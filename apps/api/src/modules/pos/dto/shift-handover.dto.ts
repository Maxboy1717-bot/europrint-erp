/**
 * @module shift-handover.dto
 * @description DTO + Zod schema definition. Validates POS smena-topshirish (2-imzo) + foto-dalil +
 *   qaytariladigan-tara (poddon/rohler) request bodies. DTO types inferred via z.infer.
 */

import { z } from 'zod';
import { MAX_NOTES_LENGTH } from '@common/constants/app.constants';

// ─── Smena-topshirish satr (material) ─────────────────────────────────────────
export const HandoverItemSchema = z.object({
  materialCardId: z.number().int().positive(),
  quantity:       z.number().min(0),
  unit:           z.string().max(24).optional(),
  note:           z.string().max(MAX_NOTES_LENGTH).optional(),
});
export type HandoverItem = z.infer<typeof HandoverItemSchema>;

// ─── Akt yaratish ─────────────────────────────────────────────────────────────
export const CreateShiftHandoverSchema = z.object({
  warehouseId:      z.string().max(40).optional(),
  toUserId:         z.number().int().positive(),       // qabul qiluvchi (smena boshlovchi)
  items:            z.array(HandoverItemSchema).default([]),
  notes:            z.string().max(MAX_NOTES_LENGTH).optional(),
  photoEvidenceUrl: z.string().max(2048).optional(),
});
export type CreateShiftHandoverDto = z.infer<typeof CreateShiftHandoverSchema>;

// ─── Imzo (topshiruvchi yoki qabul qiluvchi) ──────────────────────────────────
export const SignHandoverSchema = z.object({
  role:             z.enum(['from', 'to']),            // 'from' = topshiruvchi, 'to' = qabul qiluvchi
  photoEvidenceUrl: z.string().max(2048).optional(),   // imzo paytida foto-dalil qo'shish
});
export type SignHandoverDto = z.infer<typeof SignHandoverSchema>;

// ─── Bekor qilish ─────────────────────────────────────────────────────────────
export const CancelShiftHandoverSchema = z.object({
  reason: z.string().min(1).max(MAX_NOTES_LENGTH),
});
export type CancelShiftHandoverDto = z.infer<typeof CancelShiftHandoverSchema>;

// ─── Ro'yxat filtri ───────────────────────────────────────────────────────────
export const ShiftHandoverFilterSchema = z.object({
  warehouseId: z.string().max(40).optional(),
  status:      z.string().max(24).optional(),
  limit:       z.coerce.number().int().positive().max(200).default(50),
  offset:      z.coerce.number().int().min(0).default(0),
});
export type ShiftHandoverFilterDto = z.infer<typeof ShiftHandoverFilterSchema>;

// ─── Qaytariladigan-tara (poddon / rohler) yozuvi ─────────────────────────────
export const ReturnablePalletSchema = z.object({
  warehouseId:      z.string().max(40).optional(),
  palletType:       z.string().min(1).max(40),         // 'pallet' (poddon) | 'roller' (rohler) | ...
  direction:        z.enum(['out', 'in']),             // 'out' = berildi, 'in' = qaytdi
  quantity:         z.number().positive(),
  counterpartyId:   z.number().int().positive().optional(),
  handoverId:       z.number().int().positive().optional(),
  movementId:       z.number().int().positive().optional(),
  photoEvidenceUrl: z.string().max(2048).optional(),
  note:             z.string().max(MAX_NOTES_LENGTH).optional(),
});
export type ReturnablePalletDto = z.infer<typeof ReturnablePalletSchema>;

export const ReturnablePalletFilterSchema = z.object({
  warehouseId:    z.string().max(40).optional(),
  palletType:     z.string().max(40).optional(),
  counterpartyId: z.coerce.number().int().positive().optional(),
});
export type ReturnablePalletFilterDto = z.infer<typeof ReturnablePalletFilterSchema>;
