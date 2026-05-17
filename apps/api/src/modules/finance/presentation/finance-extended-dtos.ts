/**
 * @module finance-extended-dtos
 * @description Shared Zod schemas + role constants for the finance-extended controller siblings.
 * Extracted per Rule 16 (≤ 300 lines) so the controller files stay below the limit.
 */

import { z } from 'zod';

export const FINANCE_ROLES = ['FINANCE_MANAGER', 'ACCOUNTANT', 'SUPER_ADMIN', 'DIRECTOR'];

export const CreateInventoryCountSchema = z.object({
  warehouseId: z.union([z.string(), z.number()]).optional(),
  countDate: z.string().optional(),
  notes: z.string().max(2000).optional(),
}).passthrough();

export const CreateAssetSchema = z.object({
  name: z.string().min(1).max(200),
  code: z.string().max(100).optional(),
  category: z.string().max(100).optional(),
  purchaseDate: z.string().optional(),
  purchaseValue: z.number().nonnegative().optional(),
  depreciationRate: z.number().nonnegative().optional(),
}).passthrough();

export const PayrollCalculateSchema = z.object({
  period: z.string().min(1),
  employeeIds: z.array(z.union([z.string(), z.number()])).optional(),
}).passthrough();

export const ApprovePayrollSchema = z.object({
  approvedBy: z.union([z.string(), z.number()]).optional(),
  notes: z.string().max(2000).optional(),
}).passthrough();
