/**
 * @module production.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';

export const ProductionCreateShiftReportSchema = z.object({
  shift_id:       z.number().int().positive().optional(),
  date:           z.string().optional(),
  shift_type:     z.enum(['morning', 'afternoon', 'night']).optional(),
  supervisor_id:  z.number().int().positive().optional(),
  planned_output: z.number().int().min(0).optional(),
  actual_output:  z.number().int().min(0).optional(),
  notes:          z.string().optional(),
});
export type ProductionCreateShiftReportDto = z.infer<typeof ProductionCreateShiftReportSchema>;

export const ProductionUpdateShiftReportSchema = z.object({
  actual_output:  z.number().int().min(0).optional(),
  reject_qty:     z.number().int().min(0).optional(),
  downtime_min:   z.number().int().min(0).optional(),
  notes:          z.string().optional(),
  status:         z.enum(['open', 'closed']).optional(),
});
export type ProductionUpdateShiftReportDto = z.infer<typeof ProductionUpdateShiftReportSchema>;

export const ProductionCloseShiftReportSchema = z.object({
  notes:         z.string().optional(),
  actual_output: z.number().int().min(0).optional(),
});
export type ProductionCloseShiftReportDto = z.infer<typeof ProductionCloseShiftReportSchema>;

export const ProductionAddDowntimeSchema = z.object({
  reason:       z.string().min(1).max(500),
  duration_min: z.number().int().min(1),
  category:     z.enum(['mechanical', 'electrical', 'material', 'operator', 'other']).optional(),
});
export type ProductionAddDowntimeDto = z.infer<typeof ProductionAddDowntimeSchema>;

export const ProductionAddShiftDowntimeSchema = ProductionAddDowntimeSchema;
export type ProductionAddShiftDowntimeDto = ProductionAddDowntimeDto;
