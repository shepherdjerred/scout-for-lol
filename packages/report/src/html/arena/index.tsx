import satori from "satori";
import { type ArenaMatch, validateChampionImage, validateItemImage, validateAugmentIcon } from "@scout-for-lol/data";
import { ArenaReport } from "@scout-for-lol/report/html/arena/report.tsx";
import { bunBeaufortFonts, bunSpiegelFonts } from "@scout-for-lol/report/assets/index.ts";
import { svgToPng } from "@scout-for-lol/report/html/index.tsx";

export async function arenaMatchToSvg(match: ArenaMatch) {
  // Validate all images exist before rendering
  const validationPromises: Promise<void>[] = [];

  // Validate champion images
  for (const team of match.teams) {
    for (const player of team.players) {
      validationPromises.push(validateChampionImage(player.championName));
    }
  }

  // Validate item images
  for (const team of match.teams) {
    for (const player of team.players) {
      for (const item of player.items) {
        if (item > 0) {
          validationPromises.push(validateItemImage(item));
        }
      }
    }
  }

  // Validate augment images
  for (const team of match.teams) {
    for (const player of team.players) {
      for (const augment of player.augments) {
        if (augment.type === "full" && augment.iconLarge) {
          validationPromises.push(validateAugmentIcon(augment.iconLarge));
        }
      }
    }
  }

  // Throw error if any image is missing
  await Promise.all(validationPromises);

  const fonts = [...(await bunBeaufortFonts()), ...(await bunSpiegelFonts())];
  const svg = await satori(<ArenaReport match={match} />, {
    width: 1600,
    height: 6000,
    fonts,
  });
  return svg;
}

export async function arenaMatchToImage(match: ArenaMatch) {
  const svg = await arenaMatchToSvg(match);
  const png = await svgToPng(svg);
  return png;
}
