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
    <div className="bg-white rounded-lg border border-surface-200 p-4">
      <h3 className="text-lg font-bold text-surface-900 mb-3">In Progress ({activeGenerations.size})</h3>
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
                isSelected ? "border-blue-500 bg-blue-50" : "border-yellow-200 bg-yellow-50 hover:bg-yellow-100"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-yellow-600" />
                <span className="text-yellow-600 text-xs font-semibold">GENERATING</span>
                <span className="text-xs text-surface-500">{elapsedSeconds}s</span>
              </div>
              <div className="text-xs text-surface-700 space-y-0.5">
                <div className="font-mono truncate">{gen.configSnapshot.model}</div>
                {gen.progress && (
                  <div className="text-yellow-700">
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
