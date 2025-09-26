// @ts-check
import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import {
  baseBeaufortFonts,
  font,
  baseSpiegelFonts,
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
        variants: baseBeaufortFonts.map((font) => {
          return {
            src: [font.src],
            weight: font.weight,
            style: font.style,
          };
        }),
      },
      {
        provider: "local",
        name: font.body,
        cssVariable: "--font-spiegel",
        variants: baseSpiegelFonts.map((font) => {
          return {
            src: [font.src],
            weight: font.weight,
            style: font.style,
          };
        }),
      },
    ],
  },
});
