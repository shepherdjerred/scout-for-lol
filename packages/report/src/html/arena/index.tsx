import satori from "satori";
import { type ArenaMatch } from "@scout-for-lol/data";
import { ArenaReport } from "@scout-for-lol/report/html/arena/report.tsx";
import { bunBeaufortFonts, bunSpiegelFonts } from "@scout-for-lol/report/assets/index.ts";
import { svgToPng } from "@scout-for-lol/report/html/index.tsx";

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
  const png = await svgToPng(svg);
  return png;
}
