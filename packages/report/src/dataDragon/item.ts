import { z } from "zod";
import { latestVersion } from "./version.js";

const ItemSchema = z.object({
  data: z.record(
    z.string(),
    z.object({
      name: z.string(),
      description: z.string(), // Full HTML description with stats
      plaintext: z.string().optional(), // Short plain text description
      stats: z.record(z.string(), z.number()).optional(), // Item stats
    }),
  ),
});

export const items = ItemSchema.parse(
  await (await fetch(`https://ddragon.leagueoflegends.com/cdn/${latestVersion}/data/en_US/item.json`)).json(),
);

export function getItemInfo(itemId: number):
  | {
      name: string;
      description: string;
      plaintext?: string | undefined;
      stats?: Record<string, number> | undefined;
    }
  | undefined {
  const itemData = items.data[itemId.toString()];
  if (!itemData) return undefined;
  return {
    name: itemData.name,
    description: itemData.description, // Full tooltip
    plaintext: itemData.plaintext,
    stats: itemData.stats,
  };
}
