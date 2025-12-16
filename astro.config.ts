import { defineConfig, squooshImageService } from "astro/config";
import { rehypeHeadingIds } from "@astrojs/markdown-remark";
import rehypeAutolinkHeadings from "rehype-autolink-headings";

// https://astro.build/config
export default defineConfig({
  site: "https://ajbrown.au",
  compressHTML: true,
  scopedStyleStrategy: "class",
  image: {
    service: squooshImageService(),
  },
  markdown: {
    rehypePlugins: [
      rehypeHeadingIds,
      [
        rehypeAutolinkHeadings,
        {
          behavior: "wrap",
          properties: {
            class: "heading-linker",
          },
        },
      ],
    ],
  },
});
