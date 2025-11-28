# AI Review Feature: Mastra Migration Plan

## Executive Summary

This document outlines the migration of the AI review feature from the current hand-rolled implementation to **Mastra**, a TypeScript AI framework that provides structured workflows, agent primitives, and multi-provider model support.

## Current Architecture Overview

### Data Flow

```text
Match Completion
    ↓
generateMatchReview() [backend/generator.ts]
    ├── prepareCuratedData()     → curateMatchData + summarizeTimeline (OpenAI)
    ├── selectPlayerContext()    → player metadata + lane context
    ├── analyzeMatchData()       → OpenAI gpt-5.1-mini
    ├── generateAIReview()       → OpenAI gpt-5
    ├── selectRandomStyleAndTheme()
    ├── generateArtPromptFromReview() → OpenAI gpt-4o-mini
    ├── generateReviewImageBackend() → Gemini imagen
    └── saveToS3()
```

### Current Files

| File                                                     | Purpose                       |
| -------------------------------------------------------- | ----------------------------- |
| `packages/backend/src/league/review/generator.ts`        | Main orchestrator             |
| `packages/backend/src/league/review/ai-clients.ts`       | OpenAI/Gemini client init     |
| `packages/backend/src/league/review/ai-analysis.ts`      | Match analysis generation     |
| `packages/backend/src/league/review/ai-art.ts`           | Art prompt generation         |
| `packages/backend/src/league/review/timeline-summary.ts` | Timeline summarization        |
| `packages/backend/src/league/review/image-backend.ts`    | Gemini image generation       |
| `packages/backend/src/league/review/prompts.ts`          | Prompt loading utilities      |
| `packages/data/src/review/generator.ts`                  | Shared core logic             |
| `packages/data/src/review/prompts.ts`                    | Template variable replacement |
| `packages/data/src/review/image-prompt.ts`               | Image prompt generation       |
| `packages/data/src/review/curator.ts`                    | Match data curation           |

### Current Models Used

| Model                        | Purpose          | Location              |
| ---------------------------- | ---------------- | --------------------- |
| `gpt-5`                      | Main review text | `generator.ts:147`    |
| `gpt-5.1-mini`               | Timeline summary | `timeline-summary.ts` |
| `gpt-5.1-mini`               | Match analysis   | `ai-analysis.ts`      |
| `gpt-4o-mini`                | Art prompt       | `ai-art.ts`           |
| `gemini-3-pro-image-preview` | Image generation | `image-backend.ts`    |

---

## Why Migrate to Mastra?

### Benefits

1. **Structured Workflows** - Graph-based state machines with `.then()`, `.branch()`, `.parallel()` for clear orchestration
2. **Multi-Model Support** - 600+ models with unified interface, automatic provider switching
3. **Built-in Observability** - Tracing, evals, and monitoring out of the box
4. **Type Safety** - Zod schemas for inputs/outputs at each step
5. **Error Handling** - Built-in retry logic and graceful degradation
6. **Human-in-the-Loop** - Suspend/resume capability for future interactive features
7. **Testability** - Each workflow step is independently testable
8. **State Management** - Shared state across steps without threading

### Trade-offs

- New dependency (~framework lock-in)
- Learning curve for team
- Some refactoring of existing helper functions
- May need to adapt frontend review tool

---

## Migration Strategy

### Phase 1: Setup & Infrastructure

#### 1.1 Install Mastra

```bash
cd packages/backend
bun add @mastra/core
```

#### 1.2 Create Mastra Instance

Create `packages/backend/src/mastra/index.ts`:

```typescript
import { Mastra } from "@mastra/core";
import { reviewWorkflow } from "./workflows/review-workflow";

export const mastra = new Mastra({
  workflows: {
    reviewWorkflow,
  },
});
```

#### 1.3 Environment Configuration

Mastra auto-detects API keys from environment variables:

- `OPENAI_API_KEY` - already configured
- `GOOGLE_GENERATIVE_AI_API_KEY` - rename from `GEMINI_API_KEY`

---

### Phase 2: Define Workflow Steps

#### 2.1 Step Definitions

Create `packages/backend/src/mastra/workflows/steps/`:

**`curate-match-data.ts`** - Curate raw match data

```typescript
import { createStep } from "@mastra/core/workflows";
import { z } from "zod";
import { curateMatchData } from "@scout-for-lol/data";

export const curateMatchDataStep = createStep({
  id: "curate-match-data",
  inputSchema: z.object({
    rawMatchData: z.any().optional(),
    timelineData: z.any().optional(),
  }),
  outputSchema: z.object({
    curatedData: z.any().optional(),
  }),
  execute: async ({ inputData }) => {
    if (!inputData.rawMatchData) {
      return { curatedData: undefined };
    }
    const curatedData = await curateMatchData(inputData.rawMatchData, inputData.timelineData);
    return { curatedData };
  },
});
```

**`summarize-timeline.ts`** - OpenAI timeline summarization

```typescript
import { createStep } from "@mastra/core/workflows";
import { z } from "zod";

export const summarizeTimelineStep = createStep({
  id: "summarize-timeline",
  inputSchema: z.object({
    curatedData: z.any().optional(),
    matchId: z.string(),
  }),
  outputSchema: z.object({
    timelineSummary: z.string().optional(),
    curatedData: z.any().optional(),
  }),
  execute: async ({ inputData, mastra }) => {
    if (!inputData.curatedData?.timeline) {
      return { curatedData: inputData.curatedData };
    }

    const model = mastra.getModel("openai/gpt-5.1-mini");
    const response = await model.generate(
      [
        {
          role: "system",
          content: "You summarize League of Legends match timelines...",
        },
        {
          role: "user",
          content: JSON.stringify(inputData.curatedData.timeline),
        },
      ],
      {
        temperature: 0.3,
        maxTokens: 3000,
      },
    );

    return {
      timelineSummary: response.text,
      curatedData: {
        ...inputData.curatedData,
        timelineSummary: response.text,
      },
    };
  },
});
```

**`analyze-match.ts`** - Match analysis

```typescript
export const analyzeMatchStep = createStep({
  id: "analyze-match",
  inputSchema: z.object({
    match: MatchSchema,
    curatedData: z.any().optional(),
    laneContext: z.string(),
    playerIndex: z.number(),
  }),
  outputSchema: z.object({
    matchAnalysis: z.string().optional(),
  }),
  execute: async ({ inputData, mastra }) => {
    if (!inputData.curatedData) {
      return { matchAnalysis: undefined };
    }

    const model = mastra.getModel("openai/gpt-5.1-mini");
    // ... existing analyzeMatchData logic adapted
  },
});
```

**`generate-review-text.ts`** - Main review generation

```typescript
export const generateReviewTextStep = createStep({
  id: "generate-review-text",
  inputSchema: z.object({
    match: MatchSchema,
    personality: PersonalitySchema,
    basePromptTemplate: z.string(),
    laneContext: z.string(),
    playerMetadata: PlayerMetadataSchema,
    playerIndex: z.number(),
    matchAnalysis: z.string().optional(),
    timelineSummary: z.string().optional(),
    curatedData: z.any().optional(),
  }),
  outputSchema: z.object({
    reviewText: z.string(),
    metadata: ReviewTextMetadataSchema,
  }),
  execute: async ({ inputData, mastra }) => {
    const model = mastra.getModel("openai/gpt-5");
    // ... existing generateReviewText logic adapted
  },
});
```

**`generate-art-prompt.ts`** - Art prompt from review

```typescript
export const generateArtPromptStep = createStep({
  id: "generate-art-prompt",
  inputSchema: z.object({
    reviewText: z.string(),
    style: z.string(),
    themes: z.array(z.string()),
  }),
  outputSchema: z.object({
    artPrompt: z.string(),
  }),
  execute: async ({ inputData, mastra }) => {
    const model = mastra.getModel("openai/gpt-4o-mini");
    // ... existing generateArtPromptFromReview logic
  },
});
```

**`generate-image.ts`** - Gemini image generation

```typescript
export const generateImageStep = createStep({
  id: "generate-image",
  inputSchema: z.object({
    artPrompt: z.string(),
    style: z.string(),
    themes: z.array(z.string()),
    matchData: z.string().optional(),
  }),
  outputSchema: z.object({
    imageData: z.string().optional(), // base64
    imageMetadata: ImageMetadataSchema.optional(),
  }),
  execute: async ({ inputData, mastra }) => {
    const model = mastra.getModel("google/gemini-3-pro-image-preview");
    // ... existing generateReviewImage logic
  },
});
```

**`save-to-s3.ts`** - S3 persistence (side effect step)

```typescript
export const saveToS3Step = createStep({
  id: "save-to-s3",
  inputSchema: z.object({
    matchId: z.string(),
    reviewText: z.string(),
    imageData: z.string().optional(),
    metadata: z.any(),
    queueType: z.string(),
    trackedPlayerAliases: z.array(z.string()),
  }),
  outputSchema: z.object({
    saved: z.boolean(),
  }),
  execute: async ({ inputData }) => {
    // ... existing S3 save logic
    return { saved: true };
  },
});
```

---

### Phase 3: Compose Workflow

Create `packages/backend/src/mastra/workflows/review-workflow.ts`:

```typescript
import { createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";
import { curateMatchDataStep } from "./steps/curate-match-data";
import { summarizeTimelineStep } from "./steps/summarize-timeline";
import { analyzeMatchStep } from "./steps/analyze-match";
import { generateReviewTextStep } from "./steps/generate-review-text";
import { generateArtPromptStep } from "./steps/generate-art-prompt";
import { generateImageStep } from "./steps/generate-image";
import { saveToS3Step } from "./steps/save-to-s3";

export const reviewWorkflow = createWorkflow({
  id: "match-review",
  inputSchema: z.object({
    match: MatchSchema,
    matchId: z.string(),
    rawMatchData: z.any().optional(),
    timelineData: z.any().optional(),
  }),
  outputSchema: z.object({
    text: z.string(),
    image: z.instanceof(Uint8Array).optional(),
    metadata: ReviewMetadataSchema.optional(),
  }),
  stateSchema: z.object({
    personality: PersonalitySchema.optional(),
    basePromptTemplate: z.string().optional(),
    playerContext: PlayerContextSchema.optional(),
    style: z.string().optional(),
    themes: z.array(z.string()).optional(),
    curatedData: z.any().optional(),
  }),
})
  // Step 1: Setup - load personality, prompts, player context
  .then(setupStep)
  // Step 2: Curate match data
  .then(curateMatchDataStep)
  // Step 3: Summarize timeline (depends on curated data)
  .then(summarizeTimelineStep)
  // Step 4: Analyze match (depends on curated data)
  .then(analyzeMatchStep)
  // Step 5: Generate review text (main LLM call)
  .then(generateReviewTextStep)
  // Step 6 & 7: Art prompt + Image (could run in parallel with S3 save)
  .then(generateArtPromptStep)
  .then(generateImageStep)
  // Step 8: Save to S3
  .then(saveToS3Step)
  .commit();
```

---

### Phase 4: Update Integration Point

Update `packages/backend/src/league/tasks/postmatch/match-report-generator.ts`:

```typescript
// Before
import { generateMatchReview } from "@scout-for-lol/backend/league/review/generator.js";

// After
import { mastra } from "@scout-for-lol/backend/mastra";

// In generateMatchReport():
async function generateMatchReport(...) {
  // ... existing code ...

  // Replace direct function call with workflow execution
  const workflow = mastra.getWorkflow("match-review");
  const run = await workflow.createRunAsync();
  const result = await run.start({
    inputData: {
      match,
      matchId,
      rawMatchData,
      timelineData,
    },
  });

  if (result.status === "success") {
    return {
      text: result.result.text,
      image: result.result.image,
      metadata: result.result.metadata,
    };
  }

  console.error("[generateMatchReport] Workflow failed:", result);
  return undefined;
}
```

---

### Phase 5: Parallel Optimization

Optimize the workflow with parallel execution where possible:

```typescript
export const reviewWorkflow = createWorkflow({...})
  .then(setupStep)
  .then(curateMatchDataStep)
  // Timeline summary and match analysis can run in parallel
  .parallel([
    summarizeTimelineStep,
    analyzeMatchStep,
  ])
  .then(generateReviewTextStep)
  // Art prompt generation and S3 text save can run in parallel
  .parallel([
    generateArtPromptStep,
    saveReviewTextToS3Step,
  ])
  .then(generateImageStep)
  .then(saveImageToS3Step)
  .commit();
```

---

### Phase 6: Error Handling & Graceful Degradation

Add conditional branching for optional steps:

```typescript
.then(generateArtPromptStep)
.branch([
  // Happy path: generate image if art prompt succeeded
  [
    ({ prevStepResult }) => prevStepResult.artPrompt !== undefined,
    generateImageStep,
  ],
  // Fallback: skip image generation
  [
    () => true,
    skipImageStep,
  ],
])
```

---

### Phase 7: Frontend Review Tool Migration

The frontend review tool at `packages/frontend/src/lib/review-tool/` can either:

**Option A: Keep Separate** (Recommended for MVP)

- Continue using the shared `@scout-for-lol/data` package directly
- No changes needed initially

#### Option B: Shared Workflow

- Export workflow steps from `@scout-for-lol/data`
- Both backend and frontend use the same workflow definition
- Frontend provides browser-compatible model implementations

---

## File Structure After Migration

```text
packages/backend/src/
├── mastra/
│   ├── index.ts                    # Mastra instance
│   └── workflows/
│       ├── review-workflow.ts      # Main workflow definition
│       └── steps/
│           ├── setup.ts
│           ├── curate-match-data.ts
│           ├── summarize-timeline.ts
│           ├── analyze-match.ts
│           ├── generate-review-text.ts
│           ├── generate-art-prompt.ts
│           ├── generate-image.ts
│           └── save-to-s3.ts
└── league/
    └── review/
        ├── prompts.ts              # Keep: prompt loading utilities
        └── (deprecated files)      # Remove after migration
```

---

## Migration Checklist

### Phase 1: Setup

- [ ] Install `@mastra/core` package
- [ ] Create Mastra instance file
- [ ] Rename `GEMINI_API_KEY` to `GOOGLE_GENERATIVE_AI_API_KEY`
- [ ] Verify API keys are auto-detected

### Phase 2: Steps

- [ ] Create `curate-match-data.ts` step
- [ ] Create `summarize-timeline.ts` step
- [ ] Create `analyze-match.ts` step
- [ ] Create `generate-review-text.ts` step
- [ ] Create `generate-art-prompt.ts` step
- [ ] Create `generate-image.ts` step
- [ ] Create `save-to-s3.ts` step
- [ ] Create `setup.ts` step (personality, prompts, player context)

### Phase 3: Workflow

- [ ] Compose workflow with all steps
- [ ] Add input/output schemas
- [ ] Add state schema for shared data

### Phase 4: Integration

- [ ] Update `match-report-generator.ts` to use workflow
- [ ] Test end-to-end flow
- [ ] Verify S3 outputs match previous format

### Phase 5: Optimization

- [ ] Add parallel execution for independent steps
- [ ] Add branching for optional steps
- [ ] Benchmark performance vs. original

### Phase 6: Cleanup

- [ ] Remove deprecated files from `league/review/`
- [ ] Update imports across codebase
- [ ] Update tests

### Phase 7: Documentation

- [ ] Update CLAUDE.md with Mastra patterns
- [ ] Document workflow for team

---

## Risks & Mitigations

| Risk                   | Mitigation                                    |
| ---------------------- | --------------------------------------------- |
| Framework instability  | Pin `@mastra/core` version, test thoroughly   |
| Model API changes      | Mastra abstracts providers, fallback easy     |
| Performance regression | Benchmark before/after, parallel optimization |
| Frontend tool breaks   | Keep frontend using data package initially    |
| Team learning curve    | Workflow pattern is intuitive, good docs      |

---

## Estimated Effort

| Phase                  | Tasks | Complexity |
| ---------------------- | ----- | ---------- |
| Phase 1: Setup         | 4     | Low        |
| Phase 2: Steps         | 8     | Medium     |
| Phase 3: Workflow      | 1     | Low        |
| Phase 4: Integration   | 2     | Medium     |
| Phase 5: Optimization  | 3     | Low        |
| Phase 6: Cleanup       | 3     | Low        |
| Phase 7: Documentation | 2     | Low        |

---

## Sources

- [Mastra Documentation](https://mastra.ai/docs)
- [Mastra GitHub](https://github.com/mastra-ai/mastra)
- [Mastra Agents Overview](https://mastra.ai/docs/agents/overview)
- [Mastra Workflows Guide](https://mastra.ai/docs/workflows/overview)
