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

// Accepts the rich camelCase payload sent by the PapkaOrders page and the
// Order-Creation Wizard. Status is a free string (the DB column is varchar(30)
// with no CHECK), so 'new'/'planning'/'production'/etc. all pass. `.passthrough()`
// lets jsonb extras (materialRequirements, stockCheckResult) flow to the helper.
export const LegacyCreatePapkaOrderSchema = z.object({
  papkaNo:            z.string().max(50).optional(),
  mijozNomi:          z.string().optional(),
  mahsulotNomi:       z.string().max(255).optional(),
  mahsulotTuri:       z.string().max(50).optional(),
  tiraj:              z.coerce.number().int().nonnegative().optional(),
  listSoni:           z.coerce.number().int().optional(),
  formatA:            z.coerce.number().optional(),
  formatB:            z.coerce.number().optional(),
  sana:               z.string().optional(),
  tayyorBolishSanasi: z.string().optional(),
  status:             z.string().max(30).optional(),
  notes:              z.string().optional(),
  bomId:              z.coerce.number().int().nullable().optional(),
  productId:          z.coerce.number().int().nullable().optional(),
  routingId:          z.coerce.number().int().nullable().optional(),
  estimatedProductionTime: z.coerce.number().nullable().optional(),
  // Legacy snake_case (back-compat)
  order_id:      z.coerce.number().int().positive().optional(),
  mahsulot_nomi: z.string().max(255).optional(),
  product_name:  z.string().max(255).optional(),
  quantity:      z.coerce.number().int().optional(),
  deadline:      z.string().optional(),
}).passthrough();
export type LegacyCreatePapkaOrderDto = z.infer<typeof LegacyCreatePapkaOrderSchema>;

export const LegacyUpdatePapkaOrderSchema = z.object({
  papkaNo:            z.string().max(50).optional(),
  mijozNomi:          z.string().optional(),
  mahsulotNomi:       z.string().max(255).optional(),
  mahsulotTuri:       z.string().max(50).optional(),
  tiraj:              z.coerce.number().int().nonnegative().optional(),
  listSoni:           z.coerce.number().int().optional(),
  formatA:            z.coerce.number().optional(),
  formatB:            z.coerce.number().optional(),
  sana:               z.string().optional(),
  tayyorBolishSanasi: z.string().optional(),
  status:             z.string().max(30).optional(),
  notes:              z.string().optional(),
  // Legacy snake_case (back-compat)
  mahsulot_nomi: z.string().max(255).optional(),
  quantity:      z.coerce.number().int().optional(),
  deadline:      z.string().optional(),
}).passthrough();
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
