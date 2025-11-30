/* eslint-disable custom-rules/no-re-exports -- raw-match.schema.ts is a library file that needs to re-export types from sub-modules for backward compatibility */
import { z } from "zod";
import { RawParticipantSchema, type RawParticipant } from "./raw-participant.schema.ts";
import { RawTeamSchema, RawObjectivesSchema, type RawTeam, type RawObjectives } from "./raw-team.schema.ts";
import { RawChallengesSchema, type RawChallenges } from "./raw-challenges.schema.ts";
import { RawPerksSchema, type RawPerks } from "./raw-perks.schema.ts";
import { RawMissionsSchema, type RawMissions } from "./raw-missions.schema.ts";

/**
 * Zod schema for RawMatch from the twisted library
 * Based on Riot Games Match V5 API
 *
 * This schema validates the structure of match data received from Riot API or read from S3.
 * While the data in S3 is trusted (we control what goes in), validation provides:
 * 1. Runtime type safety and early error detection
 * 2. Documentation of the expected structure
 * 3. Protection against API changes or data corruption
 */

/**
 * Raw Metadata - Contains match identification information
 */
export const RawMetadataSchema = z
  .object({
    dataVersion: z.string(),
    matchId: z.string(),
    participants: z.array(z.string()),
  })
  .strict();

/**
 * Raw Info - Contains the main match information
 */
export const RawInfoSchema = z
  .object({
    endOfGameResult: z.string(),
    gameCreation: z.number(),
    gameDuration: z.number(),
    gameEndTimestamp: z.number(),
    gameId: z.number(),
    gameMode: z.string(),
    gameName: z.string(),
    gameStartTimestamp: z.number(),
    gameType: z.string(),
    gameVersion: z.string(),
    mapId: z.number(),
    participants: z.array(RawParticipantSchema),
    platformId: z.string(),
    queueId: z.number(),
    teams: z.array(RawTeamSchema),
    tournamentCode: z.string(),
  })
  .strict();

/**
 * Main RawMatch schema - represents a complete match from Riot Games Match V5 API
 */
export const RawMatchSchema = z
  .object({
    metadata: RawMetadataSchema,
    info: RawInfoSchema,
  })
  .strict();

// Re-export types from sub-modules for convenience
export type RawMatch = z.infer<typeof RawMatchSchema>;
export type RawMetadata = z.infer<typeof RawMetadataSchema>;
export type RawInfo = z.infer<typeof RawInfoSchema>;
export type { RawParticipant };
export type { RawChallenges };
export type { RawPerks };
export type { RawTeam, RawObjectives };
export type { RawMissions };

// Re-export schemas for convenience
export { RawParticipantSchema };
export { RawChallengesSchema };
export { RawPerksSchema };
export { RawTeamSchema };
export { RawObjectivesSchema };
export { RawMissionsSchema };
