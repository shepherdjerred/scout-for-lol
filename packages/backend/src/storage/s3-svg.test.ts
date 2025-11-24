/**
 * S3 SVG Storage Tests using aws-sdk-client-mock
 *
 * These tests verify SVG storage functionality using in-memory mocking.
 */

import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { mockClient } from "aws-sdk-client-mock";
import { saveSvgToS3 } from "@scout-for-lol/backend/storage/s3.js";
import { MatchIdSchema } from "@scout-for-lol/data";

// Create S3 mock
const s3Mock = mockClient(S3Client);

beforeEach(() => {
  // Ensure S3_BUCKET_NAME is set for tests
  Bun.env["S3_BUCKET_NAME"] = "test-bucket";
  // Reset mock before each test
  s3Mock.reset();
});

afterEach(() => {
  // Reset mock after each test
  s3Mock.reset();
});

// ============================================================================
// Success Cases
// ============================================================================

describe("saveSvgToS3 - Success Cases", () => {
  test("uploads SVG with correct parameters", async () => {
    const matchId = MatchIdSchema.parse("NA1_1234567890");
    const svgContent = '<svg xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100"/></svg>';
    const queueType = "solo";

    // Mock successful S3 upload
    s3Mock.on(PutObjectCommand).resolves({
      $metadata: { httpStatusCode: 200 },
    });

    const result = await saveSvgToS3(matchId, svgContent, queueType);

    // Verify S3 command was called once
    expect(s3Mock.calls().length).toBe(1);

    // Get the command that was called
    const call = s3Mock.call(0);
    expect(call.args[0]).toBeInstanceOf(PutObjectCommand);

    // Verify command parameters
    const command = call.args[0] as PutObjectCommand;
    expect(command.input.Bucket).toBe("test-bucket");
    expect(command.input.Key).toMatch(/^images\/\d{4}\/\d{2}\/\d{2}\/NA1_1234567890\.svg$/);
    expect(command.input.ContentType).toBe("image/svg+xml");
    expect(command.input.Metadata?.["matchId"]).toBe(matchId);
    expect(command.input.Metadata?.["queueType"]).toBe(queueType);
    expect(command.input.Metadata?.["format"]).toBe("svg");
    expect(command.input.Metadata?.["uploadedAt"]).toBeDefined();

    // Verify return value
    expect(result).toMatch(/^s3:\/\/test-bucket\/images\/\d{4}\/\d{2}\/\d{2}\/NA1_1234567890\.svg$/);
  });

  test("handles arena queue type", async () => {
    const matchId = MatchIdSchema.parse("NA1_ARENA");
    const svgContent = "<svg></svg>";
    const queueType = "arena";

    s3Mock.on(PutObjectCommand).resolves({
      $metadata: { httpStatusCode: 200 },
    });

    const result = await saveSvgToS3(matchId, svgContent, queueType);

    expect(s3Mock.calls().length).toBe(1);

    const call = s3Mock.call(0);
    const command = call.args[0] as PutObjectCommand;
    expect(command.input.Metadata?.["queueType"]).toBe("arena");
    expect(command.input.Metadata?.["format"]).toBe("svg");

    expect(result).toBeDefined();
  });

  test("handles large SVG content", async () => {
    const matchId = MatchIdSchema.parse("NA1_LARGE_SVG");
    // Create a large SVG (simulating complex match report)
    const largeSvgContent = "<svg>" + "x".repeat(100000) + "</svg>";
    const queueType = "solo";

    s3Mock.on(PutObjectCommand).resolves({
      $metadata: { httpStatusCode: 200 },
    });

    const result = await saveSvgToS3(matchId, largeSvgContent, queueType);

    expect(s3Mock.calls().length).toBe(1);

    const call = s3Mock.call(0);
    const command = call.args[0] as PutObjectCommand;
    // Body should be Uint8Array or string
    expect(
      command.input.Body instanceof Uint8Array || typeof command.input.Body === "string",
    ).toBe(true);

    expect(result).toBeDefined();
  });

  test("handles SVG with special XML characters", async () => {
    const matchId = MatchIdSchema.parse("NA1_SPECIAL_CHARS");
    const svgContent = '<svg xmlns="http://www.w3.org/2000/svg"><text>&lt;&gt;&amp;&quot;&#x27;</text></svg>';
    const queueType = "solo";

    s3Mock.on(PutObjectCommand).resolves({
      $metadata: { httpStatusCode: 200 },
    });

    const result = await saveSvgToS3(matchId, svgContent, queueType);

    expect(s3Mock.calls().length).toBe(1);
    expect(result).toBeDefined();
  });
});

// ============================================================================
// Configuration Cases
// ============================================================================

describe("saveSvgToS3 - Configuration", () => {
  test.skip("returns undefined when S3_BUCKET_NAME is not configured", async () => {
    // Note: This test is skipped because the configuration module caches
    // environment variables on first load.
    //
    // Expected behavior:
    // - When S3_BUCKET_NAME is not set, saveSvgToS3 returns undefined
    // - No S3 calls are made
    // - A warning is logged
  });
});

// ============================================================================
// Error Cases
// ============================================================================

describe("saveSvgToS3 - Error Handling", () => {
  test("throws error when S3 upload fails", async () => {
    const matchId = MatchIdSchema.parse("NA1_ERROR");
    const svgContent = "<svg></svg>";
    const queueType = "solo";

    // Mock S3 error
    s3Mock.on(PutObjectCommand).rejects(new Error("S3 upload failed"));

    await expect(saveSvgToS3(matchId, svgContent, queueType)).rejects.toThrow("Failed to save SVG NA1_ERROR to S3");

    expect(s3Mock.calls().length).toBe(1);
  });

  test("throws error with match ID in error message", async () => {
    const matchId = MatchIdSchema.parse("EUW1_NETWORK_ERROR");
    const svgContent = "<svg></svg>";
    const queueType = "flex";

    s3Mock.on(PutObjectCommand).rejects(new Error("Network timeout"));

    await expect(saveSvgToS3(matchId, svgContent, queueType)).rejects.toThrow(
      "Failed to save SVG EUW1_NETWORK_ERROR to S3",
    );
  });
});

// ============================================================================
// S3 Key Format Tests
// ============================================================================

describe("saveSvgToS3 - S3 Key Format", () => {
  test("uses current date in S3 key", async () => {
    const matchId = MatchIdSchema.parse("NA1_DATE_TEST");
    const svgContent = "<svg></svg>";
    const queueType = "solo";

    s3Mock.on(PutObjectCommand).resolves({
      $metadata: { httpStatusCode: 200 },
    });

    await saveSvgToS3(matchId, svgContent, queueType);

    const call = s3Mock.call(0);
    const command = call.args[0] as PutObjectCommand;

    // Verify key structure
    const key = command.input.Key!;
    expect(key).toMatch(/^images\/\d{4}\/\d{2}\/\d{2}\/NA1_DATE_TEST\.svg$/);

    // Verify it uses today's date
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, "0");
    const day = String(now.getUTCDate()).padStart(2, "0");

    expect(key).toContain(`images/${year.toString()}/${month}/${day}/`);
  });

  test("uses .svg extension", async () => {
    const matchId = MatchIdSchema.parse("NA1_SVG_EXT");
    const svgContent = "<svg></svg>";
    const queueType = "solo";

    s3Mock.on(PutObjectCommand).resolves({
      $metadata: { httpStatusCode: 200 },
    });

    await saveSvgToS3(matchId, svgContent, queueType);

    const call = s3Mock.call(0);
    const command = call.args[0] as PutObjectCommand;

    expect(command.input.Key).toEndWith(".svg");
  });

  test("returns s3:// URL format", async () => {
    const matchId = MatchIdSchema.parse("NA1_URL_FORMAT");
    const svgContent = "<svg></svg>";
    const queueType = "solo";

    s3Mock.on(PutObjectCommand).resolves({
      $metadata: { httpStatusCode: 200 },
    });

    const result = await saveSvgToS3(matchId, svgContent, queueType);

    expect(result).toStartWith("s3://test-bucket/");
    expect(result).toContain("images/");
    expect(result).toEndWith(".svg");
  });
});

// ============================================================================
// Content Type and Metadata Tests
// ============================================================================

describe("saveSvgToS3 - Content Type and Metadata", () => {
  test("sets correct ContentType for SVG", async () => {
    const matchId = MatchIdSchema.parse("NA1_CONTENT_TYPE");
    const svgContent = "<svg></svg>";
    const queueType = "solo";

    s3Mock.on(PutObjectCommand).resolves({
      $metadata: { httpStatusCode: 200 },
    });

    await saveSvgToS3(matchId, svgContent, queueType);

    const call = s3Mock.call(0);
    const command = call.args[0] as PutObjectCommand;

    expect(command.input.ContentType).toBe("image/svg+xml");
  });

  test("includes all required metadata fields", async () => {
    const matchId = MatchIdSchema.parse("NA1_METADATA");
    const svgContent = "<svg></svg>";
    const queueType = "solo";

    s3Mock.on(PutObjectCommand).resolves({
      $metadata: { httpStatusCode: 200 },
    });

    await saveSvgToS3(matchId, svgContent, queueType);

    const call = s3Mock.call(0);
    const command = call.args[0] as PutObjectCommand;
    const metadata = command.input.Metadata!;

    expect(metadata["matchId"]).toBe(matchId);
    expect(metadata["queueType"]).toBe(queueType);
    expect(metadata["format"]).toBe("svg");
    expect(metadata["uploadedAt"]).toBeDefined();

    // Verify uploadedAt is a valid ISO timestamp
    const uploadedAtValue = metadata["uploadedAt"];
    if (uploadedAtValue) {
      const uploadedAt = new Date(uploadedAtValue);
      expect(uploadedAt.toISOString()).toBe(uploadedAtValue);
    }
  });

  test("converts SVG string to UTF-8 buffer", async () => {
    const matchId = MatchIdSchema.parse("NA1_UTF8");
    const svgContent = "<svg><text>Hello 世界</text></svg>";
    const queueType = "solo";

    s3Mock.on(PutObjectCommand).resolves({
      $metadata: { httpStatusCode: 200 },
    });

    await saveSvgToS3(matchId, svgContent, queueType);

    const call = s3Mock.call(0);
    const command = call.args[0] as PutObjectCommand;

    // Body should be Uint8Array or string
    expect(
      command.input.Body instanceof Uint8Array || typeof command.input.Body === "string",
    ).toBe(true);

    // Body should contain the UTF-8 encoded string
    const bodyData = command.input.Body;
    const bodyString =
      bodyData instanceof Uint8Array
        ? new TextDecoder().decode(bodyData)
        : typeof bodyData === "string"
          ? bodyData
          : "";
    expect(bodyString).toBe(svgContent);
  });
});

// ============================================================================
// Concurrent Operations
// ============================================================================

describe("saveSvgToS3 - Concurrent Operations", () => {
  test("handles multiple concurrent SVG uploads", async () => {
    s3Mock.on(PutObjectCommand).resolves({
      $metadata: { httpStatusCode: 200 },
    });

    const uploads = [
      saveSvgToS3(MatchIdSchema.parse("NA1_CONCURRENT_1"), "<svg>1</svg>", "solo"),
      saveSvgToS3(MatchIdSchema.parse("NA1_CONCURRENT_2"), "<svg>2</svg>", "flex"),
      saveSvgToS3(MatchIdSchema.parse("NA1_CONCURRENT_3"), "<svg>3</svg>", "arena"),
    ];

    const results = await Promise.all(uploads);

    expect(s3Mock.calls().length).toBe(3);
    expect(results).toHaveLength(3);

    // Verify each result is unique
    expect(results[0]).toContain("NA1_CONCURRENT_1");
    expect(results[1]).toContain("NA1_CONCURRENT_2");
    expect(results[2]).toContain("NA1_CONCURRENT_3");
  });
});
