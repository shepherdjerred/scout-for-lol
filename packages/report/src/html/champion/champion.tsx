import { renderItems } from "./item.tsx";
import { palette } from "../../assets/colors.ts";
import type { Champion } from "@scout-for-lol/data";
import { summoner } from "../../dataDragon/summoner.ts";
import { latestVersion } from "../../dataDragon/version.ts";
import { CreepScore } from "./creep-score.tsx";
import { Gold } from "./gold.tsx";
import { Damage } from "./damage.tsx";
import { Kda } from "./kda.tsx";
import { Names } from "./names.tsx";
import { Lane } from "../lane/index.tsx";
import { first, keys, map, pickBy, round } from "remeda";

// highlight should be true if this champion's riotIdGameName is in the highlightNames array (player-based highlight)
export function renderChampion(champion: Champion, highlight: boolean, durationInMinutes: number, damageMax: number) {
  const items = renderItems(champion.items, champion.visionScore, false);

  const damagePercent = round((champion.damage / damageMax || 0) * 100, 0);

  const summs = map(champion.spells, (spell) => {
    const name = first(keys(pickBy(summoner.data, (summoner) => summoner.key === spell.toString())));

    if (name === undefined) {
      throw new Error(`Summoner spell ${spell.toString()} not found`);
    }

    const size = "3.75rem";

    return (
      <div style={{ width: size, height: size, display: "flex" }}>
        <img
          src={`https://ddragon.leagueoflegends.com/cdn/${latestVersion}/img/spell/${name}.png`}
          style={{
            backgroundColor: palette.blue[5],
            border: `.01rem solid ${palette.gold.bright}`,
            objectFit: "contain",
            width: "100%",
            height: "100%",
            display: "block",
          }}
        />
      </div>
    );
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "2rem",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          color: "",
        }}
      >
        {champion.lane && <Lane lane={champion.lane} />}
        <span style={{ fontWeight: 700, width: "10rem" }}>{champion.level.toString()}</span>
      </div>

      <Names championName={champion.championName} summonerName={champion.riotIdGameName} highlight={highlight} />

      <div style={{ display: "flex", gap: "3rem" }}>
        <div style={{ display: "flex", flexDirection: "column" }}>{summs}</div>
        <div style={{ display: "flex", flexDirection: "row" }}>{items}</div>
      </div>

      <Kda kills={champion.kills} deaths={champion.deaths} assists={champion.assists} highlight={highlight} />
      <Damage value={champion.damage} percent={damagePercent} highlight={highlight} />
      <Gold value={champion.gold} durationInMinutes={durationInMinutes} />
      <CreepScore value={champion.creepScore} durationInMinutes={durationInMinutes} />
    </div>
  );
}
