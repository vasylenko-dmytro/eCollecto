import type { z } from 'zod';
import type { ProductSchema } from './schemas/product.schema';

export type Product = z.infer<typeof ProductSchema>;
