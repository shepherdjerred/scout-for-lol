import { test, expect } from "bun:test";
import { writeFileSync } from "fs";
import { arenaMatchToSvg } from "./index.tsx";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const RAW_FILE_PATHS = [
  join(__dirname, "testdata/matches_2025_09_19_NA1_5370969615.json"),
  join(__dirname, "testdata/matches_2025_09_19_NA1_5370986469.json"),
];

for (const path of RAW_FILE_PATHS) {
  const fileName = path.split("/").pop();
  if (!fileName) {
    throw new Error("fileName is undefined");
  }
  const testName = `arena real data renders image for ${fileName}`;
  test(testName, async () => {
    const match = (await Bun.file(path).json()) as unknown;
    const png = await arenaMatchToSvg(toArenaMatch(match));
    expect(png.length).toBeGreaterThan(1024); // basic sanity check
    const fileName =
      path.split("/").pop()?.replace(".json", ".png") ?? "arena_real.png";
    writeFileSync(new URL(`__snapshots__/${fileName}`, import.meta.url), png);
  });
}
