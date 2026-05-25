/**
 * @module legacy.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';

export const AdminLoginSchema = z.object({
  username: z.string().min(1).max(100),
  password: z.string().min(1).max(255),
});
export type AdminLoginDto = z.infer<typeof AdminLoginSchema>;

export const LegacyAdminLoginSchema = AdminLoginSchema;
export type LegacyAdminLoginDto = AdminLoginDto;

export const AdminRefreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});
export type AdminRefreshTokenDto = z.infer<typeof AdminRefreshTokenSchema>;

export const LegacyRefreshTokenSchema = AdminRefreshTokenSchema;
export type LegacyRefreshTokenDto = AdminRefreshTokenDto;

export const LegacyCreatePapkaOrderSchema = z.object({
  order_id:      z.number().int().positive().optional(),
  mahsulot_nomi: z.string().min(1).max(255),
  product_name:  z.string().max(255).optional(),
  quantity:      z.number().int().positive().optional(),
  deadline:      z.string().optional(),
  status:        z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
});
export type LegacyCreatePapkaOrderDto = z.infer<typeof LegacyCreatePapkaOrderSchema>;

export const LegacyUpdatePapkaOrderSchema = z.object({
  mahsulot_nomi: z.string().min(1).max(255).optional(),
  quantity:      z.number().int().positive().optional(),
  deadline:      z.string().optional(),
  status:        z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
  notes:         z.string().optional(),
});
export type LegacyUpdatePapkaOrderDto = z.infer<typeof LegacyUpdatePapkaOrderSchema>;

export const LegacyCreateMachineTaskSchema = z.object({
  papka_order_id: z.number().int().positive().nullable().optional(),
  work_center_id: z.number().int().positive().nullable().optional(),
  employee_id:    z.number().int().positive().nullable().optional(),
  planned_start:  z.string().optional(),
  planned_end:    z.string().optional(),
  status:         z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
});
export type LegacyCreateMachineTaskDto = z.infer<typeof LegacyCreateMachineTaskSchema>;

export const LegacyCreatePlanningOperationSchema = z.object({
  papka_order_id: z.number().int().positive().nullable().optional(),
  work_center_id: z.number().int().positive().nullable().optional(),
  operation_name: z.string().min(1).max(255),
  planned_start:  z.string().optional(),
  planned_end:    z.string().optional(),
  status:         z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
});
export type LegacyCreatePlanningOperationDto = z.infer<typeof LegacyCreatePlanningOperationSchema>;

export const LegacyUploadSchema = z.object({
  filename: z.string().optional(),
  url:      z.string().optional(),
});
export type LegacyUploadDto = z.infer<typeof LegacyUploadSchema>;

export const LegacyClientErrorSchema = z.object({
  message:   z.string().optional(),
  stack:     z.string().optional(),
  url:       z.string().optional(),
  userAgent: z.string().optional(),
});
export type LegacyClientErrorDto = z.infer<typeof LegacyClientErrorSchema>;
