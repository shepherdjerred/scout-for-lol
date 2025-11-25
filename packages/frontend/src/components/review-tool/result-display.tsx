/**
 * Result display component (review text and image)
 */
import type { GenerationResult } from "../../lib/review-tool/config/schema";

type ResultDisplayProps = {
  result: GenerationResult;
};

export function ResultDisplay({ result }: ResultDisplayProps) {
  return (
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
    </div>
  );
}
