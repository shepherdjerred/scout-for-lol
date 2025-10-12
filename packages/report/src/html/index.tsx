import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { CompletedMatch } from "@scout-for-lol/data";
import { Report } from "./report.tsx";
import { bunBeaufortFonts, bunSpiegelFonts } from "../assets/index.ts";

export async function matchToImage(match: CompletedMatch) {
  const svg = await matchToSvg(match);
  const png = svgToPng(svg);
  return png;
}

export async function matchToSvg(match: CompletedMatch) {
  const fonts = [...(await bunBeaufortFonts()), ...(await bunSpiegelFonts())];
  const svg = await satori(<Report match={match} />, {
    width: 4760,
    height: 3500,
    fonts,
  });
  return svg;
}

export function svgToPng(svg: string) {
  const resvg = new Resvg(svg, {
    dpi: 600,
    shapeRendering: 2,
    textRendering: 2,
    imageRendering: 0,
    fitTo: {
      mode: "original",
    },
    font: {
      loadSystemFonts: false,
    },
  });

  // Automatically crop to bounding box to remove transparent background
  const bbox = resvg.getBBox();
  if (bbox) {
    resvg.cropByBBox(bbox);
  }

  const pngData = resvg.render();
  return pngData.asPng();
}
