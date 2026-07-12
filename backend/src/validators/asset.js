import { z } from 'zod';

export const assetCreateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  category: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid category ID'),
  serialNumber: z.string().min(1, 'Serial number is required'),
  acquisitionDate: z.string().transform((val) => new Date(val)),
  acquisitionCost: z.number().min(0, 'Cost must be at least 0'),
  condition: z.enum(['New', 'Good', 'Fair', 'Poor', 'Damaged']).default('New'),
  location: z.string().min(1, 'Location is required'),
  department: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid department ID').nullable().optional(),
  photos: z.array(z.string().url()).default([]),
  documents: z.array(z.string().url()).default([]),
  isSharedBookable: z.boolean().default(false),
  customFieldValues: z.record(z.string(), z.any()).default({}),
});

export const assetUpdateSchema = assetCreateSchema.partial();
