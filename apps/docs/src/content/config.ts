import { defineCollection, z } from 'astro:content';

// Two collections — getting-started + components — sharing the same shape so
// the layout can render both via a single page template.
const docFrontmatter = z.object({
  title: z.string(),
  description: z.string().optional(),
  // Optional sidebar override — when present, takes precedence over `title`
  // for the nav label so we can keep H1 long-form ("Getting started with the
  // bwc CLI") while showing a tight label ("CLI") in the side nav.
  sidebar: z
    .object({
      label: z.string().optional(),
      order: z.number().optional(),
    })
    .optional(),
});

export const collections = {
  'getting-started': defineCollection({
    type: 'content',
    schema: docFrontmatter,
  }),
  components: defineCollection({
    type: 'content',
    schema: docFrontmatter,
  }),
};
