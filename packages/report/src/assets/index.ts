import { Font } from "satori";

const fontPath = "fonts";

export const font = {
  title: "Beaufort for LOL",
  body: "Spiegel",
};

// https://brand.riotgames.com/en-us/league-of-legends/typography
export const fonts: Font[] = [
  {
    name: font.title,
    data: await Bun.file(
      new URL(
        `${fontPath}/BeaufortForLoL-TTF/BeaufortforLOL-Light.ttf`,
        import.meta.url,
      ),
    ).arrayBuffer(),
    weight: 300,
    style: "normal",
  },
  {
    name: font.title,
    data: await Bun.file(
      new URL(
        `${fontPath}/BeaufortForLoL-TTF/BeaufortforLOL-LightItalic.ttf`,
        import.meta.url,
      ),
    ).arrayBuffer(),
    weight: 300,
    style: "italic",
  },
  {
    name: font.title,
    data: await Bun.file(
      new URL(
        `${fontPath}/BeaufortForLoL-TTF/BeaufortforLOL-Regular.ttf`,
        import.meta.url,
      ),
    ).arrayBuffer(),
    weight: 400,
    style: "normal",
  },
  {
    name: font.title,
    data: await Bun.file(
      new URL(
        `${fontPath}/BeaufortForLoL-TTF/BeaufortforLOL-Italic.ttf`,
        import.meta.url,
      ),
    ).arrayBuffer(),
    weight: 400,
    style: "italic",
  },
  {
    name: font.title,
    data: await Bun.file(
      new URL(
        `${fontPath}/BeaufortForLoL-TTF/BeaufortforLOL-Medium.ttf`,
        import.meta.url,
      ),
    ).arrayBuffer(),
    weight: 500,
    style: "normal",
  },
  {
    name: font.title,
    data: await Bun.file(
      new URL(
        `${fontPath}/BeaufortForLoL-TTF/BeaufortforLOL-MediumItalic.ttf`,
        import.meta.url,
      ),
    ).arrayBuffer(),
    weight: 500,
    style: "italic",
  },
  {
    name: font.title,
    data: await Bun.file(
      new URL(
        `${fontPath}/BeaufortForLoL-TTF/BeaufortforLOL-Bold.ttf`,
        import.meta.url,
      ),
    ).arrayBuffer(),
    weight: 700,
    style: "normal",
  },
  {
    name: font.title,
    data: await Bun.file(
      new URL(
        `${fontPath}/BeaufortForLoL-TTF/BeaufortforLOL-BoldItalic.ttf`,
        import.meta.url,
      ),
    ).arrayBuffer(),
    weight: 700,
    style: "italic",
  },
  {
    name: font.title,
    data: await Bun.file(
      new URL(
        `${fontPath}/BeaufortForLoL-TTF/BeaufortforLOL-Heavy.ttf`,
        import.meta.url,
      ),
    ).arrayBuffer(),
    weight: 800,
    style: "normal",
  },
  {
    name: font.title,
    data: await Bun.file(
      new URL(
        `${fontPath}/BeaufortForLoL-TTF/BeaufortforLOL-HeavyItalic.ttf`,
        import.meta.url,
      ),
    ).arrayBuffer(),
    weight: 800,
    style: "italic",
  },
  {
    name: font.body,
    data: await Bun.file(
      new URL(
        `${fontPath}/Spiegel-TTF/Spiegel_TT_Regular.ttf`,
        import.meta.url,
      ),
    ).arrayBuffer(),
    weight: 400,
    style: "normal",
  },
  {
    name: font.body,
    data: await Bun.file(
      new URL(
        `${fontPath}/Spiegel-TTF/Spiegel_TT_Regular_Italic.ttf`,
        import.meta.url,
      ),
    ).arrayBuffer(),
    weight: 400,
    style: "italic",
  },
  {
    name: font.body,
    data: await Bun.file(
      new URL(
        `${fontPath}/Spiegel-TTF/Spiegel_TT_SemiBold.ttf`,
        import.meta.url,
      ),
    ).arrayBuffer(),
    weight: 500,
    style: "normal",
  },
  {
    name: font.body,
    data: await Bun.file(
      new URL(
        `${fontPath}/Spiegel-TTF/Spiegel_TT_SemiBold_Italic.ttf`,
        import.meta.url,
      ),
    ).arrayBuffer(),
    weight: 500,
    style: "italic",
  },
  {
    name: font.body,
    data: await Bun.file(
      new URL(
        `${fontPath}/Spiegel-TTF/Spiegel_TT_Bold.ttf`,
        import.meta.url,
      ),
    ).arrayBuffer(),
    weight: 700,
    style: "normal",
  },
  {
    name: font.body,
    data: await Bun.file(
      new URL(
        `${fontPath}/Spiegel-TTF/Spiegel_TT_Bold_Italic.ttf`,
        import.meta.url,
      ),
    ).arrayBuffer(),
    weight: 700,
    style: "italic",
  },
];
