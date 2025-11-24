/**
 * Cache management button with dropdown
 */
import { useState, useRef } from "react";
import { z } from "zod";
import { clearAllCache, getCacheStats } from "@scout-for-lol/review-dev-tool/lib/cache";

export function CacheButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [stats, setStats] = useState({
    memoryEntries: 0,
    indexedDBEntries: 0,
    indexedDBSizeBytes: 0,
    totalSizeBytes: 0,
  });
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleClearCache = async () => {
    if (confirm("Clear all cached CloudFlare R2 data? This will require re-fetching from the server.")) {
      await clearAllCache();
      const newStats = await getCacheStats();
      setStats(newStats);
      alert("Cache cleared successfully!");
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) {
      return "0 B";
    }
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2)).toString()} ${sizes[i] ?? "B"}`;
  };

  return (
    <div
      className="relative"
      ref={dropdownRef}
      onMouseDown={(e) => {
        // Handle clicks on the dropdown container itself
        e.stopPropagation();
      }}
    >
      {isOpen && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 40 }}
          onMouseDown={(e) => {
            // Close when clicking the overlay
            const NodeSchema = z.instanceof(Node);
            const targetResult = NodeSchema.safeParse(e.target);
            if (targetResult.success && e.target === e.currentTarget) {
              setIsOpen(false);
            }
          }}
        />
      )}
      <button
        onClick={() => {
          const newIsOpen = !isOpen;
          setIsOpen(newIsOpen);
          // Load stats when opening dropdown
          if (newIsOpen) {
            void getCacheStats().then(setStats);
          }
        }}
        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
        title="R2 Cache Management"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
          />
        </svg>
        Cache
      </button>

      {isOpen && (
        <div className="absolute right-0 bottom-full mb-2 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 z-50">
          <div className="p-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">R2 Cache Status</h3>

            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Memory entries:</span>
                <span className="font-medium dark:text-gray-200">{stats.memoryEntries}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">IndexedDB entries:</span>
                <span className="font-medium dark:text-gray-200">
                  {stats.indexedDBEntries} ({formatBytes(stats.indexedDBSizeBytes)})
                </span>
              </div>
              <div className="flex justify-between border-t border-gray-200 dark:border-gray-600 pt-2">
                <span className="text-gray-700 dark:text-gray-300 font-semibold">Total size:</span>
                <span className="font-semibold dark:text-gray-100">{formatBytes(stats.totalSizeBytes)}</span>
              </div>
            </div>

            <div className="text-xs text-gray-500 dark:text-gray-400 mb-3 p-2 bg-gray-50 dark:bg-gray-700 rounded">
              <p className="mb-1">• Match lists: 5 min cache</p>
              <p>• Match data: 1 hour cache</p>
            </div>

            <button
              onClick={() => {
                void handleClearCache();
              }}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Clear All Cache
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
