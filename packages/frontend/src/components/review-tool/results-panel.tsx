/**
 * Results panel showing generated review and metadata
 */
import { useState, useSyncExternalStore } from "react";
import { z } from "zod";
import type {
  ReviewConfig,
  GenerationResult,
  PipelineIntermediateResults,
  PipelineTraces,
  StageTrace,
} from "@scout-for-lol/frontend/lib/review-tool/config/schema";
import type { CompletedMatch, ArenaMatch } from "@scout-for-lol/data";
import type { CostTracker } from "@scout-for-lol/frontend/lib/review-tool/costs";
import { calculateCost } from "@scout-for-lol/frontend/lib/review-tool/costs";
import {
  generateMatchReview,
  type GenerationProgress as GenerationProgressType,
} from "@scout-for-lol/frontend/lib/review-tool/generator";
import { CostDisplay } from "./cost-display.tsx";
import { HistoryPanel } from "./history-panel.tsx";
import { getExampleMatch } from "@scout-for-lol/data";
import {
  createPendingEntry,
  saveCompletedEntry,
  updateHistoryRating,
  type HistoryEntry,
} from "@scout-for-lol/frontend/lib/review-tool/history-manager";
import { ActiveGenerationsPanel } from "./active-generations-panel.tsx";
import { GenerationProgress } from "./generation-progress.tsx";
import { GenerationConfigDisplay } from "./generation-config-display.tsx";
import { ResultDisplay } from "./result-display.tsx";
import { ResultMetadata } from "./result-metadata.tsx";
import { ResultRating } from "./result-rating.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card.tsx";

const ErrorSchema = z.object({ message: z.string() });

// Global timer for tracking elapsed time - updates every second
let timerTick = 0;
const timerSubscribers = new Set<() => void>();
let timerInterval: ReturnType<typeof setInterval> | null = null;

function startGlobalTimer() {
  timerInterval ??= setInterval(() => {
    timerTick += 1;
    timerSubscribers.forEach((callback) => {
      callback();
    });
  }, 1000);
}

function stopGlobalTimer() {
  if (timerInterval !== null && timerSubscribers.size === 0) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function subscribeToTimer(callback: () => void) {
  timerSubscribers.add(callback);
  startGlobalTimer();
  return () => {
    timerSubscribers.delete(callback);
    stopGlobalTimer();
  };
}

function getTimerSnapshot() {
  return timerTick;
}

type ResultsPanelProps = {
  config: ReviewConfig;
  match?: CompletedMatch | ArenaMatch | undefined;
  result?: GenerationResult | undefined;
  costTracker: CostTracker;
  onResultGenerated: (result: GenerationResult) => void;
};

type ActiveGeneration = {
  id: string;
  progress?: GenerationProgressType;
  startTime: number;
  configSnapshot: HistoryEntry["configSnapshot"];
};

type TraceCardProps = {
  label: string;
  trace: StageTrace | undefined;
  text: string | undefined;
};

function TraceCard({ label, trace, text }: TraceCardProps) {
  if (!trace && !text) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="flex items-start justify-between">
        <CardTitle>{label}</CardTitle>
        {trace && (
          <div className="text-xs text-gray-600">
            {trace.model.model} · {trace.durationMs}ms
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {trace?.request.systemPrompt && (
          <div>
            <div className="text-xs font-semibold text-gray-700">System prompt</div>
            <pre className="mt-1 whitespace-pre-wrap rounded-md bg-gray-50 p-2 text-xs text-gray-800">
              {trace.request.systemPrompt}
            </pre>
          </div>
        )}
        {trace?.request.userPrompt && (
          <div>
            <div className="text-xs font-semibold text-gray-700">User prompt</div>
            <pre className="mt-1 whitespace-pre-wrap rounded-md bg-gray-50 p-2 text-xs text-gray-800">
              {trace.request.userPrompt}
            </pre>
          </div>
        )}
        {(trace?.response.text ?? text) && (
          <div>
            <div className="text-xs font-semibold text-gray-700">Response</div>
            <pre className="mt-1 whitespace-pre-wrap rounded-md bg-gray-50 p-2 text-xs text-gray-800">
              {trace?.response.text ?? text}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

type PipelineTracesPanelProps = {
  traces: PipelineTraces | undefined;
  intermediate: PipelineIntermediateResults | undefined;
};

function PipelineTracesPanel({ traces, intermediate }: PipelineTracesPanelProps) {
  if (!traces) {
    return null;
  }

  return (
    <div className="space-y-3">
      <TraceCard
        label="Stage 1a: Timeline Summary"
        trace={traces.timelineSummary}
        text={intermediate?.timelineSummaryText}
      />
      <TraceCard label="Stage 1b: Match Summary" trace={traces.matchSummary} text={intermediate?.matchSummaryText} />
      <TraceCard label="Stage 2: Review Text" trace={traces.reviewText} text={undefined} />
      <TraceCard
        label="Stage 3: Image Description"
        trace={traces.imageDescription}
        text={intermediate?.imageDescriptionText}
      />
      {traces.imageGeneration && (
        <Card>
          <CardHeader className="flex items-start justify-between">
            <CardTitle>Stage 4: Image Generation</CardTitle>
            <div className="text-xs text-gray-600">
              {traces.imageGeneration.model} · {traces.imageGeneration.durationMs}ms
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-gray-800">
            <div className="font-semibold text-gray-700">Prompt</div>
            <pre className="whitespace-pre-wrap rounded-md bg-gray-50 p-2">{traces.imageGeneration.request.prompt}</pre>
            <div className="text-gray-700">
              Generated: {traces.imageGeneration.response.imageGenerated ? "yes" : "no"}{" "}
              {traces.imageGeneration.response.imageSizeBytes
                ? `(${traces.imageGeneration.response.imageSizeBytes.toString()} bytes)`
                : ""}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function ResultsPanel({ config, match, result, costTracker, onResultGenerated }: ResultsPanelProps) {
  const [activeGenerations, setActiveGenerations] = useState<Map<string, ActiveGeneration>>(new Map());
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | undefined>();
  const [viewingHistory, setViewingHistory] = useState(false);
  const [rating, setRating] = useState<1 | 2 | 3 | 4 | undefined>();
  const [notes, setNotes] = useState("");

  // Subscribe to global timer - always active but cheap
  // This triggers a re-render every second, causing elapsed times to update
  useSyncExternalStore(subscribeToTimer, getTimerSnapshot, getTimerSnapshot);

  // Calculate elapsed times only when there are active generations
  const now = Date.now();
  const activeGenerationTimers = new Map<string, number>(
    Array.from(activeGenerations.entries()).map(([id, gen]) => [id, now - gen.startTime]),
  );

  const handleGenerate = async () => {
    // Use provided match or example match
    const matchToUse = match ?? getExampleMatch("ranked");

    // Create entry ID (not persisted yet)
    console.log("[History] Creating entry ID");
    const historyId = createPendingEntry();
    console.log("[History] Created entry ID:", historyId);

    // Build config snapshot
    const configSnapshot: HistoryEntry["configSnapshot"] = {
      model: config.textGeneration.model,
    };

    // Add to active generations
    const newGen: ActiveGeneration = {
      id: historyId,
      startTime: Date.now(),
      configSnapshot,
    };
    setActiveGenerations((prev) => new Map(prev).set(historyId, newGen));
    setSelectedHistoryId(historyId);
    setViewingHistory(false); // Switch back to current result when generating

    try {
      const generatedResult = await generateMatchReview({
        match: matchToUse,
        config,
        onProgress: (p) => {
          setActiveGenerations((prev) => {
            const updated = new Map(prev);
            const gen = updated.get(historyId);
            if (gen) {
              gen.progress = p;
              updated.set(historyId, gen);
            }
            return updated;
          });
        },
      });

      // Only update the displayed result if this is the selected generation
      if (selectedHistoryId === historyId) {
        onResultGenerated(generatedResult);
      }

      // Update config snapshot with actual selected values
      if (generatedResult.metadata.selectedPersonality) {
        configSnapshot.personality = generatedResult.metadata.selectedPersonality;
      }
      if (generatedResult.metadata.imageDescription) {
        configSnapshot.imageDescription = generatedResult.metadata.imageDescription;
      }

      // Save completed entry to IndexedDB
      console.log("[History] Saving completed entry:", historyId);
      await saveCompletedEntry(historyId, generatedResult, configSnapshot);
      console.log("[History] Saved, triggering refresh");

      // Calculate and track cost
      if (!generatedResult.error) {
        const cost = calculateCost(generatedResult.metadata, config.textGeneration.model, config.imageGeneration.model);
        void (async () => {
          try {
            await costTracker.add(cost);
          } catch {
            // Error handling is done in the cost tracker
          }
        })();
      }

      // Trigger history panel refresh via history store
      // History store will be updated by the history manager
      console.log("[History] Generation complete, history should refresh");
    } catch (error) {
      const errorResult = {
        text: "",
        metadata: {
          textDurationMs: 0,
          imageGenerated: false,
        },
        error: ErrorSchema.safeParse(error).success ? ErrorSchema.parse(error).message : String(error),
      };

      // Only update displayed result if this is the selected generation
      if (selectedHistoryId === historyId) {
        onResultGenerated(errorResult);
      }

      // Save error result to history
      console.log("[History] Saving error result:", historyId);
      await saveCompletedEntry(historyId, errorResult, configSnapshot);
    } finally {
      // Remove from active generations
      setActiveGenerations((prev) => {
        const updated = new Map(prev);
        updated.delete(historyId);
        return updated;
      });
    }
  };

  const handleSelectHistoryEntry = (entry: HistoryEntry) => {
    setViewingHistory(true);
    setSelectedHistoryId(entry.id);
    setRating(entry.rating);
    setNotes(entry.notes ?? "");
    onResultGenerated(entry.result);
  };

  const handleSelectActiveGeneration = (id: string) => {
    setViewingHistory(false);
    setSelectedHistoryId(id);
  };

  const handleRatingChange = async (newRating: 1 | 2 | 3 | 4) => {
    if (!selectedHistoryId) {
      return;
    }
    setRating(newRating);
    await updateHistoryRating(selectedHistoryId, newRating, notes);
  };

  const handleNotesChange = async (newNotes: string) => {
    if (!selectedHistoryId) {
      return;
    }
    setNotes(newNotes);
    if (rating) {
      await updateHistoryRating(selectedHistoryId, rating, newNotes);
    }
  };

  const handleCancelPending = (id: string) => {
    // Pending entries are not persisted, so nothing to cancel
    console.log("[History] Cancel requested for pending entry:", id);
  };

  const cost = result?.metadata
    ? calculateCost(result.metadata, config.textGeneration.model, config.imageGeneration.model)
    : null;

  const selectedGen = selectedHistoryId ? activeGenerations.get(selectedHistoryId) : undefined;
  const isViewingActiveGeneration = selectedGen !== undefined;
  const elapsedMs = selectedHistoryId ? (activeGenerationTimers.get(selectedHistoryId) ?? 0) : 0;

  return (
    <div className="space-y-6">
      {/* History Panel */}
      <HistoryPanel
        onSelectEntry={handleSelectHistoryEntry}
        selectedEntryId={selectedHistoryId}
        onCancelPending={handleCancelPending}
      />

      {/* Active Generations Panel */}
      <ActiveGenerationsPanel
        activeGenerations={activeGenerations}
        activeGenerationTimers={activeGenerationTimers}
        selectedHistoryId={selectedHistoryId}
        onSelectGeneration={handleSelectActiveGeneration}
      />

      {/* Current/Selected Result */}
      <div className="card p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-semibold text-surface-900 dark:text-white">Generated Review</h2>
            {viewingHistory && (
              <p className="text-xs text-surface-500 dark:text-surface-400 mt-1 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Viewing from history
              </p>
            )}
            {isViewingActiveGeneration && (
              <p className="text-xs text-victory-600 dark:text-victory-400 mt-1 flex items-center gap-1">
                <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Generating...
              </p>
            )}
          </div>
          <button
            onClick={() => {
              void (async () => {
                try {
                  await handleGenerate();
                } catch {
                  // Error handling is done in handleGenerate
                }
              })();
            }}
            className="btn-primary"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Generate
          </button>
        </div>

        {!match && (
          <div className="mb-4 p-4 rounded-xl bg-victory-50 dark:bg-victory-900/20 border border-victory-200 dark:border-victory-800 text-sm text-victory-800 dark:text-victory-200 flex items-center gap-3">
            <svg className="w-5 h-5 text-victory-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>No match selected. Using example match data for preview.</span>
          </div>
        )}

        {/* Generation Configuration Details */}
        <GenerationConfigDisplay config={config} result={result} />

        {/* Generation Progress */}
        {selectedGen?.progress && <GenerationProgress progress={selectedGen.progress} elapsedMs={elapsedMs} />}

        {/* Error Display */}
        {result?.error && (
          <div className="mb-4 p-4 rounded-xl bg-defeat-50 dark:bg-defeat-900/20 border border-defeat-200 dark:border-defeat-800 animate-fade-in">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-defeat-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="flex-1">
                <div className="font-semibold text-defeat-900 dark:text-defeat-200 mb-1">Generation Failed</div>
                <div className="text-sm text-defeat-700 dark:text-defeat-300">{result.error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Result Display */}
        {result && !result.error && (
          <>
            <ResultDisplay result={result} />

            {/* Rating Component */}
            {selectedHistoryId && result.image && viewingHistory && (
              <ResultRating
                rating={rating}
                notes={notes}
                onRatingChange={handleRatingChange}
                onNotesChange={handleNotesChange}
              />
            )}

            {/* Metadata */}
            <ResultMetadata result={result} cost={cost} />

            <div className="mt-4 space-y-2 rounded-xl border border-surface-200/50 bg-white p-4 shadow-sm dark:border-surface-700/50 dark:bg-surface-900">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-surface-900 dark:text-white">Pipeline traces</div>
                  <p className="text-xs text-surface-500 dark:text-surface-400">
                    Raw prompts, responses, and timings from each stage.
                  </p>
                </div>
              </div>
              <PipelineTracesPanel traces={result.metadata.traces} intermediate={result.metadata.intermediate} />
            </div>
          </>
        )}
      </div>

      <CostDisplay costTracker={costTracker} />
    </div>
  );
}
