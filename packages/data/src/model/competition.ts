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
    "Competition must have either (startDate AND endDate) OR seasonId"
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format queue type to human-readable string
 */
export function competitionQueueTypeToString(
  queueType: CompetitionQueueType
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
