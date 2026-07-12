import { z } from 'zod';

export const bookingCreateSchema = z.object({
  assetId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid asset ID'),
  startTime: z.string().transform((val) => new Date(val)),
  endTime: z.string().transform((val) => new Date(val)),
  purpose: z.string().min(2, 'Purpose must be at least 2 characters').max(500),
});

export const bookingRescheduleSchema = z.object({
  startTime: z.string().transform((val) => new Date(val)),
  endTime: z.string().transform((val) => new Date(val)),
});
