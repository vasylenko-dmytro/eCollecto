import { z } from 'zod';

// Matches DesignerDto.java
export const DesignerSchema = z.object({
  designer_id: z.string(),
  name: z.string(),
});

