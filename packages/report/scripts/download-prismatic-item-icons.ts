#!/usr/bin/env bun

/**
 * Script to download prismatic item icons from Community Dragon
 * and store them locally in the repo.
 * 
 * Prismatic items use augment-style icons named by their API name.
 * We need to map item IDs to API names to get the correct icon filename.
 */

import { readdir, mkdir, writeFile, readFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { prismaticItemIconMap } from "../src/assets/prismatic-items/item-id-to-icon-map.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ICONS_DIR = join(__dirname, "../src/assets/prismatic-items");

// Base URL for Community Dragon icons
const CDRAGON_BASE = "https://raw.communitydragon.org/latest/game/assets/ux/cherry/augments/icons";
const ARENA_JSON_URL = "https://raw.communitydragon.org/latest/cdragon/arena/en_us.json";

// Extract unique prismatic item IDs from test data
async function getPrismaticItemIds(): Promise<number[]> {
  const testDataDir = join(__dirname, "../src/html/arena/testdata");
  const files = await readdir(testDataDir);
  const itemIds = new Set<number>();

  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    const content = await readFile(join(testDataDir, file), "utf-8");
    const data = JSON.parse(content);

    // Extract items from all players
    const extractItems = (obj: unknown): void => {
      if (typeof obj !== "object" || obj === null) return;
      if (Array.isArray(obj)) {
        obj.forEach(extractItems);
        return;
      }
      if ("items" in obj && Array.isArray(obj.items)) {
        for (const itemId of obj.items) {
          if (typeof itemId === "number" && itemId !== 0 && itemId.toString().startsWith("44")) {
            itemIds.add(itemId);
          }
        }
      }
      for (const value of Object.values(obj)) {
        extractItems(value);
      }
    };

    extractItems(data);
  }

  return Array.from(itemIds).sort((a, b) => a - b);
}

// Fetch arena JSON to get item/augment mappings
async function getArenaData(): Promise<{ augments: Array<{ id: number; apiName: string; iconSmall: string }> }> {
  const response = await fetch(ARENA_JSON_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch arena data: ${response.status}`);
  }
  const data = await response.json() as { augments?: unknown[] };
  return {
    augments: (data.augments || []).map((a: unknown) => {
      if (typeof a === "object" && a !== null && "id" in a && "apiName" in a && "iconSmall" in a) {
        return {
          id: (a as { id: unknown }).id as number,
          apiName: (a as { apiName: unknown }).apiName as string,
          iconSmall: (a as { iconSmall: unknown }).iconSmall as string,
        };
      }
      throw new Error("Invalid augment structure");
    }),
  };
}

// Convert API name to icon filename (e.g., "TransmutePrismatic" -> "transmuteprismatic_small.png")
function apiNameToIconFilename(apiName: string): string {
  return `${apiName.toLowerCase()}_small.png`;
}

// Look up item icon in arena data
// Items might be stored as augments with matching IDs, or we need to map them differently
async function findIconUrl(
  itemId: number,
  arenaData: { augments: Array<{ id: number; apiName: string; iconSmall: string }> },
): Promise<{ url: string; iconFilename: string } | null> {
  // First, check if we have a manual mapping
  const mappedIcon = prismaticItemIconMap[itemId];
  if (mappedIcon) {
    const url = `https://raw.communitydragon.org/latest/game/${mappedIcon}`;
    const response = await fetch(url, { method: "HEAD" });
    if (response.ok) {
      return { url, iconFilename: mappedIcon.split("/").pop() ?? mappedIcon };
    }
  }

  // Try to find item in augments array by ID
  const augment = arenaData.augments.find((a) => a.id === itemId);
  if (augment && augment.iconSmall) {
    // Extract filename from iconSmall path (e.g., "assets/ux/cherry/augments/icons/name_small.png" -> "name_small.png")
    const iconFilename = augment.iconSmall.split("/").pop();
    if (iconFilename) {
      const url = `https://raw.communitydragon.org/latest/game/${augment.iconSmall}`;
      return { url, iconFilename };
    }
  }

  // Try augment icon patterns (in case they're stored there)
  const augmentPatterns = [
    `${itemId}_small.png`,
    `item_${itemId}_small.png`,
  ];

  for (const pattern of augmentPatterns) {
    const url = `${CDRAGON_BASE}/${pattern}`;
    try {
      const response = await fetch(url, { method: "HEAD" });
      if (response.ok) {
        return { url, iconFilename: pattern };
      }
    } catch {
      // Continue to next pattern
    }
  }

  // Try Data Dragon item URL (prismatic items might use regular item icons)
  try {
    const versionsResponse = await fetch("https://ddragon.leagueoflegends.com/api/versions.json");
    const versions = await versionsResponse.json();
    const latestVersion = Array.isArray(versions) ? versions[0] : "latest";
    const ddragonUrl = `https://ddragon.leagueoflegends.com/cdn/${latestVersion}/img/item/${itemId}.png`;
    const response = await fetch(ddragonUrl, { method: "HEAD" });
    if (response.ok) {
      return { url: ddragonUrl, iconFilename: `${itemId}.png` };
    }
  } catch {
    // Continue
  }

  return null;
}

// Download an icon
async function downloadIcon(itemId: number, iconUrl: string, iconFilename: string): Promise<void> {
  const response = await fetch(iconUrl);
  if (!response.ok) {
    throw new Error(`Failed to download icon for item ${itemId}: ${response.status}`);
  }
  const buffer = await response.arrayBuffer();
  const filename = iconFilename || `${itemId}.png`;
  const filepath = join(ICONS_DIR, filename);
  await writeFile(filepath, Buffer.from(buffer));
  console.log(`Downloaded: ${filename} (item ${itemId})`);
}

async function main() {
  console.log("Fetching arena data...");
  const arenaData = await getArenaData();
  console.log("Arena data keys:", Object.keys(arenaData as Record<string, unknown>));

  console.log("\nExtracting prismatic item IDs from test data...");
  const itemIds = await getPrismaticItemIds();
  console.log(`Found ${itemIds.length} unique prismatic item IDs:`, itemIds);

  // Create icons directory
  await mkdir(ICONS_DIR, { recursive: true });

  console.log("\nFinding and downloading icons...");
  let downloaded = 0;
  let failed = 0;
  const failedItems: number[] = [];

  // Build mapping as we download
  const itemIdToIconMap: Record<number, string> = {};

  for (const itemId of itemIds) {
    const iconInfo = await findIconUrl(itemId, arenaData);
    if (iconInfo) {
      try {
        await downloadIcon(itemId, iconInfo.url, iconInfo.iconFilename);
        // Store mapping: extract just the filename part
        itemIdToIconMap[itemId] = iconInfo.iconFilename;
        downloaded++;
      } catch (error) {
        console.error(`Failed to download icon for item ${itemId}:`, error);
        failed++;
        failedItems.push(itemId);
      }
    } else {
      console.warn(`Could not find icon for item ${itemId}`);
      failed++;
      failedItems.push(itemId);
    }
  }

  // Write mapping file
  const mappingContent = `/**
 * Mapping from prismatic item IDs to their icon filenames.
 * Auto-generated by download script.
 */

export const prismaticItemIconMap: Record<number, string> = ${JSON.stringify(itemIdToIconMap, null, 2)};

export function getPrismaticItemIconFilename(itemId: number): string | null {
  return prismaticItemIconMap[itemId] ?? null;
}
`;
  const mappingPath = join(__dirname, "../src/assets/prismatic-items/item-id-to-icon-map.ts");
  await writeFile(mappingPath, mappingContent);
  console.log(`\nWrote mapping file: ${mappingPath}`);

  console.log(`\nDone! Downloaded: ${downloaded}, Failed: ${failed}`);
  if (failedItems.length > 0) {
    console.log("Failed item IDs:", failedItems);
  }
}

main().catch(console.error);
