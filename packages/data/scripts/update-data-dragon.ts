#!/usr/bin/env bun
import { z } from "zod";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { first } from "remeda";

const ASSETS_DIR = join(import.meta.dir, "..", "src", "data-dragon", "assets");
const IMG_DIR = join(ASSETS_DIR, "img");
const BASE_URL = "https://ddragon.leagueoflegends.com";
const COMMUNITY_DRAGON_URL = "https://raw.communitydragon.org/latest/game";

// Schemas for validation
const SummonerSchema = z.object({
  type: z.string(),
  version: z.string(),
  data: z.record(
    z.string(),
    z.object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      tooltip: z.string(),
      maxrank: z.number(),
      cooldown: z.array(z.number()),
      cooldownBurn: z.string(),
      cost: z.array(z.number()),
      costBurn: z.string(),
      datavalues: z.object({}),
      effect: z.array(z.union([z.null(), z.array(z.number())])),
      effectBurn: z.array(z.union([z.null(), z.string()])),
      vars: z.array(z.unknown()),
      key: z.string(),
      summonerLevel: z.number(),
      modes: z.array(z.string()),
      costType: z.string(),
      maxammo: z.string(),
      range: z.array(z.number()),
      rangeBurn: z.string(),
      image: z.object({
        full: z.string(),
        sprite: z.string(),
        group: z.string(),
        x: z.number(),
        y: z.number(),
        w: z.number(),
        h: z.number(),
      }),
      resource: z.string(),
    }),
  ),
});

const ItemSchema = z.object({
  data: z.record(
    z.string(),
    z.object({
      name: z.string(),
      description: z.string(),
      plaintext: z.string().optional(),
      stats: z.record(z.string(), z.number()).optional(),
    }),
  ),
});

const RuneTreeSchema = z.array(
  z.object({
    id: z.number(),
    key: z.string(),
    icon: z.string(),
    name: z.string(),
    slots: z.array(
      z.object({
        runes: z.array(
          z.object({
            id: z.number(),
            key: z.string(),
            icon: z.string(),
            name: z.string(),
            shortDesc: z.string(),
            longDesc: z.string(),
          }),
        ),
      }),
    ),
  }),
);

async function getLatestVersion(): Promise<string> {
  console.log("Fetching latest version...");
  const response = await fetch(`${BASE_URL}/api/versions.json`);
  const versions = z.array(z.string()).parse(await response.json());
  const latestVersion = first(versions);
  if (!latestVersion) {
    throw new Error("No versions available");
  }
  return latestVersion;
}

async function downloadAsset(
  version: string,
  filename: string,
  schema: z.ZodType,
): Promise<unknown> {
  const url = `${BASE_URL}/cdn/${version}/data/en_US/${filename}`;
  console.log(`Downloading ${filename} from ${url}...`);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${filename}: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  // Validate with schema
  console.log(`Validating ${filename}...`);
  const validated = schema.parse(data);

  return validated;
}

async function downloadImage(url: string, outputPath: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image ${url}: ${response.status}`);
  }
  const buffer = await response.arrayBuffer();
  await writeFile(outputPath, Buffer.from(buffer));
}

async function downloadImagesInBatches(
  items: Array<{ url: string; path: string; name: string }>,
  batchSize = 10,
): Promise<void> {
  let completed = 0;
  const total = items.length;

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (item) => {
        try {
          await downloadImage(item.url, item.path);
          completed++;
          if (completed % 20 === 0 || completed === total) {
            console.log(`  Downloaded ${completed}/${total} images...`);
          }
        } catch (error) {
          console.warn(`  ⚠ Failed to download ${item.name}: ${error}`);
        }
      }),
    );
  }
}

async function main() {
  try {
    // Get version from command line or fetch latest
    const version = process.argv[2] || (await getLatestVersion());
    console.log(`\nUsing Data Dragon version: ${version}\n`);

    // Ensure directories exist
    await mkdir(ASSETS_DIR, { recursive: true });
    await mkdir(join(IMG_DIR, "champion"), { recursive: true });
    await mkdir(join(IMG_DIR, "item"), { recursive: true });
    await mkdir(join(IMG_DIR, "spell"), { recursive: true });
    await mkdir(join(IMG_DIR, "rune"), { recursive: true });
    await mkdir(join(IMG_DIR, "augment"), { recursive: true });
    await mkdir(join(ASSETS_DIR, "champion"), { recursive: true });

    // Download and validate each asset
    const summoner = await downloadAsset(version, "summoner.json", SummonerSchema);
    const items = await downloadAsset(version, "item.json", ItemSchema);
    const runes = await downloadAsset(version, "runesReforged.json", RuneTreeSchema);

    // Write JSON assets to disk
    console.log("\nWriting JSON assets to disk...");

    await writeFile(
      join(ASSETS_DIR, "summoner.json"),
      JSON.stringify(summoner, null, 2),
      "utf-8",
    );
    console.log("✓ Written summoner.json");

    await writeFile(
      join(ASSETS_DIR, "item.json"),
      JSON.stringify(items, null, 2),
      "utf-8",
    );
    console.log("✓ Written item.json");

    await writeFile(
      join(ASSETS_DIR, "runesReforged.json"),
      JSON.stringify(runes, null, 2),
      "utf-8",
    );
    console.log("✓ Written runesReforged.json");

    // Write version metadata
    await writeFile(
      join(ASSETS_DIR, "version.json"),
      JSON.stringify({ version }, null, 2),
      "utf-8",
    );
    console.log("✓ Written version.json");

    // Download champion list to get all champion names
    console.log("\nFetching champion list...");
    const championListUrl = `${BASE_URL}/cdn/${version}/data/en_US/champion.json`;
    const championListResponse = await fetch(championListUrl);
    const championListData = await championListResponse.json();
    const championNames = Object.keys(championListData.data);
    console.log(`Found ${championNames.length} champions`);

    // Download summoner spell images
    console.log("\nDownloading summoner spell images...");
    const spellImages = Object.entries(summoner.data).map(([spellName, spell]: [string, any]) => ({
      url: `${BASE_URL}/cdn/${version}/img/spell/${spell.image.full}`,
      path: join(IMG_DIR, "spell", spell.image.full),
      name: spellName,
    }));
    await downloadImagesInBatches(spellImages, 5);
    console.log(`✓ Downloaded ${spellImages.length} summoner spell images`);

    // Download item images
    console.log("\nDownloading item images...");
    const itemImages = Object.entries(items.data).map(([itemId, _]: [string, any]) => ({
      url: `${BASE_URL}/cdn/${version}/img/item/${itemId}.png`,
      path: join(IMG_DIR, "item", `${itemId}.png`),
      name: itemId,
    }));
    await downloadImagesInBatches(itemImages, 20);
    console.log(`✓ Downloaded ${itemImages.length} item images`);

    // Download champion portraits
    console.log("\nDownloading champion portraits...");
    const championImages = championNames.map((championName) => ({
      url: `${BASE_URL}/cdn/${version}/img/champion/${championName}.png`,
      path: join(IMG_DIR, "champion", `${championName}.png`),
      name: championName,
    }));
    await downloadImagesInBatches(championImages, 20);
    console.log(`✓ Downloaded ${championImages.length} champion images`);

    // Download individual champion data files (for abilities/passives)
    console.log("\nDownloading individual champion data files...");
    let championDataCount = 0;
    for (const championName of championNames) {
      try {
        const url = `${BASE_URL}/cdn/${version}/data/en_US/champion/${championName}.json`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          await writeFile(
            join(ASSETS_DIR, "champion", `${championName}.json`),
            JSON.stringify(data, null, 2),
            "utf-8",
          );
          championDataCount++;
          if (championDataCount % 20 === 0) {
            console.log(`  Downloaded ${championDataCount}/${championNames.length} champion data files...`);
          }
        }
      } catch (error) {
        console.warn(`  ⚠ Failed to download champion data for ${championName}: ${error}`);
      }
    }
    console.log(`✓ Downloaded ${championDataCount} champion data files`);

    // Download rune icons
    console.log("\nDownloading rune icons...");
    const runeImages: Array<{ url: string; path: string; name: string }> = [];
    for (const tree of runes) {
      // Add tree icon
      runeImages.push({
        url: `https://ddragon.leagueoflegends.com/cdn/img/${tree.icon}`,
        path: join(IMG_DIR, "rune", tree.icon.split("/").pop() || `tree_${tree.id}.png`),
        name: tree.name,
      });

      // Add all rune icons in the tree
      for (const slot of tree.slots) {
        for (const rune of slot.runes) {
          runeImages.push({
            url: `https://ddragon.leagueoflegends.com/cdn/img/${rune.icon}`,
            path: join(IMG_DIR, "rune", rune.icon.split("/").pop() || `rune_${rune.id}.png`),
            name: rune.name,
          });
        }
      }
    }
    await downloadImagesInBatches(runeImages, 20);
    console.log(`✓ Downloaded ${runeImages.length} rune images`);

    // Download augment icons from CommunityDragon
    console.log("\nDownloading augment icons from CommunityDragon...");
    console.log("Note: Downloading common augments. Full augment set depends on game data.");

    // We'll collect augments from arena test data
    const augmentIconPaths = new Set<string>();
    try {
      const testDataDir = join(import.meta.dir, "..", "..", "report", "src", "html", "arena", "testdata");
      const testFiles = ["1.json", "2.json"];

      for (const file of testFiles) {
        try {
          const testData = JSON.parse(await Bun.file(join(testDataDir, file)).text());
          // Extract augment icons from test data
          if (testData.teams && Array.isArray(testData.teams)) {
            for (const team of testData.teams) {
              if (team.players && Array.isArray(team.players)) {
                for (const player of team.players) {
                  if (player.augments && Array.isArray(player.augments)) {
                    for (const augment of player.augments) {
                      if (augment.iconLarge) {
                        augmentIconPaths.add(augment.iconLarge);
                      }
                      if (augment.iconSmall) {
                        augmentIconPaths.add(augment.iconSmall);
                      }
                    }
                  }
                }
              }
            }
          }
        } catch (error) {
          console.warn(`  ⚠ Could not read test data from ${file}: ${error}`);
        }
      }
    } catch (error) {
      console.warn(`  ⚠ Could not find arena test data: ${error}`);
    }

    const augmentImages = Array.from(augmentIconPaths).map((iconPath) => {
      const filename = iconPath.split("/").pop() || "unknown.png";
      return {
        url: `${COMMUNITY_DRAGON_URL}/${iconPath}`,
        path: join(IMG_DIR, "augment", filename),
        name: filename,
      };
    });

    if (augmentImages.length > 0) {
      await downloadImagesInBatches(augmentImages, 10);
      console.log(`✓ Downloaded ${augmentImages.length} augment images`);
    } else {
      console.log("  No augment icons found in test data");
    }

    const totalImages = spellImages.length + itemImages.length + championImages.length + runeImages.length + augmentImages.length;
    console.log(`\n✅ Successfully updated Data Dragon assets to version ${version}`);
    console.log(`\nAssets written to: ${ASSETS_DIR}`);
    console.log(`Total images downloaded: ${totalImages}`);
    console.log(`  - ${spellImages.length} summoner spell images`);
    console.log(`  - ${itemImages.length} item images`);
    console.log(`  - ${championImages.length} champion portrait images`);
    console.log(`  - ${runeImages.length} rune images`);
    console.log(`  - ${augmentImages.length} augment images`);
    console.log(`  - ${championDataCount} champion data files (abilities/passives)`);
  } catch (error) {
    console.error("\n❌ Error updating Data Dragon assets:");
    console.error(error);
    process.exit(1);
  }
}

main();
