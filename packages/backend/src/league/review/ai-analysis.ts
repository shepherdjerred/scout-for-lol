import type { MatchId, ArenaMatch, CompletedMatch, CuratedMatchData } from "@scout-for-lol/data";
import type OpenAI from "openai";
import * as Sentry from "@sentry/node";
import { saveMatchAnalysisToS3 } from "@scout-for-lol/backend/storage/ai-review-s3.js";
import { createLogger } from "@scout-for-lol/backend/logger.js";

const logger = createLogger("review-ai-analysis");

const MATCH_ANALYSIS_SYSTEM_PROMPT = `You are a League of Legends analyst who writes lane-aware breakdowns for a single player's performance.
Use the provided match context and curated stats (including timeline details) to explain:
- How the game flowed for that player
- Where they excelled or struggled in their specific lane context
- The biggest momentum swings that mattered for them
- Concrete improvement ideas
Keep the writing concise, grounded in the numbers provided, and avoid generic advice.`;

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
    logger.info("[analyzeMatchData] No player found for analysis");
    return undefined;
  }
  const playerName = player.playerConfig.alias;
  if (!playerName) {
    logger.info("[analyzeMatchData] Player alias missing, skipping analysis");
    return undefined;
  }
  const playerChampion = player.champion.championName;
  let lane = "unknown lane";
  if (match.queueType === "arena") {
    lane = "arena";
  } else if ("lane" in player && typeof player.lane === "string") {
    lane = player.lane;
  }

  // Minify JSON to save tokens
  const matchDataForPrompt = JSON.stringify({
    processedMatch: match,
    detailedStats: curatedData,
  });
  const timelineSummary = curatedData.timelineSummary ?? "No timeline summary available.";

  const userPrompt = `Analyze ${playerName} playing ${playerChampion} in the ${lane} context. Use the lane primer and timeline summary to stay grounded in role expectations and how the game flowed.

Lane primer:
${laneContext}

Timeline summary:
${timelineSummary}

Provide three sections:
1) Summary (2-3 sentences about their game flow)
2) Lane Highlights (3-5 bullets referencing concrete numbers from the data: KDA, CS/min, damage, objective participation, gold swings, etc.)
3) Improvement Ideas (2 bullets of actionable, lane-aware advice)

Keep it under 220 words and avoid generic platitudes.`;

  logger.info(`[analyzeMatchData] Calling OpenAI for ${playerName} (${playerChampion}) in ${lane} using curated data`);
  const startTime = Date.now();

  try {
    const response = await openaiClient.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: MATCH_ANALYSIS_SYSTEM_PROMPT },
        {
          role: "user",
          content: `${userPrompt}\n\nMatch data JSON:\n${matchDataForPrompt}`,
        },
      ],
      max_completion_tokens: 3000,
      temperature: 0.4,
    });

    const duration = Date.now() - startTime;
    const analysis = response.choices[0]?.message.content?.trim();
    if (!analysis) {
      logger.info("[analyzeMatchData] No analysis content returned from OpenAI");
      return undefined;
    }

    logger.info(`[analyzeMatchData] Generated analysis (${analysis.length.toString()} chars)`);

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
          timelineSummary: timelineSummary,
          playerIndex,
          playerName,
          playerChampion,
        },
        response: {
          analysis,
          durationMs: duration,
          model: "gpt-4o-mini",
        },
      });
    } catch (s3Error) {
      logger.error("[analyzeMatchData] Failed to save analysis to S3:", s3Error);
    }

    return analysis;
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("[analyzeMatchData] Error generating match analysis:", err);
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
