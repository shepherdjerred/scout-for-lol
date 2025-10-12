import type { MatchV5DTOs } from "twisted/dist/models-dto/index.js";
import { type Champion, type ArenaChampion, parseLane, type Augment } from "@scout-for-lol/data";
import { mapAugmentIdsToUnion } from "../arena/augment";

// Base champion conversion for traditional games
export function participantToChampion(dto: MatchV5DTOs.ParticipantDto): Champion {
  if (!dto.riotIdGameName) {
    throw new Error("Missing riotIdGameName");
  }

  return {
    riotIdGameName: dto.riotIdGameName,
    championName: dto.championName,
    kills: dto.kills,
    deaths: dto.deaths,
    assists: dto.assists,
    items: [dto.item0, dto.item1, dto.item2, dto.item3, dto.item4, dto.item5, dto.item6],
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

// Arena champion conversion with arena-specific fields
export async function participantToArenaChampion(dto: MatchV5DTOs.ParticipantDto): Promise<ArenaChampion> {
  const baseChampion = participantToChampion(dto);

  const augments = await extractAugments(dto);
  const arenaMetrics = extractArenaMetrics(dto);
  const teamSupport = extractTeamSupport(dto);

  return {
    ...baseChampion,
    augments,
    arenaMetrics,
    teamSupport,
  };
}

// Helpers for arena-specific fields
export async function extractAugments(dto: MatchV5DTOs.ParticipantDto): Promise<Augment[]> {
  const ids: number[] = [];
  const augmentFields = [
    dto.playerAugment1,
    dto.playerAugment2,
    dto.playerAugment3,
    dto.playerAugment4,
    dto.playerAugment5,
    dto.playerAugment6,
  ];
  for (const augment of augmentFields) {
    if (augment && augment !== 0) {
      ids.push(augment);
    }
  }
  if (ids.length === 0) return [];
  try {
    const result = await mapAugmentIdsToUnion(ids);
    return result;
  } catch {
    const result: Augment[] = ids.map((id) => ({
      id,
      type: "id" as const,
    }));

    return result;
  }
}

export function extractArenaMetrics(dto: MatchV5DTOs.ParticipantDto) {
  return {
    playerScore0: dto.PlayerScore0,
    playerScore1: dto.PlayerScore1,
    playerScore2: dto.PlayerScore2,
    playerScore3: dto.PlayerScore3,
    playerScore4: dto.PlayerScore4,
    playerScore5: dto.PlayerScore5,
    playerScore6: dto.PlayerScore6,
    playerScore7: dto.PlayerScore7,
    playerScore8: dto.PlayerScore8,
  };
}

export function extractTeamSupport(dto: MatchV5DTOs.ParticipantDto) {
  return {
    damageShieldedOnTeammate: dto.totalDamageShieldedOnTeammates,
    healsOnTeammate: dto.totalHealsOnTeammates,
    damageTakenPercentage: dto.challenges.damageTakenOnTeamPercentage,
  };
}
