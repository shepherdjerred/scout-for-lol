import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { type ArenaMatch } from "@scout-for-lol/data";
import { ArenaReport } from "./report.tsx";
import { bunBeaufortFonts, bunSpiegelFonts } from "../../assets/index.ts";

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

export function svgToPng(svg: string) {
  const resvg = new Resvg(svg, {
    dpi: 600,
    shapeRendering: 2,
    textRendering: 2,
    imageRendering: 0,
  });
  const pngData = resvg.render();
  return pngData.asPng();
}
