/**
 * @module budget.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';
import { BUDGET_YEAR_MIN, BUDGET_YEAR_MAX } from '@common/constants/app.constants';

export const CreateBudgetLineSchema = z.object({
  category: z.string().min(3),
  description: z.string().min(5),
  plannedAmount: z.number().positive('Planned amount must be positive'),
});

export type CreateBudgetLineDto = z.infer<typeof CreateBudgetLineSchema>;

export const CreateBudgetDtoSchema = z.object({
  name: z.string().min(3),
  fiscalYear: z.number().int().min(BUDGET_YEAR_MIN).max(BUDGET_YEAR_MAX),
  quarter: z.number().int().min(1).max(4).optional().nullable(),
  department: z.string().optional().nullable(),
  lines: z.array(CreateBudgetLineSchema).min(1, 'At least one budget line is required'),
  notes: z.string().optional().nullable(),
});

export type CreateBudgetDto = z.infer<typeof CreateBudgetDtoSchema>;

export const GetBudgetsDtoSchema = z.object({
  fiscalYear: z.coerce.number().int().optional(),
  status: z.enum(['draft', 'pending_approval', 'approved', 'rejected', 'closed']).optional(),
  department: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export type GetBudgetsDto = z.infer<typeof GetBudgetsDtoSchema>;
