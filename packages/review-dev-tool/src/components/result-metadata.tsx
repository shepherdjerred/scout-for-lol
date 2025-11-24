/**
 * Result metadata display (metadata, prompts, cost breakdown)
 */
import type { GenerationResult, CostBreakdown } from "@scout-for-lol/review-dev-tool/config/schema";
import { formatCost } from "@scout-for-lol/review-dev-tool/lib/costs";

type ResultMetadataProps = {
  result: GenerationResult;
  cost: CostBreakdown | null;
};

export function ResultMetadata({ result, cost }: ResultMetadataProps) {
  return (
    <div className="space-y-4">
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
              <span className="font-mono text-gray-900 dark:text-gray-100">{result.metadata.textTokensPrompt}</span>
            </div>
          )}
          {result.metadata.textTokensCompletion !== undefined && (
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Completion Tokens:</span>
              <span className="font-mono text-gray-900 dark:text-gray-100">{result.metadata.textTokensCompletion}</span>
            </div>
          )}
          {result.metadata.imageGenerated && (
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Image Generation:</span>
              <span className="font-mono text-gray-900 dark:text-gray-100">{result.metadata.imageDurationMs}ms</span>
            </div>
          )}
          {result.metadata.selectedPersonality && (
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Personality:</span>
              <span className="font-mono text-gray-900 dark:text-gray-100">{result.metadata.selectedPersonality}</span>
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

      {result.metadata.openaiRequestParams !== undefined && result.metadata.openaiRequestParams !== null && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">OpenAI Request Parameters</h3>
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
                Full Request Object (JSON)
              </span>
            </summary>
            <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 font-mono text-xs text-gray-900 dark:text-gray-100 whitespace-pre-wrap max-h-96 overflow-y-auto">
              {JSON.stringify(result.metadata.openaiRequestParams, null, 2)}
            </div>
          </details>
        </div>
      )}

      {result.metadata.geminiPrompt && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Prompt Sent to Gemini</h3>
          <div className="space-y-3">
            {result.metadata.geminiModel && (
              <div className="text-xs text-gray-600 dark:text-gray-400">
                <span className="font-medium">Model:</span>{" "}
                <span className="font-mono text-gray-900 dark:text-gray-100">{result.metadata.geminiModel}</span>
              </div>
            )}
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
                  Image Generation Prompt ({result.metadata.geminiPrompt.length} chars)
                </span>
              </summary>
              <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 font-mono text-xs text-gray-900 dark:text-gray-100 whitespace-pre-wrap max-h-96 overflow-y-auto">
                {result.metadata.geminiPrompt}
              </div>
            </details>
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
              <span className="font-mono text-gray-900 dark:text-gray-100">{formatCost(cost.textOutputCost)}</span>
            </div>
            {cost.imageCost > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Image:</span>
                <span className="font-mono text-gray-900 dark:text-gray-100">{formatCost(cost.imageCost)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-2">
              <span className="font-semibold text-gray-900 dark:text-white">Total:</span>
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{formatCost(cost.totalCost)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
