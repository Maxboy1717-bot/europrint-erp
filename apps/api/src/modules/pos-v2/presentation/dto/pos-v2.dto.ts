/**
 * @module pos-v2.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';

export const StartCountDtoSchema = z.object({
  warehouseId: z.string().uuid('Invalid warehouse ID'),
  notes: z.string().optional(),
});

export type StartCountDto = z.infer<typeof StartCountDtoSchema>;

export const UpdateCountLineDtoSchema = z.object({
  countedQuantity: z.number().min(0, 'Counted quantity must be >= 0'),
  notes: z.string().optional(),
});

export type UpdateCountLineDto = z.infer<typeof UpdateCountLineDtoSchema>;

export const CreateTransferRequestDtoSchema = z.object({
  fromWarehouseId: z.string().uuid('Invalid source warehouse ID'),
  toWarehouseId: z.string().uuid('Invalid destination warehouse ID'),
  reason: z.string().min(5, 'Reason must be at least 5 characters'),
  lines: z
    .array(
      z.object({
        stockItemId: z.string().uuid('Invalid stock item ID'),
        itemName: z.string(),
        sku: z.string(),
        requestedQty: z.number().positive('Requested quantity must be positive'),
        unit: z.string(),
      }),
    )
    .min(1, 'At least one line is required'),
});

export type CreateTransferRequestDto = z.infer<typeof CreateTransferRequestDtoSchema>;

export const GetCountsDtoSchema = z.object({
  warehouseId: z.string().uuid().optional(),
  status: z.enum(['draft', 'in_progress', 'completed', 'approved']).optional(),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

export type GetCountsDto = z.infer<typeof GetCountsDtoSchema>;

export const GetRequestsDtoSchema = z.object({
  status: z.enum(['pending', 'approved', 'in_transit', 'completed', 'rejected']).optional(),
  fromWarehouseId: z.string().uuid().optional(),
  toWarehouseId: z.string().uuid().optional(),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

export type GetRequestsDto = z.infer<typeof GetRequestsDtoSchema>;

export const BarcodeDtoSchema = z.object({
  barcode: z.string().min(2, 'Barcode must be at least 2 characters'),
});

export type BarcodeDto = z.infer<typeof BarcodeDtoSchema>;

export const MovementReportDtoSchema = z.object({
  warehouseId: z.string().uuid('Invalid warehouse ID'),
  from: z.string().datetime(),
  to: z.string().datetime(),
});

export type MovementReportDto = z.infer<typeof MovementReportDtoSchema>;

export const EmployeeActivityReportDtoSchema = z.object({
  userId: z.string(),
  from: z.string().datetime(),
  to: z.string().datetime(),
});

export type EmployeeActivityReportDto = z.infer<typeof EmployeeActivityReportDtoSchema>;

export const LowStockReportDtoSchema = z.object({
  warehouseId: z.string().uuid().optional(),
});

export type LowStockReportDto = z.infer<typeof LowStockReportDtoSchema>;

export const ApproveCountDtoSchema = z.object({
  syncStock: z.boolean().optional(),
});

export type ApproveCountDto = z.infer<typeof ApproveCountDtoSchema>;

export const UpdateTransferStatusDtoSchema = z.object({
  status: z.string().min(1, 'Status is required'),
  notes:  z.string().optional(),
});

export type UpdateTransferStatusDto = z.infer<typeof UpdateTransferStatusDtoSchema>;
