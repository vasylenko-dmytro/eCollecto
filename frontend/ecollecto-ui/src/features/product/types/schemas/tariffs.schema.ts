import { z } from 'zod';

// Matches TariffsDto.java — Instant is serialized as ISO 8601 string
export const TariffsSchema = z.object({
  id: z.string(),
  year: z.number(),
  updatedAt: z.string(),
  currencies: z.record(z.string(), z.record(z.string(), z.number())),
});

