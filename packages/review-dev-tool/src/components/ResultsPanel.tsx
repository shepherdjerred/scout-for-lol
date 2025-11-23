/**
 * Results panel showing generated review and metadata
 */
import { useState } from "react";
import type { ReviewConfig, GenerationResult } from "../config/schema";
import type { CompletedMatch, ArenaMatch } from "@scout-for-lol/data";
import type { CostTracker } from "../lib/costs";
import { calculateCost, formatCost } from "../lib/costs";
import { generateMatchReview, type GenerationProgress } from "../lib/generator";
import { CostDisplay } from "./CostDisplay";
import { HistoryPanel } from "./HistoryPanel";
import { getExampleMatch } from "@scout-for-lol/report-ui/src/example";
import { createPendingEntry, updateHistoryEntry, updateHistoryRating, type HistoryEntry } from "../lib/history-manager";
import { StarRating } from "./StarRating";

interface ResultsPanelProps {
  config: ReviewConfig;
  match?: CompletedMatch | ArenaMatch;
  result?: GenerationResult;
  costTracker: CostTracker;
  onResultGenerated: (result: GenerationResult) => void;
}

export function ResultsPanel({ config, match, result, costTracker, onResultGenerated }: ResultsPanelProps) {
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState<GenerationProgress | undefined>();
  const [forceUpdate, setForceUpdate] = useState(0);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | undefined>();
  const [viewingHistory, setViewingHistory] = useState(false);
  const [rating, setRating] = useState<1 | 2 | 3 | 4 | undefined>();
  const [notes, setNotes] = useState("");

  // Listen for cost updates
  if (typeof window !== "undefined") {
    window.addEventListener("cost-update", () => setForceUpdate((n) => n + 1));
  }

  const handleGenerate = async () => {
    // Use provided match or example match
    const matchToUse = match ?? getExampleMatch("ranked");

    setGenerating(true);
    setProgress(undefined);
    setViewingHistory(false); // Switch back to current result when generating

    // Create pending entry immediately
    const historyId = createPendingEntry({
      model: config.textGeneration.model,
    });
    setSelectedHistoryId(historyId);
    setForceUpdate((n) => n + 1); // Refresh history panel to show pending entry

    try {
      const generatedResult = await generateMatchReview(matchToUse, config, (p) => setProgress(p));
      onResultGenerated(generatedResult);

      // Update history entry with results
      updateHistoryEntry(historyId, generatedResult, {
        personality: generatedResult.metadata.selectedPersonality,
        artStyle: generatedResult.metadata.selectedArtStyle,
        artTheme: generatedResult.metadata.selectedArtTheme,
      });

      // Calculate and track cost
      if (!generatedResult.error && generatedResult.metadata) {
        const cost = calculateCost(generatedResult.metadata, config.textGeneration.model, config.imageGeneration.model);
        costTracker.add(cost);
        window.dispatchEvent(new Event("cost-update"));
      }

      // Trigger history panel refresh
      setForceUpdate((n) => n + 1);
    } catch (error) {
      const errorResult = {
        text: "",
        metadata: {
          textDurationMs: 0,
          imageGenerated: false,
        },
        error: error instanceof Error ? error.message : String(error),
      };
      onResultGenerated(errorResult);

      // Update history entry with error
      updateHistoryEntry(historyId, errorResult);
      setForceUpdate((n) => n + 1);
    } finally {
      setGenerating(false);
      setProgress(undefined);
    }
  };

  const handleSelectHistoryEntry = (entry: HistoryEntry) => {
    setViewingHistory(true);
    setSelectedHistoryId(entry.id);
    setRating(entry.rating);
    setNotes(entry.notes ?? "");
    onResultGenerated(entry.result);
  };

  const handleRatingChange = (newRating: 1 | 2 | 3 | 4) => {
    if (!selectedHistoryId) return;
    setRating(newRating);
    updateHistoryRating(selectedHistoryId, newRating, notes);
    setForceUpdate((n) => n + 1);
  };

  const handleNotesChange = (newNotes: string) => {
    if (!selectedHistoryId) return;
    setNotes(newNotes);
    if (rating) {
      updateHistoryRating(selectedHistoryId, rating, newNotes);
      setForceUpdate((n) => n + 1);
    }
  };

  const handleCancelPending = (id: string) => {
    updateHistoryEntry(id, {
      text: "",
      metadata: {
        textDurationMs: 0,
        imageGenerated: false,
      },
      error: "Cancelled by user",
    });
    setForceUpdate((n) => n + 1);
  };

  const cost = result?.metadata
    ? calculateCost(result.metadata, config.textGeneration.model, config.imageGeneration.model)
    : null;

  // Show which result we're viewing
  const resultSource = viewingHistory ? "from history" : result ? "current" : "none";

  return (
    <div className="space-y-6">
      {/* History Panel */}
      <HistoryPanel
        onSelectEntry={handleSelectHistoryEntry}
        selectedEntryId={selectedHistoryId}
        onCancelPending={handleCancelPending}
        key={forceUpdate}
      />

      {/* Current/Selected Result */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Generated Review</h2>
            {viewingHistory && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Viewing from history</p>}
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            {generating ? "Generating..." : "Generate New Review"}
          </button>
        </div>

        {!match && (
          <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded text-sm text-yellow-800 dark:text-yellow-200">
            No match selected. Using example match data.
          </div>
        )}

        {generating && progress && (
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 dark:border-blue-400" />
              <div className="flex-1">
                <div className="text-sm font-medium text-blue-900 dark:text-blue-200">{progress.message}</div>
                <div className="mt-2 flex gap-2">
                  <div
                    className={`h-2 flex-1 rounded ${progress.step === "text" || progress.step === "image" || progress.step === "complete" ? "bg-blue-600 dark:bg-blue-400" : "bg-blue-200 dark:bg-blue-800"}`}
                  />
                  <div
                    className={`h-2 flex-1 rounded ${progress.step === "image" || progress.step === "complete" ? "bg-blue-600 dark:bg-blue-400" : "bg-blue-200 dark:bg-blue-800"}`}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {result?.error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"
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

        {result && !result.error && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Review Text</h3>
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 font-mono text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                {result.text}
              </div>
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Length: {result.text.length} characters
                {result.text.length > 400 && (
                  <span className="ml-2 text-orange-600 dark:text-orange-400 font-medium">
                    (⚠️ Exceeds 400 character limit)
                  </span>
                )}
              </div>
            </div>

            {result.image && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Generated Image</h3>
                <img
                  src={`data:image/png;base64,${result.image}`}
                  alt="Generated review"
                  className="w-full rounded border border-gray-200 dark:border-gray-700"
                />
              </div>
            )}

            {selectedHistoryId && result.image && (
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Rate this generation</h3>
                <div className="mb-3">
                  <StarRating rating={rating} onRate={handleRatingChange} size="large" />
                </div>
                <div>
                  <label
                    htmlFor="rating-notes"
                    className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1"
                  >
                    Notes (optional)
                  </label>
                  <textarea
                    id="rating-notes"
                    value={notes}
                    onChange={(e) => handleNotesChange(e.target.value)}
                    placeholder="What did you like or dislike about this generation?"
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent resize-vertical placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    rows={2}
                  />
                </div>
              </div>
            )}

            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Metadata</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Text Generation:</span>
                  <span className="font-mono text-gray-900 dark:text-gray-100">{result.metadata.textDurationMs}ms</span>
                </div>
                {result.metadata.textTokensPrompt !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Prompt Tokens:</span>
                    <span className="font-mono text-gray-900 dark:text-gray-100">
                      {result.metadata.textTokensPrompt}
                    </span>
                  </div>
                )}
                {result.metadata.textTokensCompletion !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Completion Tokens:</span>
                    <span className="font-mono text-gray-900 dark:text-gray-100">
                      {result.metadata.textTokensCompletion}
                    </span>
                  </div>
                )}
                {result.metadata.imageGenerated && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Image Generation:</span>
                    <span className="font-mono text-gray-900 dark:text-gray-100">
                      {result.metadata.imageDurationMs}ms
                    </span>
                  </div>
                )}
                {result.metadata.selectedPersonality && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Personality:</span>
                    <span className="font-mono text-gray-900 dark:text-gray-100">
                      {result.metadata.selectedPersonality}
                    </span>
                  </div>
                )}
                {result.metadata.selectedArtStyle && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Art Style:</span>
                    <span className="font-mono text-xs text-gray-900 dark:text-gray-100">
                      {result.metadata.selectedArtStyle.substring(0, 50)}...
                    </span>
                  </div>
                )}
                {result.metadata.selectedArtTheme && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Art Theme:</span>
                    <span className="font-mono text-xs text-gray-900 dark:text-gray-100">
                      {result.metadata.selectedArtTheme.substring(0, 50)}...
                    </span>
                  </div>
                )}
              </div>
            </div>

            {cost && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Cost</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Text Input:</span>
                    <span className="font-mono text-gray-900 dark:text-gray-100">{formatCost(cost.textInputCost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Text Output:</span>
                    <span className="font-mono text-gray-900 dark:text-gray-100">
                      {formatCost(cost.textOutputCost)}
                    </span>
                  </div>
                  {cost.imageCost > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Image:</span>
                      <span className="font-mono text-gray-900 dark:text-gray-100">{formatCost(cost.imageCost)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-2">
                    <span className="font-semibold text-gray-900 dark:text-white">Total:</span>
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                      {formatCost(cost.totalCost)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <CostDisplay costTracker={costTracker} key={forceUpdate} />
    </div>
  );
}
