/**
 * @module pp.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';

export const PpCreateEquipmentSchema = z.object({
  name:         z.string().min(1).max(255),
  code:         z.string().max(50).optional(),
  type:         z.string().max(100).optional(),
  manufacturer: z.string().max(100).optional(),
  model:        z.string().max(100).optional(),
  location:     z.string().max(255).optional(),
  status:       z.enum(['active', 'maintenance', 'inactive']).optional(),
});
export type PpCreateEquipmentDto = z.infer<typeof PpCreateEquipmentSchema>;

export const PpUpdateEquipmentSchema = z.object({
  name:     z.string().min(1).max(255).optional(),
  status:   z.enum(['active', 'maintenance', 'inactive']).optional(),
  location: z.string().max(255).optional(),
  notes:    z.string().optional(),
});
export type PpUpdateEquipmentDto = z.infer<typeof PpUpdateEquipmentSchema>;

export const PpCreateScheduleEntrySchema = z.object({
  work_order_id:  z.number().int().positive().optional(),
  work_center_id: z.number().int().positive().optional(),
  planned_start:  z.string().optional(),
  planned_end:    z.string().optional(),
  operator_id:    z.number().int().positive().optional(),
  notes:          z.string().optional(),
});
export type PpCreateScheduleEntryDto = z.infer<typeof PpCreateScheduleEntrySchema>;

export const PpUpdateOperationSchema = z.object({
  status:      z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
  progress:    z.number().int().min(0).max(100).optional(),
  actual_time: z.number().int().min(0).optional(),
  notes:       z.string().optional(),
});
export type PpUpdateOperationDto = z.infer<typeof PpUpdateOperationSchema>;
