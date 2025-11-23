import { z } from "zod";
import { latestVersion } from "./version.js";

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

// Cache champion data to avoid repeated fetches
const championCache = new Map<
  string,
  {
    spells: Array<{ name: string; description: string; tooltip: string }>;
    passive: { name: string; description: string };
  }
>();

// Note: Champion data is fetched on-demand per champion
export async function getChampionInfo(championName: string): Promise<
  | {
      spells: Array<{ name: string; description: string; tooltip: string }>;
      passive: { name: string; description: string };
    }
  | undefined
> {
  // Check cache first
  if (championCache.has(championName)) {
    return championCache.get(championName);
  }

  try {
    const response = await fetch(
      `https://ddragon.leagueoflegends.com/cdn/${latestVersion}/data/en_US/champion/${championName}.json`,
    );

    if (!response.ok) {
      return undefined;
    }

    const data = ChampionDataSchema.parse(await response.json());
    const championData = data.data[championName];

    if (!championData) return undefined;

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
