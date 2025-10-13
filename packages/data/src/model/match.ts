import { z } from "zod";
import { type Champion, ChampionSchema } from "./champion.js";
import { RosterSchema } from "./roster.js";
import { TeamSchema } from "./team.js";
import { LaneSchema } from "./lane.js";
import { QueueTypeSchema } from "./state.js";
import { RankSchema } from "./rank.js";
import { PlayerConfigEntrySchema } from "./player-config.js";
import { filter, first, pipe } from "remeda";

export type CompletedMatch = z.infer<typeof CompletedMatchSchema>;
export const CompletedMatchSchema = z.strictObject({
  durationInSeconds: z.number().nonnegative(),
  queueType: QueueTypeSchema.exclude(["arena"]).optional(),
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

export function getLaneOpponent(player: Champion, opponents: Champion[]): Champion | undefined {
  return pipe(
    opponents,
    filter((opponent) => opponent.lane === player.lane),
    first(),
  );
}
