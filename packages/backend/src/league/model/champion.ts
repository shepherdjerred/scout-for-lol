import type { MatchV5DTOs } from "twisted/dist/models-dto/index.js";
import { type Champion, type ArenaChampion, parseLane } from "@scout-for-lol/data";

// Base champion conversion for traditional games
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

// Arena champion conversion with arena-specific fields
export function participantToArenaChampion(
  dto: MatchV5DTOs.ParticipantDto,
): ArenaChampion {
  const baseChampion = participantToChampion(dto);

  // Extract augments (playerAugment1-6, filter out zeros)
  const augments: number[] = [];
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
      augments.push(augment);
    }
  }

  // Extract arena performance metrics (PlayerScore0-11)
  const arenaMetrics = {
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

  // Extract team support metrics (arena 2v2 specific)
  const teamSupport = {
    damageShieldedOnTeammate: dto.totalDamageShieldedOnTeammates,
    healsOnTeammate: dto.totalHealsOnTeammates,
    damageTakenPercentage: dto.challenges?.damageTakenOnTeamPercentage,
  };

  return {
    ...baseChampion,
    augments,
    arenaMetrics,
    teamSupport,
  };
}
