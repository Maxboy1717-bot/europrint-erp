/**
 * @module defect.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';
import { IntegerIdSchema } from '@common/dto/integer-id.zod';

export const ReportDefectDtoSchema = z.object({
  inspectionId: IntegerIdSchema.nullable().optional(),
  productionOrderId: z.string().uuid().nullable().optional(),
  workCenterId: z.string().uuid().nullable().optional(),
  defectCode: z.string().min(2, 'Defect code must be at least 2 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  severity: z.enum(['minor', 'major', 'critical']),
  quantity: z.number().positive('Quantity must be positive').default(1),
  unit: z.string().default('pcs'),
});

export type ReportDefectDto = z.infer<typeof ReportDefectDtoSchema>;

export const ResolveDefectDtoSchema = z.object({
  resolution: z.string().min(10, 'Resolution must be at least 10 characters'),
});

export type ResolveDefectDto = z.infer<typeof ResolveDefectDtoSchema>;

export const CreateReclamationDtoSchema = z.object({
  customerName: z.string().min(2, 'Customer name must be at least 2 characters'),
  customerId: z.number().int().positive().nullable().optional(),
  orderId: z.string().uuid().nullable().optional(),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  severity: z.enum(['minor', 'major', 'critical']),
});

export type CreateReclamationDto = z.infer<typeof CreateReclamationDtoSchema>;

export const GetDefectsDtoSchema = z.object({
  severity: z.enum(['minor', 'major', 'critical']).optional(),
  status: z.enum(['open', 'in_review', 'rework', 'scrapped', 'resolved']).optional(),
  productionOrderId: z.string().uuid().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export type GetDefectsDto = z.infer<typeof GetDefectsDtoSchema>;

export const GetReclamationsDtoSchema = z.object({
  status: z.enum(['new', 'investigating', 'resolved', 'rejected']).optional(),
  severity: z.enum(['minor', 'major', 'critical']).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export type GetReclamationsDto = z.infer<typeof GetReclamationsDtoSchema>;
