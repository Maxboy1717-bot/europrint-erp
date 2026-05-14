/**
 * @module mm.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';

export const MmCreatePurchaseOrderSchema = z.object({
  vendor_id:     z.number().int().positive(),
  expected_date: z.string().optional(),
  notes:         z.string().optional(),
  items:         z.array(z.object({
    material_id: z.number().int().positive(),
    quantity:    z.number().positive(),
    unit_price:  z.number().positive().optional(),
  })).optional(),
});
export type MmCreatePurchaseOrderDto = z.infer<typeof MmCreatePurchaseOrderSchema>;

export const MmApprovePurchaseOrderSchema = z.object({
  notes: z.string().optional(),
});
export type MmApprovePurchaseOrderDto = z.infer<typeof MmApprovePurchaseOrderSchema>;

export const MmGoodsReceiptFromOrderSchema = z.object({
  received_date: z.string().optional(),
  notes:         z.string().optional(),
});
export type MmGoodsReceiptFromOrderDto = z.infer<typeof MmGoodsReceiptFromOrderSchema>;

export const MmCreateGoodsReceiptSchema = z.object({
  purchase_order_id: z.number().int().positive(),
  received_date:     z.string().optional(),
  received_by:       z.string().optional(),
  delivery_note:     z.string().optional(),
  notes:             z.string().optional(),
  items:             z.array(z.object({
    material_id: z.number().int().positive(),
    quantity:    z.number().positive(),
  })).optional(),
});
export type MmCreateGoodsReceiptDto = z.infer<typeof MmCreateGoodsReceiptSchema>;

export const MmUpdateGoodsReceiptSchema = z.object({
  status:        z.enum(['draft', 'pending', 'approved', 'rejected']).optional(),
  notes:         z.string().optional(),
  received_date: z.string().optional(),
});
export type MmUpdateGoodsReceiptDto = z.infer<typeof MmUpdateGoodsReceiptSchema>;

export const MmCreateGoodsIssueSchema = z.object({
  work_order_id: z.number().int().positive().optional(),
  warehouse_id:  z.number().int().positive().optional(),
  issued_by:     z.string().optional(),
  cost_center:   z.string().optional(),
  notes:         z.string().optional(),
  items:         z.array(z.object({
    material_id: z.number().int().positive(),
    quantity:    z.number().positive(),
  })).optional(),
});
export type MmCreateGoodsIssueDto = z.infer<typeof MmCreateGoodsIssueSchema>;

export const MmUpdateGoodsIssueSchema = z.object({
  status: z.enum(['draft', 'pending', 'approved', 'issued']).optional(),
  notes:  z.string().optional(),
});
export type MmUpdateGoodsIssueDto = z.infer<typeof MmUpdateGoodsIssueSchema>;

export const MmCreateVendorSchema = z.object({
  name:    z.string().min(1).max(255),
  inn:     z.string().optional(),
  phone:   z.string().optional(),
  email:   z.string().email().optional(),
  address: z.string().optional(),
});
export type MmCreateVendorDto = z.infer<typeof MmCreateVendorSchema>;

export const MmUpdateVendorSchema = z.object({
  name:    z.string().min(1).max(255).optional(),
  inn:     z.string().optional(),
  phone:   z.string().optional(),
  email:   z.string().email().optional(),
  address: z.string().optional(),
  status:  z.enum(['active', 'inactive', 'blacklisted']).optional(),
});
export type MmUpdateVendorDto = z.infer<typeof MmUpdateVendorSchema>;

export const MmCreateRequisitionSchema = z.object({
  title:       z.string().min(1).max(255),
  description: z.string().optional(),
  priority:    z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  needed_by:   z.string().optional(),
  notes:       z.string().optional(),
  items:       z.array(z.object({
    material_id:  z.number().int().positive(),
    quantity:     z.number().positive(),
    unit_of_measure: z.string().optional(),
  })).optional(),
});
export type MmCreateRequisitionDto = z.infer<typeof MmCreateRequisitionSchema>;

export const MmUpdateRequisitionSchema = z.object({
  title:    z.string().min(1).max(255).optional(),
  status:   z.enum(['draft', 'pending', 'approved', 'rejected', 'cancelled']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  notes:    z.string().optional(),
});
export type MmUpdateRequisitionDto = z.infer<typeof MmUpdateRequisitionSchema>;

export const MmCreateFleetVehicleSchema = z.object({
  registration_number: z.string().min(1).max(50),
  model:               z.string().max(100).optional(),
  year:                z.number().int().min(1900).max(2100).optional(),
  fuel_type:           z.enum(['petrol', 'diesel', 'electric', 'gas']).optional(),
  status:              z.enum(['active', 'maintenance', 'inactive']).optional(),
});
export type MmCreateFleetVehicleDto = z.infer<typeof MmCreateFleetVehicleSchema>;

export const MmCreateFuelLogSchema = z.object({
  vehicle_id: z.number().int().positive(),
  liters:     z.number().positive(),
  cost:       z.number().positive().optional(),
  date:       z.string().optional(),
  odometer:   z.number().int().min(0).optional(),
});
export type MmCreateFuelLogDto = z.infer<typeof MmCreateFuelLogSchema>;
