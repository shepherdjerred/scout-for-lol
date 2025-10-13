import { type ArenaMatch, type Augment, formatArenaPlacement } from "@scout-for-lol/data";
import { renderItems } from "../champion/item.tsx";
import { startCase } from "@scout-for-lol/data/src/util.ts";

export function ArenaReport(props: { match: ArenaMatch }) {
  const { match } = props;
  const renderAugment = (a: Augment) => {
    if (a.type === "full") {
      const rarityName = startCase(a.rarity);

      return `${a.name} (${rarityName})`;
    }
    return `Augment ${a.id.toString()}`;
  };
  const filterDisplayAugments = (augs: Augment[]) => augs.filter((a) => (a.type === "full" ? true : a.id > 0));
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        padding: 48,
        gap: 24,
        fontFamily: "Inter",
        color: "#e5e7eb",
        background: "#0b1220",
      }}
    >
      {(() => {
        // Get tracked player names to check if we're only tracking one team
        const highlightNames = match.players.map((p) => p.champion.riotIdGameName);

        const trackedTeams = match.teams.filter((team) =>
          team.players.some((p) => highlightNames.includes(p.riotIdGameName)),
        );

        // If we are only tracking one team, show victory if placement was <= 4, otherwise show loss
        if (trackedTeams.length === 1) {
          const trackedTeam = trackedTeams[0]; // Length check ensures this exists
          if (!trackedTeam) {
            throw new Error("Tracked team not found despite length check");
          }
          const isVictory = trackedTeam.placement <= 4;

          return (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  fontSize: 48,
                  fontWeight: 800,
                  color: isVictory ? "#10b981" : "#ef4444",
                  textShadow: "0 2px 4px rgba(0, 0, 0, 0.3)",
                }}
              >
                {isVictory ? "VICTORY" : "DEFEAT"}
              </div>
              <div
                style={{
                  fontSize: 32,
                  opacity: 0.8,
                  color: "#e5e7eb",
                  display: "flex",
                }}
              >
                {formatArenaPlacement(trackedTeam.placement)}
              </div>
            </div>
          );
        }

        return null;
      })()}

      <div style={{ display: "flex", fontSize: 48, opacity: 0.9 }}>
        {Math.round(match.durationInSeconds / 60)}m {Math.round(match.durationInSeconds % 60)}s
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Get tracked player names for gold highlighting (same as regular matches) */}
        {(() => {
          const highlightNames = match.players.map((p) => p.champion.riotIdGameName);

          return [...match.teams]
            .sort((a, b) => a.placement - b.placement)
            .filter((team) => {
              // Only show teams that have tracked players
              return team.players.some((p) => highlightNames.includes(p.riotIdGameName));
            })
            .map((team) => {
              // Check if this team has any tracked players (will always be true now due to filter)
              const hasTrackedPlayer = team.players.some((p) => highlightNames.includes(p.riotIdGameName));

              // Enhanced styling for teams with tracked players and medal accents
              const getTeamStyling = (placement: number, hasTracked: boolean) => {
                const medalAccent = {
                  border:
                    placement <= 3
                      ? placement === 1
                        ? "2px solid rgba(255, 215, 0, 0.3)"
                        : placement === 2
                          ? "2px solid rgba(192, 192, 192, 0.3)"
                          : "2px solid rgba(205, 127, 50, 0.3)"
                      : "2px solid #374151",
                  boxShadow:
                    placement <= 3
                      ? placement === 1
                        ? "0 4px 16px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 215, 0, 0.1)"
                        : placement === 2
                          ? "0 4px 16px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(192, 192, 192, 0.1)"
                          : "0 4px 16px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(205, 127, 50, 0.1)"
                      : "0 4px 16px rgba(0, 0, 0, 0.3)",
                };

                if (hasTracked) {
                  return {
                    background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
                    border: "3px solid #fbbf24",
                    boxShadow:
                      "0 8px 24px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(251, 191, 36, 0.3), 0 0 20px rgba(251, 191, 36, 0.15)",
                  };
                }

                return {
                  background: "linear-gradient(135deg, #111827 0%, #1f2937 100%)",
                  border: medalAccent.border,
                  boxShadow: medalAccent.boxShadow,
                };
              };

              const teamStyle = getTeamStyling(team.placement, hasTrackedPlayer);

              return (
                <div
                  key={team.teamId}
                  style={{
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    borderRadius: 20,
                    padding: 32,
                    background: teamStyle.background,
                    border: teamStyle.border,
                    boxShadow: teamStyle.boxShadow,
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 16,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div
                        style={{
                          background:
                            team.placement === 1
                              ? "linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)"
                              : team.placement === 2
                                ? "linear-gradient(135deg, #c0c0c0 0%, #e8e8e8 100%)"
                                : team.placement === 3
                                  ? "linear-gradient(135deg, #cd7f32 0%, #deb887 100%)"
                                  : "#6b7280",
                          color: team.placement <= 3 ? "#000" : "#fff",
                          borderRadius: "50%",
                          width: 52,
                          height: 52,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 24,
                          fontWeight: 800,
                          border: team.placement <= 3 ? "2px solid rgba(255, 255, 255, 0.2)" : "none",
                          boxShadow:
                            team.placement <= 3
                              ? "0 2px 8px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.3)"
                              : "0 2px 4px rgba(0, 0, 0, 0.2)",
                          textShadow: team.placement <= 3 ? "0 1px 1px rgba(0, 0, 0, 0.3)" : "none",
                        }}
                      >
                        {formatArenaPlacement(team.placement)}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {team.players.map((p, idx) => {
                      const items = renderItems(p.items, 0, true);
                      const isTrackedPlayer = highlightNames.includes(p.riotIdGameName);

                      return (
                        <div
                          key={idx}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            marginBottom: 16,
                            gap: 8,
                          }}
                        >
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                marginBottom: 4,
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  fontSize: 28,
                                  fontWeight: 700,
                                  color: isTrackedPlayer ? "#fbbf24" : "#e5e7eb",
                                }}
                              >
                                {p.riotIdGameName}
                              </div>
                              <div
                                style={{
                                  display: "flex",
                                  fontSize: 24,
                                  opacity: 0.8,
                                }}
                              >
                                Level {p.level}
                              </div>
                            </div>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: 8,
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  fontSize: 24,
                                  opacity: 0.9,
                                }}
                              >
                                {p.championName}
                              </div>
                              <div
                                style={{
                                  display: "flex",
                                  fontSize: 24,
                                  fontWeight: 600,
                                  color: p.kills > p.deaths ? "#10b981" : "#ef4444",
                                }}
                              >
                                {p.kills}/{p.deaths}/{p.assists}
                              </div>
                            </div>
                            {filterDisplayAugments(p.augments).length > 0 ? (
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  marginTop: 8,
                                  gap: 4,
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: 24,
                                    opacity: 0.8,
                                    fontWeight: 600,
                                    marginBottom: 4,
                                  }}
                                >
                                  Augments:
                                </div>
                                {filterDisplayAugments(p.augments).map((augment, augIdx) => (
                                  <div
                                    key={augIdx}
                                    style={{
                                      display: "flex",
                                      fontSize: 22,
                                      opacity: 0.75,
                                      paddingLeft: 16,
                                      position: "relative",
                                    }}
                                  >
                                    <span
                                      style={{
                                        position: "absolute",
                                        left: 0,
                                        color: "#9ca3af",
                                      }}
                                    >
                                      •
                                    </span>
                                    {renderAugment(augment)}
                                  </div>
                                ))}
                              </div>
                            ) : null}
                          </div>

                          <div
                            style={{
                              display: "flex",
                              transform: "scale(0.5)",
                              transformOrigin: "left top",
                            }}
                          >
                            {items}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            });
        })()}
      </div>
    </div>
  );
}
