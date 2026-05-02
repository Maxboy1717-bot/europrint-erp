// Zod schema bilan validatsiya qilinadi — class-validator ishlatilmaydi
import { z } from 'zod';

export const WmsCreateTransferSchema = z.object({
  from_warehouse_id: z.number().int().positive().optional(),
  to_warehouse_id:   z.number().int().positive().optional(),
  items:             z.array(z.object({
    material_id: z.number().int().positive(),
    quantity:    z.number().positive(),
  })).optional(),
  notes:             z.string().optional(),
}).passthrough();
export type WmsCreateTransferDto = z.infer<typeof WmsCreateTransferSchema>;

export const WmsCreateGatewayInternalRequestSchema = z.object({
  material_id:  z.number().int().positive().optional(),
  quantity:     z.number().positive().optional(),
  reason:       z.string().optional(),
  warehouse_id: z.number().int().positive().optional(),
}).passthrough();
export type WmsCreateGatewayInternalRequestDto = z.infer<typeof WmsCreateGatewayInternalRequestSchema>;

export const WmsCreateGatewayGoodsReceiptSchema = z.object({
  vendor_id:         z.number().int().positive().optional(),
  purchase_order_id: z.number().int().positive().optional(),
  received_date:     z.string().optional(),
  notes:             z.string().optional(),
}).passthrough();
export type WmsCreateGatewayGoodsReceiptDto = z.infer<typeof WmsCreateGatewayGoodsReceiptSchema>;

export const WmsQcLineSchema = z.object({
  passed: z.boolean(),
  notes:  z.string().optional(),
});
export type WmsQcLineDto = z.infer<typeof WmsQcLineSchema>;

export const WmsUpdateMaterialSchema = z.object({
  name:             z.string().min(1).max(255).optional(),
  unit_of_measure:  z.string().max(50).optional(),
  category_id:      z.number().int().positive().optional(),
  min_stock:        z.number().min(0).optional(),
  max_stock:        z.number().min(0).optional(),
  reorder_point:    z.number().min(0).optional(),
}).passthrough();
export type WmsUpdateMaterialDto = z.infer<typeof WmsUpdateMaterialSchema>;

export const WmsCreateMaterialKitSchema = z.object({
  name:         z.string().min(1).max(255).optional(),
  order_id:     z.number().int().positive().optional(),
  work_order_id: z.number().int().positive().optional(),
  items:        z.array(z.object({
    material_id: z.number().int().positive(),
    quantity:    z.number().positive(),
  })).optional(),
}).passthrough();
export type WmsCreateMaterialKitDto = z.infer<typeof WmsCreateMaterialKitSchema>;

export const WmsAddKitItemSchema = z.object({
  material_id: z.number().int().positive().optional(),
  quantity:    z.number().positive().optional(),
  notes:       z.string().optional(),
}).passthrough();
export type WmsAddKitItemDto = z.infer<typeof WmsAddKitItemSchema>;

export const WmsCreateRentalRecordSchema = z.object({
  tenant_id:    z.number().int().positive().optional(),
  warehouse_id: z.number().int().positive().optional(),
  start_date:   z.string().optional(),
  end_date:     z.string().optional(),
  area_m2:      z.number().positive().optional(),
  rate_per_m2:  z.number().positive().optional(),
}).passthrough();
export type WmsCreateRentalRecordDto = z.infer<typeof WmsCreateRentalRecordSchema>;

export const WmsUpdateRentalSettingsSchema = z.object({
  default_rate: z.number().positive().optional(),
  currency:     z.string().max(10).optional(),
  payment_day:  z.number().int().min(1).max(31).optional(),
});
export type WmsUpdateRentalSettingsDto = z.infer<typeof WmsUpdateRentalSettingsSchema>;

export const WmsMarkPaidSchema = z.object({
  notes: z.string().optional(),
});
export type WmsMarkPaidDto = z.infer<typeof WmsMarkPaidSchema>;
