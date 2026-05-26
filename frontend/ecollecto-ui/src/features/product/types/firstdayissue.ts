import type { z } from 'zod';
import type { FirstDayIssueSchema } from './schemas/firstdayissue.schema';

export type FirstDayIssue = z.infer<typeof FirstDayIssueSchema>;
