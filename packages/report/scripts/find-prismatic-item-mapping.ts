#!/usr/bin/env bun

/**
 * Script to investigate how to map prismatic item IDs to icon names.
 * Prismatic items have IDs starting with 44 (like 443054, 447122).
 */

const ARENA_JSON_URL = "https://raw.communitydragon.org/latest/cdragon/arena/en_us.json";
const CDRAGON_BASE = "https://raw.communitydragon.org/latest/game/assets/ux/cherry/augments/icons";

// Sample prismatic item IDs from test data
const SAMPLE_ITEM_IDS = [443054, 447122, 443058, 443083, 443090, 444636, 447104];

async function main() {
  console.log("Fetching arena data...");
  const response = await fetch(ARENA_JSON_URL);
  const data = await response.json();
  
  console.log("\nChecking if items exist in arena data...");
  if ("items" in data) {
    console.log("Found items key!");
    console.log("Items count:", Array.isArray(data.items) ? data.items.length : "not an array");
  } else {
    console.log("No items key found - only augments available");
  }
  
  console.log("\nChecking augment IDs vs item IDs...");
  const augmentIds = (data.augments || []).map((a: { id: number }) => a.id);
  console.log("Augment IDs range:", Math.min(...augmentIds), "to", Math.max(...augmentIds));
  console.log("Sample item IDs:", SAMPLE_ITEM_IDS);
  
  console.log("\nTrying to find icons for sample item IDs...");
  for (const itemId of SAMPLE_ITEM_IDS) {
    const patterns = [
      `${itemId}_small.png`,
      `item_${itemId}_small.png`,
      `${itemId}.png`,
    ];
    
    for (const pattern of patterns) {
      const url = `${CDRAGON_BASE}/${pattern}`;
      const headResponse = await fetch(url, { method: "HEAD" });
      if (headResponse.ok) {
        console.log(`✓ Found: ${pattern} for item ${itemId}`);
        break;
      }
    }
  }
  
  console.log("\nNote: Prismatic items might need to be looked up in item data, not augment data.");
  console.log("They might use Data Dragon URLs or have a different mapping.");
}

main().catch(console.error);
