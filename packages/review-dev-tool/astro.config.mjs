// @ts-check
import { defineConfig } from "astro/config";
import { resolve } from "path";
import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  output: "static", // Enable fully static site generation (no server/backend needed)
  server: {
    port: 4321,
  },
  vite: {
    assetsInclude: ["**/*.txt"],
    optimizeDeps: {
      // Don't pre-bundle these native modules - they're only used server-side
      exclude: ["@resvg/resvg-js", "satori"],
    },
    resolve: {
      alias: {
        // Replace resvg with a stub when importing in browser
        "@resvg/resvg-js": resolve(import.meta.dirname, "src/resvg-stub.ts"),
        // Replace satori with a stub when importing in browser
        satori: resolve(import.meta.dirname, "src/satori-stub.ts"),
        // Replace Node.js built-ins with empty modules for browser
        assert: resolve(import.meta.dirname, "src/assert-stub.ts"),
      },
    },
  },
});
