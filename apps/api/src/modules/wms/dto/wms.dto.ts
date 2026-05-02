// Zod schema bilan validatsiya qilinadi — class-validator ishlatilmaydi
import { z } from 'zod';

export const WmsCreateWarehouseRentalSchema = z.object({
  warehouse_id:   z.number().int().positive().optional(),
  tenant_id:      z.number().int().positive().optional(),
  start_date:     z.string().optional(),
  end_date:       z.string().optional(),
  monthly_rate:   z.number().positive().optional(),
  area_sqm:       z.number().positive().optional(),
  notes:          z.string().optional(),
});
export type WmsCreateWarehouseRentalDto = z.infer<typeof WmsCreateWarehouseRentalSchema>;

export const WmsUpdateRentalSettingsSchema = z.object({
  default_rate:     z.number().positive().optional(),
  currency:         z.string().max(10).optional(),
  billing_day:      z.number().int().min(1).max(31).optional(),
  late_fee_percent: z.number().min(0).optional(),
});
export type WmsUpdateRentalSettingsDto = z.infer<typeof WmsUpdateRentalSettingsSchema>;

export const WmsMarkRentalPaidSchema = z.object({
  amount:         z.number().positive().optional(),
  payment_method: z.enum(['cash', 'card', 'bank_transfer']).optional(),
  notes:          z.string().optional(),
});
export type WmsMarkRentalPaidDto = z.infer<typeof WmsMarkRentalPaidSchema>;

export const WmsCreateMaterialKitSchema = z.object({
  name:           z.string().min(1).max(255),
  production_order_id: z.number().int().positive().optional(),
  work_center_id: z.number().int().positive().optional(),
  planned_date:   z.string().optional(),
  notes:          z.string().optional(),
});
export type WmsCreateMaterialKitDto = z.infer<typeof WmsCreateMaterialKitSchema>;

export const WmsGenerateMaterialKitSchema = z.object({
  production_order_id: z.number().int().positive(),
  work_center_id:      z.number().int().positive().optional(),
  date:                z.string().optional(),
});
export type WmsGenerateMaterialKitDto = z.infer<typeof WmsGenerateMaterialKitSchema>;

export const WmsAddKitItemSchema = z.object({
  material_id: z.number().int().positive(),
  quantity:    z.number().positive(),
  unit:        z.string().max(20).optional(),
});
export type WmsAddKitItemDto = z.infer<typeof WmsAddKitItemSchema>;

export const WmsUpdateMaterialSchema = z.object({
  name:          z.string().min(1).max(255).optional(),
  description:   z.string().optional(),
  unit:          z.string().max(20).optional(),
  min_quantity:  z.number().min(0).optional(),
  max_quantity:  z.number().min(0).optional(),
  location:      z.string().max(100).optional(),
  category:      z.string().max(100).optional(),
  is_active:     z.boolean().optional(),
});
export type WmsUpdateMaterialDto = z.infer<typeof WmsUpdateMaterialSchema>;

export const WmsCreateTransferSchema = z.object({
  from_warehouse_id: z.number().int().positive().optional(),
  to_warehouse_id:   z.number().int().positive().optional(),
  material_id:       z.number().int().positive().optional(),
  quantity:          z.number().positive(),
  notes:             z.string().optional(),
});
export type WmsCreateTransferDto = z.infer<typeof WmsCreateTransferSchema>;

export const WmsCreateInternalRequestSchema = z.object({
  material_id:    z.number().int().positive(),
  quantity:       z.number().positive(),
  requester_dept: z.string().max(100).optional(),
  needed_by:      z.string().optional(),
  notes:          z.string().optional(),
});
export type WmsCreateInternalRequestDto = z.infer<typeof WmsCreateInternalRequestSchema>;

export const WmsCreateGoodsReceiptSchema = z.object({
  supplier_id:    z.number().int().positive().optional(),
  purchase_order_id: z.number().int().positive().optional(),
  receipt_date:   z.string().optional(),
  notes:          z.string().optional(),
});
export type WmsCreateGoodsReceiptDto = z.infer<typeof WmsCreateGoodsReceiptSchema>;

export const WmsQcLineSchema = z.object({
  passed: z.boolean(),
  notes:  z.string().optional(),
});
export type WmsQcLineDto = z.infer<typeof WmsQcLineSchema>;
