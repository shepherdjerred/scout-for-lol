// @ts-check
import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import {
  beauforFonts,
  font,
  spiegelFonts,
} from "@scout-for-lol/report/src/assets";

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  experimental: {
    fonts: [
      {
        provider: "local",
        name: font.title,
        cssVariable: "--font-beaufort-for-lol",
        variants: beauforFonts.map((font) => {
          delete font.data;
          delete font.name;
          return font;
        }),
      },
      {
        provider: "local",
        name: font.body,
        cssVariable: "--font-spiegel",
        variants: spiegelFonts.map((font) => {
          delete font.data;
          delete font.name;
          return font;
        }),
      },
    ],
  },
});
