import { type ArenaAugmentUnion, type ArenaMatch, formatArenaPlacement } from "@scout-for-lol/data";
import { renderItems } from "../champion/item.tsx";
import { latestVersion } from "../../dataDragon/version.ts";
import { summoner } from "../../dataDragon/summoner.ts";
import { palette } from "../../assets/colors.ts";
import { first, keys, map, pickBy } from "remeda";

export function ArenaReport(props: { match: ArenaMatch }) {
  const { match } = props;
  const renderAugment = (a: ArenaAugmentUnion) => {
    if (a.type === "full") {
      const rarityName = a.rarity === "prismatic" ? "Prismatic" : a.rarity === "gold" ? "Gold" : "Silver";
      return `${a.name} (${rarityName})`;
    }
    return `Augment ${a.id}`;
  };
  const filterDisplayAugments = (augs: ArenaAugmentUnion[]) => augs.filter((a) => (a.type === "full" ? true : a.id > 0));
  const renderHighlighted = (highlighted: ArenaMatch["players"][number]) => {
    const items = renderItems(highlighted.champion.items, highlighted.champion.visionScore, true);

    const summs = map(highlighted.champion.spells, (spell) => {
      const name = first(
        keys(
          pickBy(summoner.data, (summoner) => summoner.key === spell.toString())
        )
      );

      if (name === undefined) {
        return null;
      }

      return (
        <img
          key={spell}
          src={`https://ddragon.leagueoflegends.com/cdn/${latestVersion}/img/spell/${name}.png`}
          width={40}
          height={40}
          style={{
            backgroundColor: palette.blue[5],
            border: `1px solid ${palette.gold.bright}`,
            marginRight: 6,
          }}
        />
      );
    });

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
          {highlighted.playerConfig.alias} · Team {highlighted.team} · {formatArenaPlacement(highlighted.placement)}
        </div>
        <div style={{ display: "flex", fontSize: 48 }}>
          Level {highlighted.champion.level} · {highlighted.champion.championName} · KDA {highlighted.champion.kills}/{highlighted.champion.deaths}/{highlighted.champion.assists}
        </div>
        {Array.isArray(highlighted.champion.augments) && filterDisplayAugments(highlighted.champion.augments).length > 0 ? (
          <div style={{ display: "flex", fontSize: 36, opacity: 0.9 }}>
            Augments: {filterDisplayAugments(highlighted.champion.augments).map(renderAugment).join(", ")}
          </div>
        ) : null}

        <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {summs.filter(Boolean)}
          </div>
          <div style={{ display: "flex", transform: "scale(0.6)", transformOrigin: "left center" }}>
            {items}
          </div>
        </div>
      </div>
    );
  };
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
              {team.players.map((p, idx) => {
                const items = renderItems(p.items, p.visionScore, true);

                const summs = map(p.spells, (spell) => {
                  const name = first(
                    keys(
                      pickBy(summoner.data, (summoner) => summoner.key === spell.toString())
                    )
                  );

                  if (name === undefined) {
                    return null;
                  }

                  return (
                    <img
                      key={spell}
                      src={`https://ddragon.leagueoflegends.com/cdn/${latestVersion}/img/spell/${name}.png`}
                      width={30}
                      height={30}
                      style={{
                        backgroundColor: palette.blue[5],
                        border: `1px solid ${palette.gold.bright}`,
                        marginRight: 4,
                      }}
                    />
                  );
                });

                return (
                  <div
                    key={idx}
                    style={{ display: "flex", alignItems: "center", marginBottom: 16, gap: 16 }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", minWidth: 200 }}>
                      <div style={{ display: "flex", fontSize: 32, fontWeight: 700 }}>
                        Level {p.level} · {p.riotIdGameName ?? "Unknown"}
                      </div>
                      <div style={{ display: "flex", fontSize: 28, opacity: 0.9 }}>
                        {p.championName} · KDA {p.kills}/{p.deaths}/{p.assists}
                      </div>
                      {p.augments && filterDisplayAugments(p.augments).length > 0 ? (
                        <div style={{ display: "flex", fontSize: 24, opacity: 0.8, marginTop: 4 }}>
                          Augments: {filterDisplayAugments(p.augments).map(renderAugment).join(", ")}
                        </div>
                      ) : null}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        {summs.filter(Boolean)}
                      </div>
                      <div style={{ display: "flex", transform: "scale(0.5)", transformOrigin: "left center" }}>
                        {items}
                      </div>
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
