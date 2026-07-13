/**
 * @module sd-order-departments.dto
 * @description DTO + Zod schema. The manager's per-order department selection (Phase 4
 *   fan-out source): which departments an order needs, and (for mold) new vs reuse.
 */

import { z } from 'zod';

export const ORDER_DEPARTMENTS = ['design', 'mold', 'cliche', 'warehouse', 'production', 'logistics'] as const;

export const SetOrderDepartmentsSchema = z.object({
  departments: z.array(z.object({
    department: z.enum(ORDER_DEPARTMENTS),
    mode: z.enum(['new', 'reuse']).optional(),
  })).min(1, { message: 'Kamida bitta bo\'lim tanlanishi kerak' }),
});
export type SetOrderDepartmentsDto = z.infer<typeof SetOrderDepartmentsSchema>;

export const MOLD_STATUSES = ['ORDERED', 'IN_TRANSIT', 'RECEIVED', 'REJECTED'] as const;
export const UpdateMoldStatusSchema = z.object({
  status: z.enum(MOLD_STATUSES),
});
export type UpdateMoldStatusDto = z.infer<typeof UpdateMoldStatusSchema>;

export const DESIGN_STATUSES = ['DRAFT', 'REVIEW', 'CONFIRMED', 'OBSOLETE'] as const;
export const UpdateDesignStatusSchema = z.object({
  status: z.enum(DESIGN_STATUSES),
});
export type UpdateDesignStatusDto = z.infer<typeof UpdateDesignStatusSchema>;

export const CLICHE_STATUSES = ['ORDERED', 'IN_TRANSIT', 'ARRIVED', 'REJECTED'] as const;
export const UpdateClicheStatusSchema = z.object({
  status: z.enum(CLICHE_STATUSES),
});
export type UpdateClicheStatusDto = z.infer<typeof UpdateClicheStatusSchema>;

// Logistics delivery lifecycle — matches the ow_deliveries CHECK constraint.
export const SHIPPING_STATUSES = ['DISPATCHED', 'IN_TRANSIT', 'DELIVERED', 'RETURNED'] as const;
export const UpdateShippingStatusSchema = z.object({
  status: z.enum(SHIPPING_STATUSES),
});
export type UpdateShippingStatusDto = z.infer<typeof UpdateShippingStatusSchema>;

// Warehouse/rulon material-requirement lifecycle — matches the ow_material_requirements CHECK.
export const MATERIAL_STATUSES = ['NEEDED', 'RESERVED', 'ISSUED', 'RETURNED'] as const;
export const UpdateMaterialStatusSchema = z.object({
  status: z.enum(MATERIAL_STATUSES),
});
export type UpdateMaterialStatusDto = z.infer<typeof UpdateMaterialStatusSchema>;

// Vision 06-sd#18: physical die identity (die_code) tagged onto a mold; decoupled from order_id.
export const SetDieCodeSchema = z.object({
  dieCode: z.string().min(1).max(100),
});
export type SetDieCodeDto = z.infer<typeof SetDieCodeSchema>;

// SD #18-followup: taxonomy_entries category='code_prefix' (KT/PT/E/GL) classification tag on
// a mold/die. Validated against the LIVE taxonomy_entries set server-side (not a hardcoded
// enum here, Q-40) — this schema only enforces shape.
export const SetCodePrefixSchema = z.object({
  codePrefix: z.string().min(1).max(20),
});
export type SetCodePrefixDto = z.infer<typeof SetCodePrefixSchema>;
