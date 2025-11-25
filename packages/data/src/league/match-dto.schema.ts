/* eslint-disable custom-rules/no-re-exports -- match-dto.schema.ts is a library file that needs to re-export types from sub-modules for backward compatibility */
import { z } from "zod";
import { ParticipantDtoSchema, type ParticipantDto } from "./participant-dto.schema.js";
import { TeamDtoSchema, ObjectivesDtoSchema, type TeamDto, type ObjectivesDto } from "./team-dto.schema.js";
import { ChallengesDtoSchema, type ChallengesDto } from "./challenges-dto.schema.js";
import { PerksDtoSchema, type PerksDto } from "./perks-dto.schema.js";
import { MissionsDtoSchema, type MissionsDto } from "./missions-dto.schema.js";

/**
 * Zod schema for MatchV5DTOs.MatchDto from the twisted library
 * Based on Riot Games Match V5 API
 *
 * This schema validates the structure of match data received from Riot API or read from S3.
 * While the data in S3 is trusted (we control what goes in), validation provides:
 * 1. Runtime type safety and early error detection
 * 2. Documentation of the expected structure
 * 3. Protection against API changes or data corruption
 */

/**
 * Metadata DTO - Contains match identification information
 */
export const MetadataDtoSchema = z
  .object({
    dataVersion: z.string(),
    matchId: z.string(),
    participants: z.array(z.string()),
  })
  .strict();

/**
 * Info DTO - Contains the main match information
 */
export const InfoDtoSchema = z
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
    participants: z.array(ParticipantDtoSchema),
    platformId: z.string(),
    queueId: z.number(),
    teams: z.array(TeamDtoSchema),
    tournamentCode: z.string(),
  })
  .strict();

/**
 * Main MatchDto schema - represents a complete match from Riot Games Match V5 API
 */
export const MatchDtoSchema = z
  .object({
    metadata: MetadataDtoSchema,
    info: InfoDtoSchema,
  })
  .strict();

// Re-export types from sub-modules for convenience
export type MatchDto = z.infer<typeof MatchDtoSchema>;
export type MetadataDto = z.infer<typeof MetadataDtoSchema>;
export type InfoDto = z.infer<typeof InfoDtoSchema>;
export type { ParticipantDto };
export type { ChallengesDto };
export type { PerksDto };
export type { TeamDto, ObjectivesDto };
export type { MissionsDto };

// Re-export schemas for convenience
export { ParticipantDtoSchema };
export { ChallengesDtoSchema };
export { PerksDtoSchema };
export { TeamDtoSchema };
export { ObjectivesDtoSchema };
export { MissionsDtoSchema };
