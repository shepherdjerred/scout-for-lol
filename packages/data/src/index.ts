/* eslint-disable custom-rules/no-re-exports -- data package is a library, so re-exports are intentional */
export * from "./model/index.js";
export * from "./seasons.js";
export * from "./review/art-styles.js";
export { ART_STYLES } from "./review/art-styles-list.js";
export { ART_THEMES } from "./review/art-themes-list.js";
export * from "./review/models.js";
export * from "./review/prompts.js";
export * from "./review/image-prompt.js";
export {
  generateReviewText,
  generateReviewImage,
  type ReviewTextMetadata,
  type ReviewImageMetadata,
  type CuratedMatchData,
  type ChatCompletionCreateParams,
} from "./review/generator.js";
export { extractMatchData, getOrdinalSuffix } from "./review/generator-helpers.js";
export { curateMatchData, curateParticipantData } from "./review/curator.js";
export { curateTimelineData } from "./review/timeline-curator.js";
export type { CuratedTimeline, CuratedTimelineEvent, CuratedParticipantSnapshot } from "./review/curator-types.js";
// Shared AI analysis functions
export {
  summarizeTimeline,
  analyzeMatchData,
  generateArtPrompt,
  TIMELINE_SUMMARY_PROMPT,
  MATCH_ANALYSIS_SYSTEM_PROMPT,
  ART_PROMPT_SYSTEM_PROMPT,
  type OpenAIClientInterface,
  type TimelineSummaryResult,
  type MatchAnalysisResult,
  type ArtPromptResult,
  type AnalyzeMatchDataParams,
  type GenerateArtPromptParams,
} from "./review/ai-analysis.js";
export * from "./league/raw-match.schema.js";
export * from "./league/raw-timeline.schema.js";
export * from "./league/raw-summoner-league.schema.js";
export { getExampleMatch, type AnyMatch } from "./example/example.js";
