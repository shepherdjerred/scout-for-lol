/**
 * S3 match browser for selecting real match data
 */
import { useState, useMemo, useCallback, useEffect } from "react";
import Fuse from "fuse.js";
import type { ApiSettings } from "../config/schema";
import type { CompletedMatch, ArenaMatch } from "@scout-for-lol/data";
import {
  listMatchesFromS3,
  fetchMatchFromS3,
  convertMatchDtoToInternalFormat,
  extractMatchMetadataFromDto,
  type S3Config,
  type MatchMetadata,
} from "../lib/s3";
import { getCachedDataAsync, setCachedData } from "../lib/cache";

type MatchBrowserProps = {
  onMatchSelected: (match: CompletedMatch | ArenaMatch) => void;
  apiSettings: ApiSettings;
};

export function MatchBrowser({ onMatchSelected, apiSettings }: MatchBrowserProps) {
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState<{ current: number; total: number } | null>(null);
  const [matches, setMatches] = useState<MatchMetadata[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filterQueueType, setFilterQueueType] = useState<string>("all");
  const [filterLane, setFilterLane] = useState<string>("all");
  const [filterPlayer, setFilterPlayer] = useState<string>("");
  const [filterChampion, setFilterChampion] = useState<string>("");
  const [filterOutcome, setFilterOutcome] = useState<string>("all");
  const [selectedMetadata, setSelectedMetadata] = useState<MatchMetadata | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const s3Config: S3Config | null =
    apiSettings.s3BucketName && apiSettings.awsAccessKeyId && apiSettings.awsSecretAccessKey
      ? {
          bucketName: apiSettings.s3BucketName,
          accessKeyId: apiSettings.awsAccessKeyId,
          secretAccessKey: apiSettings.awsSecretAccessKey,
          region: apiSettings.awsRegion,
          ...(apiSettings.s3Endpoint ? { endpoint: apiSettings.s3Endpoint } : {}),
        }
      : null;

  const handleBrowse = useCallback(
    async (forceRefresh = false) => {
      if (!s3Config) {
        setError("S3 credentials not configured");
        return;
      }

      // Check cache FIRST before showing loading UI
      const cacheKey = {
        bucketName: s3Config.bucketName,
        region: s3Config.region,
        endpoint: s3Config.endpoint,
        type: "metadata-array",
      };

      if (!forceRefresh) {
        const cachedMetadata = await getCachedDataAsync<MatchMetadata[]>("match-metadata", cacheKey);

        if (cachedMetadata && cachedMetadata.length > 0) {
          // Instant load from cache - no loading UI!
          console.log(`[Cache HIT] Loaded ${cachedMetadata.length.toString()} matches from cache (IndexedDB/localStorage)`);
          setMatches(cachedMetadata);
          setError(null);
          return;
        } else {
          console.log(`[Cache MISS] Need to fetch matches`, { forceRefresh, hasCachedData: !!cachedMetadata });
        }
      }

      // No cache hit, proceed with fetching
      // Cancel any ongoing fetch
      if (abortController) {
        abortController.abort();
      }

      const newAbortController = new AbortController();
      setAbortController(newAbortController);
      setLoading(true);
      setError(null);
      setMatches([]); // Clear old results while loading
      setLoadingProgress(null);

      try {
        // Not cached, need to fetch and extract
        const matchKeys = await listMatchesFromS3(s3Config);
        const matchData: MatchMetadata[] = [];

        // Fetch and convert all matches
        const totalMatches = matchKeys.length;
        setLoadingProgress({ current: 0, total: totalMatches });

        // Batch fetching with concurrency limit to avoid DOSing the endpoint
        const BATCH_SIZE = 10; // Fetch 10 matches at a time

        for (let i = 0; i < totalMatches; i += BATCH_SIZE) {
          // Check if aborted
          if (newAbortController.signal.aborted) {
            throw new Error("Loading cancelled");
          }

          const batch = matchKeys.slice(i, Math.min(i + BATCH_SIZE, totalMatches));

          // Fetch batch in parallel
          const batchResults = await Promise.allSettled(
            batch.map(async (matchKey) => {
              const matchDto = await fetchMatchFromS3(s3Config, matchKey.key);
              if (matchDto) {
                return extractMatchMetadataFromDto(matchDto, matchKey.key);
              }
              return null;
            }),
          );

          // Process batch results
          for (const result of batchResults) {
            if (result.status === "fulfilled" && result.value) {
              matchData.push(...result.value);
            }
          }

          // Update progress
          setLoadingProgress({ current: Math.min(i + BATCH_SIZE, totalMatches), total: totalMatches });

          // Small delay between batches to be nice to the API
          if (i + BATCH_SIZE < totalMatches) {
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
        }

        // Cache the metadata array for fast subsequent loads (24 hour TTL)
        console.log(`[Cache WRITE] Caching ${matchData.length.toString()} matches for 24 hours`);
        await setCachedData("match-metadata", cacheKey, matchData, 24 * 60 * 60 * 1000);

        setMatches(matchData);
        setLoadingProgress(null);
      } catch (err) {
        if (err instanceof Error && err.message === "Loading cancelled") {
          setError("Loading cancelled");
        } else {
          setError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        setLoading(false);
        setLoadingProgress(null);
        setAbortController(null);
      }
    },
    [s3Config, abortController],
  );

  // Auto-load matches on mount when S3 config is available
  useEffect(() => {
    if (s3Config && matches.length === 0 && !loading) {
      void handleBrowse();
    }
  }, [s3Config?.bucketName]); // Only trigger when config changes, not on every render

  // Auto-refresh today's matches every 10 minutes (if matches are already loaded)
  useEffect(() => {
    if (!s3Config || matches.length === 0) return;

    const interval = setInterval(
      () => {
        // Force refresh to get latest data (bypasses metadata cache)
        void handleBrowse(true);
      },
      10 * 60 * 1000,
    ); // 10 minutes

    return () => {
      clearInterval(interval);
    };
  }, [s3Config, matches.length, handleBrowse]);

  const handleSelectMatch = async (metadata: MatchMetadata) => {
    if (!s3Config) return;

    setLoading(true);
    setSelectedMetadata(metadata);
    try {
      const matchDto = await fetchMatchFromS3(s3Config, metadata.key);
      if (matchDto) {
        const match = convertMatchDtoToInternalFormat(matchDto, metadata.playerName);
        onMatchSelected(match);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSelectedMetadata(null);
    } finally {
      setLoading(false);
    }
  };

  const filteredMatches = useMemo(() => {
    let result = matches;

    // Queue type filter
    if (filterQueueType !== "all") {
      result = result.filter((m) => m.queueType === filterQueueType);
    }

    // Lane filter
    if (filterLane !== "all") {
      result = result.filter((m) => m.lane === filterLane);
    }

    // Outcome filter
    if (filterOutcome !== "all") {
      result = result.filter((m) => {
        if (filterOutcome === "victory") {
          return m.outcome.includes("Victory");
        }
        if (filterOutcome === "defeat") {
          return m.outcome.includes("Defeat");
        }
        return true;
      });
    }

    // Player name fuzzy filter
    if (filterPlayer?.trim()) {
      const fuse = new Fuse(result, {
        keys: ["playerName"],
        threshold: 0.3, // Lower = more strict, higher = more fuzzy
        ignoreLocation: true,
        includeScore: true,
      });
      const fuzzyResults = fuse.search(filterPlayer.trim());
      result = fuzzyResults.map((r) => r.item);
    }

    // Champion fuzzy filter
    if (filterChampion?.trim()) {
      const fuse = new Fuse(result, {
        keys: ["champion"],
        threshold: 0.3,
        ignoreLocation: true,
        includeScore: true,
      });
      const fuzzyResults = fuse.search(filterChampion.trim());
      result = fuzzyResults.map((r) => r.item);
    }

    return result;
  }, [matches, filterQueueType, filterLane, filterPlayer, filterChampion, filterOutcome]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterQueueType, filterLane, filterPlayer, filterChampion, filterOutcome]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredMatches.length / pageSize);
  const paginatedMatches = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize;
    const endIdx = startIdx + pageSize;
    return filteredMatches.slice(startIdx, endIdx);
  }, [filteredMatches, currentPage, pageSize]);

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Browse Matches</h3>

      {!s3Config && (
        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded text-sm text-yellow-800 dark:text-yellow-200 mb-3">
          <strong>S3 credentials not configured.</strong> Please configure Cloudflare R2 credentials in API Settings to
          browse matches.
        </div>
      )}

      <div className="space-y-3 mb-3">
        {s3Config && (
          <div className="space-y-1">
            <button
              onClick={() => {
                void handleBrowse(true);
              }}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              {loading ? "Loading..." : "Refresh Matches"}
            </button>
            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
              Auto-loads last 7 days • Refreshes every 10 min
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Queue Type</label>
            <select
              value={filterQueueType}
              onChange={(e) => {
                setFilterQueueType(e.target.value);
              }}
              className="w-full px-2 py-1.5 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded"
            >
              <option value="all">All</option>
              <option value="solo">Ranked Solo</option>
              <option value="flex">Ranked Flex</option>
              <option value="arena">Arena</option>
              <option value="aram">ARAM</option>
              <option value="quickplay">Quickplay</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lane</label>
            <select
              value={filterLane}
              onChange={(e) => {
                setFilterLane(e.target.value);
              }}
              className="w-full px-2 py-1.5 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded"
            >
              <option value="all">All</option>
              <option value="top">Top</option>
              <option value="jungle">Jungle</option>
              <option value="middle">Mid</option>
              <option value="adc">ADC</option>
              <option value="support">Support</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Outcome</label>
            <select
              value={filterOutcome}
              onChange={(e) => {
                setFilterOutcome(e.target.value);
              }}
              className="w-full px-2 py-1.5 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded"
            >
              <option value="all">All</option>
              <option value="victory">Victory</option>
              <option value="defeat">Defeat</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Player (Game Name)</label>
          <input
            type="text"
            placeholder="Fuzzy search player names..."
            value={filterPlayer}
            onChange={(e) => {
              setFilterPlayer(e.target.value);
            }}
            className="w-full px-2 py-1.5 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Champion</label>
          <input
            type="text"
            placeholder="Fuzzy search champions..."
            value={filterChampion}
            onChange={(e) => {
              setFilterChampion(e.target.value);
            }}
            className="w-full px-2 py-1.5 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded"
          />
        </div>
      </div>

      {loading && (
        <div className="text-center py-2 text-sm text-gray-600 dark:text-gray-400">
          {loadingProgress ? (
            <div className="space-y-2">
              <div>
                Loading matches... {loadingProgress.current}/{loadingProgress.total}
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((loadingProgress.current / loadingProgress.total) * 100).toString()}%` }}
                />
              </div>
              <button
                onClick={() => abortController?.abort()}
                className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div>Loading matches...</div>
          )}
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded text-sm text-red-800 dark:text-red-200 mb-3">
          {error}
        </div>
      )}

      {filteredMatches.length > 0 && !loading && (
        <div className="border border-gray-200 dark:border-gray-700 rounded overflow-hidden">
          <div className="px-2 py-1.5 bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <span className="text-xs text-gray-600 dark:text-gray-400">
              Showing {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filteredMatches.length)} of{" "}
              {filteredMatches.length} {filteredMatches.length === 1 ? "result" : "results"}
              {matches.length !== filteredMatches.length && ` (filtered from ${matches.length.toString()})`}
            </span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="text-xs px-2 py-0.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded"
            >
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
          </div>
          <div
            className="max-h-96 overflow-y-auto"
            key={`results-${filterPlayer}-${filterChampion}-${filterQueueType}-${filterLane}-${filterOutcome}`}
          >
            <div className="space-y-2 p-2">
              {paginatedMatches.map((match, idx) => {
                const isSelected =
                  selectedMetadata !== null &&
                  selectedMetadata.key === match.key &&
                  selectedMetadata.playerName === match.playerName;
                return (
                  <div
                    key={`${match.key}-${match.playerName}-${idx.toString()}`}
                    onClick={() => {
                      void handleSelectMatch(match);
                    }}
                    className={`rounded p-2 transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-blue-100 dark:bg-blue-900 border-2 border-blue-500 dark:border-blue-400"
                        : "bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 border-2 border-transparent"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2">
                        <div className="text-xs font-medium text-gray-900 dark:text-white">{match.champion}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">({match.lane})</div>
                      </div>
                      {isSelected && (
                        <div className="text-xs font-semibold text-blue-600 dark:text-blue-400">✓ Selected</div>
                      )}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 space-y-0.5">
                      <div>{match.playerName}</div>
                      <div className="flex justify-between">
                        <span className="capitalize">{match.queueType}</span>
                        <span
                          className={
                            match.outcome.includes("Victory")
                              ? "text-green-600 dark:text-green-400"
                              : match.outcome.includes("Defeat")
                                ? "text-red-600 dark:text-red-400"
                                : ""
                          }
                        >
                          {match.outcome}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-mono">{match.kda}</span>
                        <span>{match.timestamp.toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {totalPages > 1 && (
            <div className="px-2 py-2 bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <button
                onClick={() => {
                  setCurrentPage((p) => Math.max(1, p - 1));
                }}
                disabled={currentPage === 1}
                className="px-3 py-1 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  Page {currentPage} of {totalPages}
                </span>
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={currentPage}
                  onChange={(e) => {
                    const page = Number(e.target.value);
                    if (page >= 1 && page <= totalPages) {
                      setCurrentPage(page);
                    }
                  }}
                  className="w-16 px-2 py-0.5 text-xs text-center bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded"
                />
              </div>
              <button
                onClick={() => {
                  setCurrentPage((p) => Math.min(totalPages, p + 1));
                }}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {matches.length === 0 && !loading && !error && (
        <div className="text-center py-6 text-sm text-gray-500 dark:text-gray-400">
          {s3Config
            ? "No matches found in the last 7 days."
            : "Configure Cloudflare R2 credentials in API Settings to browse matches."}
        </div>
      )}

      {matches.length > 0 && filteredMatches.length === 0 && !loading && (
        <div className="text-center py-6 text-sm text-gray-500 dark:text-gray-400">
          No matches match the current filters. Try adjusting your filters.
        </div>
      )}
    </div>
  );
}
