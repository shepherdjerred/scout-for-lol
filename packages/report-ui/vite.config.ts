import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
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
});
