/**
 * Results panel showing generated review and metadata
 */
import { useState, useEffect } from "react";
import { z } from "zod";
import type { ReviewConfig, GenerationResult } from "@scout-for-lol/review-dev-tool/config/schema";
import type { CompletedMatch, ArenaMatch } from "@scout-for-lol/data";
import type { CostTracker } from "@scout-for-lol/review-dev-tool/lib/costs";
import { calculateCost, formatCost } from "@scout-for-lol/review-dev-tool/lib/costs";
import { generateMatchReview, type GenerationProgress } from "@scout-for-lol/review-dev-tool/lib/generator";
import { CostDisplay } from "@scout-for-lol/review-dev-tool/components/cost-display";
import { HistoryPanel } from "@scout-for-lol/review-dev-tool/components/history-panel";
import { getExampleMatch } from "@scout-for-lol/report-ui/src/example";
import { createPendingEntry, saveCompletedEntry, updateHistoryRating, type HistoryEntry } from "@scout-for-lol/review-dev-tool/lib/history-manager";
import { StarRating } from "@scout-for-lol/review-dev-tool/components/star-rating";

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
  progress?: GenerationProgress;
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
    const historyId = createPendingEntry({
      model: config.textGeneration.model,
    });
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
        costTracker.add(cost);
        window.dispatchEvent(new Event("cost-update"));
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
    const gen = activeGenerations.get(id);
    if (gen) {
      // No result to display yet for active generation
      // The UI will show the progress indicator
    }
  };

  const handleRatingChange = async (newRating: 1 | 2 | 3 | 4) => {
    if (!selectedHistoryId) {return;}
    setRating(newRating);
    await updateHistoryRating(selectedHistoryId, newRating, notes);
    setForceUpdate((n) => n + 1);
  };

  const handleNotesChange = async (newNotes: string) => {
    if (!selectedHistoryId) {return;}
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
      {activeGenerations.size > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
            In Progress ({activeGenerations.size})
          </h3>
          <div className="space-y-2">
            {Array.from(activeGenerations.values()).map((gen) => {
              const isSelected = gen.id === selectedHistoryId;
              const elapsed = activeGenerationTimers.get(gen.id) ?? 0;
              const elapsedSeconds = Math.floor(elapsed / 1000);

              return (
                <button
                  key={gen.id}
                  onClick={() => {
                    handleSelectActiveGeneration(gen.id);
                  }}
                  className={`w-full text-left p-3 rounded border transition-colors ${
                    isSelected
                      ? "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30"
                      : "border-yellow-200 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-yellow-600 dark:border-yellow-400" />
                    <span className="text-yellow-600 dark:text-yellow-400 text-xs font-semibold">GENERATING</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{elapsedSeconds}s</span>
                  </div>
                  <div className="text-xs text-gray-700 dark:text-gray-300 space-y-0.5">
                    <div className="font-mono truncate">{gen.configSnapshot.model}</div>
                    {gen.progress && (
                      <div className="text-yellow-700 dark:text-yellow-300">
                        {gen.progress.step === "text" ? "Generating text..." : "Generating image..."}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

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
              void handleGenerate();
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
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-3">Generation Configuration</h3>
          <div className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <div>
                <span className="text-blue-700 dark:text-blue-300 font-medium">Text Model:</span>
                <span className="ml-2 text-blue-900 dark:text-blue-100 font-mono text-xs">
                  {config.textGeneration.model}
                </span>
              </div>
              <div>
                <span className="text-blue-700 dark:text-blue-300 font-medium">Personality:</span>
                <span className="ml-2 text-blue-900 dark:text-blue-100">
                  {config.prompts.personalityId === "random"
                    ? "Random"
                    : (config.prompts.customPersonality?.metadata.name ?? config.prompts.personalityId)}
                </span>
              </div>
            </div>

            {config.imageGeneration.enabled ? (
              <>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <div>
                    <span className="text-blue-700 dark:text-blue-300 font-medium">Image Model:</span>
                    <span className="ml-2 text-blue-900 dark:text-blue-100 font-mono text-xs">
                      {config.imageGeneration.model}
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-700 dark:text-blue-300 font-medium">Mashup Mode:</span>
                    <span className="ml-2 text-blue-900 dark:text-blue-100">
                      {config.imageGeneration.mashupMode ? "On (2 Themes)" : "Off"}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-blue-700 dark:text-blue-300 font-medium">Art Style:</span>
                  <span className="ml-2 text-blue-900 dark:text-blue-100 text-xs">
                    {config.imageGeneration.artStyle === "random" ? (
                      <span className="italic">Random</span>
                    ) : config.imageGeneration.artStyle.length > 60 ? (
                      `${config.imageGeneration.artStyle.substring(0, 60)}...`
                    ) : (
                      config.imageGeneration.artStyle
                    )}
                  </span>
                </div>

                <div>
                  <span className="text-blue-700 dark:text-blue-300 font-medium">Art Theme:</span>
                  <span className="ml-2 text-blue-900 dark:text-blue-100 text-xs">
                    {config.imageGeneration.artTheme === "random" ? (
                      <span className="italic">Random</span>
                    ) : config.imageGeneration.artTheme.length > 60 ? (
                      `${config.imageGeneration.artTheme.substring(0, 60)}...`
                    ) : (
                      config.imageGeneration.artTheme
                    )}
                  </span>
                </div>

                {config.imageGeneration.mashupMode && (
                  <div>
                    <span className="text-blue-700 dark:text-blue-300 font-medium">Second Theme:</span>
                    <span className="ml-2 text-blue-900 dark:text-blue-100 text-xs">
                      {config.imageGeneration.secondArtTheme === "random" ? (
                        <span className="italic">Random</span>
                      ) : config.imageGeneration.secondArtTheme.length > 60 ? (
                        `${config.imageGeneration.secondArtTheme.substring(0, 60)}...`
                      ) : (
                        config.imageGeneration.secondArtTheme
                      )}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div>
                <span className="text-blue-700 dark:text-blue-300 font-medium">Image Generation:</span>
                <span className="ml-2 text-blue-900 dark:text-blue-100">Disabled</span>
              </div>
            )}
          </div>
          {result &&
            !result.error &&
            (result.metadata.selectedPersonality ??
              result.metadata.selectedArtStyle ??
              result.metadata.selectedArtTheme) && (
              <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
                <h4 className="text-xs font-semibold text-blue-800 dark:text-blue-200 mb-2">
                  Actually Selected (for this generation):
                </h4>
                <div className="space-y-1.5 text-xs">
                  {result.metadata.selectedPersonality && (
                    <div>
                      <span className="text-blue-700 dark:text-blue-300 font-medium">Personality File:</span>
                      <span className="ml-2 text-blue-900 dark:text-blue-100">
                        {result.metadata.selectedPersonality}
                      </span>
                    </div>
                  )}
                  {result.metadata.reviewerName && (
                    <div>
                      <span className="text-blue-700 dark:text-blue-300 font-medium">Personality Name:</span>
                      <span className="ml-2 text-blue-900 dark:text-blue-100">{result.metadata.reviewerName}</span>
                    </div>
                  )}
                  {result.metadata.selectedArtStyle && (
                    <div>
                      <span className="text-blue-700 dark:text-blue-300 font-medium">Art Style:</span>
                      <span className="ml-2 text-blue-900 dark:text-blue-100 font-mono wrap-break-word">
                        {result.metadata.selectedArtStyle.length > 80
                          ? `${result.metadata.selectedArtStyle.substring(0, 80)}...`
                          : result.metadata.selectedArtStyle}
                      </span>
                    </div>
                  )}
                  {result.metadata.selectedArtTheme && (
                    <div>
                      <span className="text-blue-700 dark:text-blue-300 font-medium">Art Theme:</span>
                      <span className="ml-2 text-blue-900 dark:text-blue-100 wrap-break-word">
                        {result.metadata.selectedArtTheme.length > 80
                          ? `${result.metadata.selectedArtTheme.substring(0, 80)}...`
                          : result.metadata.selectedArtTheme}
                      </span>
                    </div>
                  )}
                  {result.metadata.selectedSecondArtTheme && (
                    <div>
                      <span className="text-blue-700 dark:text-blue-300 font-medium">Second Art Theme:</span>
                      <span className="ml-2 text-blue-900 dark:text-blue-100 wrap-break-word">
                        {result.metadata.selectedSecondArtTheme.length > 80
                          ? `${result.metadata.selectedSecondArtTheme.substring(0, 80)}...`
                          : result.metadata.selectedSecondArtTheme}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
        </div>

        {isViewingActiveGeneration &&
          selectedGen.progress &&
          (() => {
            // Calculate progress percentage based on elapsed time
            // Text generation: ~60s, Image generation: ~20s
            // Cap at 90% until complete, then jump to 100%
            const expectedDuration = selectedGen.progress.step === "text" ? 60000 : 20000;
            const progressPercent =
              selectedGen.progress.step === "complete"
                ? 100
                : Math.min(90, Math.floor((elapsedMs / expectedDuration) * 100));

            const elapsedSeconds = Math.floor(elapsedMs / 1000);

            return (
              <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    {/* Spinning loader */}
                    <div className="shrink-0">
                      <svg
                        className="animate-spin h-5 w-5 text-blue-600 dark:text-blue-400"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-blue-900 dark:text-blue-200">
                        {selectedGen.progress.message
                          ? (selectedGen.progress.message.split("(")[0]?.trim() ?? "Generating")
                          : "Generating"}{" "}
                        ({elapsedSeconds}s)
                      </div>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 dark:bg-blue-400 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercent.toString()}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-blue-700 dark:text-blue-300 text-center">{progressPercent}%</div>
                </div>
              </div>
            );
          })()}

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

            {selectedHistoryId && result.image && viewingHistory && (
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Rate this generation</h3>
                <div className="mb-3">
                  <StarRating
                    rating={rating}
                    onRate={(newRating) => {
                      void handleRatingChange(newRating);
                    }}
                    size="large"
                  />
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
                    onChange={(e) => {
                      void handleNotesChange(e.target.value);
                    }}
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

            {(result.metadata.systemPrompt ?? result.metadata.userPrompt) && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Prompts Sent to OpenAI</h3>
                <div className="space-y-3">
                  {result.metadata.systemPrompt && (
                    <details className="group">
                      <summary className="cursor-pointer text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 list-none">
                        <span className="inline-flex items-center gap-1">
                          <svg
                            className="w-4 h-4 transition-transform group-open:rotate-90"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          System Prompt ({result.metadata.systemPrompt.length} chars)
                        </span>
                      </summary>
                      <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 font-mono text-xs text-gray-900 dark:text-gray-100 whitespace-pre-wrap max-h-96 overflow-y-auto">
                        {result.metadata.systemPrompt}
                      </div>
                    </details>
                  )}
                  {result.metadata.userPrompt && (
                    <details className="group">
                      <summary className="cursor-pointer text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 list-none">
                        <span className="inline-flex items-center gap-1">
                          <svg
                            className="w-4 h-4 transition-transform group-open:rotate-90"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          User Prompt ({result.metadata.userPrompt.length} chars)
                        </span>
                      </summary>
                      <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 font-mono text-xs text-gray-900 dark:text-gray-100 whitespace-pre-wrap max-h-96 overflow-y-auto">
                        {result.metadata.userPrompt}
                      </div>
                    </details>
                  )}
                </div>
              </div>
            )}

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
