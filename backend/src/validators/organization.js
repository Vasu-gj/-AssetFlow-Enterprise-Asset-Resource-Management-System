import { z } from 'zod';

export const departmentSchema = z.object({
  name: z.string().min(2, 'Department name must be at least 2 characters').max(100),
  parentDepartment: z.string().nullable().optional(),
  departmentHead: z.string().nullable().optional(),
  status: z.enum(['Active', 'Inactive']).optional(),
});

const customFieldSchema = z.object({
  fieldName: z.string().min(1, 'Field name is required'),
  fieldType: z.enum(['text', 'number', 'date']),
  required: z.boolean().default(false),
});

export const categorySchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters').max(100),
  customFields: z.array(customFieldSchema).default([]),
});

export const employeeRoleSchema = z.object({
  role: z.enum(['Admin', 'AssetManager', 'DepartmentHead', 'Technician', 'Employee']),
});

export const employeeStatusSchema = z.object({
  status: z.enum(['Active', 'Inactive']),
});
