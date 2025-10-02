import satori from "satori";
import { type ArenaMatch } from "@scout-for-lol/data";
import { ArenaReport } from "./report.tsx";
import { bunBeaufortFonts, bunSpiegelFonts } from "../../assets/index.ts";
import { svgToPng } from "../index.tsx";

export async function arenaMatchToSvg(match: ArenaMatch) {
  const fonts = [...(await bunBeaufortFonts()), ...(await bunSpiegelFonts())];
  const svg = await satori(<ArenaReport match={match} />, {
    width: 1600,
    height: 6000,
    fonts,
  });
  return svg;
}

export async function arenaMatchToImage(match: ArenaMatch) {
  const svg = await arenaMatchToSvg(match);
  const png = svgToPng(svg);
  return png;
}
