/**
 * Filter functions to reduce raw timeline data size for LLM consumption.
 *
 * The full raw timeline from Riot API can be 100k+ tokens (one frame per minute
 * with 10 participants' detailed stats + hundreds of events). This module provides
 * functions to slim it down to ~5-10k tokens by keeping only relevant information.
 */

import type { RawTimeline } from "@scout-for-lol/data/league/raw-timeline.schema.ts";

/**
 * Event types that are most relevant for game narrative.
 * These events significantly impact the game flow and outcome.
 */
const IMPORTANT_EVENT_TYPES = new Set([
  "CHAMPION_KILL",
  "BUILDING_KILL",
  "ELITE_MONSTER_KILL",
  "DRAGON_SOUL_GIVEN",
  "GAME_END",
  "TURRET_PLATE_DESTROYED",
  "CHAMPION_SPECIAL_KILL", // First blood, multi-kills, etc.
]);

/**
 * Participant frame fields to keep.
 * Just enough to track gold/xp/cs progression without position or detailed stats.
 */
const PARTICIPANT_FRAME_FIELDS = [
  "participantId",
  "level",
  "totalGold",
  "minionsKilled",
  "jungleMinionsKilled",
] as const;

/**
 * Filter participant frame to only include key fields.
 */
function filterParticipantFrame(frame: Record<string, unknown>): Record<string, unknown> {
  const filtered: Record<string, unknown> = {};
  for (const field of PARTICIPANT_FRAME_FIELDS) {
    if (field in frame) {
      filtered[field] = frame[field];
    }
  }
  return filtered;
}

/**
 * Filter event to remove bloated victim damage arrays.
 */
function filterEvent(event: RawTimeline["info"]["frames"][number]["events"][number]): Record<string, unknown> {
  // Convert to plain object and filter out large arrays
  const filtered: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(event)) {
    // Skip victim damage arrays - they're very large and rarely needed for narrative
    if (key === "victimDamageDealt" || key === "victimDamageReceived") {
      continue;
    }
    filtered[key] = value;
  }
  return filtered;
}

/**
 * Create a slimmed-down version of raw timeline data for LLM consumption.
 *
 * Reduces timeline size by:
 * 1. Keeping only important events (kills, objectives, buildings)
 * 2. Sampling frames every 5 minutes instead of every minute
 * 3. Keeping only key participant stats (gold, level, CS)
 * 4. Removing bloated victim damage arrays from kill events
 *
 * @param rawTimeline - Full raw timeline data from Riot API
 * @returns Filtered timeline data safe for LLM context (~5-10k tokens)
 */
export function createSlimTimeline(rawTimeline: RawTimeline): object {
  const frames = rawTimeline.info.frames;
  const frameInterval = rawTimeline.info.frameInterval; // Usually 60000ms (1 minute)

  // Sample every 5 frames (5 minutes) + always include first and last frame
  const SAMPLE_INTERVAL = 5;
  const sampledFrames: object[] = [];

  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];
    if (!frame) {
      continue;
    }

    const isFirst = i === 0;
    const isLast = i === frames.length - 1;
    const isSamplePoint = i % SAMPLE_INTERVAL === 0;

    // Filter events: only keep important ones
    const importantEvents = frame.events
      .filter((event) => IMPORTANT_EVENT_TYPES.has(event.type))
      .map((event) => filterEvent(event));

    // For sampled frames, include participant data; otherwise just events
    if (isFirst || isLast || isSamplePoint) {
      // Filter participant frames to key fields only
      const slimParticipantFrames: Record<string, unknown> = {};
      for (const [participantId, participantFrame] of Object.entries(frame.participantFrames)) {
        slimParticipantFrames[participantId] = filterParticipantFrame(participantFrame);
      }

      sampledFrames.push({
        timestamp: frame.timestamp,
        participantFrames: slimParticipantFrames,
        events: importantEvents,
      });
    } else if (importantEvents.length > 0) {
      // For non-sampled frames, only include if there are important events
      sampledFrames.push({
        timestamp: frame.timestamp,
        events: importantEvents,
      });
    }
  }

  return {
    metadata: {
      matchId: rawTimeline.metadata.matchId,
    },
    info: {
      frameInterval,
      gameId: rawTimeline.info.gameId,
      frames: sampledFrames,
      // Include participant mapping from timeline (just IDs and PUUIDs)
      participants: rawTimeline.info.participants,
    },
  };
}
