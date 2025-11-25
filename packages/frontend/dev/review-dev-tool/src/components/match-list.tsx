/**
 * Match list display component
 */
import type { MatchMetadata } from "../lib/s3";

type MatchListProps = {
  matches: MatchMetadata[];
  selectedMetadata: MatchMetadata | null;
  filterPlayer: string;
  filterChampion: string;
  filterQueueType: string;
  filterLane: string;
  filterOutcome: string;
  onSelectMatch: (metadata: MatchMetadata) => void;
};

export function MatchList({
  matches,
  selectedMetadata,
  filterPlayer,
  filterChampion,
  filterQueueType,
  filterLane,
  filterOutcome,
  onSelectMatch,
}: MatchListProps) {
  return (
    <div
      className="max-h-96 overflow-y-auto"
      key={`results-${filterPlayer}-${filterChampion}-${filterQueueType}-${filterLane}-${filterOutcome}`}
    >
      <div className="space-y-2 p-2">
        {matches.map((match, idx) => {
          const isSelected =
            selectedMetadata !== null &&
            selectedMetadata.key === match.key &&
            selectedMetadata.playerName === match.playerName;
          return (
            <div
              key={`${match.key}-${match.playerName}-${idx.toString()}`}
              role="button"
              tabIndex={0}
              onClick={() => {
                onSelectMatch(match);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectMatch(match);
                }
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
                {isSelected && <div className="text-xs font-semibold text-blue-600 dark:text-blue-400">✓ Selected</div>}
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
  );
}
