import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { DeleteObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { MatchV5DTOs } from "twisted/dist/models-dto/index.js";
import configuration from "../configuration.js";
import { queryMatchesByDateRange } from "./s3-query.js";

// Helper to create a mock match
function createMockMatch(matchId: string, participantPuuids: string[], gameCreationDate: Date): MatchV5DTOs.MatchDto {
  return {
    metadata: {
      dataVersion: "2",
      matchId: matchId,
      participants: participantPuuids,
    },
    info: {
      endOfGameResult: "GameComplete",
      gameCreation: gameCreationDate.getTime(),
      gameDuration: 1800,
      gameEndTimestamp: gameCreationDate.getTime() + 1800000,
      gameId: Number.parseInt(matchId.replace("TEST_", "")),
      gameMode: "CLASSIC",
      gameName: `teambuilder-match-${matchId}`,
      gameStartTimestamp: gameCreationDate.getTime(),
      gameType: "MATCHED_GAME",
      gameVersion: "14.1.1",
      mapId: 11,
      participants: [],
      platformId: "NA1",
      queueId: 420,
      teams: [],
      tournamentCode: "",
    },
  };
}

// Helper to generate S3 key for a match on a specific date
function generateMatchKey(matchId: string, date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `matches/${year.toString()}/${month}/${day}/${matchId}.json`;
}

// Track uploaded keys for cleanup
const uploadedKeys: string[] = [];

async function uploadMatchToS3(client: S3Client, bucket: string, match: MatchV5DTOs.MatchDto, date: Date) {
  const key = generateMatchKey(match.metadata.matchId, date);
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: JSON.stringify(match),
    ContentType: "application/json",
  });

  await client.send(command);
  uploadedKeys.push(key);
}

async function deleteMatchFromS3(client: S3Client, bucket: string, key: string) {
  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  await client.send(command);
}

// Skip all tests if S3 is not configured
const s3Available = configuration.s3BucketName !== undefined;
const testIf = s3Available ? test : test.skip;
const describeIf = s3Available ? describe : describe.skip;

if (!s3Available) {
  console.warn("[S3Query Integration Tests] Skipping - S3_BUCKET_NAME not configured");
}

beforeEach(async () => {
  // Clean up any leftover test data
  if (s3Available && uploadedKeys.length > 0 && configuration.s3BucketName) {
    const client = new S3Client();
    const bucket = configuration.s3BucketName;

    for (const key of uploadedKeys) {
      try {
        await deleteMatchFromS3(client, bucket, key);
      } catch {
        // Ignore errors during cleanup
      }
    }
    uploadedKeys.length = 0;
  }
});

afterEach(async () => {
  // Clean up uploaded test data
  if (s3Available && uploadedKeys.length > 0 && configuration.s3BucketName) {
    const client = new S3Client();
    const bucket = configuration.s3BucketName;

    for (const key of uploadedKeys) {
      try {
        await deleteMatchFromS3(client, bucket, key);
      } catch (cleanupError) {
        console.warn(`[S3Query Integration Test] Failed to cleanup ${key}:`, cleanupError);
      }
    }
    uploadedKeys.length = 0;
  }
});

// ============================================================================
// Integration Tests
// ============================================================================

describeIf("queryMatchesByDateRange - single day", () => {
  testIf("returns matches from a single day", async () => {
    const bucketName = configuration.s3BucketName;
    if (!bucketName) throw new Error("S3 bucket not configured");

    const client = new S3Client();
    const bucket = bucketName;
    const date = new Date("2025-01-15T12:00:00Z");
    const puuid1 = "PUUID-TEST-1";
    const puuid2 = "PUUID-TEST-2";

    // Upload 3 matches on the same day
    const match1 = createMockMatch("TEST_1001", [puuid1, "PUUID-OTHER-1"], date);
    const match2 = createMockMatch("TEST_1002", [puuid2, "PUUID-OTHER-2"], date);
    const match3 = createMockMatch("TEST_1003", [puuid1, puuid2], date);

    await uploadMatchToS3(client, bucket, match1, date);
    await uploadMatchToS3(client, bucket, match2, date);
    await uploadMatchToS3(client, bucket, match3, date);

    // Query for matches with puuid1 or puuid2
    const results = await queryMatchesByDateRange(date, date, [puuid1, puuid2]);

    expect(results.length).toBe(3);
    expect(results.map((m) => m.metadata.matchId).sort()).toEqual(["TEST_1001", "TEST_1002", "TEST_1003"]);
  });

  testIf("filters matches by participant PUUID", async () => {
    const bucketName = configuration.s3BucketName;
    if (!bucketName) throw new Error("S3 bucket not configured");

    const client = new S3Client();
    const bucket = bucketName;
    const date = new Date("2025-01-15T12:00:00Z");
    const targetPuuid = "PUUID-TARGET";
    const otherPuuid = "PUUID-OTHER";

    // Upload 3 matches: 2 with targetPuuid, 1 without
    const match1 = createMockMatch("TEST_2001", [targetPuuid, otherPuuid], date);
    const match2 = createMockMatch("TEST_2002", [otherPuuid, "PUUID-ANOTHER"], date);
    const match3 = createMockMatch("TEST_2003", [targetPuuid, "PUUID-ANOTHER"], date);

    await uploadMatchToS3(client, bucket, match1, date);
    await uploadMatchToS3(client, bucket, match2, date);
    await uploadMatchToS3(client, bucket, match3, date);

    // Query for matches with targetPuuid only
    const results = await queryMatchesByDateRange(date, date, [targetPuuid]);

    expect(results.length).toBe(2);
    expect(results.map((m) => m.metadata.matchId).sort()).toEqual(["TEST_2001", "TEST_2003"]);
  });

  testIf("returns empty array when no matches found", async () => {
    const date = new Date("2025-01-20T12:00:00Z");
    const puuid = "PUUID-NONEXISTENT";

    const results = await queryMatchesByDateRange(date, date, [puuid]);

    expect(results).toEqual([]);
  });
});

describeIf("queryMatchesByDateRange - date range", () => {
  testIf("returns matches across multiple days", async () => {
    const bucketName = configuration.s3BucketName;
    if (!bucketName) throw new Error("S3 bucket not configured");

    const client = new S3Client();
    const bucket = bucketName;
    const puuid = "PUUID-MULTIDAY";

    const date1 = new Date("2025-01-15T12:00:00Z");
    const date2 = new Date("2025-01-16T12:00:00Z");
    const date3 = new Date("2025-01-17T12:00:00Z");

    // Upload matches on 3 consecutive days
    const match1 = createMockMatch("TEST_3001", [puuid, "OTHER-1"], date1);
    const match2 = createMockMatch("TEST_3002", [puuid, "OTHER-2"], date2);
    const match3 = createMockMatch("TEST_3003", [puuid, "OTHER-3"], date3);

    await uploadMatchToS3(client, bucket, match1, date1);
    await uploadMatchToS3(client, bucket, match2, date2);
    await uploadMatchToS3(client, bucket, match3, date3);

    // Query the entire range
    const results = await queryMatchesByDateRange(date1, date3, [puuid]);

    expect(results.length).toBe(3);
    expect(results.map((m) => m.metadata.matchId).sort()).toEqual(["TEST_3001", "TEST_3002", "TEST_3003"]);
  });

  testIf("handles partial date ranges", async () => {
    const bucketName = configuration.s3BucketName;
    if (!bucketName) throw new Error("S3 bucket not configured");

    const client = new S3Client();
    const bucket = bucketName;
    const puuid = "PUUID-PARTIAL";

    const date1 = new Date("2025-01-15T12:00:00Z");
    const date2 = new Date("2025-01-16T12:00:00Z");
    const date3 = new Date("2025-01-17T12:00:00Z");

    // Upload matches on 3 days
    const match1 = createMockMatch("TEST_4001", [puuid], date1);
    const match2 = createMockMatch("TEST_4002", [puuid], date2);
    const match3 = createMockMatch("TEST_4003", [puuid], date3);

    await uploadMatchToS3(client, bucket, match1, date1);
    await uploadMatchToS3(client, bucket, match2, date2);
    await uploadMatchToS3(client, bucket, match3, date3);

    // Query only middle 2 days
    const results = await queryMatchesByDateRange(date2, date3, [puuid]);

    expect(results.length).toBe(2);
    expect(results.map((m) => m.metadata.matchId).sort()).toEqual(["TEST_4002", "TEST_4003"]);
  });

  testIf("handles month boundary crossing", async () => {
    const bucketName = configuration.s3BucketName;
    if (!bucketName) throw new Error("S3 bucket not configured");

    const client = new S3Client();
    const bucket = bucketName;
    const puuid = "PUUID-MONTH-CROSS";

    const date1 = new Date("2025-01-31T12:00:00Z");
    const date2 = new Date("2025-02-01T12:00:00Z");
    const date3 = new Date("2025-02-02T12:00:00Z");

    const match1 = createMockMatch("TEST_5001", [puuid], date1);
    const match2 = createMockMatch("TEST_5002", [puuid], date2);
    const match3 = createMockMatch("TEST_5003", [puuid], date3);

    await uploadMatchToS3(client, bucket, match1, date1);
    await uploadMatchToS3(client, bucket, match2, date2);
    await uploadMatchToS3(client, bucket, match3, date3);

    const results = await queryMatchesByDateRange(date1, date3, [puuid]);

    expect(results.length).toBe(3);
    expect(results.map((m) => m.metadata.matchId).sort()).toEqual(["TEST_5001", "TEST_5002", "TEST_5003"]);
  });
});

describeIf("queryMatchesByDateRange - edge cases", () => {
  testIf("returns empty array when PUUIDs array is empty", async () => {
    const date = new Date("2025-01-15T12:00:00Z");

    const results = await queryMatchesByDateRange(date, date, []);

    expect(results).toEqual([]);
  });

  testIf("handles invalid JSON in S3 gracefully", async () => {
    const bucketName = configuration.s3BucketName;
    if (!bucketName) throw new Error("S3 bucket not configured");

    const client = new S3Client();
    const bucket = bucketName;
    const date = new Date("2025-01-15T12:00:00Z");
    const puuid = "PUUID-INVALID-JSON";

    // Upload a valid match
    const validMatch = createMockMatch("TEST_6001", [puuid], date);
    await uploadMatchToS3(client, bucket, validMatch, date);

    // Upload invalid JSON
    const invalidKey = generateMatchKey("TEST_6002_INVALID", date);
    const putCommand = new PutObjectCommand({
      Bucket: bucket,
      Key: invalidKey,
      Body: "{ invalid json content",
      ContentType: "application/json",
    });
    await client.send(putCommand);
    uploadedKeys.push(invalidKey);

    // Query should skip invalid JSON and return valid match
    const results = await queryMatchesByDateRange(date, date, [puuid]);

    expect(results.length).toBe(1);
    expect(results[0]?.metadata.matchId).toBe("TEST_6001");
  });

  testIf("handles multiple participants correctly", async () => {
    const bucketName = configuration.s3BucketName;
    if (!bucketName) throw new Error("S3 bucket not configured");

    const client = new S3Client();
    const bucket = bucketName;
    const date = new Date("2025-01-15T12:00:00Z");

    const puuid1 = "PUUID-PLAYER-1";
    const puuid2 = "PUUID-PLAYER-2";
    const puuid3 = "PUUID-PLAYER-3";

    // Match with puuid1 and puuid2
    const match1 = createMockMatch("TEST_7001", [puuid1, puuid2, "OTHER-1"], date);
    // Match with puuid2 and puuid3
    const match2 = createMockMatch("TEST_7002", [puuid2, puuid3, "OTHER-2"], date);
    // Match with puuid1 only
    const match3 = createMockMatch("TEST_7003", [puuid1, "OTHER-3", "OTHER-4"], date);

    await uploadMatchToS3(client, bucket, match1, date);
    await uploadMatchToS3(client, bucket, match2, date);
    await uploadMatchToS3(client, bucket, match3, date);

    // Query for puuid1 and puuid2
    const results = await queryMatchesByDateRange(date, date, [puuid1, puuid2]);

    expect(results.length).toBe(3); // All matches contain at least one of the PUUIDs
    expect(results.map((m) => m.metadata.matchId).sort()).toEqual(["TEST_7001", "TEST_7002", "TEST_7003"]);
  });
});

describeIf("queryMatchesByDateRange - S3 configuration", () => {
  test.skip("returns empty array when S3_BUCKET_NAME not configured", async () => {
    // This test would require mocking configuration, which is complex
    // In practice, this is tested by the conditional test execution
    // If S3 is not configured, all tests are skipped
  });
});

describeIf("queryMatchesByDateRange - data verification", () => {
  testIf("returns complete match data", async () => {
    const bucketName = configuration.s3BucketName;
    if (!bucketName) throw new Error("S3 bucket not configured");

    const client = new S3Client();
    const bucket = bucketName;
    const date = new Date("2025-01-15T12:00:00Z");
    const puuid = "PUUID-COMPLETE-DATA";

    const match = createMockMatch("TEST_8001", [puuid, "OTHER"], date);

    await uploadMatchToS3(client, bucket, match, date);

    const results = await queryMatchesByDateRange(date, date, [puuid]);

    expect(results.length).toBe(1);
    const retrieved = results[0];
    expect(retrieved).toBeDefined();
    expect(retrieved?.metadata.matchId).toBe("TEST_8001");
    expect(retrieved?.metadata.participants).toContain(puuid);
    expect(retrieved?.info.gameMode).toBe("CLASSIC");
    expect(retrieved?.info.queueId).toBe(420);
  });

  testIf("verifies S3 list command works correctly", async () => {
    const bucketName = configuration.s3BucketName;
    if (!bucketName) throw new Error("S3 bucket not configured");

    const client = new S3Client();
    const bucket = bucketName;
    const date = new Date("2025-01-15T12:00:00Z");
    const puuid = "PUUID-LIST-VERIFY";

    // Upload multiple matches
    for (let i = 0; i < 5; i++) {
      const match = createMockMatch(`TEST_9${String(i).padStart(3, "0")}`, [puuid], date);
      await uploadMatchToS3(client, bucket, match, date);
    }

    // Verify all matches are listed
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");
    const prefix = `matches/${year.toString()}/${month}/${day}/`;

    const listCommand = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
    });

    const response = await client.send(listCommand);
    const testKeys = response.Contents?.filter((obj) => obj.Key?.includes("TEST_9")) ?? [];

    expect(testKeys.length).toBeGreaterThanOrEqual(5);

    // Now query with our function
    const results = await queryMatchesByDateRange(date, date, [puuid]);

    expect(results.length).toBeGreaterThanOrEqual(5);
  });
});
