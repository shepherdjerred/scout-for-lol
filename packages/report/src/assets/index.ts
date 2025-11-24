import type { Font } from "satori";

const fontPath = "fonts";

// https://brand.riotgames.com/en-us/league-of-legends/typography
export const font = {
  title: "Beaufort for LOL",
  body: "Spiegel",
};

type FontConfig = {
  weight: Font["weight"];
  variants: {
    style: "normal" | "italic";
    filename: string;
  }[];
};

/**
 * Generate font definitions from weight/style configurations
 */
function generateFonts(
  fontName: string,
  fontFamily: string,
  configs: FontConfig[],
): (Omit<Font, "data"> & { src: string })[] {
  const fonts: (Omit<Font, "data"> & { src: string })[] = [];

  for (const config of configs) {
    for (const variant of config.variants) {
      fonts.push({
        name: fontName,
        src: `${fontPath}/${fontFamily}/${variant.filename}`,
        // @ts-expect-error - Weight type from satori is overly restrictive, but these values are valid
        weight: config.weight,
        style: variant.style,
      } as Omit<Font, "data"> & { src: string });
    }
  }

  return fonts;
}

const beaufortConfigs: FontConfig[] = [
  {
    weight: 300 as Font["weight"],
    variants: [
      { style: "normal", filename: "BeaufortforLOL-Light.ttf" },
      { style: "italic", filename: "BeaufortforLOL-LightItalic.ttf" },
    ],
  },
  {
    weight: 400 as Font["weight"],
    variants: [
      { style: "normal", filename: "BeaufortforLOL-Regular.ttf" },
      { style: "italic", filename: "BeaufortforLOL-Italic.ttf" },
    ],
  },
  {
    weight: 500 as Font["weight"],
    variants: [
      { style: "normal", filename: "BeaufortforLOL-Medium.ttf" },
      { style: "italic", filename: "BeaufortforLOL-MediumItalic.ttf" },
    ],
  },
  {
    weight: 700 as Font["weight"],
    variants: [
      { style: "normal", filename: "BeaufortforLOL-Bold.ttf" },
      { style: "italic", filename: "BeaufortforLOL-BoldItalic.ttf" },
    ],
  },
  {
    weight: 800 as Font["weight"],
    variants: [
      { style: "normal", filename: "BeaufortforLOL-Heavy.ttf" },
      { style: "italic", filename: "BeaufortforLOL-HeavyItalic.ttf" },
    ],
  },
];

const spiegelConfigs: FontConfig[] = [
  {
    weight: 400 as Font["weight"],
    variants: [
      { style: "normal", filename: "Spiegel_TT_Regular.ttf" },
      { style: "italic", filename: "Spiegel_TT_Regular_Italic.ttf" },
    ],
  },
  {
    weight: 500 as Font["weight"],
    variants: [
      { style: "normal", filename: "Spiegel_TT_SemiBold.ttf" },
      { style: "italic", filename: "Spiegel_TT_SemiBold_Italic.ttf" },
    ],
  },
  {
    weight: 700 as Font["weight"],
    variants: [
      { style: "normal", filename: "Spiegel_TT_Bold.ttf" },
      { style: "italic", filename: "Spiegel_TT_Bold_Italic.ttf" },
    ],
  },
];

const baseBeaufortFonts = generateFonts(font.title, "BeaufortForLoL-TTF", beaufortConfigs);
const baseSpiegelFonts = generateFonts(font.body, "Spiegel-TTF", spiegelConfigs);

/**
 * These fonts are used by satori.
 * They're used server-side, so we need Bun APIs to load them.
 */
export const bunBeaufortFonts: () => Promise<Font[]> = () =>
  Promise.all(
    baseBeaufortFonts.map(
      async (font): Promise<Font> => ({
        ...font,
        data: await Bun.file(new URL(font.src, import.meta.url)).arrayBuffer(),
      }),
    ),
  );

export const bunSpiegelFonts: () => Promise<Font[]> = () =>
  Promise.all(
    baseSpiegelFonts.map(
      async (font): Promise<Font> => ({
        ...font,
        data: await Bun.file(new URL(font.src, import.meta.url)).arrayBuffer(),
      }),
    ),
  );
