import { latestVersion } from "./version.ts";

function getAbsolutePath(relativePath: string): string {
  return new URL(relativePath, import.meta.url).pathname;
}

async function validateImageExists(absolutePath: string, description: string): Promise<void> {
  const file = Bun.file(absolutePath);
  const exists = await file.exists();

  if (!exists) {
    throw new Error(
      `${description} not found at ${absolutePath}. Run 'bun run update-data-dragon' in packages/data to cache latest assets.`,
    );
  }
}

// Validation functions (async, for preloading/checking)
export async function validateChampionImage(championName: string): Promise<void> {
  const relativePath = `./assets/img/champion/${championName}.png`;
  const absolutePath = getAbsolutePath(relativePath);
  await validateImageExists(absolutePath, `Champion image for ${championName}`);
}

export async function validateItemImage(itemId: number): Promise<void> {
  const relativePath = `./assets/img/item/${itemId.toString()}.png`;
  const absolutePath = getAbsolutePath(relativePath);
  await validateImageExists(absolutePath, `Item image for item ${itemId.toString()}`);
}

export async function validateSpellImage(spellImageName: string): Promise<void> {
  const relativePath = `./assets/img/spell/${spellImageName}`;
  const absolutePath = getAbsolutePath(relativePath);
  await validateImageExists(absolutePath, `Summoner spell image ${spellImageName}`);
}

export async function validateRuneIcon(runeIconPath: string): Promise<void> {
  const filename = runeIconPath.split("/").pop() ?? "unknown.png";
  const relativePath = `./assets/img/rune/${filename}`;
  const absolutePath = getAbsolutePath(relativePath);
  await validateImageExists(absolutePath, `Rune image ${filename}`);
}

export async function validateAugmentIcon(augmentIconPath: string): Promise<void> {
  const filename = augmentIconPath.split("/").pop() ?? "unknown.png";
  const relativePath = `./assets/img/augment/${filename}`;
  const absolutePath = getAbsolutePath(relativePath);
  await validateImageExists(absolutePath, `Augment image ${filename}`);
}

// URL getters (synchronous, for use in components)
export function getChampionImageUrl(championName: string): string {
  return `https://ddragon.leagueoflegends.com/cdn/${latestVersion}/img/champion/${championName}.png`;
}

export function getItemImageUrl(itemId: number): string {
  return `https://ddragon.leagueoflegends.com/cdn/${latestVersion}/img/item/${itemId.toString()}.png`;
}

export function getSpellImageUrl(spellImageName: string): string {
  return `https://ddragon.leagueoflegends.com/cdn/${latestVersion}/img/spell/${spellImageName}`;
}

export function getRuneIconUrl(runeIconPath: string): string {
  return `https://ddragon.leagueoflegends.com/cdn/img/${runeIconPath}`;
}

export function getAugmentIconUrl(augmentIconPath: string): string {
  return `https://raw.communitydragon.org/latest/game/${augmentIconPath}`;
}
