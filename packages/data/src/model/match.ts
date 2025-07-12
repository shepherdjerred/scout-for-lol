import { z } from "zod";
import { type Champion, ChampionSchema } from "./champion.js";
import { RosterSchema, ArenaRosterSchema } from "./roster.js";
import { TeamSchema, ArenaTeamSchema } from "./team.js";
import { LaneSchema } from "./lane.js";
import { QueueTypeSchema } from "./state.js";
import { RankSchema } from "./rank.js";
import { PlayerConfigEntrySchema } from "./playerConfig.js";
import { filter, first, pipe } from "remeda";

export type CompletedMatch = z.infer<typeof CompletedMatchSchema>;
export const CompletedMatchSchema = z.strictObject({
  durationInSeconds: z.number().nonnegative(),
  queueType: QueueTypeSchema.optional(),
  /**
   * Data specific to all players we care about (e.g. all subscribed players in this match).
   * This was previously a single 'player' object, now an array for multi-player support.
   */
  players: z.array(
    z.strictObject({
      playerConfig: PlayerConfigEntrySchema,
      wins: z.number().nonnegative().optional(),
      losses: z.number().nonnegative().optional(),
      outcome: z.enum(["Victory", "Defeat", "Surrender"]),
      champion: ChampionSchema,
      team: TeamSchema,
      lane: LaneSchema.optional(),
      laneOpponent: ChampionSchema.optional(),
      rankBeforeMatch: RankSchema.optional(),
      rankAfterMatch: RankSchema.optional(),
    }),
  ),

  teams: z.strictObject({
    red: RosterSchema,
    blue: RosterSchema,
  }),
});

// Arena match for 16 players (8 teams of 2)
export type ArenaMatch = z.infer<typeof ArenaMatchSchema>;
export const ArenaMatchSchema = z.strictObject({
  durationInSeconds: z.number().nonnegative(),
  queueType: z.literal("arena"),
  /**
   * Data specific to all players we care about (e.g. all subscribed players in this match).
   */
  players: z.array(
    z.strictObject({
      playerConfig: PlayerConfigEntrySchema,
      wins: z.number().nonnegative().optional(),
      losses: z.number().nonnegative().optional(),
      outcome: z.enum(["Victory", "Defeat", "Surrender"]),
      champion: ChampionSchema,
      team: ArenaTeamSchema,
      // Arena doesn't have lanes, so no lane/laneOpponent
      rankBeforeMatch: RankSchema.optional(),
      rankAfterMatch: RankSchema.optional(),
      // Arena-specific stats
      placement: z.number().min(1).max(8), // Final placement (1st to 8th)
      teammateChampion: ChampionSchema.optional(), // Teammate's champion
    }),
  ),

  teams: z.strictObject({
    team1: ArenaRosterSchema,
    team2: ArenaRosterSchema,
    team3: ArenaRosterSchema,
    team4: ArenaRosterSchema,
    team5: ArenaRosterSchema,
    team6: ArenaRosterSchema,
    team7: ArenaRosterSchema,
    team8: ArenaRosterSchema,
  }),
});

// Union type for all match types
export type AnyMatch = CompletedMatch | ArenaMatch;
export const AnyMatchSchema = z.union([CompletedMatchSchema, ArenaMatchSchema]);

export function getLaneOpponent(
  player: Champion,
  opponents: Champion[],
): Champion | undefined {
  return pipe(
    opponents,
    filter((opponent) => opponent.lane === player.lane),
    first(),
  );
}

// Helper function to get teammate in Arena match
export function getTeammate(
  player: Champion,
  teammates: Champion[],
): Champion | undefined {
  return pipe(
    teammates,
    filter((teammate) => teammate.riotIdGameName !== player.riotIdGameName),
    first(),
  );
}
