import {
  type ArenaMatch,
  type Augment,
  formatArenaPlacement,
} from "@scout-for-lol/data";
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
  const filterDisplayAugments = (augs: Augment[]) =>
    augs.filter((a) => (a.type === "full" ? true : a.id > 0));
  const renderHighlighted = (highlighted: ArenaMatch["players"][number]) => {
    const items = renderItems(
      highlighted.champion.items,
      highlighted.champion.visionScore,
      true
    );

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
          padding: 24,
          borderRadius: 16,
          background: "#111827",
        }}
      >
        <div style={{ display: "flex", fontSize: 60, fontWeight: 700 }}>
          {highlighted.playerConfig.alias} · Team {highlighted.teamId} ·{" "}
          {formatArenaPlacement(highlighted.placement)}
        </div>
        <div style={{ display: "flex", fontSize: 48 }}>
          Level {highlighted.champion.level} ·{" "}
          {highlighted.champion.championName} · KDA {highlighted.champion.kills}
          /{highlighted.champion.deaths}/{highlighted.champion.assists}
        </div>
        {Array.isArray(highlighted.champion.augments) &&
        filterDisplayAugments(highlighted.champion.augments).length > 0 ? (
          <div style={{ display: "flex", fontSize: 36, opacity: 0.9 }}>
            Augments:{" "}
            {filterDisplayAugments(highlighted.champion.augments)
              .map(renderAugment)
              .join(", ")}
          </div>
        ) : null}

        <div
          style={{
            display: "flex",
            transform: "scale(0.6)",
            transformOrigin: "left center",
            marginTop: 8,
          }}
        >
          {items}
        </div>
      </div>
    );
  };
  const hasHighlighted = match.players.length > 0;
  const firstPlayer = match.players[0];
  if (!firstPlayer) {
    throw new Error("first player not found");
  }
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
      <div style={{ display: "flex", fontSize: 96, fontWeight: 800 }}>
        Arena Match
      </div>
      <div style={{ display: "flex", fontSize: 48, opacity: 0.9 }}>
        Duration: {Math.round(match.durationInSeconds / 60)}m
      </div>

      {/* Highlighted player (first tracked player) */}
      {hasHighlighted ? renderHighlighted(firstPlayer) : null}
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        {match.teams.map((team) => (
          <div
            key={team.teamId}
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
            <div
              style={{
                display: "flex",
                fontSize: 40,
                fontWeight: 700,
                marginBottom: 8,
              }}
            >
              Team {team.teamId} · {formatArenaPlacement(team.placement)}
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {team.players.map((p, idx) => {
                const items = renderItems(p.items, p.visionScore, true);

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
                          fontSize: 32,
                          fontWeight: 700,
                        }}
                      >
                        Level {p.level} · {p.riotIdGameName}
                      </div>
                      <div
                        style={{ display: "flex", fontSize: 28, opacity: 0.9 }}
                      >
                        {p.championName} · KDA {p.kills}/{p.deaths}/{p.assists}
                      </div>
                      {filterDisplayAugments(p.augments).length > 0 ? (
                        <div
                          style={{
                            display: "flex",
                            fontSize: 24,
                            opacity: 0.8,
                            marginTop: 4,
                          }}
                        >
                          Augments:{" "}
                          {filterDisplayAugments(p.augments)
                            .map(renderAugment)
                            .join(", ")}
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
        ))}
      </div>
    </div>
  );
}
