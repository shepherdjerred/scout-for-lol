import { palette } from "@scout-for-lol/report/assets/colors.ts";
import { round } from "remeda";

export function Kda({
  kills,
  deaths,
  assists,
  highlight,
}: {
  kills: number;
  deaths: number;
  assists: number;
  highlight: boolean;
}) {
  const kdaRatio = deaths === 0 ? kills + assists : round((kills + assists) / deaths, 2);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "30rem",
      }}
    >
      <span style={{ fontWeight: 700, color: highlight ? palette.gold[1] : "" }}>
        {`${kills.toString()} / ${deaths.toString()} / ${assists.toString()}`}
      </span>
      <span>{kdaRatio} KDA</span>
    </div>
  );
}
