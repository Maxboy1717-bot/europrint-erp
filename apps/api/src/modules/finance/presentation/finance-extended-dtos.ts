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
  employeeId: z.union([z.string(), z.number()]),
  workDays: z.coerce.number().min(0).max(31).optional(),
  workHours: z.coerce.number().min(0).optional(),
  productionUnits: z.coerce.number().min(0).optional(),
  bonuses: z.coerce.number().min(0).optional(),
  allowances: z.coerce.number().min(0).optional(),
  advances: z.coerce.number().min(0).optional(),
  loans: z.coerce.number().min(0).optional(),
  otherDeductions: z.coerce.number().min(0).optional(),
}).passthrough();

export const PayrollAiCalculateSchema = z.object({
  employeeId: z.union([z.string(), z.number()]),
  periodMonth: z.string().optional(),
}).passthrough();

export const PayrollRunSchema = z.object({
  period: z.string().min(1).max(20),
}).passthrough();

export const ApprovePayrollSchema = z.object({
  approvedBy: z.union([z.string(), z.number()]).optional(),
  notes: z.string().max(2000).optional(),
}).passthrough();

export const PayrollCreateContractSchema = z.object({
  employeeId: z.coerce.number().int().positive(),
  contractNumber: z.string().min(3).max(50),
  payType: z.enum(['fixed', 'hourly', 'piecework']),
  baseSalary: z.coerce.number().nonnegative().optional(),
  hourlyRate: z.coerce.number().nonnegative().optional(),
  pieceworkRate: z.coerce.number().nonnegative().optional(),
  pieceworkUnit: z.string().max(20).optional(),
  effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD format kerak'),
  effectiveTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status: z.enum(['active', 'suspended', 'terminated']).default('active'),
  notes: z.string().max(2000).optional(),
});
