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
export * from "./league/match-dto.schema.js";
export * from "./league/timeline-dto.schema.js";
export * from "./league/summoner-league-dto.schema.js";
export { getExampleMatch, type AnyMatch } from "./example/example.js";
