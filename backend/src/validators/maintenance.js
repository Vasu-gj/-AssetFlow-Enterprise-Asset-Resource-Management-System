import { z } from 'zod';

export const maintenanceCreateSchema = z.object({
  assetId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid asset ID'),
  issueDescription: z.string().min(5, 'Issue description must be at least 5 characters').max(1000),
  priority: z.enum(['Low', 'Medium', 'High', 'Critical']),
  photo: z.string().url().nullable().optional(),
});

export const maintenanceAssignSchema = z.object({
  technicianId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid technician user ID'),
});

export const maintenanceProgressSchema = z.object({
  status: z.enum(['InProgress', 'Resolved']),
  rejectionReason: z.string().optional(),
});
