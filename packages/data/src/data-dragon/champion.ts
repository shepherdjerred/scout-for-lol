import { z } from "zod";
import { join } from "node:path";

const ChampionSpellSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  tooltip: z.string(),
});

const ChampionDataSchema = z.object({
  data: z.record(
    z.string(),
    z.object({
      id: z.string(),
      name: z.string(),
      title: z.string(),
      spells: z.array(ChampionSpellSchema), // Q, W, E, R
      passive: z.object({
        name: z.string(),
        description: z.string(),
      }),
    }),
  ),
});

// Cache champion data to avoid repeated reads
const championCache = new Map<
  string,
  {
    spells: { name: string; description: string; tooltip: string }[];
    passive: { name: string; description: string };
  }
>();

/**
 * Get champion ability and passive information from cached local files
 * @param championName - Champion name (e.g., "Aatrox", "LeeSin")
 * @returns Champion spell and passive data, or undefined if not found
 */
export async function getChampionInfo(championName: string): Promise<
  | {
      spells: { name: string; description: string; tooltip: string }[];
      passive: { name: string; description: string };
    }
  | undefined
> {
  // Check cache first
  if (championCache.has(championName)) {
    return championCache.get(championName);
  }

  try {
    const championFilePath = join(import.meta.dir, "assets", "champion", `${championName}.json`);
    const fileContent = await Bun.file(championFilePath).text();
    const data = ChampionDataSchema.parse(JSON.parse(fileContent));
    const championData = data.data[championName];

    if (!championData) {
      return undefined;
    }

    const result = {
      spells: championData.spells.map((s) => ({
        name: s.name,
        description: s.description,
        tooltip: s.tooltip,
      })),
      passive: championData.passive,
    };

    // Cache the result
    championCache.set(championName, result);

    return result;
  } catch {
    return undefined;
  }
}
