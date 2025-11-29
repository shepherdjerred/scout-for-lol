# Review Pipeline Refactor Plan

## Overview

This document outlines the plan to unify the AI review generation pipeline between the backend and frontend dev tool, achieving 100% code reuse with zero drift.

## Goals

1. **Single source of truth** - All review generation logic lives in `@scout-for-lol/data`
2. **Zero drift** - Frontend dev tool produces identical results to production backend
3. **Full customization** - Frontend can tweak every aspect of the pipeline
4. **Observability** - Per-stage traces saved to S3 for debugging

## Current Architecture Problems

| Issue | Description |
|-------|-------------|
| Duplicated code | Timeline summary, match analysis, image description logic exists in both backend and frontend |
| Different flows | Backend has extra steps (timeline summary, match analysis) that frontend lacks |
| JSON in prompts | Match report JSON sent directly to personality reviewer (wasteful tokens) |
| Scattered S3 saving | Multiple S3 save functions with inconsistent naming |
| Config drift | Model configs hardcoded in different places |

## New Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Stage 1 (parallel)                                         │
│  ┌─────────────────────┐  ┌─────────────────────┐          │
│  │ 1a. Timeline Summary│  │ 1b. Match Summary   │          │
│  │ (timeline JSON→text)│  │ (match JSON→text)   │          │
│  └──────────┬──────────┘  └──────────┬──────────┘          │
│             │                        │                      │
│             └──────────┬─────────────┘                      │
│                        ▼                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 2. Personality Review                                │   │
│  │ (timeline summary + match summary → review text)     │   │
│  │ NO JSON - only text summaries passed in              │   │
│  └──────────────────────────┬──────────────────────────┘   │
│                             ▼                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 3. Image Description                                 │   │
│  │ (review text → image prompt)                         │   │
│  └──────────────────────────┬──────────────────────────┘   │
│                             ▼                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 4. Image Generation                                  │   │
│  │ (image prompt → Gemini → image)                      │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Type Definitions

### Pipeline Input

```typescript
export type ModelConfig = {
  model: string;
  maxTokens: number;
  temperature?: number;
  topP?: number;
};

export type StageConfig = {
  enabled: boolean;
  model: ModelConfig;
  systemPrompt?: string;  // Override default
};

export type ReviewPipelineInput = {
  /** Match data */
  match: {
    processed: CompletedMatch | ArenaMatch;
    raw?: RawMatch;
    rawTimeline?: RawTimeline;
  };

  /** Player to review */
  player: {
    index: number;
    metadata: PlayerMetadata;
  };

  /** Prompts and personality */
  prompts: {
    personality: Personality;
    baseTemplate: string;
    laneContext: string;
    systemPromptPrefix?: string;
  };

  /** AI clients (injected) */
  clients: {
    openai: OpenAIClient;
    gemini?: GoogleGenerativeAI;
  };

  /** Per-stage configuration */
  stages: {
    timelineSummary: StageConfig;
    matchSummary: StageConfig;
    reviewText: {
      model: ModelConfig;
    };
    imageDescription: StageConfig;
    imageGeneration: {
      enabled: boolean;
      model: string;
      timeoutMs: number;
    };
  };
};
```

### Pipeline Output

```typescript
export type StageTrace = {
  request: {
    systemPrompt?: string;
    userPrompt: string;
  };
  response: {
    text: string;
  };
  model: ModelConfig;
  durationMs: number;
  tokensPrompt?: number;
  tokensCompletion?: number;
};

export type ReviewPipelineOutput = {
  /** Final outputs */
  review: {
    text: string;
    imageBase64?: string;
  };

  /** Per-stage traces (for observability/S3) */
  traces: {
    timelineSummary?: StageTrace;
    matchSummary?: StageTrace;
    reviewText: StageTrace;
    imageDescription?: StageTrace;
    imageGeneration?: ImageGenerationTrace;
  };

  /** Intermediate results (for debugging/dev tool) */
  intermediate: {
    curatedData?: CuratedMatchData;
    curatedTimeline?: CuratedTimeline;
    timelineSummaryText?: string;
    matchSummaryText?: string;
    imageDescriptionText?: string;
  };

  /** Context */
  context: {
    reviewerName: string;
    playerName: string;
    playerIndex: number;
    personality: {
      filename?: string;
      name: string;
    };
  };
};
```

## Default Configurations

```typescript
export const DEFAULT_STAGE_CONFIGS = {
  timelineSummary: {
    enabled: true,
    model: { model: "gpt-4o-mini", maxTokens: 3000, temperature: 0.3 },
  },
  matchSummary: {
    enabled: true,
    model: { model: "gpt-4o-mini", maxTokens: 3000, temperature: 0.4 },
  },
  reviewText: {
    model: { model: "gpt-5.1", maxTokens: 1000 },
  },
  imageDescription: {
    enabled: true,
    model: { model: "gpt-5.1", maxTokens: 600, temperature: 0.8 },
  },
  imageGeneration: {
    enabled: true,
    model: "gemini-3-pro-image-preview",
    timeoutMs: 60_000,
  },
};
```

## System Prompts

### Timeline Summary
```
You are a League of Legends analyst. Analyze this match timeline data and provide a concise summary of how the game unfolded.

The timeline contains key events (kills, objectives, towers) and gold snapshots at intervals. Teams are "Blue" and "Red". Players are identified by champion name.

Focus on:
- Early game: First blood, early kills, lane advantages
- Mid game: Dragon/Herald takes, tower pushes, gold leads
- Late game: Baron takes, team fights, game-ending plays
- Notable momentum swings or comeback moments

Keep the summary factual and under 300 words. Reference players by their champion name.
```

### Match Summary
```
You are a League of Legends analyst who writes concise match summaries for a single player's performance.

Use the provided match data to summarize:
- The player's overall performance (KDA, damage, objectives)
- Key moments that defined their game
- How their lane/role went
- Their contribution to team fights and objectives

Keep it factual, grounded in the numbers provided, and under 250 words. This summary will be used by a personality-based reviewer, so focus on facts not opinions.
```

### Image Description
```
You are an art director turning a League of Legends performance review into a single striking image concept.
Focus on the mood, key moments, and emotions from the review text.
Describe one vivid scene with the focal action, characters, and environment.
Include composition ideas, color palette, and mood direction.
Do NOT ask for text to be placed in the image.
Keep it under 120 words.
```

## S3 Storage Structure

All pipeline traces saved under `{matchId}/ai-pipeline/`:

```
{matchId}/
└── ai-pipeline/
    ├── 1a-timeline-summary.json
    ├── 1b-match-summary.json
    ├── 2-review-text.json
    ├── 3-image-description.json
    ├── 4-image-generation.json
    ├── final-review.txt
    └── final-image.png
```

## Frontend Dev Tool UI

The dev tool will have collapsible sections for each pipeline stage:

```
┌─────────────────────────────────────────────────────┐
│ ▼ Stage 1a: Timeline Summary            [✓] Enabled │
│   Model: [gpt-4o-mini ▾]                           │
│   Max Tokens: [3000]  Temp: [0.3]  TopP: [___]     │
│   System Prompt: [Edit...]                          │
├─────────────────────────────────────────────────────┤
│ ▼ Stage 1b: Match Summary               [✓] Enabled │
│   Model: [gpt-4o-mini ▾]                           │
│   Max Tokens: [3000]  Temp: [0.4]  TopP: [___]     │
│   System Prompt: [Edit...]                          │
├─────────────────────────────────────────────────────┤
│ ▼ Stage 2: Review Text                              │
│   Model: [gpt-5.1 ▾]                               │
│   Max Tokens: [1000]  Temp: [___]  TopP: [___]     │
│   Personality: [Aaron ▾] [Edit Custom...]          │
│   Base Template: [Edit...]                          │
│   Lane Context: [Auto from player ▾]               │
│   System Prefix: [Edit...]                          │
├─────────────────────────────────────────────────────┤
│ ▼ Stage 3: Image Description            [✓] Enabled │
│   Model: [gpt-5.1 ▾]                               │
│   Max Tokens: [600]  Temp: [0.8]  TopP: [___]      │
│   System Prompt: [Edit...]                          │
├─────────────────────────────────────────────────────┤
│ ▼ Stage 4: Image Generation             [✓] Enabled │
│   Model: [gemini-3-pro-image-preview ▾]            │
│   Timeout: [60000] ms                               │
└─────────────────────────────────────────────────────┘
```

## Implementation Phases

### Phase 1: Data Package (6 tasks)

| Task | File | Description |
|------|------|-------------|
| 1.1 | `packages/data/src/review/pipeline-types.ts` | Type definitions for input/output |
| 1.2 | `packages/data/src/review/pipeline-defaults.ts` | Default configs and system prompts |
| 1.3 | `packages/data/src/review/pipeline-stages.ts` | Individual stage functions |
| 1.4 | `packages/data/src/review/pipeline.ts` | Main `generateFullMatchReview()` |
| 1.5 | `packages/data/src/index.ts` | Export pipeline |
| 1.6 | — | Run typecheck |

### Phase 2: Backend (3 tasks)

| Task | File | Description |
|------|------|-------------|
| 2.1 | `packages/backend/src/storage/pipeline-s3.ts` | New S3 saving for traces |
| 2.2 | `packages/backend/src/league/review/generator.ts` | Thin wrapper using pipeline |
| 2.3 | — | Run typecheck |

### Phase 3: Frontend (10 tasks)

| Task | File | Description |
|------|------|-------------|
| 3.1 | `package.json` | Add `@headlessui/react` |
| 3.2 | `src/lib/review-tool/config/schema.ts` | Update for pipeline stages |
| 3.3 | `src/lib/review-tool/generator.ts` | Thin wrapper using pipeline |
| 3.4 | `src/components/review-tool/stage-config/StageConfigPanel.tsx` | Collapsible stage panel |
| 3.5 | `src/components/review-tool/stage-config/ModelConfigForm.tsx` | Model config inputs |
| 3.6 | `src/components/review-tool/stage-config/PromptEditor.tsx` | Prompt editing modal |
| 3.7 | `src/components/review-tool/stage-config/ImageGenerationPanel.tsx` | Image gen config |
| 3.8 | `src/components/review-tool/tab-settings-panel.tsx` | Use new stage components |
| 3.9 | `src/components/review-tool/results-panel.tsx` | Show traces/intermediates |
| 3.10 | — | Run typecheck |

### Phase 4: Cleanup (10 tasks)

| Task | Action | Description |
|------|--------|-------------|
| 4.1 | Delete | `packages/backend/src/league/review/ai-analysis.ts` |
| 4.2 | Delete | `packages/backend/src/league/review/ai-image-description.ts` |
| 4.3 | Delete | `packages/backend/src/league/review/timeline-summary.ts` |
| 4.4 | Delete | `packages/backend/src/storage/ai-review-s3.ts` |
| 4.5 | Clean | `packages/backend/src/storage/s3.ts` - remove old functions |
| 4.6 | Delete | Old frontend settings components |
| 4.7 | Update | `packages/frontend/src/lib/review-tool/prompts.ts` |
| 4.8 | Run | `bun run typecheck:all` |
| 4.9 | Run | `bun run lint:all` |
| 4.10 | Run | `bun run test:all` |

## Key Design Decisions

### 1. No JSON in personality reviewer

The personality reviewer (Stage 2) only receives **text summaries**, not raw JSON. This:
- Reduces token usage significantly
- Keeps the personality focused on voice/tone
- Makes summaries reusable for debugging

### 2. Platform-agnostic data package

The `@scout-for-lol/data` package has no filesystem, S3, or Sentry dependencies. Callers inject:
- AI clients (OpenAI, Gemini)
- Loaded prompts and personalities
- Configuration

### 3. Full trace output

Every stage produces a trace with request/response/timing. Backend saves to S3, frontend shows in UI.

### 4. Per-stage model config

Each stage can have different model/temperature/topP settings. Frontend can override any of them.

### 5. Headless UI for frontend

Using `@headlessui/react` for:
- `Disclosure` - collapsible stage panels
- `Switch` - enable/disable toggles
- `Dialog` - prompt editing modals

Pairs well with existing Tailwind setup.

## Migration Notes

### Backend

The backend wrapper becomes ~50 lines:
1. Load prompts/personality from filesystem
2. Initialize clients from env
3. Call `generateFullMatchReview()` with defaults
4. Save traces to S3
5. Handle errors with Sentry

### Frontend

The frontend wrapper:
1. Resolves personality from UI config
2. Initializes clients with user-provided API keys
3. Calls `generateFullMatchReview()` with user config
4. Displays traces and results in UI

### Breaking Changes

- S3 path changes from scattered files to `ai-pipeline/` folder
- Old `ai-review-s3.ts` functions removed
- Frontend config schema restructured around stages

## Testing Strategy

1. **Unit tests** - Test individual stage functions in data package
2. **Integration tests** - Test full pipeline with mocked clients
3. **Manual testing** - Use frontend dev tool to verify output matches backend
4. **Snapshot tests** - Ensure prompt construction is stable
