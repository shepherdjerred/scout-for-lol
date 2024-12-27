import { z } from "zod";
import { LaneSchema, parseLane } from "./lane.ts";
import type { MatchV5DTOs } from "twisted/dist/models-dto/index.js";

export type Champion = z.infer<typeof ChampionSchema>;
export const ChampionSchema = z.strictObject({
  summonerName: z.string().min(0),
  championName: z.string().min(0),
  kills: z.number().nonnegative(),
  deaths: z.number().nonnegative(),
  assists: z.number().nonnegative(),
  level: z.number().min(1).max(18),
  items: z.array(z.number()),
  lane: LaneSchema.optional(),
  spells: z.array(z.number()),
  gold: z.number().nonnegative(),
  runes: z.array(z.strictObject({})),
  creepScore: z.number().nonnegative(),
  visionScore: z.number().nonnegative(),
  damage: z.number().nonnegative(),
});

export function participantToChampion(
  dto: MatchV5DTOs.ParticipantDto,
): Champion {
  return {
    summonerName: dto.riotIdGameName ?? "???",
    championName: dto.championName,
    kills: dto.kills,
    deaths: dto.deaths,
    assists: dto.assists,
    items: [
      dto.item0,
      dto.item1,
      dto.item2,
      dto.item3,
      dto.item4,
      dto.item5,
      dto.item6,
    ],
    spells: [dto.summoner1Id, dto.summoner2Id],
    runes: [],
    lane: parseLane(dto.teamPosition),
    creepScore: dto.totalMinionsKilled + dto.neutralMinionsKilled,
    visionScore: dto.visionScore,
    damage: dto.totalDamageDealtToChampions,
    gold: dto.goldEarned,
    level: dto.champLevel,
  };
}
