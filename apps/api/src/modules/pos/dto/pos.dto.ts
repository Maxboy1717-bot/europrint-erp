import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';

// ─── POS Auth ─────────────────────────────────────────────────────────────────

export const PosLoginSchema = z.object({
  username: z.string().min(1, 'username majburiy').max(50),
  password: z.string().min(1, 'password majburiy').max(128),
});
export class PosLoginDto extends createZodDto(PosLoginSchema) {}

// ─── Movement Types ───────────────────────────────────────────────────────────

export const CreateMovementTypeSchema = z.object({
  code:             z.string().min(1),
  name:             z.string().min(1),
  nameRu:           z.string().optional(),
  direction:        z.enum(['in', 'out', 'transfer', 'adjustment']),
  requiresDocument: z.boolean().optional(),
});
export class CreateMovementTypeDto extends createZodDto(CreateMovementTypeSchema) {}

// ─── Warehouse Access ─────────────────────────────────────────────────────────

export const GrantWarehouseAccessSchema = z.object({
  userId:      z.number().int(),
  warehouseId: z.string().min(1),
  canRead:     z.boolean().optional(),
  canWrite:    z.boolean().optional(),
  canApprove:  z.boolean().optional(),
  expiresAt:   z.string().optional(),
});
export class GrantWarehouseAccessDto extends createZodDto(GrantWarehouseAccessSchema) {}

// ─── Movements (legacy pos.dto) ───────────────────────────────────────────────

export const CreateMovementSchema = z.object({
  movementTypeId:  z.number().int(),
  fromWarehouseId: z.string().optional(),
  toWarehouseId:   z.string().optional(),
  referenceDoc:    z.string().optional(),
  notes:           z.string().optional(),
  submit:          z.boolean().optional(),
});
export class CreateMovementDto extends createZodDto(CreateMovementSchema) {}

export const AddMovementLineSchema = z.object({
  productId:           z.string().min(1),
  productName:         z.string().min(1),
  unit:                z.string().optional(),
  quantity:            z.string().min(1),
  unitPrice:           z.string().optional(),
  passportId:          z.number().int().optional(),
  barcodeAssignmentId: z.number().int().optional(),
  batchNumber:         z.string().optional(),
  notes:               z.string().optional(),
});
export class AddMovementLineDto extends createZodDto(AddMovementLineSchema) {}

export const MOVEMENT_STATUSES = ['draft', 'pending', 'approved', 'completed', 'cancelled'] as const;
export type MovementStatus = typeof MOVEMENT_STATUSES[number];

export const UpdateMovementStatusSchema = z.object({
  status:       z.enum(MOVEMENT_STATUSES),
  cancelReason: z.string().optional(),
});
export class UpdateMovementStatusDto extends createZodDto(UpdateMovementStatusSchema) {}

// ─── Inventory Passports ──────────────────────────────────────────────────────

export const CreateInventoryPassportSchema = z.object({
  passportNumber: z.string().min(1),
  productId:      z.string().min(1),
  productName:    z.string().min(1),
  unit:           z.string().optional(),
  warehouseId:    z.string().optional(),
  batchNumber:    z.string().optional(),
  serialNumber:   z.string().optional(),
  manufacturedAt: z.string().optional(),
  expiresAt:      z.string().optional(),
});
export class CreateInventoryPassportDto extends createZodDto(CreateInventoryPassportSchema) {}

export const AssignBarcodeSchema = z.object({
  passportId:  z.number().int(),
  barcode:     z.string().min(1),
  barcodeType: z.enum(['qr', 'ean13', 'code128', 'datamatrix']),
  quantity:    z.string().optional(),
  isPrimary:   z.boolean().optional(),
});
export class AssignBarcodeDto extends createZodDto(AssignBarcodeSchema) {}

// ─── PDF Templates ────────────────────────────────────────────────────────────

export const CreatePdfTemplateSchema = z.object({
  name:            z.string().min(1),
  code:            z.string().min(1),
  movementTypeId:  z.number().int().optional(),
  templateContent: z.string().min(1),
  paperSize:       z.enum(['A4', 'A5', 'Letter']).optional(),
  orientation:     z.enum(['portrait', 'landscape']).optional(),
  isDefault:       z.boolean().optional(),
});
export class CreatePdfTemplateDto extends createZodDto(CreatePdfTemplateSchema) {}
