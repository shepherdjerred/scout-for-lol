import { type ArenaTeam } from "@scout-for-lol/data";
import { PlacementBadge } from "./placement-badge.tsx";
import { TeamStats } from "./team-stats.tsx";

export function TeamHeader({ team }: { team: ArenaTeam }) {
  const teamKills = team.players.reduce((sum, p) => sum + p.kills, 0);
  const teamDeaths = team.players.reduce((sum, p) => sum + p.deaths, 0);
  const teamAssists = team.players.reduce((sum, p) => sum + p.assists, 0);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <PlacementBadge placement={team.placement} />
      </div>
      <TeamStats kills={teamKills} deaths={teamDeaths} assists={teamAssists} />
      Gold: 1000
    </div>
  );
}
