import { z, defineCollection } from "astro:content";

export const collections = {
  blog: defineCollection({
    schema: ({ image }) => z.object({
      cover: z.string().optional(),
      coverAlt: z.string().optional(),
      title: z.string(),
      publicationDate: z.date(),
      description: z.string(),
    }),
  }),
};
