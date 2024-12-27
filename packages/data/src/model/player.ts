import { z } from "zod";
import { RankSchema, RanksSchema } from "./rank.ts";
import { rankToLeaguePoints } from "./leaguePoints.ts";
import { PlayerConfigEntrySchema } from "./playerConfig.ts";
import { flatMap, sortBy } from "remeda";

export type Player = z.infer<typeof PlayerSchema>;
export const PlayerSchema = z.strictObject({
  config: PlayerConfigEntrySchema,
  ranks: RanksSchema,
});

export type PlayerWithSoloQueueRank = z.infer<
  typeof PlayerWithSoloQueueRankSchema
>;
export const PlayerWithSoloQueueRankSchema = PlayerSchema.extend({
  ranks: RanksSchema.extend({
    solo: RankSchema,
  }),
});

export function filterPlayersWithSoloQueueRank(
  players: Player[],
): PlayerWithSoloQueueRank[] {
  return flatMap(
    players,
    (player) =>
      PlayerWithSoloQueueRankSchema.safeParse(player).success
        ? [PlayerWithSoloQueueRankSchema.parse(player)]
        : [],
  );
}

export function sortPlayersBySoloQueueRank(
  players: Player[],
): PlayerWithSoloQueueRank[] {
  const playersWithSoloQueueRank = filterPlayersWithSoloQueueRank(players);
  return sortBy(
    playersWithSoloQueueRank,
    (player) => rankToLeaguePoints(player.ranks.solo),
  ).reverse();
}
