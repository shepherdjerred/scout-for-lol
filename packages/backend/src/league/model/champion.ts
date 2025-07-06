import type { MatchV5DTOs } from "twisted/dist/models-dto/index.js";
import { type Champion, parseLane } from "@scout-for-lol/data";

export function participantToChampion(
  dto: MatchV5DTOs.ParticipantDto,
): Champion {
  if (!dto.riotIdGameName) {
    throw new Error("Missing riotIdGameName");
  }
  return {
    riotIdGameName: dto.riotIdGameName,
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
    // TODO: parse runes
    runes: [],
    lane: parseLane(dto.teamPosition),
    creepScore: dto.totalMinionsKilled + dto.neutralMinionsKilled,
    visionScore: dto.visionScore,
    damage: dto.totalDamageDealtToChampions,
    gold: dto.goldEarned,
    level: dto.champLevel,
  };
}
