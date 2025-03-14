import satori, { init } from "satori/wasm";
import { Resvg } from "@resvg/resvg-js";
import React from "react";
import { fonts } from "../assets/index.ts";
import { CompletedMatch } from "@scout/data";
import { Report } from "./report.tsx";
import initYoga from "yoga-wasm-web";

const wasm = await Deno.readFile(`node_modules/yoga-wasm-web/dist/yoga.wasm`);
const yoga = await initYoga(wasm);
init(yoga);

export async function matchToImage(match: CompletedMatch) {
  const svg = await matchToSvg(match);
  const png = svgToPng(svg);
  return png;
}

export async function matchToSvg(match: CompletedMatch) {
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
