import { z } from 'zod';

export const allocateSchema = z.object({
  assetId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid asset ID'),
  holderType: z.enum(['Employee', 'Department']),
  holderUser: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID').nullable().optional(),
  holderDepartment: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid department ID').nullable().optional(),
  expectedReturnDate: z.string().transform((val) => val ? new Date(val) : null).nullable().optional(),
});

export const returnSchema = z.object({
  conditionCheckInNotes: z.string().optional(),
  condition: z.enum(['New', 'Good', 'Fair', 'Poor', 'Damaged']).optional(),
});

export const transferRequestSchema = z.object({
  assetId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid asset ID'),
  requestedForUser: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID').nullable().optional(),
  requestedForDepartment: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid department ID').nullable().optional(),
});

export const transferDecisionSchema = z.object({
  decisionNotes: z.string().optional(),
});
