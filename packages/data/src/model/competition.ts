import { match } from "ts-pattern";
import { z } from "zod";

// ============================================================================
// Branded ID Types
// ============================================================================

export type CompetitionId = z.infer<typeof CompetitionIdSchema>;
export const CompetitionIdSchema = z
  .number()
  .int()
  .positive()
  .brand("CompetitionId");

export type ParticipantId = z.infer<typeof ParticipantIdSchema>;
export const ParticipantIdSchema = z
  .number()
  .int()
  .positive()
  .brand("ParticipantId");

// ============================================================================
// Enums
// ============================================================================

export type CompetitionVisibility = z.infer<typeof CompetitionVisibilitySchema>;
export const CompetitionVisibilitySchema = z.enum([
  "OPEN",
  "INVITE_ONLY",
  "SERVER_WIDE",
]);

export type ParticipantStatus = z.infer<typeof ParticipantStatusSchema>;
export const ParticipantStatusSchema = z.enum(["INVITED", "JOINED", "LEFT"]);

export type SnapshotType = z.infer<typeof SnapshotTypeSchema>;
export const SnapshotTypeSchema = z.enum(["START", "END"]);

export type PermissionType = z.infer<typeof PermissionTypeSchema>;
export const PermissionTypeSchema = z.enum(["CREATE_COMPETITION"]);

export type CompetitionQueueType = z.infer<typeof CompetitionQueueTypeSchema>;
export const CompetitionQueueTypeSchema = z.enum([
  "SOLO",
  "FLEX",
  "RANKED_ANY",
  "ARENA",
  "ARAM",
  "ALL",
]);

// ============================================================================
// Competition Criteria (Discriminated Union)
// ============================================================================

/**
 * Criteria: Most games played in specified queue
 */
export const MostGamesPlayedCriteriaSchema = z.object({
  type: z.literal("MOST_GAMES_PLAYED"),
  queue: CompetitionQueueTypeSchema,
});

export type MostGamesPlayedCriteria = z.infer<
  typeof MostGamesPlayedCriteriaSchema
>;

/**
 * Criteria: Highest rank achieved in SOLO or FLEX queue
 */
export const HighestRankCriteriaSchema = z.object({
  type: z.literal("HIGHEST_RANK"),
  queue: z.enum(["SOLO", "FLEX"]), // Only ranked queues
});

export type HighestRankCriteria = z.infer<typeof HighestRankCriteriaSchema>;

/**
 * Criteria: Most rank climb (LP gained) in SOLO or FLEX queue
 */
export const MostRankClimbCriteriaSchema = z.object({
  type: z.literal("MOST_RANK_CLIMB"),
  queue: z.enum(["SOLO", "FLEX"]), // Only ranked queues
});

export type MostRankClimbCriteria = z.infer<
  typeof MostRankClimbCriteriaSchema
>;

/**
 * Criteria: Most wins in specified queue (for a player)
 */
export const MostWinsPlayerCriteriaSchema = z.object({
  type: z.literal("MOST_WINS_PLAYER"),
  queue: CompetitionQueueTypeSchema,
});

export type MostWinsPlayerCriteria = z.infer<
  typeof MostWinsPlayerCriteriaSchema
>;

/**
 * Criteria: Most wins with a specific champion
 * Queue is optional - if not specified, counts wins across all queues
 */
export const MostWinsChampionCriteriaSchema = z.object({
  type: z.literal("MOST_WINS_CHAMPION"),
  championId: z.number().int().positive(),
  queue: CompetitionQueueTypeSchema.optional(),
});

export type MostWinsChampionCriteria = z.infer<
  typeof MostWinsChampionCriteriaSchema
>;

/**
 * Criteria: Highest win rate (minimum games required)
 */
export const HighestWinRateCriteriaSchema = z.object({
  type: z.literal("HIGHEST_WIN_RATE"),
  minGames: z.number().int().positive().default(10),
  queue: CompetitionQueueTypeSchema,
});

export type HighestWinRateCriteria = z.infer<
  typeof HighestWinRateCriteriaSchema
>;

/**
 * Discriminated union of all competition criteria types.
 * The 'type' field is the discriminator that allows TypeScript to narrow the type.
 */
export const CompetitionCriteriaSchema = z.discriminatedUnion("type", [
  MostGamesPlayedCriteriaSchema,
  HighestRankCriteriaSchema,
  MostRankClimbCriteriaSchema,
  MostWinsPlayerCriteriaSchema,
  MostWinsChampionCriteriaSchema,
  HighestWinRateCriteriaSchema,
]);

export type CompetitionCriteria = z.infer<typeof CompetitionCriteriaSchema>;

// ============================================================================
// Competition Status (Calculated, Not Stored)
// ============================================================================

export type CompetitionStatus = "DRAFT" | "ACTIVE" | "ENDED" | "CANCELLED";

/**
 * Calculate competition status based on dates and cancellation flag.
 * This is a pure function with no side effects.
 *
 * Rules:
 * 1. If isCancelled === true → CANCELLED (regardless of dates)
 * 2. If endDate is in the past → ENDED
 * 3. If startDate is in the future → DRAFT
 * 4. If startDate <= now < endDate → ACTIVE
 * 5. If no dates provided → DRAFT (assumes seasonId is set)
 */
export function getCompetitionStatus(competition: {
  isCancelled: boolean;
  startDate: Date | null;
  endDate: Date | null;
  seasonId: string | null;
}): CompetitionStatus {
  // Rule 1: Cancellation overrides everything
  if (competition.isCancelled) {
    return "CANCELLED";
  }

  const now = new Date();

  // Handle date-based competitions
  if (competition.startDate !== null && competition.endDate !== null) {
    const startDate = competition.startDate;
    const endDate = competition.endDate;

    // Rule 2: Competition has ended
    if (now >= endDate) {
      return "ENDED";
    }

    // Rule 3: Competition hasn't started yet
    if (now < startDate) {
      return "DRAFT";
    }

    // Rule 4: Competition is active
    return "ACTIVE";
  }

  // Handle season-based competitions (no fixed dates yet)
  if (competition.seasonId !== null) {
    // Season competitions start in DRAFT until dates are resolved
    return "DRAFT";
  }

  // Invalid state: no dates and no seasonId
  throw new Error(
    "Competition must have either (startDate AND endDate) OR seasonId",
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format queue type to human-readable string
 */
export function competitionQueueTypeToString(
  queueType: CompetitionQueueType,
): string {
  return match(queueType)
    .with("SOLO", () => "Solo Queue")
    .with("FLEX", () => "Flex Queue")
    .with("RANKED_ANY", () => "Ranked (Any)")
    .with("ARENA", () => "Arena")
    .with("ARAM", () => "ARAM")
    .with("ALL", () => "All Queues")
    .exhaustive();
}

/**
 * Format visibility to human-readable string
 */
export function visibilityToString(visibility: CompetitionVisibility): string {
  return match(visibility)
    .with("OPEN", () => "Open to All")
    .with("INVITE_ONLY", () => "Invite Only")
    .with("SERVER_WIDE", () => "Server-Wide")
    .exhaustive();
}

/**
 * Format participant status to human-readable string
 */
export function participantStatusToString(status: ParticipantStatus): string {
  return match(status)
    .with("INVITED", () => "Invited")
    .with("JOINED", () => "Joined")
    .with("LEFT", () => "Left")
    .exhaustive();
}
