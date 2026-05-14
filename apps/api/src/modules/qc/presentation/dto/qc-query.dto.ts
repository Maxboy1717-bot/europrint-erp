/**
 * @module qc-query.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';

export const GetInspectionsDtoSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'passed', 'failed', 'on_hold']).optional(),
  inspectorId: z.string().uuid().optional(),
  referenceType: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export type GetInspectionsDto = z.infer<typeof GetInspectionsDtoSchema>;

export const GetInspectionStatsDtoSchema = z.object({
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
});

export type GetInspectionStatsDto = z.infer<typeof GetInspectionStatsDtoSchema>;
