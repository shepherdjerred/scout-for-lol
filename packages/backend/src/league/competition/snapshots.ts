import {
  type CompetitionCriteria,
  type GamesPlayedSnapshotData,
  getSnapshotSchemaForCriteria,
  type RankSnapshotData,
  type SnapshotType,
  type WinsSnapshotData,
} from "@scout-for-lol/data";
import { type PrismaClient } from "../../../generated/prisma/client/index.js";
import { getParticipants } from "../../database/competition/participants.js";
import { fetchSnapshotData } from "./leaderboard.js";

// ============================================================================
// Snapshot Creation
// ============================================================================

/**
 * Create a snapshot for a player in a competition
 *
 * @param prisma Prisma client instance
 * @param competitionId Competition ID
 * @param playerId Player ID
 * @param snapshotType Type of snapshot (START or END)
 * @param criteria Competition criteria (determines what data to capture)
 * @throws Error if player not found or data fetching fails
 *
 * This function is idempotent - calling it multiple times with the same
 * parameters will update the existing snapshot instead of creating duplicates
 */
export async function createSnapshot(
  prisma: PrismaClient,
  competitionId: number,
  playerId: number,
  snapshotType: SnapshotType,
  criteria: CompetitionCriteria,
): Promise<void> {
  console.log(
    `[Snapshots] Creating ${snapshotType} snapshot for competition ${competitionId.toString()}, player ${playerId.toString()}`,
  );

  // Get player with accounts
  const player = await prisma.player.findUnique({
    where: { id: playerId },
    include: { accounts: true },
  });

  if (!player) {
    throw new Error(`Player ${playerId.toString()} not found`);
  }

  if (player.accounts.length === 0) {
    throw new Error(`Player ${playerId.toString()} has no accounts`);
  }

  // Fetch snapshot data based on criteria
  const snapshotData = await fetchSnapshotData(prisma, competitionId, criteria, [player], "ACTIVE");

  // Get the appropriate schema for validation
  const schema = getSnapshotSchemaForCriteria(criteria);

  // Validate the data
  const validated = schema.parse(snapshotData);

  // Upsert the snapshot (for idempotency)
  await prisma.competitionSnapshot.upsert({
    where: {
      competitionId_playerId_snapshotType: {
        competitionId,
        playerId,
        snapshotType,
      },
    },
    update: {
      snapshotData: JSON.stringify(validated),
      snapshotTime: new Date(),
    },
    create: {
      competitionId,
      playerId,
      snapshotType,
      snapshotData: JSON.stringify(validated),
      snapshotTime: new Date(),
    },
  });

  console.log(`[Snapshots] ✅ Created ${snapshotType} snapshot for player ${playerId.toString()}`);
}

// ============================================================================
// Snapshot Retrieval
// ============================================================================

/**
 * Get a snapshot for a player in a competition
 *
 * @param prisma Prisma client instance
 * @param competitionId Competition ID
 * @param playerId Player ID
 * @param snapshotType Type of snapshot (START or END)
 * @param criteria Competition criteria (needed to parse the snapshot data correctly)
 * @returns Parsed snapshot data, or null if snapshot doesn't exist
 */
export async function getSnapshot(
  prisma: PrismaClient,
  competitionId: number,
  playerId: number,
  snapshotType: SnapshotType,
  criteria: CompetitionCriteria,
): Promise<RankSnapshotData | GamesPlayedSnapshotData | WinsSnapshotData | null> {
  const snapshot = await prisma.competitionSnapshot.findUnique({
    where: {
      competitionId_playerId_snapshotType: {
        competitionId,
        playerId,
        snapshotType,
      },
    },
  });

  if (!snapshot) {
    return null;
  }

  // Parse the JSON string
  const snapshotData: unknown = JSON.parse(snapshot.snapshotData);

  // Get the appropriate schema for validation
  const schema = getSnapshotSchemaForCriteria(criteria);

  // Validate and return
  return schema.parse(snapshotData);
}

// ============================================================================
// Bulk Operations
// ============================================================================

/**
 * Create snapshots for all JOINED participants in a competition
 *
 * @param prisma Prisma client instance
 * @param competitionId Competition ID
 * @param snapshotType Type of snapshot (START or END)
 * @param criteria Competition criteria (determines what data to capture)
 *
 * This function processes participants in parallel for efficiency.
 * Individual failures are logged but don't stop the entire process.
 */
export async function createSnapshotsForAllParticipants(
  prisma: PrismaClient,
  competitionId: number,
  snapshotType: SnapshotType,
  criteria: CompetitionCriteria,
): Promise<void> {
  console.log(`[Snapshots] Creating ${snapshotType} snapshots for competition ${competitionId.toString()}`);

  // Get all JOINED participants
  const participants = await getParticipants(prisma, competitionId, "JOINED", true);

  console.log(`[Snapshots] Found ${participants.length.toString()} participants`);

  // Create snapshots in parallel
  const results = await Promise.allSettled(
    participants.map((participant) =>
      createSnapshot(prisma, competitionId, participant.playerId, snapshotType, criteria),
    ),
  );

  // Log results
  const successful = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  console.log(`[Snapshots] ✅ Created ${successful.toString()} snapshots`);
  if (failed > 0) {
    console.warn(`[Snapshots] ⚠️  Failed to create ${failed.toString()} snapshots`);

    // Log individual failures
    results.forEach((result, index) => {
      if (result.status === "rejected") {
        const participant = participants[index];
        if (participant) {
          console.error(
            `[Snapshots] Failed snapshot for player ${participant.playerId.toString()}: ${String(result.reason)}`,
          );
        }
      }
    });
  }
}
