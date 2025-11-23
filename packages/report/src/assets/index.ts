import type { Font } from "satori";

const fontPath = "fonts";

// https://brand.riotgames.com/en-us/league-of-legends/typography
export const font = {
  title: "Beaufort for LOL",
  body: "Spiegel",
};

export const baseBeaufortFonts: (Omit<Font, "data"> & {
  src: string;
})[] = [
  {
    name: font.title,
    src: `${fontPath}/BeaufortForLoL-TTF/BeaufortforLOL-Light.ttf`,
    weight: 300,
    style: "normal",
  },
  {
    name: font.title,
    src: `${fontPath}/BeaufortForLoL-TTF/BeaufortforLOL-LightItalic.ttf`,
    weight: 300,
    style: "italic",
  },
  {
    name: font.title,
    src: `${fontPath}/BeaufortForLoL-TTF/BeaufortforLOL-Regular.ttf`,
    weight: 400,
    style: "normal",
  },
  {
    name: font.title,
    src: `${fontPath}/BeaufortForLoL-TTF/BeaufortforLOL-Italic.ttf`,
    weight: 400,
    style: "italic",
  },
  {
    name: font.title,
    src: `${fontPath}/BeaufortForLoL-TTF/BeaufortforLOL-Medium.ttf`,
    weight: 500,
    style: "normal",
  },
  {
    name: font.title,
    src: `${fontPath}/BeaufortForLoL-TTF/BeaufortforLOL-MediumItalic.ttf`,
    weight: 500,
    style: "italic",
  },
  {
    name: font.title,
    src: `${fontPath}/BeaufortForLoL-TTF/BeaufortforLOL-Bold.ttf`,
    weight: 700,
    style: "normal",
  },
  {
    name: font.title,
    src: `${fontPath}/BeaufortForLoL-TTF/BeaufortforLOL-BoldItalic.ttf`,
    weight: 700,
    style: "italic",
  },
  {
    name: font.title,
    src: `${fontPath}/BeaufortForLoL-TTF/BeaufortforLOL-Heavy.ttf`,
    weight: 800,
    style: "normal",
  },
  {
    name: font.title,
    src: `${fontPath}/BeaufortForLoL-TTF/BeaufortforLOL-HeavyItalic.ttf`,
    weight: 800,
    style: "italic",
  },
];

export const baseSpiegelFonts: (Omit<Font, "data"> & {
  src: string;
})[] = [
  {
    name: font.body,
    src: `${fontPath}/Spiegel-TTF/Spiegel_TT_Regular.ttf`,
    weight: 400,
    style: "normal",
  },
  {
    name: font.body,
    src: `${fontPath}/Spiegel-TTF/Spiegel_TT_Regular_Italic.ttf`,
    weight: 400,
    style: "italic",
  },
  {
    name: font.body,
    src: `${fontPath}/Spiegel-TTF/Spiegel_TT_SemiBold.ttf`,
    weight: 500,
    style: "normal",
  },
  {
    name: font.body,
    src: `${fontPath}/Spiegel-TTF/Spiegel_TT_SemiBold_Italic.ttf`,
    weight: 500,
    style: "italic",
  },
  {
    name: font.body,
    src: `${fontPath}/Spiegel-TTF/Spiegel_TT_Bold.ttf`,
    weight: 700,
    style: "normal",
  },
  {
    name: font.body,
    src: `${fontPath}/Spiegel-TTF/Spiegel_TT_Bold_Italic.ttf`,
    weight: 700,
    style: "italic",
  },
];

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
