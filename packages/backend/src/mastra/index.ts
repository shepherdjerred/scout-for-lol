/**
 * Mastra AI Framework integration for Scout for LoL
 *
 * This module provides AI-powered match review generation using the Mastra framework.
 * The workflow orchestrates multiple AI models (OpenAI GPT, Gemini) to generate:
 * - Timeline summaries
 * - Match analysis
 * - Review text
 * - Art prompts
 * - Review images
 */

import { Mastra } from "@mastra/core";
import {
  timelineSummaryAgent as _timelineSummaryAgent,
  matchAnalysisAgent as _matchAnalysisAgent,
  artPromptAgent as _artPromptAgent,
} from "./agents/index.js";
import {
  executeReviewWorkflow as _executeReviewWorkflow,
  generateMatchReview as _generateMatchReview,
  type ReviewMetadata as _ReviewMetadata,
} from "./workflows/review-workflow.js";

// Re-export agents for direct use if needed
export const timelineSummaryAgent = _timelineSummaryAgent;
export const matchAnalysisAgent = _matchAnalysisAgent;
export const artPromptAgent = _artPromptAgent;

// Re-export the workflow
export const executeReviewWorkflow = _executeReviewWorkflow;
export const generateMatchReview = _generateMatchReview;
export type ReviewMetadata = _ReviewMetadata;

/**
 * Mastra instance configured with AI agents for review generation
 *
 * Note: The current implementation uses a direct async workflow function
 * (executeReviewWorkflow) rather than Mastra's createWorkflow API because:
 *
 * 1. Complex data dependencies between steps require flexible data passing
 * 2. The existing helper functions from @scout-for-lol/data need direct client access
 * 3. Sequential step execution with state management is simpler in direct async code
 *
 * The agents are still registered here for potential future use with Mastra's
 * agent-based features like human-in-the-loop or agent chaining.
 */
export const mastra = new Mastra({
  agents: {
    timelineSummaryAgent,
    matchAnalysisAgent,
    artPromptAgent,
  },
});
