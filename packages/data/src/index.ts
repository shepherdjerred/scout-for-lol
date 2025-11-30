/* eslint-disable custom-rules/no-re-exports -- data package is a library, so re-exports are intentional */
export * from "./model/index.ts";
export * from "./seasons.ts";
export * from "./review/art-styles.ts";
export { ART_STYLES } from "./review/art-styles-list.ts";
export { ART_THEMES } from "./review/art-themes-list.ts";
export * from "./review/models.ts";
export * from "./review/prompts.ts";
export * from "./review/image-prompt.ts";
export {
  generateReviewText,
  generateReviewImage,
  type ReviewTextMetadata,
  type ReviewImageMetadata,
  type CuratedMatchData,
  type ChatCompletionCreateParams,
} from "./review/generator.ts";
export { extractMatchData, getOrdinalSuffix } from "./review/generator-helpers.ts";
export { curateMatchData, curateParticipantData } from "./review/curator.ts";
export { curateTimelineData } from "./review/timeline-curator.ts";
export type { CuratedTimeline, CuratedTimelineEvent, CuratedParticipantSnapshot } from "./review/curator-types.ts";

// Pipeline exports
export { generateFullMatchReview, runStage1Sequential } from "./review/pipeline.ts";
export {
  generateTimelineSummary,
  generateMatchSummary,
  generateReviewTextStage,
  generateImageDescription,
  generateImage,
} from "./review/pipeline-stages.ts";
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
} from "./review/pipeline-defaults.ts";
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
} from "./review/pipeline-types.ts";

export * from "./league/raw-match.schema.ts";
export * from "./league/raw-participant.schema.ts";
export * from "./league/raw-perks.schema.ts";
export * from "./league/raw-challenges.schema.ts";
export * from "./league/raw-timeline.schema.ts";
export * from "./league/raw-summoner-league.schema.ts";
export { getExampleMatch, type AnyMatch } from "./example/example.ts";
export * from "./data-dragon/version.ts";
export * from "./data-dragon/summoner.ts";
export * from "./data-dragon/item.ts";
export * from "./data-dragon/runes.ts";
export { getChampionInfo } from "./data-dragon/champion.ts";
export {
  // URL getters (synchronous)
  getChampionImageUrl,
  getItemImageUrl,
  getSpellImageUrl,
  getRuneIconUrl,
  getAugmentIconUrl,
  // Validation functions (async)
  validateChampionImage,
  validateItemImage,
  validateSpellImage,
  validateRuneIcon,
  validateAugmentIcon,
} from "./data-dragon/images.ts";
