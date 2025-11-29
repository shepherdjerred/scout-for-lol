import {
  type MatchId,
  type ArenaMatch,
  type CompletedMatch,
  type CuratedMatchData,
  analyzeMatchData as analyzeMatchDataCore,
  MATCH_ANALYSIS_SYSTEM_PROMPT,
} from "@scout-for-lol/data";
import type OpenAI from "openai";
import * as Sentry from "@sentry/node";
import { saveMatchAnalysisToS3 } from "@scout-for-lol/backend/storage/ai-review-s3.js";

/**
 * Analyze match data using OpenAI
 *
 * This is a backend wrapper around the shared analyzeMatchData function.
 * It adds:
 * - S3 persistence for debugging
 * - Sentry error tracking
 */
export async function analyzeMatchData(params: {
  match: CompletedMatch | ArenaMatch;
  curatedData: CuratedMatchData;
  laneContext: string;
  matchId: MatchId;
  queueType: string;
  trackedPlayerAliases: string[];
  playerIndex: number;
  openaiClient: OpenAI;
}): Promise<string | undefined> {
  const { match, curatedData, laneContext, matchId, queueType, trackedPlayerAliases, playerIndex, openaiClient } =
    params;

  const player = match.players[playerIndex] ?? match.players[0];
  if (!player) {
    console.log("[analyzeMatchData] No player found for analysis");
    return undefined;
  }
  const playerName = player.playerConfig.alias;
  if (!playerName) {
    console.log("[analyzeMatchData] Player alias missing, skipping analysis");
    return undefined;
  }
  const playerChampion = player.champion.championName;
  let lane = "unknown lane";
  if (match.queueType === "arena") {
    lane = "arena";
  } else if ("lane" in player && typeof player.lane === "string") {
    lane = player.lane;
  }

  console.log(`[analyzeMatchData] Calling OpenAI for ${playerName} (${playerChampion}) in ${lane} using curated data`);

  try {
    // Use shared function from @scout-for-lol/data
    const result = await analyzeMatchDataCore({
      match,
      curatedData,
      laneContext,
      playerIndex,
      openaiClient,
      model: "gpt-4o-mini",
      timelineSummary: curatedData.timelineSummary,
    });

    if (!result) {
      console.log("[analyzeMatchData] No analysis content returned from OpenAI");
      return undefined;
    }

    console.log(`[analyzeMatchData] Generated analysis (${result.analysis.length.toString()} chars)`);

    // Save to S3 for debugging/analysis
    try {
      await saveMatchAnalysisToS3({
        matchId,
        queueType,
        trackedPlayerAliases,
        request: {
          prompt: MATCH_ANALYSIS_SYSTEM_PROMPT,
          matchData: {
            processedMatch: match,
            detailedStats: curatedData,
          },
          laneContext,
          timelineSummary: curatedData.timelineSummary ?? "No timeline summary available.",
          playerIndex,
          playerName,
          playerChampion,
        },
        response: {
          analysis: result.analysis,
          durationMs: result.durationMs,
          model: "gpt-4o-mini",
        },
      });
    } catch (s3Error) {
      console.error("[analyzeMatchData] Failed to save analysis to S3:", s3Error);
    }

    return result.analysis;
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("[analyzeMatchData] Error generating match analysis:", err);
    Sentry.captureException(err, {
      tags: {
        source: "openai-match-analysis",
        queueType,
        lane,
      },
    });
    return undefined;
  }
}
