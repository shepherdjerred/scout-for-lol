import { z } from "zod";
import { latestVersion } from "./version.js";

// Runes are organized by style (tree) with selections
const RuneSchema = z.array(
  z.object({
    id: z.number(),
    key: z.string(),
    name: z.string(),
    slots: z.array(
      z.object({
        runes: z.array(
          z.object({
            id: z.number(),
            key: z.string(),
            name: z.string(),
            shortDesc: z.string(),
            longDesc: z.string(),
          }),
        ),
      }),
    ),
  }),
);

export const runes = RuneSchema.parse(
  await (await fetch(`https://ddragon.leagueoflegends.com/cdn/${latestVersion}/data/en_US/runesReforged.json`)).json(),
);

export function getRuneInfo(runeId: number):
  | {
      name: string;
      shortDesc: string;
      longDesc: string;
    }
  | undefined {
  // Flatten and search through all runes
  for (const tree of runes) {
    for (const slot of tree.slots) {
      for (const rune of slot.runes) {
        if (rune.id === runeId) {
          return {
            name: rune.name,
            shortDesc: rune.shortDesc,
            longDesc: rune.longDesc,
          };
        }
      }
    }
  }
  return undefined;
}

export function getRuneTreeName(treeId: number): string | undefined {
  const tree = runes.find((t) => t.id === treeId);
  return tree?.name;
}
