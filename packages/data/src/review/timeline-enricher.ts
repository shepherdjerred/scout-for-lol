/**
 * Timeline enrichment utilities
 *
 * Provides helpful context data that makes the raw timeline easier for AI to interpret.
 * Includes a participant lookup table for champion names and filters the timeline
 * to reduce token usage while preserving important game narrative.
 */

import type { RawMatch, RawTimeline } from "@scout-for-lol/data";
import { createSlimTimeline } from "./timeline-filter.ts";

/**
 * Participant info for the lookup table
 */
export type ParticipantLookup = {
  participantId: number;
  championName: string;
  team: "Blue" | "Red";
  summonerName: string;
};

/**
 * Enrichment context to include with raw timeline data
 */
export type TimelineEnrichment = {
  /** Lookup table mapping participant IDs (1-10) to champion/team info */
  participants: ParticipantLookup[];
  /** Game duration in seconds */
  gameDurationSeconds: number;
};

/**
 * Build enrichment context for a timeline
 *
 * This creates a lookup table that maps participant IDs to human-readable
 * champion names and team names ("Blue"/"Red" instead of 100/200).
 */
export function buildTimelineEnrichment(rawMatch: RawMatch): TimelineEnrichment {
  const participants: ParticipantLookup[] = rawMatch.info.participants.map((p, index) => ({
    participantId: index + 1,
    championName: p.championName,
    team: p.teamId === 100 ? "Blue" : "Red",
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- riotIdGameName is optional
    summonerName: p.riotIdGameName ?? p.summonerName ?? "Unknown",
  }));

  return {
    participants,
    gameDurationSeconds: rawMatch.info.gameDuration,
  };
}

/**
 * Timeline data with enrichment context
 *
 * This is what gets sent to OpenAI - a filtered timeline plus
 * a participant lookup table for human-readable names.
 */
export type EnrichedTimelineData = {
  /** Filtered timeline (important events + sampled frames) */
  timeline: object;
  /** Enrichment context (participant mapping) */
  context: TimelineEnrichment;
};

/**
 * Create enriched timeline data for AI consumption
 *
 * Filters the timeline to reduce token usage:
 * - Keeps only important events (kills, objectives, buildings)
 * - Samples frames every 5 minutes instead of every minute
 * - Keeps only key participant stats (gold, level, CS)
 */
export function enrichTimelineData(rawTimeline: RawTimeline, rawMatch: RawMatch): EnrichedTimelineData {
  return {
    timeline: createSlimTimeline(rawTimeline),
    context: buildTimelineEnrichment(rawMatch),
  };
}
