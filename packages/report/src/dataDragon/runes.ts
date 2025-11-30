import { runes as importedRunes, getRuneIconUrl as getRuneIconUrlFromData } from "@scout-for-lol/data";

// Cache rune icons at module load time
const runeIconCache = new Map<string, string>();

// Pre-load all rune icons
if (typeof Bun !== "undefined") {
  const allRuneIcons: string[] = [];
  for (const tree of importedRunes) {
    allRuneIcons.push(tree.icon);
    for (const slot of tree.slots) {
      for (const rune of slot.runes) {
        allRuneIcons.push(rune.icon);
      }
    }
  }

  for (const iconPath of allRuneIcons) {
    const url = getRuneIconUrlFromData(iconPath);
    runeIconCache.set(iconPath, url);
  }
}

export function getRuneIconUrl(iconPath: string): string {
  const cached = runeIconCache.get(iconPath);
  if (cached) {
    return cached;
  }
  throw new Error(`Rune icon ${iconPath} not found in cache. This should not happen.`);
}
