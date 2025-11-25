import tailwindcss from "@tailwindcss/postcss";

const config: { plugins: ReturnType<typeof tailwindcss>[] } = {
  plugins: [tailwindcss()],
};

export default config;
