// @ts-check
import { defineConfig } from "astro/config";
import { resolve } from "path";
import { fileURLToPath } from "url";

import react from "@astrojs/react";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  vite: {
    optimizeDeps: {
      // Don't pre-bundle these native modules - they're only used server-side
      exclude: ["@resvg/resvg-js"],
    },
    resolve: {
      alias: {
        // Replace resvg with a stub when importing in browser
        "@resvg/resvg-js": resolve(__dirname, "src/resvg-stub.ts"),
        // Replace satori with a stub when importing in browser
        satori: resolve(__dirname, "src/satori-stub.ts"),
        // Replace Node.js built-ins with empty modules for browser
        assert: resolve(__dirname, "src/assert-stub.ts"),
      },
    },
  },
});
