/**
 * Cost tracking display component
 */
import { useEffect, useState } from "react";
import type { CostTracker } from "@scout-for-lol/review-dev-tool/lib/costs";
import { formatCost, type CostBreakdown } from "@scout-for-lol/review-dev-tool/lib/costs";

type CostDisplayProps = {
  costTracker: CostTracker;
};

export function CostDisplay({ costTracker }: CostDisplayProps) {
  const [total, setTotal] = useState<CostBreakdown | null>(null);
  const count = costTracker.getCount();

  useEffect(() => {
    void (async () => {
      const totalData = await costTracker.getTotal();
      setTotal(totalData);
    })();

    // Re-fetch when cost updates
    const handleUpdate = () => {
      void (async () => {
        const totalData = await costTracker.getTotal();
        setTotal(totalData);
      })();
    };
    window.addEventListener("cost-update", handleUpdate);
    return () => window.removeEventListener("cost-update", handleUpdate);
  }, [costTracker]);

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
              const report = costTracker.export();
              const blob = new Blob([report], { type: "text/plain" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `cost-report-${new Date().toISOString()}.txt`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
          >
            Export Report
          </button>
          <button
            onClick={() => {
              if (confirm("Clear cost history?")) {
                costTracker.clear();
                // Force re-render
                window.dispatchEvent(new Event("cost-update"));
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
