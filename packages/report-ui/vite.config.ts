import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // Don't pre-bundle these native modules - they're only used server-side
    exclude: ["@resvg/resvg-js", "satori"],
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
});
