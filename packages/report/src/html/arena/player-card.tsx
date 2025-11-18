import { type ArenaChampion } from "@scout-for-lol/data";
import { ChampionInfo } from "./champion-info.tsx";
import { AugmentsDisplay } from "./augments-display.tsx";

export function PlayerCard({ player }: { player: ArenaChampion }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", marginBottom: 16, gap: 8 }}>
      <ChampionInfo
        items={player.items}
        playerName={player.riotIdGameName}
        championName={player.championName}
        kills={player.kills}
        deaths={player.deaths}
        assists={player.assists}
      />

      <AugmentsDisplay augments={player.augments} />
    </div>
  );
}
