import {
  type MatchDto,
  type TimelineDto,
  generateReviewText,
  generateReviewImage,
  type ArenaMatch,
  type CompletedMatch,
  type MatchId,
  selectRandomStyleAndTheme,
  curateMatchData,
  type CuratedMatchData,
  type ReviewTextMetadata,
} from "@scout-for-lol/data";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import * as Sentry from "@sentry/node";
import config from "@scout-for-lol/backend/configuration.js";
import {
  saveAIReviewImageToS3,
  saveAIReviewTextToS3,
  saveAIReviewRequestToS3,
  saveTimelineSummaryToS3,
  saveMatchAnalysisToS3,
  saveArtPromptToS3,
} from "@scout-for-lol/backend/storage/s3.js";
import {
  loadPromptFile,
  selectRandomPersonality,
  loadPlayerMetadata,
  getLaneContext,
} from "@scout-for-lol/backend/league/review/prompts.js";

const AI_IMAGES_DIR = `${import.meta.dir}/ai-images`;

/**
 * Initialize OpenAI client if API key is configured
 */
function getOpenAIClient(): OpenAI | undefined {
  if (!config.openaiApiKey) {
    return undefined;
  }
  return new OpenAI({ apiKey: config.openaiApiKey });
}

/**
 * Initialize Gemini client if API key is configured
 */
function getGeminiClient(): GoogleGenerativeAI | undefined {
  if (!config.geminiApiKey) {
    return undefined;
  }
  return new GoogleGenerativeAI(config.geminiApiKey);
}

const TIMELINE_SUMMARY_PROMPT = `You are a League of Legends analyst. Analyze this raw match timeline data from the Riot API and provide a concise summary of how the game unfolded.

The timeline contains frames with events like CHAMPION_KILL, ELITE_MONSTER_KILL (dragons, baron, herald), BUILDING_KILL (towers, inhibitors), and participantFrames showing gold/level progression.

Focus on:
- Early game: First blood, early kills, lane advantages
- Mid game: Dragon/Herald takes, tower pushes, gold leads
- Late game: Baron takes, team fights, game-ending plays
- Notable momentum swings or comeback moments

Keep the summary factual and under 300 words. Use champion names when describing kills/events.

Raw timeline JSON:
`;

const MATCH_ANALYSIS_PROMPT = `You are a high-elo League of Legends coach. Analyze the full match data with the provided lane focus
and timeline summary. Highlight lane-specific decision making, itemization, macro calls, and momentum
swings. Keep the output concise (under 350 words) and focus on practical insights and mistakes to
address.`;

const ART_PROMPT_TEMPLATE = `You are an imaginative art director. Given a styled League of Legends performance review, craft a
vivid art direction for an illustration. Respect the requested art style and theme(s). Describe the scene
in 120 words or fewer, focusing on composition, mood, and key visual elements. Avoid story prose and keep
it as a descriptive art brief.`;

/**
 * Summarize raw timeline data using OpenAI
 *
 * Sends the raw timeline JSON directly to OpenAI for summarization.
 * The AI extracts key events and creates a narrative summary.
 * Saves both the request and response to S3 for debugging/analysis.
 */
async function summarizeTimeline(timelineDto: TimelineDto, matchId: MatchId): Promise<string | undefined> {
  const client = getOpenAIClient();
  if (!client) {
    console.log("[summarizeTimeline] OpenAI API key not configured, skipping timeline summary");
    return undefined;
  }

  try {
    // Send the raw timeline JSON directly
    const timelineJson = JSON.stringify(timelineDto, null, 2);
    const fullPrompt = TIMELINE_SUMMARY_PROMPT + timelineJson;

    console.log("[summarizeTimeline] Calling OpenAI to summarize timeline...");
    console.log(`[summarizeTimeline] Timeline JSON size: ${timelineJson.length.toString()} chars`);
    const startTime = Date.now();

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini", // Use a faster/cheaper model for summarization
      messages: [
        {
          role: "user",
          content: fullPrompt,
        },
      ],
      max_completion_tokens: 2000,
      temperature: 0.3, // Lower temperature for more factual output
    });

    const duration = Date.now() - startTime;
    console.log(`[summarizeTimeline] OpenAI response received in ${duration.toString()}ms`);

    const content = response.choices[0]?.message.content;
    if (!content) {
      console.log("[summarizeTimeline] No content in OpenAI response");
      return undefined;
    }

    const summary = content.trim();
    console.log(`[summarizeTimeline] Generated summary (${summary.length.toString()} chars)`);

    // Save request and response to S3
    try {
      await saveTimelineSummaryToS3({
        matchId,
        timelineDto,
        prompt: TIMELINE_SUMMARY_PROMPT,
        summary,
        durationMs: duration,
      });
    } catch (s3Error) {
      console.error("[summarizeTimeline] Failed to save to S3:", s3Error);
      // Continue even if S3 save fails
    }

    return summary;
  } catch (error) {
    console.error("[summarizeTimeline] Error summarizing timeline:", error);
    Sentry.captureException(error, {
      tags: {
        source: "timeline-summarization",
        matchId,
      },
    });
    return undefined;
  }
}

async function analyzeMatchData(
  curatedData: CuratedMatchData,
  matchId: MatchId,
  params: { lane?: string | undefined },
): Promise<string | undefined> {
  const client = getOpenAIClient();
  if (!client) {
    console.log("[analyzeMatchData] OpenAI API key not configured, skipping match analysis");
    return undefined;
  }

  try {
    const curatedJson = JSON.stringify(curatedData, null, 2);
    const promptSections = [
      MATCH_ANALYSIS_PROMPT,
      `Lane focus: ${params.lane ?? "unknown"}`,
      curatedData.timelineSummary ? `Timeline summary:\n${curatedData.timelineSummary}` : undefined,
      `Curated match data (JSON):\n${curatedJson}`,
    ].filter((section): section is string => Boolean(section));

    const fullPrompt = promptSections.join("\n\n");

    console.log("[analyzeMatchData] Calling OpenAI to analyze curated match data...");
    const startTime = Date.now();
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: fullPrompt,
        },
      ],
      max_completion_tokens: 3000,
      temperature: 0.4,
    });

    const duration = Date.now() - startTime;
    console.log(`[analyzeMatchData] OpenAI response received in ${duration.toString()}ms`);

    const content = response.choices[0]?.message.content;
    if (!content) {
      console.log("[analyzeMatchData] No content returned from OpenAI");
      return undefined;
    }

    const analysis = content.trim();
    console.log(`[analyzeMatchData] Generated match analysis (${analysis.length.toString()} chars)`);

    try {
      await saveMatchAnalysisToS3({
        matchId,
        lane: params.lane,
        curatedData,
        prompt: MATCH_ANALYSIS_PROMPT,
        analysis,
        durationMs: duration,
        timelineSummary: curatedData.timelineSummary,
      });
    } catch (error) {
      console.error("[analyzeMatchData] Failed to save match analysis to S3:", error);
    }

    return analysis;
  } catch (error) {
    console.error("[analyzeMatchData] Error generating match analysis:", error);
    Sentry.captureException(error, {
      tags: {
        source: "openai-match-analysis",
        matchId,
        lane: params.lane ?? "unknown",
      },
    });
    return undefined;
  }
}

/**
 * Generate an AI-powered image from review text using Gemini (backend wrapper)
 */
async function generateReviewImageBackend(params: {
  reviewText: string;
  match: CompletedMatch | ArenaMatch;
  matchId: MatchId;
  queueType: string;
  style: string;
  themes: string[];
  curatedData?: CuratedMatchData;
  artPrompt?: string;
}): Promise<Uint8Array | undefined> {
  const { reviewText, match, matchId, queueType, style, themes, curatedData, artPrompt } = params;
  const client = getGeminiClient();
  if (!client) {
    console.log("[generateReviewImage] Gemini API key not configured, skipping image generation");
    return undefined;
  }

  try {
    const isMashup = themes.length > 1;

    console.log(`[generateReviewImage] Using art style: ${style}`);
    if (isMashup) {
      console.log(`[generateReviewImage] MASHUP! Themes: ${themes.join(" meets ")}`);
    } else {
      const firstTheme = themes[0];
      console.log(`[generateReviewImage] Using theme: ${firstTheme ?? "unknown"}`);
    }
    console.log("[generateReviewImage] Calling Gemini API to generate image...");

    // Log match structure before serialization for Gemini
    console.log(`[debug][generateReviewImage] About to serialize match for Gemini API`);
    if (match.queueType !== "arena") {
      console.log(`[debug][generateReviewImage] Match has ${match.players.length.toString()} player(s)`);
      for (let i = 0; i < match.players.length; i++) {
        const playerObj = match.players[i];
        if (!playerObj) {
          continue;
        }
        console.log(
          `[debug][generateReviewImage] Match.players[${i.toString()}] keys before JSON.stringify:`,
          Object.keys(playerObj),
        );
        if ("puuid" in playerObj) {
          console.error(
            `[debug][generateReviewImage] ⚠️  ERROR: Match.players[${i.toString()}] has puuid field before JSON.stringify!`,
            playerObj,
          );
        }
      }
    }

    const matchDataJson = JSON.stringify(
      curatedData ? { processedMatch: match, detailedStats: curatedData } : match,
      null,
      2,
    );

    // Call shared image generation function
    const result = await generateReviewImage({
      reviewText,
      artStyle: style,
      artTheme: themes[0] ?? "League of Legends gameplay",
      ...(themes[1] !== undefined ? { secondArtTheme: themes[1] } : {}),
      matchData: matchDataJson,
      geminiClient: client,
      model: "gemini-3-pro-image-preview",
      timeoutMs: 60_000,
      ...(artPrompt ? { promptOverride: artPrompt } : {}),
    });

    console.log(`[generateReviewImage] Gemini API call completed in ${result.metadata.imageDurationMs.toString()}ms`);

    // Decode base64 to Uint8Array
    const binaryString = atob(result.imageData);
    const buffer = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      buffer[i] = binaryString.charCodeAt(i);
    }
    console.log("[generateReviewImage] Successfully generated image");

    // Save to local filesystem for debugging
    try {
      const filepath = `${AI_IMAGES_DIR}/ai-review-${new Date().toISOString().replace(/[:.]/g, "-")}.png`;
      await Bun.write(filepath, buffer);
      console.log(`[generateReviewImage] Saved image to: ${filepath}`);
    } catch (fsError: unknown) {
      console.error("[generateReviewImage] Failed to save image to filesystem:", fsError);
    }

    // Upload to S3
    try {
      const trackedPlayerAliases = match.players.map((p) => p.playerConfig.alias);
      await saveAIReviewImageToS3(matchId, buffer, queueType, trackedPlayerAliases);
    } catch (s3Error: unknown) {
      console.error("[generateReviewImage] Failed to save image to S3:", s3Error);
      // Continue even if S3 upload fails
    }

    return buffer;
  } catch (error) {
    // Validate error structure with Zod
    const ErrorSchema = z.object({
      message: z.string(),
    });
    const result = ErrorSchema.safeParse(error);

    if (result.success && result.data.message.includes("timed out")) {
      console.error("[generateReviewImage] Gemini API call timed out - request took too long");
    } else {
      console.error("[generateReviewImage] Error generating image:", error);
    }
    Sentry.captureException(error, {
      tags: {
        source: "gemini-image-generation",
        matchId,
        queueType,
        style,
        isTimeout: result.success && result.data.message.includes("timed out") ? "true" : "false",
      },
    });
    return undefined;
  }
}

/**
 * Metadata about the generated review
 */
export type ReviewMetadata = {
  reviewerName: string;
  playerName: string;
  style?: string;
  themes?: string[];
};

type ReviewerContext = {
  personality: Awaited<ReturnType<typeof selectRandomPersonality>>;
  basePromptTemplate: string;
  laneContext: Awaited<ReturnType<typeof getLaneContext>>;
  lane?: string | undefined;
  playerIndex: number;
  playerName: string;
  playerMetadata: Awaited<ReturnType<typeof loadPlayerMetadata>>;
};

async function buildReviewerContext(match: CompletedMatch | ArenaMatch): Promise<ReviewerContext | undefined> {
  const personality = await selectRandomPersonality();
  const basePromptTemplate = await loadPromptFile("base.txt");

  console.log(`[generateAIReview] Selected personality: ${personality.filename}`);

  const playerIndex = Math.floor(Math.random() * match.players.length);
  const player = match.players[playerIndex];
  console.log(
    `[generateAIReview] Selected player ${(playerIndex + 1).toString()}/${match.players.length.toString()}: ${
      player?.playerConfig.alias ?? "unknown"
    }`,
  );

  const lane = match.queueType === "arena" ? undefined : player && "lane" in player ? player.lane : undefined;
  const laneContextInfo = await getLaneContext(lane);
  console.log(`[generateAIReview] Selected lane context: ${laneContextInfo.filename}`);

  const playerName = player?.playerConfig.alias;
  if (!playerName) {
    console.log("[generateAIReview] No player name found");
    return undefined;
  }
  const playerMeta = await loadPlayerMetadata(playerName);

  return {
    personality,
    basePromptTemplate,
    laneContext: laneContextInfo,
    lane,
    playerIndex,
    playerName,
    playerMetadata: playerMeta,
  };
}

/**
 * Generate an AI-powered review using OpenAI (backend wrapper)
 */
async function generateAIReview(
  match: CompletedMatch | ArenaMatch,
  curatedData: CuratedMatchData | undefined,
  reviewerContext: ReviewerContext,
  matchAnalysis?: string,
): Promise<{ review: string; metadata: ReviewMetadata; textMetadata: ReviewTextMetadata } | undefined> {
  const client = getOpenAIClient();
  if (!client) {
    console.log("[generateAIReview] OpenAI API key not configured, skipping AI review");
    return undefined;
  }

  try {
    console.log("[generateAIReview] Calling OpenAI API...");

    const systemPrefix = matchAnalysis
      ? `GAME ANALYSIS (use for context, don't repeat verbatim):\n${matchAnalysis}\n\n`
      : "";

    // Call shared review text generation function
    const result = await generateReviewText({
      match,
      personality: reviewerContext.personality,
      basePromptTemplate: reviewerContext.basePromptTemplate,
      laneContext: reviewerContext.laneContext.content,
      playerMetadata: reviewerContext.playerMetadata,
      openaiClient: client,
      model: "gpt-5",
      maxTokens: 25000,
      curatedData,
      playerIndex: reviewerContext.playerIndex,
      systemPromptPrefix: systemPrefix,
    });

    console.log("[generateAIReview] Successfully generated AI review");
    return {
      review: result.text,
      metadata: {
        reviewerName: result.metadata.reviewerName,
        playerName: result.metadata.playerName,
      },
      textMetadata: result.metadata,
    };
  } catch (error) {
    console.error("[generateAIReview] Error generating AI review:", error);
    Sentry.captureException(error, {
      tags: {
        source: "openai-review-generation",
        queueType: match.queueType ?? "unknown",
      },
    });
    return undefined;
  }
}

async function generateArtPrompt(params: {
  reviewText: string;
  style: string;
  themes: string[];
  matchId: MatchId;
}): Promise<string | undefined> {
  const client = getOpenAIClient();
  if (!client) {
    console.log("[generateArtPrompt] OpenAI API key not configured, skipping art prompt generation");
    return undefined;
  }

  try {
    const themeLine = params.themes.length > 1
      ? `Themes: ${params.themes.join(" + ")}`
      : `Theme: ${params.themes[0] ?? "League of Legends"}`;

    const prompt = `${ART_PROMPT_TEMPLATE}

Art style: ${params.style}
${themeLine}

Review text:
${params.reviewText}`;

    console.log("[generateArtPrompt] Calling OpenAI to draft art prompt...");
    const startTime = Date.now();
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      max_completion_tokens: 800,
      temperature: 0.7,
    });

    const duration = Date.now() - startTime;
    console.log(`[generateArtPrompt] OpenAI response received in ${duration.toString()}ms`);

    const content = response.choices[0]?.message.content;
    if (!content) {
      console.log("[generateArtPrompt] No content returned from OpenAI");
      return undefined;
    }

    const artPrompt = content.trim();
    console.log(`[generateArtPrompt] Generated art prompt (${artPrompt.length.toString()} chars)`);

    try {
      await saveArtPromptToS3({
        matchId: params.matchId,
        prompt: ART_PROMPT_TEMPLATE,
        style: params.style,
        themes: params.themes,
        reviewText: params.reviewText,
        artPrompt,
        durationMs: duration,
      });
    } catch (error) {
      console.error("[generateArtPrompt] Failed to save art prompt to S3:", error);
    }

    return artPrompt;
  } catch (error) {
    console.error("[generateArtPrompt] Error generating art prompt:", error);
    Sentry.captureException(error, {
      tags: {
        source: "openai-art-direction",
        matchId: params.matchId,
        style: params.style,
      },
    });
    return undefined;
  }
}

/**
 * Generates a post-game review for a player's performance with optional AI-generated image.
 * @param match - The completed match data (regular or arena)
 * @param matchId - The match ID for S3 storage
 * @param rawMatchData - Optional raw match data from Riot API for detailed stats
 * @param timelineData - Optional timeline data from Riot API for game progression context
 * @returns A promise that resolves to an object with review text, optional image, and metadata, or undefined if API keys are not configured
 */
export async function generateMatchReview(
  match: CompletedMatch | ArenaMatch,
  matchId: MatchId,
  rawMatchData?: MatchDto,
  timelineData?: TimelineDto,
): Promise<{ text: string; image?: Uint8Array; metadata?: ReviewMetadata } | undefined> {
  console.log(`[debug][generateMatchReview] Received match for ${matchId}`);
  console.log(
    `[debug][generateMatchReview] Match type: ${match.queueType === "arena" ? "ArenaMatch" : "CompletedMatch"}`,
  );
  if (timelineData) {
    console.log(
      `[debug][generateMatchReview] Timeline data available with ${timelineData.info.frames.length.toString()} frames`,
    );
  }
  if (match.queueType !== "arena") {
    console.log(`[debug][generateMatchReview] Match has ${match.players.length.toString()} player(s)`);
    for (let i = 0; i < match.players.length; i++) {
      const playerObj = match.players[i];
      if (!playerObj) {
        continue;
      }
      console.log(`[debug][generateMatchReview] Match.players[${i.toString()}] keys:`, Object.keys(playerObj));
      if ("puuid" in playerObj) {
        console.error(
          `[debug][generateMatchReview] ⚠️  ERROR: Match.players[${i.toString()}] has puuid field!`,
          playerObj,
        );
      }
    }
  }

  const reviewerContext = await buildReviewerContext(match);
  if (!reviewerContext) {
    console.log("[generateMatchReview] Missing reviewer context, skipping review generation");
    return undefined;
  }

  // Curate the raw match data if provided (including timeline if available)
  let curatedData = rawMatchData ? await curateMatchData(rawMatchData, timelineData) : undefined;
  if (curatedData?.timeline) {
    console.log(
      `[debug][generateMatchReview] Curated timeline with ${curatedData.timeline.keyEvents.length.toString()} key events`,
    );
  }

  // Generate timeline summary if we have timeline data
  if (timelineData && curatedData) {
    const timelineSummary = await summarizeTimeline(timelineData, matchId);
    if (timelineSummary) {
      console.log(`[debug][generateMatchReview] Generated timeline summary`);
      curatedData = { ...curatedData, timelineSummary };
    }
  }

  let matchAnalysis: string | undefined;
  if (curatedData) {
    matchAnalysis = await analyzeMatchData(curatedData, matchId, { lane: reviewerContext.lane });
    if (matchAnalysis) {
      curatedData = { ...curatedData, matchAnalysis };
    }
  }

  // Try to generate AI review
  const aiReviewResult = await generateAIReview(match, curatedData, reviewerContext, matchAnalysis);

  if (!aiReviewResult) {
    console.log("[generateMatchReview] OpenAI API key not configured, skipping review generation");
    return undefined;
  }

  const { review: reviewText, metadata, textMetadata } = aiReviewResult;

  // Save review text and request data to S3
  const queueType = match.queueType === "arena" ? "arena" : (match.queueType ?? "unknown");
  const trackedPlayerAliases = match.players.map((p) => p.playerConfig.alias);

  try {
    await saveAIReviewTextToS3(matchId, reviewText, queueType, trackedPlayerAliases);
  } catch (error) {
    console.error("[generateMatchReview] Failed to save review text to S3:", error);
    // Continue even if S3 upload fails
  }

  // Save the AI request data (prompts and parameters) to S3
  try {
    await saveAIReviewRequestToS3(matchId, textMetadata, queueType, trackedPlayerAliases);
  } catch (error) {
    console.error("[generateMatchReview] Failed to save AI request to S3:", error);
    // Continue even if S3 upload fails
  }

  // Generate AI image from the review text (only if we have a real AI review)
  const { style, themes } = selectRandomStyleAndTheme();

  const artPrompt = await generateArtPrompt({
    reviewText,
    style,
    themes,
    matchId,
  });

  // Add style and theme to metadata
  const fullMetadata: ReviewMetadata = {
    ...metadata,
    style,
    themes,
  };

  const reviewImage = await generateReviewImageBackend({
    reviewText,
    match,
    matchId,
    queueType,
    style,
    themes,
    ...(curatedData !== undefined && { curatedData }),
    ...(artPrompt ? { artPrompt } : {}),
  });

  if (reviewImage) {
    return {
      text: reviewText,
      image: reviewImage,
      metadata: fullMetadata,
    };
  }

  return {
    text: reviewText,
    metadata: fullMetadata,
  };
}
