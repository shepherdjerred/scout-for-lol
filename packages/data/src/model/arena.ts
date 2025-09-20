import { z } from "zod";
import { ChampionSchema } from "./champion.js";
import { PlayerConfigEntrySchema } from "./playerConfig.js";
import { RankSchema } from "./rank.js";
import { LaneSchema } from "./lane.js";

// Arena-specific performance metrics (meanings inferred - need verification)
export type ArenaMetrics = z.infer<typeof ArenaMetricsSchema>;
export const ArenaMetricsSchema = z.strictObject({
  playerScore0: z.number().optional(),  // Likely kills/eliminations
  playerScore1: z.number().optional(),  // Likely assists
  playerScore2: z.number().optional(),  // Possibly damage per minute
  playerScore3: z.number().optional(),  // Unknown percentage metric
  playerScore4: z.number().optional(),  // Unknown - could be survival time/rounds
  playerScore5: z.number().optional(),  // Unknown damage-related metric
  playerScore6: z.number().optional(),  // Unknown - possibly total damage
  playerScore7: z.number().optional(),  // Unknown - possibly economy metric
  playerScore8: z.number().optional(),  // Unknown percentage metric
  // playerScore9-11 often 0, likely unused
});

// Team support metrics (2v2 specific)
export type TeamSupportMetrics = z.infer<typeof TeamSupportMetricsSchema>;
export const TeamSupportMetricsSchema = z.strictObject({
  damageShieldedOnTeammate: z.number().optional(),
  healsOnTeammate: z.number().optional(),
  damageTakenPercentage: z.number().optional(),
});

// Arena Champion extends base Champion with arena-specific fields
export type ArenaChampion = z.infer<typeof ArenaChampionSchema>;
export const ArenaChampionSchema = ChampionSchema.extend({
  // Arena-specific fields
  augments: z.array(z.number()).max(6), // playerAugment1-6 (required for arena)
  arenaMetrics: ArenaMetricsSchema, // Required for arena
  teamSupport: TeamSupportMetricsSchema, // Required for arena
});

// Augment slot metadata
export type AugmentSlot = z.infer<typeof AugmentSlotSchema>;
export const AugmentSlotSchema = z.strictObject({
  augmentId: z.number(),
  slot: z.number().int().min(1).max(6),
});

// Arena team types
export type ArenaTeamId = z.infer<typeof ArenaTeamIdSchema>;
export const ArenaTeamIdSchema = z.number().int().min(1).max(8);

// Arena subteam structure (2 players per team)
export type ArenaSubteam = z.infer<typeof ArenaSubteamSchema>;
export const ArenaSubteamSchema = z.strictObject({
  subteamId: ArenaTeamIdSchema, // playerSubteamId (1-8)
  players: z.array(ArenaChampionSchema).length(2), // Exactly 2 players
  placement: z.number().int().min(1).max(8), // Final placement (1st-8th)
});

// Arena match outcome (placement 1-8 instead of win/loss)
export type ArenaPlacement = z.infer<typeof ArenaPlacementSchema>;
export const ArenaPlacementSchema = z.number().int().min(1).max(8);

// Type guards for arena teams
export function isArenaTeam(team: unknown): team is ArenaTeamId {
  return typeof team === "number" && team >= 1 && team <= 8;
}

// Arena team parsing utility
export function parseArenaTeam(subteamId: number): ArenaTeamId | undefined {
  if (subteamId >= 1 && subteamId <= 8) {
    return subteamId;
  }
  return undefined;
}

// Arena-specific player data
export type ArenaMatchPlayer = z.infer<typeof ArenaMatchPlayerSchema>;
export const ArenaMatchPlayerSchema = z.strictObject({
  playerConfig: PlayerConfigEntrySchema,
  wins: z.number().nonnegative().optional(),
  losses: z.number().nonnegative().optional(),
  placement: ArenaPlacementSchema, // 1st-8th place instead of Victory/Defeat
  champion: ArenaChampionSchema,
  team: ArenaTeamIdSchema, // Arena subteam ID (1-8)
  lane: LaneSchema.optional(),
  arenaTeammate: ArenaChampionSchema, // Required for arena - the other player in the 2v2 team
  rankBeforeMatch: RankSchema.optional(),
  rankAfterMatch: RankSchema.optional(),
});

// Complete arena match
export type ArenaMatch = z.infer<typeof ArenaMatchSchema>;
export const ArenaMatchSchema = z.strictObject({
  durationInSeconds: z.number().nonnegative(),
  queueType: z.literal("arena"),

  players: z.array(ArenaMatchPlayerSchema),

  // Arena has 8 subteams instead of red/blue
  subteams: z.array(ArenaSubteamSchema).length(8), // 8 teams of 2 players each
});
