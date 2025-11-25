/* eslint-disable @typescript-eslint/no-unsafe-assignment -- Vite config requires dynamic typing */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const host: string | undefined =
  typeof process.env["TAURI_DEV_HOST"] === "string" ? process.env["TAURI_DEV_HOST"] : undefined;
const isDebug = Boolean(process.env["TAURI_DEBUG"]);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": `${import.meta.dir}/src`,
    },
  },
  clearScreen: false,
  server: {
    host: host ?? false,
    port: 5173,
    strictPort: true,
    ...(host
      ? {
          hmr: {
            protocol: "ws",
            host,
            port: 5173,
          },
        }
      : {}),
  },
  build: {
    outDir: "dist",
    target: "esnext",
    minify: !isDebug ? "esbuild" : false,
    sourcemap: isDebug,
  },
});
