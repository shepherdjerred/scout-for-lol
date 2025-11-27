/**
 * Cost tracking display component
 */
import { useSyncExternalStore, useRef, useCallback } from "react";
import type { CostTracker } from "@scout-for-lol/frontend/lib/review-tool/costs";
import type { CostBreakdown } from "@scout-for-lol/frontend/lib/review-tool/config/schema";
import { formatCost } from "@scout-for-lol/frontend/lib/review-tool/costs";

type CostDisplayProps = {
  costTracker: CostTracker;
};

// Store for async cost total data
const costTotalData: CostBreakdown | null = null;
const costTotalListeners = new Set<() => void>();

// Subscribe function - must be pure, no side effects during subscribe
function subscribeToCostTotal(callback: () => void) {
  costTotalListeners.add(callback);
  return () => {
    costTotalListeners.delete(callback);
  };
}

function getCostTotalSnapshot() {
  return costTotalData;
}

export function CostDisplay({ costTracker }: CostDisplayProps) {
  const count = costTracker.getCount();
  const costTrackerRef = useRef(costTracker);
  costTrackerRef.current = costTracker;

  // Memoize subscribe function to ensure stable reference for useSyncExternalStore
  const subscribeToCostTotalCallback = useCallback(subscribeToCostTotal, []);

  // Subscribe to cost total updates
  const total = useSyncExternalStore(subscribeToCostTotalCallback, getCostTotalSnapshot, getCostTotalSnapshot);

  if (!total) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Session Costs</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Session Costs</h3>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">Total Requests:</span>
          <span className="font-mono text-sm font-medium text-gray-900 dark:text-white">{count}</span>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-3 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Text Input:</span>
            <span className="font-mono text-sm text-gray-900 dark:text-white">{formatCost(total.textInputCost)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Text Output:</span>
            <span className="font-mono text-sm text-gray-900 dark:text-white">{formatCost(total.textOutputCost)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Images:</span>
            <span className="font-mono text-sm text-gray-900 dark:text-white">{formatCost(total.imageCost)}</span>
          </div>
        </div>

        <div className="border-t-2 border-gray-300 dark:border-gray-600 pt-3">
          <div className="flex justify-between items-center">
            <span className="text-base font-semibold text-gray-900 dark:text-white">Total:</span>
            <span className="font-mono text-lg font-bold text-blue-600 dark:text-blue-400">
              {formatCost(total.totalCost)}
            </span>
          </div>
        </div>

        <div className="flex gap-2 pt-3">
          <button
            onClick={() => {
              void (async () => {
                const report = await costTracker.export();
                const blob = new Blob([report], { type: "text/plain" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `cost-report-${new Date().toISOString()}.txt`;
                a.click();
                URL.revokeObjectURL(url);
              })();
            }}
            className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
          >
            Export Report
          </button>
          <button
            onClick={() => {
              if (confirm("Clear cost history?")) {
                void costTracker.clear().then(() => {
                  window.dispatchEvent(new Event("cost-update"));
                });
              }
            }}
            className="flex-1 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
          >
            Clear History
          </button>
        </div>
      </div>
    </div>
  );
}
