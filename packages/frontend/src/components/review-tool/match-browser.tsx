/**
 * S3 match browser for selecting real match data
 */
import { useState, useMemo, useCallback } from "react";
import { z } from "zod";
import Fuse, { type FuseResult } from "fuse.js";
import type { ApiSettings } from "@scout-for-lol/frontend/lib/review-tool/config/schema";
import type { CompletedMatch, ArenaMatch } from "@scout-for-lol/data";
import {
  listMatchesFromS3,
  fetchMatchFromS3,
  convertRawMatchToInternalFormat,
  extractMatchMetadataFromRawMatch,
  type S3Config,
  type MatchMetadata,
} from "@scout-for-lol/frontend/lib/review-tool/s3";
import { getCachedDataAsync, setCachedData } from "@scout-for-lol/frontend/lib/review-tool/cache";
import { MatchFilters } from "./match-filters";
import { MatchList } from "./match-list";
import { MatchPagination } from "./match-pagination";
import { MatchLoadingState } from "./match-loading-state";

const ErrorSchema = z.object({ message: z.string() });
const MatchMetadataArraySchema = z.array(
  z.object({
    key: z.string(),
    queueType: z.string(),
    playerName: z.string(),
    champion: z.string(),
    lane: z.string(),
    outcome: z.string(),
    kda: z.string(),
    timestamp: z.date(),
  }),
);

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

  const s3Config = useMemo<S3Config | null>(() => {
    if (apiSettings.s3BucketName && apiSettings.awsAccessKeyId && apiSettings.awsSecretAccessKey) {
      return {
        bucketName: apiSettings.s3BucketName,
        accessKeyId: apiSettings.awsAccessKeyId,
        secretAccessKey: apiSettings.awsSecretAccessKey,
        region: apiSettings.awsRegion,
        ...(apiSettings.s3Endpoint ? { endpoint: apiSettings.s3Endpoint } : {}),
      };
    }
    return null;
  }, [apiSettings]);

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
        const cached: unknown = await getCachedDataAsync("match-metadata", cacheKey);
        const cachedResult = MatchMetadataArraySchema.safeParse(cached);

        if (cachedResult.success && cachedResult.data.length > 0) {
          // Instant load from cache - no loading UI!
          console.log(`[Cache HIT] Loaded ${cachedResult.data.length.toString()} matches from cache (IndexedDB)`);
          setMatches(cachedResult.data);
          setError(null);
          return;
        } else {
          console.log(`[Cache MISS] Need to fetch matches`, { forceRefresh, hasCachedData: !!cached });
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
              const rawMatch = await fetchMatchFromS3(s3Config, matchKey.key);
              if (rawMatch) {
                return extractMatchMetadataFromRawMatch(rawMatch, matchKey.key);
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
        const errorResult = ErrorSchema.safeParse(err);
        if (errorResult.success && errorResult.data.message === "Loading cancelled") {
          setError("Loading cancelled");
        } else {
          setError(errorResult.success ? errorResult.data.message : String(err));
        }
      } finally {
        setLoading(false);
        setLoadingProgress(null);
        setAbortController(null);
      }
    },
    [s3Config, abortController],
  );

  const handleSelectMatch = async (metadata: MatchMetadata) => {
    if (!s3Config) {
      return;
    }

    setLoading(true);
    setSelectedMetadata(metadata);
    try {
      const rawMatch = await fetchMatchFromS3(s3Config, metadata.key);
      if (rawMatch) {
        const match = convertRawMatchToInternalFormat(rawMatch, metadata.playerName);
        onMatchSelected(match);
      }
    } catch (err) {
      const errorResult = ErrorSchema.safeParse(err);
      setError(errorResult.success ? errorResult.data.message : String(err));
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
    if (filterPlayer.trim()) {
      const fuse = new Fuse(result, {
        keys: ["playerName"],
        threshold: 0.3, // Lower = more strict, higher = more fuzzy
        ignoreLocation: true,
        includeScore: true,
      });
      const fuzzyResults = fuse.search(filterPlayer.trim());
      result = fuzzyResults.map((r: FuseResult<MatchMetadata>) => r.item);
    }

    // Champion fuzzy filter
    if (filterChampion.trim()) {
      const fuse = new Fuse(result, {
        keys: ["champion"],
        threshold: 0.3,
        ignoreLocation: true,
        includeScore: true,
      });
      const fuzzyResults = fuse.search(filterChampion.trim());
      result = fuzzyResults.map((r: FuseResult<MatchMetadata>) => r.item);
    }

    return result;
  }, [matches, filterQueueType, filterLane, filterPlayer, filterChampion, filterOutcome]);

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
            <p className="text-xs text-center text-gray-500 dark:text-gray-400">Loads last 7 days of matches</p>
          </div>
        )}

        <MatchFilters
          filterQueueType={filterQueueType}
          filterLane={filterLane}
          filterPlayer={filterPlayer}
          filterChampion={filterChampion}
          filterOutcome={filterOutcome}
          onQueueTypeChange={setFilterQueueType}
          onLaneChange={setFilterLane}
          onPlayerChange={setFilterPlayer}
          onChampionChange={setFilterChampion}
          onOutcomeChange={setFilterOutcome}
        />
      </div>

      <MatchLoadingState
        loading={loading}
        loadingProgress={loadingProgress}
        onCancel={() => {
          abortController?.abort();
        }}
      />

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
          <MatchList
            matches={paginatedMatches}
            selectedMetadata={selectedMetadata}
            filterPlayer={filterPlayer}
            filterChampion={filterChampion}
            filterQueueType={filterQueueType}
            filterLane={filterLane}
            filterOutcome={filterOutcome}
            onSelectMatch={(metadata) => {
              void handleSelectMatch(metadata);
            }}
          />
          <MatchPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
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
