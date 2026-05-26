import { z } from 'zod';

export const ProductSchema = z.object({
  stamp_id: z.string(),
  name: z.string(),
  description: z.string(),
  stampSKU: z.number(),
  meta: z.object({
    denomination: z.string(),
    series: z.string().nullable(),
    designer: z.string().nullable(),
    perforation: z.boolean(),
    stampsPerPane: z.number().nullable(),
    themes: z.string().nullable(),
    europa: z.boolean(),
  }),
  release: z.object({
    year: z.number(),
    date: z.string(),
    printQuantity: z.number(),
    isMassIssue: z.boolean(),
    isAvailable: z.boolean(),
  }),
  images: z.object({
    original: z.string(),
    small: z.string(),
    pane: z.string().nullable(),
  }),
});

