import { type ArenaMatch, formatArenaPlacement } from "@scout-for-lol/data";

export function ArenaReport(props: { match: ArenaMatch }) {
  const { match } = props;
  const renderAugment = (a: any) => {
    if (!a) return "";
    if (typeof a === "object" && "name" in a && "rarity" in a) {
      return `${(a as any).name} (R${(a as any).rarity})`;
    }
    if (typeof a === "object" && "id" in a) return `Augment ${(a as any).id}`;
    return String(a);
  };
  const renderHighlighted = (highlighted: ArenaMatch["players"][number]) => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: 24,
        borderRadius: 16,
        background: "#111827",
      }}
    >
      <div style={{ display: "flex", fontSize: 60, fontWeight: 700 }}>
        {highlighted.playerConfig.alias} · Team {highlighted.team} · {formatArenaPlacement(highlighted.placement)}
      </div>
      <div style={{ display: "flex", fontSize: 40 }}>
        {highlighted.champion.championName} · KDA {highlighted.champion.kills}/{highlighted.champion.deaths}/{highlighted.champion.assists}
      </div>
      {Array.isArray(highlighted.champion.augments) && highlighted.champion.augments.length > 0 ? (
        <div style={{ display: "flex", fontSize: 36, opacity: 0.9 }}>
          Augments: {highlighted.champion.augments.map(renderAugment).join(", ")}
        </div>
      ) : null}
    </div>
  );
  const hasHighlighted = match.players.length > 0;
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
      <div style={{ display: "flex", fontSize: 96, fontWeight: 800 }}>Arena Match</div>
      <div style={{ display: "flex", fontSize: 48, opacity: 0.9 }}>
        Duration: {Math.round(match.durationInSeconds / 60)}m
      </div>

      {/* Highlighted player (first tracked player) */}
      {hasHighlighted ? renderHighlighted(match.players[0] as ArenaMatch["players"][number]) : null}
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        {match.subteams.map((team) => (
          <div
            key={team.subteamId}
            style={{
              width: "24%",
              marginRight: "1%",
              marginBottom: 24,
              display: "flex",
              flexDirection: "column",
              borderRadius: 16,
              padding: 24,
              background: "#111827",
            }}
          >
            <div style={{ display: "flex", fontSize: 40, fontWeight: 700, marginBottom: 8 }}>
              Team {team.subteamId} · {formatArenaPlacement(team.placement)}
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {team.players.map((p, idx) => (
                <div
                  key={idx}
                  style={{ display: "flex", fontSize: 36, marginBottom: 12 }}
                >
                  <span style={{ fontWeight: 700 }}>
                    {p.riotIdGameName ?? "Unknown"}
                  </span>
                  <span style={{ opacity: 0.9 }}>{" · "}{p.championName}</span>
                  <span style={{ opacity: 0.9 }}>{" · KDA "}{p.kills}/{p.deaths}/{p.assists}</span>
                  {p.augments && p.augments.length > 0 ? (
                    <span style={{ opacity: 0.8 }}>
                      {" "}· Augments: {p.augments.map(renderAugment).join(", ")}
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
