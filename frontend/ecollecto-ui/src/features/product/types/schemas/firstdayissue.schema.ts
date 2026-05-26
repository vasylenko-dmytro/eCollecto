import { z } from 'zod';

export const FirstDayIssueSchema = z.object({
  postmark_id: z.string().nullable(),
  envelope_id: z.string().nullable(),
  name: z.string(),
  description: z.string(),
  postmarkSKU: z.number().nullable(),
  envelopeSKU: z.number().nullable(),
  designer: z.string().nullable(),
  release: z.object({
    year: z.number(),
    date: z.string(),
    printQuantity: z.number(),
  }),
  images: z.object({
    envelope: z.string().nullable(),
    postmark: z.string().nullable(),
  }),
});
