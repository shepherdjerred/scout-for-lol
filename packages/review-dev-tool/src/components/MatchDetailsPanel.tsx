/**
 * Display details about the currently selected match
 */
import type { CompletedMatch, ArenaMatch } from "@scout-for-lol/data";
import { formatArenaPlacement } from "@scout-for-lol/data";

interface MatchDetailsPanelProps {
  match: CompletedMatch | ArenaMatch;
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function isArenaMatch(match: CompletedMatch | ArenaMatch): match is ArenaMatch {
  return match.queueType === "arena";
}

export function MatchDetailsPanel({ match }: MatchDetailsPanelProps) {
  const isArena = isArenaMatch(match);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Match Details</h3>

      <div className="space-y-3">
        {/* Queue Type */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">Queue:</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
            {match.queueType ?? "Unknown"}
          </span>
        </div>

        {/* Duration */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">Duration:</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {formatDuration(match.durationInSeconds)}
          </span>
        </div>

        {/* Players */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {match.players.length === 1 ? "Player" : "Players"} ({match.players.length})
          </h4>
          <div className="space-y-2">
            {match.players.map((player, idx) => (
              <div key={idx} className="bg-gray-50 dark:bg-gray-900 rounded p-2">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {player.playerConfig.alias || "Unknown"}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Riot ID</div>
                  </div>
                  {!isArena && "outcome" in player && (
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        player.outcome === "Victory" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}
                    >
                      {player.outcome}
                    </span>
                  )}
                  {isArena && "placement" in player && (
                    <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">
                      {formatArenaPlacement(player.placement)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400 dark:text-gray-500">
                  <span>
                    <strong>Champion:</strong> {player.champion.championName}
                  </span>
                  {!isArena && "lane" in player.champion && player.champion.lane && (
                    <span className="capitalize">
                      <strong>Lane:</strong> {player.champion.lane}
                    </span>
                  )}
                  <span>
                    <strong>KDA:</strong> {player.champion.kills}/{player.champion.deaths}/{player.champion.assists}
                  </span>
                </div>
                {!isArena && "rankAfterMatch" in player && player.rankAfterMatch && (
                  <div className="text-xs text-gray-600 dark:text-gray-400 dark:text-gray-500 mt-1">
                    <strong>Rank:</strong> {player.rankAfterMatch.tier} {player.rankAfterMatch.division}
                    {player.rankAfterMatch.lp !== undefined && ` (${player.rankAfterMatch.lp} LP)`}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Team Composition (for non-arena matches) */}
        {!isArena && "teams" in match && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Teams</h4>
            <div className="grid grid-cols-2 gap-3">
              {/* Blue Team */}
              <div className="bg-blue-50 dark:bg-blue-950/30 rounded p-3 border border-blue-200 dark:border-blue-800">
                <div className="text-xs font-semibold text-blue-900 dark:text-blue-300 mb-2">Blue Team</div>
                <div className="space-y-1.5">
                  {match.teams.blue.map((champion, idx) => (
                    <div key={idx} className="text-xs">
                      <div className="font-medium text-blue-900 dark:text-blue-200">{champion.riotIdGameName}</div>
                      <div className="text-blue-700 dark:text-blue-400">{champion.championName}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Red Team */}
              <div className="bg-red-50 dark:bg-red-950/30 rounded p-3 border border-red-200 dark:border-red-800">
                <div className="text-xs font-semibold text-red-900 dark:text-red-300 mb-2">Red Team</div>
                <div className="space-y-1.5">
                  {match.teams.red.map((champion, idx) => (
                    <div key={idx} className="text-xs">
                      <div className="font-medium text-red-900 dark:text-red-200">{champion.riotIdGameName}</div>
                      <div className="text-red-700 dark:text-red-400">{champion.championName}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Arena Teams */}
        {isArena && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Arena Teams ({match.teams.length})
            </h4>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {match.teams
                .slice()
                .sort((a, b) => a.placement - b.placement)
                .map((team) => (
                  <div
                    key={team.teamId}
                    className="flex justify-between items-center text-xs bg-gray-50 dark:bg-gray-900 rounded px-2 py-1"
                  >
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatArenaPlacement(team.placement)}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400 dark:text-gray-500">
                      {team.players.map((p) => p.championName).join(" & ")}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
