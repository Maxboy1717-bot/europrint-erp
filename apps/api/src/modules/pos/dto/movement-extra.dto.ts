/**
 * @module movement-extra.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';

import { MAX_NOTES_LENGTH, MAX_SHORT_TEXT } from '@common/constants/app.constants';
const QC_DECISION_VALUES    = ['APPROVED', 'REWORK', 'REJECTED'] as const;
const MOVEMENT_STATUS_VALUES = [
  'draft', 'qc_pending', 'qc_approved', 'qc_rework', 'qc_rejected',
  'pending', 'approved', 'ai_processing', 'completed', 'cancelled',
] as const;

// ─── QC Decision ──────────────────────────────────────────────────────────────

export const QcDecisionSchema = z.object({
  movementId:        z.number().int().positive(),
  decision:          z.enum(QC_DECISION_VALUES),
  notes:             z.string().max(MAX_NOTES_LENGTH).optional(),
  rejectionReason:   z.string().max(MAX_SHORT_TEXT).optional(),
  reworkInstruction: z.string().max(MAX_SHORT_TEXT).optional(),
});
export class QcDecisionDto extends createZodDto(QcDecisionSchema) {}

// ─── 3-Way Match ─────────────────────────────────────────────────────────────

export const ThreeWayMatchSchema = z.object({
  posMovementId:    z.number().int().positive(),
  purchaseOrderId:  z.string().optional(),
  goodsReceiptId:   z.string().optional(),
  invoiceId:        z.string().optional(),
  invoiceNumber:    z.string().max(100).optional(),
  poQty:            z.number().optional(),
  grQty:            z.number().optional(),
  invoiceQty:       z.number().optional(),
  poUnitPrice:      z.number().optional(),
  invoiceUnitPrice: z.number().optional(),
  varianceNotes:    z.string().optional(),
});
export class ThreeWayMatchDto extends createZodDto(ThreeWayMatchSchema) {}

// ─── Movement Filter (Query) ──────────────────────────────────────────────────

export const MovementFilterSchema = z.object({
  status:         z.enum(MOVEMENT_STATUS_VALUES).optional(),
  warehouseId:    z.string().optional(),
  dateFrom:       z.string().optional(),
  dateTo:         z.string().optional(),
  supplierName:   z.string().optional(),
  movementNumber: z.string().optional(),
  materialCardId: z.coerce.number().int().optional(),
  page:           z.coerce.number().int().min(1).optional(),
  limit:          z.coerce.number().int().min(1).max(100).optional(),
});
export class MovementFilterDto extends createZodDto(MovementFilterSchema) {}

// ─── Damage Act ───────────────────────────────────────────────────────────────

export const CreateDamageActSchema = z.object({
  posMovementId:     z.number().int().positive(),
  materialCardId:    z.number().int().positive(),
  damagedQty:        z.number().positive(),
  serialNumber:      z.string().optional(),
  damageDescription: z.string().min(1).max(MAX_NOTES_LENGTH),
  sendToQc:          z.boolean().optional(),
});
export class CreateDamageActDto extends createZodDto(CreateDamageActSchema) {}

// ─── Inventory Adjustment ─────────────────────────────────────────────────────

export const CreateInventoryAdjustmentSchema = z.object({
  warehouseId:      z.string().min(1),
  materialCardId:   z.number().int().positive(),
  actualQty:        z.number().min(0),
  reason:           z.string().min(1).max(MAX_SHORT_TEXT),
  inventoryCountId: z.number().int().optional(),
});
export class CreateInventoryAdjustmentDto extends createZodDto(CreateInventoryAdjustmentSchema) {}
