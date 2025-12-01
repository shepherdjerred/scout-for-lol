/**
 * Filter functions to reduce raw match data size for LLM consumption.
 *
 * The full raw match from Riot API can be 200k+ tokens (10 players × 150+ fields each,
 * plus challenges, perks, missions objects). This module provides functions to
 * slim it down to ~5-10k tokens by keeping only relevant stats.
 */

import type { RawMatch } from "@scout-for-lol/data/league/raw-match.schema.ts";

/**
 * Key fields to keep from raw participant data for the reviewed player.
 * This excludes bloated objects (challenges, perks, missions) and keeps
 * only the most important stats for review.
 */
const PLAYER_PARTICIPANT_FIELDS = [
  // Identity
  "championName",
  "championId",
  "participantId",
  "teamId",
  "individualPosition",
  "teamPosition",
  "lane",
  "role",
  // Core stats
  "kills",
  "deaths",
  "assists",
  "champLevel",
  "champExperience",
  "goldEarned",
  "goldSpent",
  // Damage
  "totalDamageDealtToChampions",
  "physicalDamageDealtToChampions",
  "magicDamageDealtToChampions",
  "trueDamageDealtToChampions",
  "totalDamageTaken",
  "damageSelfMitigated",
  // Vision
  "visionScore",
  "wardsPlaced",
  "wardsKilled",
  "detectorWardsPlaced",
  "visionWardsBoughtInGame",
  // CS and objectives
  "totalMinionsKilled",
  "neutralMinionsKilled",
  "damageDealtToObjectives",
  "damageDealtToTurrets",
  "damageDealtToBuildings",
  "turretKills",
  "turretTakedowns",
  "inhibitorKills",
  "dragonKills",
  "baronKills",
  // Items
  "item0",
  "item1",
  "item2",
  "item3",
  "item4",
  "item5",
  "item6",
  "itemsPurchased",
  // Combat
  "killingSprees",
  "largestKillingSpree",
  "largestMultiKill",
  "doubleKills",
  "tripleKills",
  "quadraKills",
  "pentaKills",
  "firstBloodKill",
  "firstBloodAssist",
  "firstTowerKill",
  "firstTowerAssist",
  // Utility
  "totalHeal",
  "totalHealsOnTeammates",
  "totalDamageShieldedOnTeammates",
  "timeCCingOthers",
  "totalTimeCCDealt",
  // Time
  "timePlayed",
  "longestTimeSpentLiving",
  "totalTimeSpentDead",
  // Game state
  "win",
  "gameEndedInSurrender",
  "gameEndedInEarlySurrender",
  // Arena-specific (optional fields)
  "placement",
  "subteamPlacement",
  "playerAugment1",
  "playerAugment2",
  "playerAugment3",
  "playerAugment4",
] as const;

/**
 * Minimal fields for other players (opponents/teammates).
 * Just enough to understand the match context.
 */
const OTHER_PARTICIPANT_FIELDS = [
  "championName",
  "championId",
  "participantId",
  "teamId",
  "individualPosition",
  "teamPosition",
  "kills",
  "deaths",
  "assists",
  "champLevel",
  "totalDamageDealtToChampions",
  "goldEarned",
  "win",
  // Arena
  "placement",
] as const;

/**
 * Filter raw participant data to only include specified fields.
 * Uses Object.entries to avoid type assertions while iterating over participant fields.
 */
function filterParticipant(
  participant: RawMatch["info"]["participants"][number],
  fields: readonly string[],
): Record<string, unknown> {
  const fieldSet = new Set<string>(fields);
  const filtered: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(participant)) {
    if (fieldSet.has(key)) {
      filtered[key] = value;
    }
  }
  return filtered;
}

/**
 * Create a slimmed-down version of raw match data for LLM consumption.
 *
 * The full raw match from Riot API can be 200k+ tokens (10 players × 150+ fields each,
 * plus challenges, perks, missions objects). This function reduces it to ~5-10k tokens
 * by keeping only relevant stats.
 *
 * @param rawMatch - Full raw match data from Riot API
 * @param playerChampion - Champion name of the player being reviewed
 * @returns Filtered match data safe for LLM context
 */
export function createSlimRawMatch(rawMatch: RawMatch, playerChampion: string): object {
  const participants = rawMatch.info.participants;

  // Find the player being reviewed
  const reviewedParticipant = participants.find((p) => p.championName.toLowerCase() === playerChampion.toLowerCase());

  // Separate player from others
  const slimParticipants = participants.map((p) => {
    if (p === reviewedParticipant) {
      return filterParticipant(p, PLAYER_PARTICIPANT_FIELDS);
    }
    return filterParticipant(p, OTHER_PARTICIPANT_FIELDS);
  });

  return {
    metadata: {
      matchId: rawMatch.metadata.matchId,
    },
    info: {
      gameCreation: rawMatch.info.gameCreation,
      gameDuration: rawMatch.info.gameDuration,
      gameMode: rawMatch.info.gameMode,
      gameType: rawMatch.info.gameType,
      gameVersion: rawMatch.info.gameVersion,
      queueId: rawMatch.info.queueId,
      mapId: rawMatch.info.mapId,
      participants: slimParticipants,
      teams: rawMatch.info.teams,
    },
  };
}
