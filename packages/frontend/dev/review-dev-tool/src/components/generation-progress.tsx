/**
 * Generation progress indicator
 */
type GenerationProgressProps = {
  progress: { step: string; message?: string };
  elapsedMs: number;
};

export function GenerationProgress({ progress, elapsedMs }: GenerationProgressProps) {
  // Calculate progress percentage based on elapsed time
  // Text generation: ~30s, Image generation: ~20s
  // Cap at 90% until complete, then jump to 100%
  const expectedDuration = progress.step === "text" ? 30000 : 20000;
  const progressPercent =
    progress.step === "complete" ? 100 : Math.min(90, Math.floor((elapsedMs / expectedDuration) * 100));

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
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-blue-900 dark:text-blue-200">
              {progress.message ? (progress.message.split("(")[0]?.trim() ?? "Generating") : "Generating"} (
              {elapsedSeconds}s)
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
}
