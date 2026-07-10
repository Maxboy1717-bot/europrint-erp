/**
 * @module mes.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';
import { MES_REASON_MAX_LENGTH, MES_TITLE_MAX_LENGTH, MES_SCORE_MAX } from '../constants/mes.constants';

export const MesCreateProductionSessionSchema = z.object({
  // production_order_id / work_order_id — both accepted (FE sends either); maps to production_sessions.production_order_id
  production_order_id: z.number().int().positive().optional(),
  work_order_id:       z.number().int().positive().optional(),
  // work_center_id / machine_id — both accepted; maps to production_sessions.equipment_id + machine_id
  work_center_id:      z.number().int().positive().optional(),
  machine_id:          z.number().int().positive().optional(),
  operator_id:         z.number().int().positive().optional(),
  product_id:          z.number().int().positive().optional(),
  planned_qty:         z.number().positive().optional(),
  shift:               z.enum(['morning', 'afternoon', 'night']).optional(),
  notes:               z.string().optional(),
});
export type MesCreateProductionSessionDto = z.infer<typeof MesCreateProductionSessionSchema>;

export const MesAddSessionDowntimeSchema = z.object({
  reason:      z.string().min(1).max(MES_REASON_MAX_LENGTH),
  duration_min: z.number().int().min(1).optional(),
});
export type MesAddSessionDowntimeDto = z.infer<typeof MesAddSessionDowntimeSchema>;

export const MesCreateWorkOrderSessionSchema = z.object({
  work_order_id: z.number().int().positive().optional(),
  machine_id:    z.number().int().positive().optional(),
  operator_id:   z.number().int().positive().optional(),
  planned_qty:   z.number().positive().optional(),
  notes:         z.string().optional(),
});
export type MesCreateWorkOrderSessionDto = z.infer<typeof MesCreateWorkOrderSessionSchema>;

export const MesStartSessionSchema = z.object({
  actual_start:  z.string().optional(),
  notes:         z.string().optional(),
  workCenterId:  z.number().int().positive().optional(),
  operatorId:    z.number().int().positive().optional(),
  courseId:      z.number().int().positive().optional(),
});
export type MesStartSessionDto = z.infer<typeof MesStartSessionSchema>;

export const MesCompleteSessionSchema = z.object({
  actual_qty:  z.number().int().min(0).optional(),
  reject_qty:  z.number().int().min(0).optional(),
  notes:       z.string().optional(),
});
export type MesCompleteSessionDto = z.infer<typeof MesCompleteSessionSchema>;

export const MesAddDowntimeSchema = z.object({
  reason:       z.string().min(1).max(MES_REASON_MAX_LENGTH),
  duration_min: z.number().int().min(1).optional(),
  category:     z.enum(['mechanical', 'electrical', 'material', 'operator', 'other']).optional(),
});
export type MesAddDowntimeDto = z.infer<typeof MesAddDowntimeSchema>;

export const MesCreateMaintenanceRequestSchema = z.object({
  title:          z.string().min(1).max(MES_TITLE_MAX_LENGTH),
  description:    z.string().optional(),
  work_center_id: z.number().int().positive().optional(),
  priority:       z.enum(['low', 'medium', 'high', 'urgent']).optional(),
});
export type MesCreateMaintenanceRequestDto = z.infer<typeof MesCreateMaintenanceRequestSchema>;

export const MesUpdateMaintenanceRequestSchema = z.object({
  status:      z.enum(['open', 'in_progress', 'completed', 'cancelled']).optional(),
  assigned_to: z.number().int().positive().optional(),
  notes:       z.string().optional(),
  resolved_at: z.string().optional(),
});
export type MesUpdateMaintenanceRequestDto = z.infer<typeof MesUpdateMaintenanceRequestSchema>;

export const MesUpdateTaskProgressSchema = z.object({
  progress: z.number().int().min(0).max(MES_SCORE_MAX),
  notes:    z.string().optional(),
});
export type MesUpdateTaskProgressDto = z.infer<typeof MesUpdateTaskProgressSchema>;

export const MesShiftHandoverSchema = z.object({
  outgoing_supervisor: z.number().int().positive(),
  incoming_supervisor: z.number().int().positive(),
  notes:               z.string().optional(),
  issues:              z.string().optional(),
});
export type MesShiftHandoverDto = z.infer<typeof MesShiftHandoverSchema>;

// ─── Handover tasdiq (qabul-gate, SB0429) ─────────────────────────────────────
// A handover row is created 'pending' by shiftHandover() above. It stays an
// unconfirmed draft until the RECEIVING supervisor (received_by) confirms it
// with a signature — mirrors the POS 2-signature gate pattern (pos-shift-
// handover.service.ts) scaled to MES's single-receiver schema. Confirming
// without a signature, confirming twice, or confirming as someone other than
// the receiver must all be rejected (enforced in the repository UPDATE WHERE
// clause, not just here).
export const MesConfirmShiftHandoverSchema = z.object({
  signature_data: z.string().min(1).max(MES_TITLE_MAX_LENGTH * 10),
});
export type MesConfirmShiftHandoverDto = z.infer<typeof MesConfirmShiftHandoverSchema>;

export const MesCloseShiftEvaluationSchema = z.object({
  shift_id:          z.number().int().positive(),
  supervisor_id:     z.number().int().positive().optional(),
  production_score:  z.number().int().min(0).max(MES_SCORE_MAX).optional(),
  quality_score:     z.number().int().min(0).max(MES_SCORE_MAX).optional(),
  safety_score:      z.number().int().min(0).max(MES_SCORE_MAX).optional(),
  notes:             z.string().optional(),
});
export type MesCloseShiftEvaluationDto = z.infer<typeof MesCloseShiftEvaluationSchema>;

export const MesPauseSessionSchema = z.object({
  reason: z.string().optional(),
});
export type MesPauseSessionDto = z.infer<typeof MesPauseSessionSchema>;

export const MesCreateSosSchema = z.object({
  reason:         z.string().min(1).max(MES_REASON_MAX_LENGTH),
  session_id:     z.number().int().positive().optional(),
  work_center_id: z.number().int().positive().optional(),
});
export type MesCreateSosDto = z.infer<typeof MesCreateSosSchema>;

export const MesCreateDowntimeEventSchema = z.object({
  session_id: z.number().int().positive(),
  reason_id:  z.number().int().positive().optional(),
  notes:      z.string().optional(),
});
export type MesCreateDowntimeEventDto = z.infer<typeof MesCreateDowntimeEventSchema>;

export const MesRecordDowntimeSchema = MesAddDowntimeSchema;
export type MesRecordDowntimeDto = MesAddDowntimeDto;

export const MesCreateSessionSchema = z.object({
  // /mes/sessions create payload — same shape as production-sessions so user input is not whitelisted away.
  // Accept both snake_case (work_center_id/production_order_id) and camelCase (workCenterId/ppOrderId) fallbacks.
  production_order_id: z.number().int().positive().optional(),
  work_order_id:       z.number().int().positive().optional(),
  ppOrderId:           z.number().int().positive().optional(),
  work_center_id:      z.number().int().positive().optional(),
  workCenterId:        z.number().int().positive().optional(),
  machine_id:          z.number().int().positive().optional(),
  operator_id:         z.number().int().positive().optional(),
  operatorId:          z.number().int().positive().optional(),
  planned_qty:         z.number().positive().optional(),
  shift:               z.enum(['morning', 'afternoon', 'night']).optional(),
  notes:               z.string().optional(),
});
export type MesCreateSessionDto = z.infer<typeof MesCreateSessionSchema>;

export const MesSessionDowntimeSchema = MesAddSessionDowntimeSchema;
export type MesSessionDowntimeDto = MesAddSessionDowntimeDto;

export const MesUpdateSessionQuantitySchema = z.object({
  produced_qty: z.number().int().min(0),
  rejected_qty: z.number().int().min(0).optional(),
});
export type MesUpdateSessionQuantityDto = z.infer<typeof MesUpdateSessionQuantitySchema>;

export const MesMaterialConsumptionSchema = z.object({
  session_id:   z.number().int().positive(),
  material_id:  z.number().int().positive(),
  quantity:     z.number().positive(),
  batch_number: z.string().optional(),
  // To'lqin 3 (material/formula): unit_of_measure ustuni jonli DB'da BOR edi, lekin yozuv-yo'li
  // uni e'tiborsiz qoldirardi → doim NULL (chala data-yo'li, Q-46). Endi uchma-uch ushlanadi.
  // Qiymat = operator kiritadigan material birligi (kg/m²/list/dona). Kanonik gofra-konversiya
  // (m²↔kg, GofraConversionService) ON-consumption semantikasi egasi-qaroriga bog'liq (GATED).
  unit_of_measure: z.string().max(20).optional(),
});
export type MesMaterialConsumptionDto = z.infer<typeof MesMaterialConsumptionSchema>;

// #116 (08-mes, EP-MES-066) — sessiyaga qog'oz formati (list A×B) + gramm + kg yoziladi (aniq material
// sarfi). Barcha maydon ixtiyoriy (qisman yangilash) — repo COALESCE bilan faqat berilganini yozadi;
// .refine kamida bitta maydon berilishini talab qiladi (bo'sh PATCH mantiqsiz).
export const MesSetPaperFormatSchema = z.object({
  format_a: z.number().positive().optional(), // list o'lchami A (mm)
  format_b: z.number().positive().optional(), // list o'lchami B (mm)
  gramm:    z.number().positive().optional(), // grammaj (g/m²)
  kg:       z.number().positive().optional(), // haqiqiy material sarfi (kg)
}).refine(
  (v) => v.format_a != null || v.format_b != null || v.gramm != null || v.kg != null,
  { message: 'Kamida bitta maydon kerak (format_a/format_b/gramm/kg)' },
);
export type MesSetPaperFormatDto = z.infer<typeof MesSetPaperFormatSchema>;
