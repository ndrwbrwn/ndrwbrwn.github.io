import { z, defineCollection } from "astro:content";

export const collections = {
  blog: defineCollection({
    schema: () => z.object({
      cover: z.string().optional(),
      coverAlt: z.string().optional(),
      title: z.string(),
      publicationDate: z.date(),
      description: z.string(),
    }),
  }),
  about: defineCollection({})
};
