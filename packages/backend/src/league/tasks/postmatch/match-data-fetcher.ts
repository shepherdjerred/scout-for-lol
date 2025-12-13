import { z } from "zod";
import * as Sentry from "@sentry/bun";
import { api } from "@scout-for-lol/backend/league/api/api.ts";
import { regionToRegionGroup } from "twisted/dist/constants/regions.js";
import { mapRegionToEnum } from "@scout-for-lol/backend/league/model/region.ts";
import type { Region, MatchId, RawMatch, RawTimeline } from "@scout-for-lol/data/index.ts";
import { RawMatchSchema, RawTimelineSchema } from "@scout-for-lol/data/index.ts";
import { createLogger } from "@scout-for-lol/backend/logger.ts";

const logger = createLogger("match-data-fetcher");

function captureError(error: unknown, source: string, matchId?: string, extra?: Record<string, string>): void {
  Sentry.captureException(error, { tags: { source, ...(matchId && { matchId }), ...extra } });
}

/**
 * Fetch match data from Riot API
 *
 * Validates the response against our schema to ensure type safety and catch API changes.
 */
export async function fetchMatchData(matchId: MatchId, playerRegion: Region): Promise<RawMatch | undefined> {
  try {
    const region = mapRegionToEnum(playerRegion);
    const regionGroup = regionToRegionGroup(region);

    logger.info(`[fetchMatchData] 📥 Fetching match data for ${matchId}`);
    const response = await api.MatchV5.get(matchId, regionGroup);

    // Validate and parse the API response to ensure it matches our schema
    try {
      const validated = RawMatchSchema.parse(response.response);
      return validated;
    } catch (parseError) {
      logger.error(`[fetchMatchData] ❌ Match data validation failed for ${matchId}:`, parseError);
      logger.error(`[fetchMatchData] This may indicate an API schema change or data corruption`);
      captureError(parseError, "match-data-validation", matchId);
      logger.error(`[fetchMatchData] 🔍 Raw API response:`, JSON.stringify(response.response, null, 2));
      return undefined;
    }
  } catch (e) {
    const result = z.object({ status: z.number() }).safeParse(e);
    if (result.success) {
      if (result.data.status === 404) {
        logger.info(`[fetchMatchData] ℹ️  Match ${matchId} not found (404) - may still be processing`);
        return undefined;
      }
      logger.error(`[fetchMatchData] ❌ HTTP Error ${result.data.status.toString()} for match ${matchId}`);
      captureError(e, "match-data-fetch", matchId, { httpStatus: result.data.status.toString() });
    } else {
      logger.error(`[fetchMatchData] ❌ Error fetching match ${matchId}:`, e);
      captureError(e, "match-data-fetch", matchId);
    }
    return undefined;
  }
}

/**
 * Fetch match timeline data from Riot API
 *
 * The timeline provides frame-by-frame game data including:
 * - Participant stats evolution (gold, XP, position)
 * - Game events (kills, item purchases, objectives, etc.)
 *
 * Validates the response against our schema to ensure type safety and catch API changes.
 */
export async function fetchMatchTimeline(matchId: MatchId, playerRegion: Region): Promise<RawTimeline | undefined> {
  try {
    const region = mapRegionToEnum(playerRegion);
    const regionGroup = regionToRegionGroup(region);

    logger.info(`[fetchMatchTimeline] 📥 Fetching timeline data for ${matchId}`);

    // Use the timeline endpoint from the twisted library
    // The twisted library provides api.MatchV5.timeline() for Match V5 Timeline API
    const response = await api.MatchV5.timeline(matchId, regionGroup);

    // Validate and parse the API response to ensure it matches our schema
    try {
      const validated = RawTimelineSchema.parse(response.response);
      logger.info(`[fetchMatchTimeline] ✅ Timeline validated with ${validated.info.frames.length.toString()} frames`);
      return validated;
    } catch (parseError) {
      logger.error(`[fetchMatchTimeline] ❌ Timeline data validation failed for ${matchId}:`, parseError);
      logger.error(`[fetchMatchTimeline] This may indicate an API schema change or data corruption`);
      captureError(parseError, "timeline-data-validation", matchId);
      return undefined;
    }
  } catch (e) {
    const result = z.object({ status: z.number() }).safeParse(e);
    if (result.success) {
      if (result.data.status === 404) {
        logger.info(`[fetchMatchTimeline] ℹ️  Timeline ${matchId} not found (404) - may still be processing`);
        return undefined;
      }
      logger.error(`[fetchMatchTimeline] ❌ HTTP Error ${result.data.status.toString()} for timeline ${matchId}`);
      captureError(e, "timeline-data-fetch", matchId, { httpStatus: result.data.status.toString() });
    } else {
      logger.error(`[fetchMatchTimeline] ❌ Error fetching timeline ${matchId}:`, e);
      captureError(e, "timeline-data-fetch", matchId);
    }
    return undefined;
  }
}
