import { latestVersion } from "../../dataDragon/version";
import { renderItems } from "../champion/item";

export function ChampionInfo({
  playerName,
  championName,
  kills,
  deaths,
  assists,
  items,
}: {
  playerName: string;
  championName: string;
  kills: number;
  deaths: number;
  assists: number;
  items: number[];
}) {
  const actualItems = renderItems(items, 0, true);

  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
        <img
          src={`https://ddragon.leagueoflegends.com/cdn/${latestVersion}/img/champion/${championName}.png`}
          style={{ width: 60, height: 60, borderRadius: 8, border: "2px solid #374151", flexShrink: 0 }}
          alt={championName}
        />
        <div style={{ display: "flex", fontSize: 24, opacity: 0.9, justifyContent: "center" }}>
          <span>{playerName}</span>
          <span>{championName}</span>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: "scale(0.5)",
          transformOrigin: "center",
        }}
      >
        {actualItems}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 24,
          fontWeight: 600,
          color: kills > deaths ? "#10b981" : "#ef4444",
          minWidth: 80,
        }}
      >
        {kills}/{deaths}/{assists}
      </div>
    </div>
  );
}
