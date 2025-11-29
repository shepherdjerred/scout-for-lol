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
// Shared AI analysis functions (legacy - kept for backwards compatibility)
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
// New workflow steps - clear 5-step pipeline with full request/response tracing
export {
  // Step functions
  summarizeMatchResult,
  summarizeTimelineStep,
  generatePersonalityReview,
  generateImageDescription,
  generateImage,
  // Prompts
  MATCH_RESULT_SUMMARY_PROMPT,
  TIMELINE_SUMMARY_PROMPT as TIMELINE_SUMMARY_PROMPT_V2,
  IMAGE_DESCRIPTION_SYSTEM_PROMPT,
  // Types
  type StepResultBase,
  type Step1aRequest,
  type Step1aResponse,
  type Step1aResult,
  type Step1bRequest,
  type Step1bResponse,
  type Step1bResult,
  type Step2Request,
  type Step2Response,
  type Step2Result,
  type Step3Request,
  type Step3Response,
  type Step3Result,
  type Step4Request,
  type Step4Response,
  type Step4Result,
  type WorkflowResult,
  type GeminiClientInterface,
  type OpenAIClientInterface as OpenAIClientInterfaceV2,
} from "./review/workflow-steps.js";
// Workflow orchestrator
export {
  executeWorkflow,
  type WorkflowConfig,
  type WorkflowProgressCallback,
} from "./review/workflow-orchestrator.js";
export * from "./league/raw-match.schema.js";
export * from "./league/raw-timeline.schema.js";
export * from "./league/raw-summoner-league.schema.js";
export { getExampleMatch, type AnyMatch } from "./example/example.js";
