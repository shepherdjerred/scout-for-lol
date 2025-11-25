/**
 * Active generations panel showing in-progress generations
 */
type ActiveGeneration = {
  id: string;
  progress?: { step: string; message?: string };
  startTime: number;
  configSnapshot: { model: string };
};

type ActiveGenerationsPanelProps = {
  activeGenerations: Map<string, ActiveGeneration>;
  activeGenerationTimers: Map<string, number>;
  selectedHistoryId: string | undefined;
  onSelectGeneration: (id: string) => void;
};

export function ActiveGenerationsPanel({
  activeGenerations,
  activeGenerationTimers,
  selectedHistoryId,
  onSelectGeneration,
}: ActiveGenerationsPanelProps) {
  if (activeGenerations.size === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">In Progress ({activeGenerations.size})</h3>
      <div className="space-y-2">
        {Array.from(activeGenerations.values()).map((gen) => {
          const isSelected = gen.id === selectedHistoryId;
          const elapsed = activeGenerationTimers.get(gen.id) ?? 0;
          const elapsedSeconds = Math.floor(elapsed / 1000);

          return (
            <button
              key={gen.id}
              onClick={() => {
                onSelectGeneration(gen.id);
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
  );
}
