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

// Pipeline exports
export { generateFullMatchReview, runStage1Sequential } from "./review/pipeline.js";
export {
  generateTimelineSummary,
  generateMatchSummary,
  generateReviewTextStage,
  generateImageDescription,
  generateImage,
} from "./review/pipeline-stages.js";
export {
  DEFAULT_STAGE_CONFIGS,
  DEFAULT_TIMELINE_SUMMARY_MODEL,
  DEFAULT_MATCH_SUMMARY_MODEL,
  DEFAULT_REVIEW_TEXT_MODEL,
  DEFAULT_IMAGE_DESCRIPTION_MODEL,
  DEFAULT_IMAGE_GENERATION_MODEL,
  DEFAULT_IMAGE_GENERATION_TIMEOUT_MS,
  TIMELINE_SUMMARY_SYSTEM_PROMPT,
  MATCH_SUMMARY_SYSTEM_PROMPT,
  IMAGE_DESCRIPTION_SYSTEM_PROMPT,
  createStageConfigs,
  getStageSystemPrompt,
} from "./review/pipeline-defaults.js";
export type {
  ModelConfig,
  StageConfig,
  ReviewTextStageConfig,
  ImageGenerationStageConfig,
  PipelineStagesConfig,
  OpenAIClient,
  PipelineMatchInput,
  PipelinePlayerInput,
  PipelinePromptsInput,
  PipelineClientsInput,
  ReviewPipelineInput,
  StageTrace,
  ImageGenerationTrace,
  PipelineTraces,
  PipelineIntermediateResults,
  PipelineContext,
  PipelineReviewOutput,
  ReviewPipelineOutput,
} from "./review/pipeline-types.js";

export * from "./league/raw-match.schema.js";
export * from "./league/raw-timeline.schema.js";
export * from "./league/raw-summoner-league.schema.js";
export { getExampleMatch, type AnyMatch } from "./example/example.js";
