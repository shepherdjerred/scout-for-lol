import { type MatchId, type TimelineDto, type MatchDto } from "@scout-for-lol/data";
import type OpenAI from "openai";
import * as Sentry from "@sentry/node";
import { saveTimelineSummaryToS3 } from "@scout-for-lol/backend/storage/s3.js";
import { getOpenAIClient } from "./ai-clients.js";

const TIMELINE_SUMMARY_PROMPT = `You are a League of Legends analyst. Analyze this match timeline data and provide a concise summary of how the game unfolded.

The timeline contains frames with events like CHAMPION_KILL, ELITE_MONSTER_KILL (dragons, baron, herald), BUILDING_KILL (towers, inhibitors), and participantFrames showing gold/level progression.

Participants are formatted as: Name (Champion, Position, Team)

Focus on:
- Early game: First blood, early kills, lane advantages
- Mid game: Dragon/Herald takes, tower pushes, gold leads
- Late game: Baron takes, team fights, game-ending plays
- Notable momentum swings or comeback moments

Keep the summary factual and under 300 words. Reference players by their name and champion.

Timeline data:
`;

type ParticipantInfo = {
  name: string;
  champion: string;
  position: string;
  team: "Blue" | "Red";
};

/**
 * Build a mapping from participant ID to readable info
 */
function buildParticipantMapping(matchDto: MatchDto): Map<number, ParticipantInfo> {
  const mapping = new Map<number, ParticipantInfo>();

  for (const participant of matchDto.info.participants) {
    const name = participant.riotIdGameName ?? participant.summonerName ?? "Unknown";
    const position = participant.teamPosition || participant.individualPosition || "Unknown";
    mapping.set(participant.participantId, {
      name,
      champion: participant.championName,
      position,
      team: participant.teamId === 100 ? "Blue" : "Red",
    });
  }

  return mapping;
}

/**
 * Format a participant reference for AI readability
 */
function formatParticipant(participantId: number, mapping: Map<number, ParticipantInfo>): string {
  const info = mapping.get(participantId);
  if (!info) {
    return `Unknown Player (ID: ${participantId.toString()})`;
  }
  return `${info.name} (${info.champion}, ${info.position}, ${info.team})`;
}

/**
 * Convert team ID to readable team name
 */
function formatTeam(teamId: number): string {
  return teamId === 100 ? "Blue" : "Red";
}

/**
 * Format timestamp as MM:SS
 */
function formatTimestamp(timestampMs: number): string {
  const totalSeconds = Math.floor(timestampMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString()}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Process timeline data to be more readable for the AI
 * - Replace participant IDs with readable names
 * - Replace team IDs with Blue/Red
 * - Remove pause events
 * - Format timestamps as MM:SS
 */
function processTimelineForAI(
  timelineDto: TimelineDto,
  participantMapping: Map<number, ParticipantInfo>,
): Record<string, unknown> {
  const processedFrames = timelineDto.info.frames.map((frame) => {
    // Filter out pause events and process remaining events
    const processedEvents = frame.events
      .filter((event) => event.type !== "PAUSE_END" && event.type !== "GAME_END")
      .map((event) => {
        const processed: Record<string, unknown> = {
          time: formatTimestamp(event.timestamp),
          type: event.type,
        };

        // Replace participant IDs with readable names
        if (event.killerId !== undefined && event.killerId > 0) {
          processed["killer"] = formatParticipant(event.killerId, participantMapping);
        }
        if (event.victimId !== undefined && event.victimId > 0) {
          processed["victim"] = formatParticipant(event.victimId, participantMapping);
        }
        if (event.participantId !== undefined && event.participantId > 0) {
          processed["participant"] = formatParticipant(event.participantId, participantMapping);
        }
        if (event.creatorId !== undefined && event.creatorId > 0) {
          processed["creator"] = formatParticipant(event.creatorId, participantMapping);
        }
        if (event.assistingParticipantIds && event.assistingParticipantIds.length > 0) {
          processed["assists"] = event.assistingParticipantIds.map((id) => formatParticipant(id, participantMapping));
        }

        // Replace team IDs with readable names
        if (event.teamId !== undefined) {
          processed["team"] = formatTeam(event.teamId);
        }
        if (event.killerTeamId !== undefined) {
          processed["killerTeam"] = formatTeam(event.killerTeamId);
        }
        if (event.winningTeam !== undefined) {
          processed["winningTeam"] = formatTeam(event.winningTeam);
        }

        // Include relevant event details
        if (event.monsterType) {
          processed["monsterType"] = event.monsterType;
        }
        if (event.monsterSubType) {
          processed["monsterSubType"] = event.monsterSubType;
        }
        if (event.buildingType) {
          processed["buildingType"] = event.buildingType;
        }
        if (event.towerType) {
          processed["towerType"] = event.towerType;
        }
        if (event.laneType) {
          processed["laneType"] = event.laneType;
        }
        if (event.wardType) {
          processed["wardType"] = event.wardType;
        }
        if (event.bounty !== undefined && event.bounty > 0) {
          processed["bounty"] = event.bounty;
        }
        if (event.killStreakLength !== undefined && event.killStreakLength > 1) {
          processed["killStreak"] = event.killStreakLength;
        }

        return processed;
      });

    // Process participant frames - replace string keys with readable names
    const processedParticipantFrames: Record<string, unknown> = {};
    for (const [idStr, participantFrame] of Object.entries(frame.participantFrames)) {
      const participantId = parseInt(idStr, 10);
      const participantKey = formatParticipant(participantId, participantMapping);
      processedParticipantFrames[participantKey] = {
        gold: participantFrame.totalGold,
        level: participantFrame.level,
        cs: participantFrame.minionsKilled + participantFrame.jungleMinionsKilled,
      };
    }

    return {
      time: formatTimestamp(frame.timestamp),
      events: processedEvents,
      participants: processedParticipantFrames,
    };
  });

  return {
    frameInterval: timelineDto.info.frameInterval,
    frames: processedFrames,
  };
}

/**
 * Summarize raw timeline data using OpenAI
 *
 * Sends processed timeline data to OpenAI for summarization.
 * The AI extracts key events and creates a narrative summary.
 * Saves both the request and response to S3 for debugging/analysis.
 */
export async function summarizeTimeline(
  timelineDto: TimelineDto,
  matchDto: MatchDto,
  matchId: MatchId,
  client?: OpenAI,
): Promise<string | undefined> {
  const openaiClient = client ?? getOpenAIClient();
  if (!openaiClient) {
    console.log("[summarizeTimeline] OpenAI API key not configured, skipping timeline summary");
    return undefined;
  }

  try {
    const participantMapping = buildParticipantMapping(matchDto);
    const processedTimeline = processTimelineForAI(timelineDto, participantMapping);

    // Minify JSON to save tokens
    const timelineJson = JSON.stringify(processedTimeline);
    const fullPrompt = TIMELINE_SUMMARY_PROMPT + timelineJson;

    console.log("[summarizeTimeline] Calling OpenAI to summarize timeline...");
    console.log(`[summarizeTimeline] Timeline JSON size: ${timelineJson.length.toString()} chars`);
    const startTime = Date.now();

    const response = await openaiClient.chat.completions.create({
      model: "gpt-5.1-mini",
      messages: [
        {
          role: "user",
          content: fullPrompt,
        },
      ],
      max_completion_tokens: 3000,
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
