import { test, expect } from "bun:test";
import { writeFileSync } from "fs";
import { arenaMatchToSvg, svgToPng } from "./index.tsx";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { ArenaMatchSchema } from "@scout-for-lol/data";

const __dirname = dirname(fileURLToPath(import.meta.url));

const RAW_FILE_PATHS = [
  join(__dirname, "testdata/1.json"),
  join(__dirname, "testdata/2.json"),
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
    writeFileSync(new URL(`__snapshots__/${fileName}`, import.meta.url), svg);
    writeFileSync(new URL(`__snapshots__/${fileName}`, import.meta.url), png);
  });
}
