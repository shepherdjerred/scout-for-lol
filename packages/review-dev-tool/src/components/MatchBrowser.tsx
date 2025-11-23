/**
 * S3 match browser for selecting real match data
 */
import { useState, useEffect } from "react";
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

interface MatchBrowserProps {
  onMatchSelected: (match: CompletedMatch | ArenaMatch) => void;
  apiSettings: ApiSettings;
}

export function MatchBrowser({ onMatchSelected, apiSettings }: MatchBrowserProps) {
  const [daysBack, setDaysBack] = useState(2);
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<MatchMetadata[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filterQueueType, setFilterQueueType] = useState<string>("all");
  const [filterPlayer, setFilterPlayer] = useState<string>("");
  const [filterChampion, setFilterChampion] = useState<string>("");
  const [filterOutcome, setFilterOutcome] = useState<string>("all");

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

  const handleBrowse = async () => {
    if (!s3Config) {
      setError("S3 credentials not configured");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const matchKeys = await listMatchesFromS3(s3Config, daysBack);
      const matchData: MatchMetadata[] = [];

      // Fetch and convert first 50 matches
      const limit = Math.min(matchKeys.length, 50);
      for (let i = 0; i < limit; i++) {
        const matchKey = matchKeys[i];
        if (!matchKey) continue;

        const matchDto = await fetchMatchFromS3(s3Config, matchKey.key);
        if (matchDto) {
          const metadataArray = extractMatchMetadataFromDto(matchDto, matchKey.key);
          matchData.push(...metadataArray);
        }
      }

      setMatches(matchData);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  // Auto-load matches from cache on mount
  useEffect(() => {
    if (s3Config && matches.length === 0 && !loading) {
      handleBrowse();
    }
  }, [s3Config?.bucketName]); // Only trigger when S3 config changes

  const handleSelectMatch = async (metadata: MatchMetadata) => {
    if (!s3Config) return;

    setLoading(true);
    try {
      const matchDto = await fetchMatchFromS3(s3Config, metadata.key);
      if (matchDto) {
        const match = await convertMatchDtoToInternalFormat(matchDto);
        onMatchSelected(match);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const filteredMatches = matches.filter((m) => {
    // Queue type filter
    if (filterQueueType !== "all" && m.queueType !== filterQueueType) {
      return false;
    }

    // Player name filter (case-insensitive)
    if (filterPlayer && !m.playerName.toLowerCase().includes(filterPlayer.toLowerCase())) {
      return false;
    }

    // Champion filter (case-insensitive)
    if (filterChampion && !m.champion.toLowerCase().includes(filterChampion.toLowerCase())) {
      return false;
    }

    // Outcome filter
    if (filterOutcome !== "all") {
      if (filterOutcome === "victory" && !m.outcome.includes("Victory")) {
        return false;
      }
      if (filterOutcome === "defeat" && !m.outcome.includes("Defeat")) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Browse Matches</h3>

      {!s3Config && (
        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded text-sm text-yellow-800 dark:text-yellow-200 mb-3">
          Please configure S3 credentials in API Settings to browse matches.
        </div>
      )}

      <div className="space-y-3 mb-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Days Back: {daysBack}
          </label>
          <input
            type="range"
            min="1"
            max="30"
            value={daysBack}
            onChange={(e) => setDaysBack(Number.parseInt(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Queue Type</label>
            <select
              value={filterQueueType}
              onChange={(e) => setFilterQueueType(e.target.value)}
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Outcome</label>
            <select
              value={filterOutcome}
              onChange={(e) => setFilterOutcome(e.target.value)}
              className="w-full px-2 py-1.5 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded"
            >
              <option value="all">All</option>
              <option value="victory">Victory</option>
              <option value="defeat">Defeat</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Player Name</label>
          <input
            type="text"
            placeholder="Filter by player..."
            value={filterPlayer}
            onChange={(e) => setFilterPlayer(e.target.value)}
            className="w-full px-2 py-1.5 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Champion</label>
          <input
            type="text"
            placeholder="Filter by champion..."
            value={filterChampion}
            onChange={(e) => setFilterChampion(e.target.value)}
            className="w-full px-2 py-1.5 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded"
          />
        </div>

        <button
          onClick={handleBrowse}
          disabled={loading || !s3Config}
          className="w-full px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          {loading ? "Loading..." : "Browse"}
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded text-sm text-red-800 dark:text-red-200 mb-3">
          {error}
        </div>
      )}

      {filteredMatches.length > 0 && (
        <div className="border border-gray-200 dark:border-gray-700 rounded overflow-hidden">
          <div className="max-h-96 overflow-y-auto">
            <div className="space-y-2 p-2">
              {filteredMatches.map((match) => (
                <div
                  key={match.key}
                  className="bg-gray-50 dark:bg-gray-900 rounded p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="text-xs font-medium text-gray-900 dark:text-white">
                      {match.champion}
                    </div>
                    <button
                      onClick={() => handleSelectMatch(match)}
                      className="px-2 py-0.5 bg-green-600 dark:bg-green-500 text-white rounded hover:bg-green-700 dark:hover:bg-green-600 transition-colors text-xs"
                    >
                      Select
                    </button>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 space-y-0.5">
                    <div>{match.playerName}</div>
                    <div className="flex justify-between">
                      <span className="capitalize">{match.queueType}</span>
                      <span className={match.outcome.includes("Victory") ? "text-green-600 dark:text-green-400" : match.outcome.includes("Defeat") ? "text-red-600 dark:text-red-400" : ""}>
                        {match.outcome}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-mono">{match.kda}</span>
                      <span>{match.timestamp.toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {matches.length === 0 && !loading && !error && (
        <div className="text-center py-6 text-sm text-gray-500 dark:text-gray-400">
          {s3Config
            ? "No matches found. Try adjusting the days back or click Browse to refresh."
            : "Configure S3 credentials in Settings to browse matches."}
        </div>
      )}

      {matches.length > 0 && filteredMatches.length === 0 && (
        <div className="text-center py-6 text-sm text-gray-500 dark:text-gray-400">
          No matches match the current filters. Try adjusting your filters.
        </div>
      )}
    </div>
  );
}
