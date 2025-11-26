import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        discord: {
          blurple: "#5865f2",
          green: "#3ba55d",
          yellow: "#faa61a",
          fuchsia: "#eb459e",
          red: "#ed4245",
          white: "#ffffff",
          black: "#000000",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
