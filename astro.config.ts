import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  site: "https://ajbrown.au",
  compressHTML: true,
  scopedStyleStrategy: "class",
});
