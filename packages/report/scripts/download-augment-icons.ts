#!/usr/bin/env node

/**
 * Script to download augment icons from Community Dragon
 * and store them locally in the repo.
 */

import { readdir, mkdir, writeFile, readFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ICONS_DIR = join(__dirname, "../src/assets/augment-icons");

// Base URL for Community Dragon icons
const CDRAGON_BASE = "https://raw.communitydragon.org/latest/game/assets/ux/cherry/augments/icons";
const ARENA_JSON_URL = "https://raw.communitydragon.org/latest/cdragon/arena/en_us.json";

// Extract unique augment IDs and their icon paths from test data
async function getAugmentData(): Promise<Map<number, { iconSmall: string; iconLarge: string; apiName: string }>> {
  const testDataDir = join(__dirname, "../src/html/arena/testdata");
  const files = await readdir(testDataDir);
  const augmentMap = new Map<number, { iconSmall: string; iconLarge: string; apiName: string }>();

  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    const content = await readFile(join(testDataDir, file), "utf-8");
    const data = JSON.parse(content);

    // Extract augments from all players
    const extractAugments = (obj: unknown): void => {
      if (typeof obj !== "object" || obj === null) return;
      if (Array.isArray(obj)) {
        obj.forEach(extractAugments);
        return;
      }
      if ("augments" in obj && Array.isArray(obj.augments)) {
        for (const augment of obj.augments) {
          if (
            typeof augment === "object" &&
            augment !== null &&
            "id" in augment &&
            "iconSmall" in augment &&
            "iconLarge" in augment &&
            "apiName" in augment &&
            typeof augment.id === "number" &&
            typeof augment.iconSmall === "string" &&
            typeof augment.iconLarge === "string" &&
            typeof augment.apiName === "string"
          ) {
            if (!augmentMap.has(augment.id)) {
              augmentMap.set(augment.id, {
                iconSmall: augment.iconSmall,
                iconLarge: augment.iconLarge,
                apiName: augment.apiName,
              });
            }
          }
        }
      }
      for (const value of Object.values(obj)) {
        extractAugments(value);
      }
    };

    extractAugments(data);
  }

  return augmentMap;
}

// Fetch arena JSON to get all augment data
async function getArenaData(): Promise<{ augments: Array<{ id: number; apiName: string; iconSmall: string; iconLarge: string }> }> {
  const response = await fetch(ARENA_JSON_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch arena data: ${response.status}`);
  }
  const data = await response.json() as { augments?: unknown[] };
  return {
    augments: (data.augments || []).map((a: unknown) => {
      if (
        typeof a === "object" &&
        a !== null &&
        "id" in a &&
        "apiName" in a &&
        "iconSmall" in a &&
        "iconLarge" in a
      ) {
        return {
          id: (a as { id: unknown }).id as number,
          apiName: (a as { apiName: unknown }).apiName as string,
          iconSmall: (a as { iconSmall: unknown }).iconSmall as string,
          iconLarge: (a as { iconLarge: unknown }).iconLarge as string,
        };
      }
      throw new Error("Invalid augment structure");
    }),
  };
}

// Download an icon
async function downloadIcon(iconPath: string, filename: string): Promise<void> {
  const url = `https://raw.communitydragon.org/latest/game/${iconPath}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download icon ${filename}: ${response.status}`);
  }
  const buffer = await response.arrayBuffer();
  const filepath = join(ICONS_DIR, filename);
  await writeFile(filepath, Buffer.from(buffer));
  console.log(`Downloaded: ${filename}`);
}

async function main() {
  console.log("Fetching arena data...");
  const arenaData = await getArenaData();
  console.log(`Found ${arenaData.augments.length} augments in arena data`);

  console.log("\nExtracting augment data from test data...");
  const testAugmentMap = await getAugmentData();
  console.log(`Found ${testAugmentMap.size} unique augments in test data`);

  // Create icons directory
  await mkdir(ICONS_DIR, { recursive: true });

  console.log("\nDownloading augment icons...");
  let downloaded = 0;
  let failed = 0;
  const failedAugments: number[] = [];

  // Build mapping as we download
  const augmentIdToIconMap: Record<number, string> = {};

  // Use arena data as the source of truth, but also check test data
  const allAugments = new Map<number, { iconSmall: string; apiName: string }>();

  // Add augments from arena data
  for (const augment of arenaData.augments) {
    allAugments.set(augment.id, {
      iconSmall: augment.iconSmall,
      apiName: augment.apiName,
    });
  }

  // Add augments from test data (in case some are missing from arena data)
  for (const [id, data] of testAugmentMap) {
    if (!allAugments.has(id)) {
      allAugments.set(id, {
        iconSmall: data.iconSmall,
        apiName: data.apiName,
      });
    }
  }

  console.log(`\nTotal unique augments to download: ${allAugments.size}`);

  for (const [augmentId, data] of allAugments) {
    try {
      // Extract filename from iconSmall path (e.g., "assets/ux/cherry/augments/icons/name_small.png" -> "name_small.png")
      const iconFilename = data.iconSmall.split("/").pop();
      if (!iconFilename) {
        console.warn(`Could not extract filename from icon path for augment ${augmentId}`);
        failed++;
        failedAugments.push(augmentId);
        continue;
      }

      await downloadIcon(data.iconSmall, iconFilename);
      augmentIdToIconMap[augmentId] = iconFilename;
      downloaded++;
    } catch (error) {
      console.error(`Failed to download icon for augment ${augmentId}:`, error);
      failed++;
      failedAugments.push(augmentId);
    }
  }

  // Write mapping file
  const mappingContent = `/**
 * Mapping from augment IDs to their icon filenames.
 * Auto-generated by download script.
 */

export const augmentIconMap: Record<number, string> = ${JSON.stringify(augmentIdToIconMap, null, 2)};

export function getAugmentIconFilename(augmentId: number): string | null {
  return augmentIconMap[augmentId] ?? null;
}
`;
  const mappingPath = join(__dirname, "../src/assets/augment-icons/augment-id-to-icon-map.ts");
  await writeFile(mappingPath, mappingContent);
  console.log(`\nWrote mapping file: ${mappingPath}`);

  console.log(`\nDone! Downloaded: ${downloaded}, Failed: ${failed}`);
  if (failedAugments.length > 0) {
    console.log("Failed augment IDs:", failedAugments);
  }
}

main().catch(console.error);
