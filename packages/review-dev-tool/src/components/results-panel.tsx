/**
 * Results panel showing generated review and metadata
 */
import { useState, useEffect } from "react";
import { z } from "zod";
import type { ReviewConfig, GenerationResult } from "@scout-for-lol/review-dev-tool/config/schema";
import type { CompletedMatch, ArenaMatch } from "@scout-for-lol/data";
import type { CostTracker } from "@scout-for-lol/review-dev-tool/lib/costs";
import { calculateCost } from "@scout-for-lol/review-dev-tool/lib/costs";
import {
  generateMatchReview,
  type GenerationProgress as GenerationProgressType,
} from "@scout-for-lol/review-dev-tool/lib/generator";
import { CostDisplay } from "@scout-for-lol/review-dev-tool/components/cost-display";
import { HistoryPanel } from "@scout-for-lol/review-dev-tool/components/history-panel";
import { getExampleMatch } from "@scout-for-lol/report-ui/src/example";
import {
  createPendingEntry,
  saveCompletedEntry,
  updateHistoryRating,
  type HistoryEntry,
} from "@scout-for-lol/review-dev-tool/lib/history-manager";
import { ActiveGenerationsPanel } from "@scout-for-lol/review-dev-tool/components/active-generations-panel";
import { GenerationProgress } from "@scout-for-lol/review-dev-tool/components/generation-progress";
import { GenerationConfigDisplay } from "@scout-for-lol/review-dev-tool/components/generation-config-display";
import { ResultDisplay } from "@scout-for-lol/review-dev-tool/components/result-display";
import { ResultMetadata } from "@scout-for-lol/review-dev-tool/components/result-metadata";
import { ResultRating } from "@scout-for-lol/review-dev-tool/components/result-rating";

const ErrorSchema = z.object({ message: z.string() });

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

export function ResultsPanel({ config, match, result, costTracker, onResultGenerated }: ResultsPanelProps) {
  const [activeGenerations, setActiveGenerations] = useState<Map<string, ActiveGeneration>>(new Map());
  const [forceUpdate, setForceUpdate] = useState(0);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | undefined>();
  const [viewingHistory, setViewingHistory] = useState(false);
  const [rating, setRating] = useState<1 | 2 | 3 | 4 | undefined>();
  const [notes, setNotes] = useState("");
  const [activeGenerationTimers, setActiveGenerationTimers] = useState<Map<string, number>>(new Map());

  // Listen for cost updates
  useEffect(() => {
    const handleCostUpdate = () => {
      setForceUpdate((n) => n + 1);
    };

    window.addEventListener("cost-update", handleCostUpdate);
    return () => {
      window.removeEventListener("cost-update", handleCostUpdate);
    };
  }, []);

  // Timer for progress animation for all active generations
  useEffect(() => {
    if (activeGenerations.size === 0) {
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      setActiveGenerationTimers(
        new Map(Array.from(activeGenerations.entries()).map(([id, gen]) => [id, now - gen.startTime])),
      );
    }, 100);

    return () => {
      clearInterval(interval);
    };
  }, [activeGenerations]);

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
      const generatedResult = await generateMatchReview(matchToUse, config, (p) => {
        setActiveGenerations((prev) => {
          const updated = new Map(prev);
          const gen = updated.get(historyId);
          if (gen) {
            gen.progress = p;
            updated.set(historyId, gen);
          }
          return updated;
        });
      });

      // Only update the displayed result if this is the selected generation
      if (selectedHistoryId === historyId) {
        onResultGenerated(generatedResult);
      }

      // Update config snapshot with actual selected values
      if (generatedResult.metadata.selectedPersonality) {
        configSnapshot.personality = generatedResult.metadata.selectedPersonality;
      }
      if (generatedResult.metadata.selectedArtStyle) {
        configSnapshot.artStyle = generatedResult.metadata.selectedArtStyle;
      }
      if (generatedResult.metadata.selectedArtTheme) {
        configSnapshot.artTheme = generatedResult.metadata.selectedArtTheme;
      }

      // Save completed entry to IndexedDB
      console.log("[History] Saving completed entry:", historyId);
      await saveCompletedEntry(historyId, generatedResult, configSnapshot);
      console.log("[History] Saved, triggering refresh");

      // Calculate and track cost
      if (!generatedResult.error) {
        const cost = calculateCost(generatedResult.metadata, config.textGeneration.model, config.imageGeneration.model);
        costTracker
          .add(cost)
          .then(() => {
            window.dispatchEvent(new Event("cost-update"));
          })
          .catch(() => {
            // Error handling is done in the cost tracker
          });
      }

      // Trigger history panel refresh
      setForceUpdate((n) => {
        console.log("[History] Force update:", n + 1);
        return n + 1;
      });
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
      setForceUpdate((n) => n + 1);
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
    setForceUpdate((n) => n + 1);
  };

  const handleNotesChange = async (newNotes: string) => {
    if (!selectedHistoryId) {
      return;
    }
    setNotes(newNotes);
    if (rating) {
      await updateHistoryRating(selectedHistoryId, rating, newNotes);
      setForceUpdate((n) => n + 1);
    }
  };

  const handleCancelPending = (id: string) => {
    // Pending entries are not persisted, so nothing to cancel
    console.log("[History] Cancel requested for pending entry:", id);
    setForceUpdate((n) => n + 1);
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
        refreshTrigger={forceUpdate}
      />

      {/* Active Generations Panel */}
      <ActiveGenerationsPanel
        activeGenerations={activeGenerations}
        activeGenerationTimers={activeGenerationTimers}
        selectedHistoryId={selectedHistoryId}
        onSelectGeneration={handleSelectActiveGeneration}
      />

      {/* Current/Selected Result */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Generated Review</h2>
            {viewingHistory && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Viewing from history</p>}
            {isViewingActiveGeneration && (
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">Viewing active generation</p>
            )}
          </div>
          <button
            onClick={() => {
              handleGenerate().catch(() => {
                // Error handling is done in handleGenerate
              });
            }}
            className="px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors"
          >
            Generate New Review
          </button>
        </div>

        {!match && (
          <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded text-sm text-yellow-800 dark:text-yellow-200">
            No match selected. Using example match data.
          </div>
        )}

        {/* Generation Configuration Details */}
        <GenerationConfigDisplay config={config} result={result} />

        {/* Generation Progress */}
        {selectedGen?.progress && <GenerationProgress progress={selectedGen.progress} elapsedMs={elapsedMs} />}

        {/* Error Display */}
        {result?.error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="flex-1">
                <div className="font-semibold text-red-900 dark:text-red-200 mb-1">Error</div>
                <div className="text-sm text-red-800 dark:text-red-300">{result.error}</div>
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
          </>
        )}
      </div>

      <CostDisplay costTracker={costTracker} key={forceUpdate} />
    </div>
  );
}
