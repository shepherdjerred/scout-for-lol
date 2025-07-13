import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { fonts } from "../assets/index.ts";
import { AnyMatch } from "@scout-for-lol/data";
import { Report } from "./report.tsx";

export async function matchToImage(match: AnyMatch) {
  const svg = await matchToSvg(match);
  const png = svgToPng(svg);
  return png;
}

export async function matchToSvg(match: AnyMatch) {
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
  });
  const pngData = resvg.render();
  return pngData.asPng();
}
