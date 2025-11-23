// @ts-check
import { defineConfig } from "astro/config";
import { resolve } from "path";
import { fileURLToPath } from "url";
import react from "@astrojs/react";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  server: {
    port: 4321,
  },
  vite: {
    assetsInclude: ["**/*.txt"],
    optimizeDeps: {
      // Don't pre-bundle these native modules - they're only used server-side
      exclude: ["@resvg/resvg-js"],
    },
    resolve: {
      alias: {
        // Replace resvg with a stub when importing in browser
        "@resvg/resvg-js": resolve(__dirname, "src/resvg-stub.ts"),
      },
    },
  },
});
