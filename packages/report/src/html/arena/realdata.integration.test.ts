import { test, expect } from "bun:test";
import { writeFileSync } from "fs";
import { createHash } from "crypto";
import { arenaMatchToSvg } from "./index.tsx";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { ArenaMatchSchema } from "@scout-for-lol/data";
import { svgToPng } from "../index.tsx";

const currentDir = dirname(fileURLToPath(import.meta.url));

function hashSvg(svg: string): string {
  return createHash("sha256").update(svg).digest("hex");
}

const RAW_FILE_PATHS = [
  join(currentDir, "testdata/1.json"),
  join(currentDir, "testdata/2.json"),
];

for (const path of RAW_FILE_PATHS) {
  const fileName = path.split("/").pop();
  if (!fileName) {
    throw new Error("fileName is undefined");
  }
  const testName = `arena real data renders image for ${fileName}`;
  test(testName, async () => {
    const match = (await Bun.file(path).json()) as unknown;
    const svg = await arenaMatchToSvg(ArenaMatchSchema.parse(match));
    const png = svgToPng(svg);
    expect(svg.length).toBeGreaterThan(1024); // basic sanity check
    const fileName =
      path.split("/").pop()?.replace(".json", ".png") ?? "arena_real.png";
    writeFileSync(new URL(`__snapshots__/${fileName}`, import.meta.url), png);

    // Hash the SVG for snapshot comparison instead of storing the full content
    const svgHash = hashSvg(svg);
    expect(svgHash).toMatchSnapshot();
  });
}
