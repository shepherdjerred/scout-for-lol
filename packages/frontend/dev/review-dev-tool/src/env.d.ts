/// <reference types="astro/client" />

declare module "*.txt" {
  const content: string;
  export default content;
}

declare module "*.txt?raw" {
  const content: string;
  export default content;
}

declare module "*.json" {
  const value: unknown;
  export default value;
}
