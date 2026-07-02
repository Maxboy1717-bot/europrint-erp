/**
 * @module movement.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';
import { MovementTypeCode, MovementStatus, QcDecision } from './movement-enums';
import { MovementContextSchema } from './movement-extra.dto';

import { MAX_NOTES_LENGTH, MAX_SHORT_TEXT, MAX_NAME_LENGTH } from '@common/constants/app.constants';
const isoDate = z.string().refine((s) => !isNaN(Date.parse(s)), { message: 'ISO date string expected' });

export { MovementTypeCode, MovementStatus, QcDecision };

const MOVEMENT_STATUS_VALUES = [
  'draft', 'qc_pending', 'qc_approved', 'qc_rework', 'qc_rejected',
  'pending', 'approved', 'ai_processing', 'completed', 'cancelled',
] as const;

// ─── Movement Line ────────────────────────────────────────────────────────────

export const AddMovementLineSchema = z.object({
  materialCardId: z.number().int().positive(),
  batchId:        z.number().int().optional(),
  quantity:       z.number().positive(),
  unitPrice:      z.number().min(0).optional(),
  currency:       z.string().max(3).optional(),
  exchangeRate:   z.number().min(0).optional(),
  expiryDate:     z.string().optional(),
  binLocation:    z.string().max(100).optional(),
  serialNumber:   z.string().max(MAX_NAME_LENGTH).optional(),
  lotNumber:      z.string().max(MAX_SHORT_TEXT).optional(),
  // G1-1 BARKOD SERVER-GATE (2026-07-02): EXTERNAL_IN uchun MAJBURIY (egasi:
  // "barcode bo'lmasa qabul qilmaydi", kitob 18400-18402) — sxemada optional,
  // tur-bog'liq majburiylik CreateMovementSchema.superRefine + PosMovementService
  // (movementTypeId yo'li DB-lookup talab qiladi) darajasida tekshiriladi.
  barcode:        z.string().min(1).max(100).optional(),
  notes:          z.string().max(MAX_SHORT_TEXT).optional(),
});
export class AddMovementLineDto extends createZodDto(AddMovementLineSchema) {}

// ─── Create Movement ──────────────────────────────────────────────────────────

export const CreateMovementSchema = z.object({
  movementTypeId:       z.number().int().positive().optional(),
  movementTypeCode:     z.string().optional(),
  fromWarehouseId:      z.string().optional(),
  toWarehouseId:        z.string().optional(),
  receivedByEmployeeId: z.number().int().optional(),
  supplierName:         z.string().max(255).optional(),
  documentNumber:       z.string().max(100).optional(),
  documentDate:         isoDate.optional(),
  returnReason:         z.string().max(MAX_SHORT_TEXT).optional(),
  purchaseOrderId:      z.string().optional(),
  cashPaid:             z.boolean().optional(),
  cashAmount:           z.number().min(0).optional(),
  baseCurrency:         z.string().max(3).optional(),
  exchangeRate:         z.number().min(0).optional(),
  telegramUserId:       z.number().optional(),
  offlineCreatedAt:     isoDate.optional(),
  lines:                z.array(AddMovementLineSchema).optional(),
  notes:                z.string().max(MAX_NOTES_LENGTH).optional(),
  submit:               z.boolean().optional(),
  // ADDITIVE (2026-06-27): yangi harakat turlari uchun ixtiyoriy kontekst
  // (WASTE_IN / LAB_SAMPLE_OUT / PARTIAL_RECEIPT / CUSTOMER_MATERIAL).
  context:              MovementContextSchema.optional(),
  // ADDITIVE (2026-07-01, Savdo-sity referens H-8 naqshi): double-tap/retry himoyasi —
  // FE crypto.randomUUID() yuboradi, BE bir xil kalit bilan qayta so'rovda mavjud harakatni qaytaradi.
  idempotencyKey:       z.string().max(100).optional(),
}).refine(d => d.movementTypeId != null || (d.movementTypeCode != null && d.movementTypeCode.length > 0), {
  message: 'movementTypeId yoki movementTypeCode majburiy',
  path: ['movementTypeId'],
}).superRefine((d, ctx) => {
  // G1-1 BARKOD SERVER-GATE (2026-07-02): EXTERNAL_IN kirimda har qatorda barkod
  // MAJBURIY (egasi: "barcode bo'lmasa qabul qilmaydi", kitob 18400-18402).
  // Bu yerda faqat movementTypeCode yo'li ushlanadi; movementTypeId yo'li
  // PosMovementService.createMovement ichida (DB-lookup dan keyin) tekshiriladi.
  if (d.movementTypeCode === MovementTypeCode.EXTERNAL_IN && Array.isArray(d.lines)) {
    d.lines.forEach((line, i) => {
      if (!line.barcode) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'EXTERNAL_IN kirim qatorida barkod majburiy (barkodsiz qabul taqiqlangan)',
          path: ['lines', i, 'barcode'],
        });
      }
    });
  }
});
export class CreateMovementDto extends createZodDto(CreateMovementSchema) {}

// ─── Update Movement Status ───────────────────────────────────────────────────

export const UpdateMovementStatusSchema = z.object({
  status: z.enum(MOVEMENT_STATUS_VALUES),
  reason: z.string().max(MAX_SHORT_TEXT).optional(),
});
export class UpdateMovementStatusDto extends createZodDto(UpdateMovementStatusSchema) {}

// ─── Re-exports from movement-extra.dto ──────────────────────────────────────

export {
  QcDecisionDto,
  QcDecisionSchema,
  ThreeWayMatchDto,
  ThreeWayMatchSchema,
  MovementFilterDto,
  MovementFilterSchema,
  CreateDamageActDto,
  CreateDamageActSchema,
  CreateInventoryAdjustmentDto,
  CreateInventoryAdjustmentSchema,
  MovementContextDto,
  MovementContextSchema,
} from './movement-extra.dto';
