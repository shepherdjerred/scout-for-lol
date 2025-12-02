/**
 * Generation progress indicator
 *
 * Note: The pipeline doesn't support intermediate progress updates,
 * so we show an indeterminate-style progress based on elapsed time.
 */
import type { GenerationProgress as GenerationProgressType } from "@scout-for-lol/frontend/lib/review-tool/generator";

type GenerationProgressProps = {
  progress: GenerationProgressType;
  elapsedMs: number;
};

/** Estimate total duration based on number of stages (rough approximation) */
function estimateTotalDuration(totalStages: number | undefined): number {
  // Base: ~20s for text, ~15s per summary stage, ~30s for image
  // With all stages: ~60-90s typical
  const stages = totalStages ?? 3;
  return stages * 20000; // ~20s per stage average
}

export function GenerationProgress({ progress, elapsedMs }: GenerationProgressProps) {
  const { step, message, totalStages } = progress;

  // Time-based progress that smoothly fills over expected duration
  const expectedDuration = estimateTotalDuration(totalStages);
  // Use asymptotic progress: approaches 95% but never reaches it until complete
  const timeProgress = step === "complete" ? 100 : Math.min(95, (elapsedMs / expectedDuration) * 100 * 0.95);

  const elapsedSeconds = Math.floor(elapsedMs / 1000);

  return (
    <div className="mb-4 p-4 bg-brand-50 border border-brand-200 rounded-xl">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Spinning loader */}
            {step !== "complete" && (
              <div className="shrink-0">
                <svg
                  className="animate-spin h-5 w-5 text-brand-600"
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
            )}
            {step === "complete" && (
              <div className="shrink-0">
                <svg className="h-5 w-5 text-victory-500" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}
            <div className="flex-1">
              <div className="text-sm font-medium text-brand-900">{step === "complete" ? "Complete!" : message}</div>
              {totalStages !== undefined && step !== "complete" && (
                <div className="text-xs text-brand-600">{totalStages} stages</div>
              )}
            </div>
          </div>
          <div className="text-sm font-mono text-brand-700">{elapsedSeconds}s</div>
        </div>

        {/* Progress bar - indeterminate style with time-based fill */}
        <div className="w-full bg-brand-200 rounded-full h-2 overflow-hidden">
          <div
            className={`h-2 rounded-full transition-all duration-1000 ease-out ${step === "complete" ? "bg-victory-500" : "bg-brand-500"}`}
            style={{ width: `${Math.floor(timeProgress).toString()}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}
