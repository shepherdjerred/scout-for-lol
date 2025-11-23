// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  server: {
    port: 4321,
  },
  vite: {
    assetsInclude: ["**/*.txt"],
  },
});
