import { type Champion, type ArenaChampion, parseLane, type Augment, type ParticipantDto } from "@scout-for-lol/data";
import { type Rune } from "@scout-for-lol/data/model/champion";
import { mapAugmentIdsToUnion } from "@scout-for-lol/backend/league/arena/augment";
import { getRuneInfo } from "@scout-for-lol/report";

// Helper to extract rune details from participant perks
function extractRunes(dto: ParticipantDto): Rune[] {
  const runes: Rune[] = [];

  // Extract primary rune selections
  const primaryStyle = dto.perks.styles[0];
  if (primaryStyle) {
    for (const selection of primaryStyle.selections) {
      const info = getRuneInfo(selection.perk);
      runes.push({
        id: selection.perk,
        name: info?.name ?? `Rune ${selection.perk.toString()}`,
        description: info?.longDesc ?? info?.shortDesc ?? "",
      });
    }
  }

  // Extract secondary rune selections
  const subStyle = dto.perks.styles[1];
  if (subStyle) {
    for (const selection of subStyle.selections) {
      const info = getRuneInfo(selection.perk);
      runes.push({
        id: selection.perk,
        name: info?.name ?? `Rune ${selection.perk.toString()}`,
        description: info?.longDesc ?? info?.shortDesc ?? "",
      });
    }
  }

  return runes;
}

// Base champion conversion for traditional games
export function participantToChampion(dto: ParticipantDto): Champion {
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
    runes: extractRunes(dto),
    lane: parseLane(dto.teamPosition),
    creepScore: dto.totalMinionsKilled + dto.neutralMinionsKilled,
    visionScore: dto.visionScore,
    damage: dto.totalDamageDealtToChampions,
    gold: dto.goldEarned,
    level: dto.champLevel,
  };
}

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
export async function extractAugments(dto: ParticipantDto): Promise<Augment[]> {
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

export function extractArenaMetrics(dto: ParticipantDto) {
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

export function extractTeamSupport(dto: ParticipantDto) {
  return {
    damageShieldedOnTeammate: dto.totalDamageShieldedOnTeammates,
    healsOnTeammate: dto.totalHealsOnTeammates,
    damageTakenPercentage: dto.challenges.damageTakenOnTeamPercentage,
  };
}
