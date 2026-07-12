import { z } from 'zod';

export const auditCycleCreateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  scopeDepartment: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid department ID').nullable().optional(),
  scopeLocation: z.string().nullable().optional(),
  startDate: z.string().transform((val) => new Date(val)),
  endDate: z.string().transform((val) => new Date(val)),
  auditors: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID')).min(1, 'At least 1 auditor is required'),
});

export const auditEntrySchema = z.object({
  assetId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid asset ID'),
  result: z.enum(['Verified', 'Missing', 'Damaged']),
  notes: z.string().optional(),
});
