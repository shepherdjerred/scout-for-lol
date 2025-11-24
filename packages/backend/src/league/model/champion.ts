import { type ArenaChampion, type Augment, type ParticipantDto } from "@scout-for-lol/data";
import { participantToChampion } from "@scout-for-lol/data/model/match-helpers";
import { mapAugmentIdsToUnion } from "@scout-for-lol/backend/league/arena/augment";

// Arena champion conversion with arena-specific fields
export async function participantToArenaChampion(dto: ParticipantDto): Promise<ArenaChampion> {
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
async function extractAugments(dto: ParticipantDto): Promise<Augment[]> {
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
  if (ids.length === 0) {
    return [];
  }
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

function extractArenaMetrics(dto: ParticipantDto) {
  return {
    playerScore0: dto.playerScore0 ?? 0,
    playerScore1: dto.playerScore1 ?? 0,
    playerScore2: dto.playerScore2 ?? 0,
    playerScore3: dto.playerScore3 ?? 0,
    playerScore4: dto.playerScore4 ?? 0,
    playerScore5: dto.playerScore5 ?? 0,
    playerScore6: dto.playerScore6 ?? 0,
    playerScore7: dto.playerScore7 ?? 0,
    playerScore8: dto.playerScore8 ?? 0,
  };
}

function extractTeamSupport(dto: ParticipantDto) {
  return {
    damageShieldedOnTeammate: dto.totalDamageShieldedOnTeammates,
    healsOnTeammate: dto.totalHealsOnTeammates,
    damageTakenPercentage: dto.challenges.damageTakenOnTeamPercentage,
  };
}
