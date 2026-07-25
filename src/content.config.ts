import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// The `blog` collection is the single source of truth for ALL posts —
// both standalone (src/content/blog/) and series (src/content/<series-slug>/).
// The glob base is `./src/content` so any subfolder is picked up automatically.
//
// Post IDs include the folder path, which becomes the URL:
//   src/content/minds-and-machines/a1-...mdx → /minds-and-machines/a1-.../
//   src/content/blog/some-post.mdx           → /blog/some-post/
const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    draft: z.boolean().default(false),
    featured: z.boolean().default(false),
    tags: z.array(z.string()).default([]),
    coverImage: z.string().optional(),
    series: z
      .object({
        name: z.string(),
        part: z.number().int().positive(),
      })
      .optional(),
    dropCap: z.boolean().default(true),
  }),
});

export const collections = { blog };
