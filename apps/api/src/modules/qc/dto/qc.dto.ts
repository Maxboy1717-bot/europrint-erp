/**
 * @module qc.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';
import { MAX_TITLE_LENGTH, MAX_SHORT_LABEL, MAX_SCORE_VALUE } from '@common/constants/app.constants';

export const QcCreateStandardSchema = z.object({
  name:        z.string().min(1).max(MAX_TITLE_LENGTH),
  category:    z.string().max(MAX_SHORT_LABEL).optional(),
  description: z.string().optional(),
  parameters:  z.record(z.string(), z.unknown()).optional(),
  is_active:   z.boolean().optional(),
});
export type QcCreateStandardDto = z.infer<typeof QcCreateStandardSchema>;

export const QcUpdateStandardSchema = z.object({
  name:        z.string().min(1).max(MAX_TITLE_LENGTH).optional(),
  category:    z.string().max(MAX_SHORT_LABEL).optional(),
  description: z.string().optional(),
  is_active:   z.boolean().optional(),
});
export type QcUpdateStandardDto = z.infer<typeof QcUpdateStandardSchema>;

export const QcCreateFinalInspectionSchema = z.object({
  order_id:      z.number().int().positive().optional(),
  papkaOrderId:  z.number().int().positive().optional(),
  inspector_id:  z.number().int().positive().optional(),
  status:        z.enum(['pending', 'passed', 'failed']).optional(),
  notes:         z.string().optional(),
  comments:      z.string().optional(),
  sampleQty:     z.number().int().min(1).optional(),
  defectQty:     z.number().int().min(0).optional(),
  visualOk:      z.boolean().optional(),
  dimensionsOk:  z.boolean().optional(),
  printOk:       z.boolean().optional(),
  packagingOk:   z.boolean().optional(),
}).refine(
  (d) => (d.order_id != null || d.papkaOrderId != null),
  { message: 'order_id yoki papkaOrderId talab qilinadi' }
);
export type QcCreateFinalInspectionDto = z.infer<typeof QcCreateFinalInspectionSchema>;

export const QcUpdateFinalInspectionSchema = z.object({
  status:      z.enum(['pending', 'passed', 'failed']).optional(),
  inspector_id: z.number().int().positive().optional(),
  notes:       z.string().optional(),
});
export type QcUpdateFinalInspectionDto = z.infer<typeof QcUpdateFinalInspectionSchema>;

export const QcCreateBrakSchema = z.object({
  quantity:       z.number().int().positive(),
  session_id:     z.number().int().positive().optional(),
  material_id:    z.number().int().positive().optional(),
  reason:         z.string().optional(),
  root_cause_id:  z.number().int().positive().optional(),
  reported_by:    z.number().int().positive().optional(),
  papka_order_id: z.number().int().positive().optional(),
  brak_date:      z.string().optional(),
  stage:          z.string().optional(),
  description:    z.string().optional(),
});
export type QcCreateBrakDto = z.infer<typeof QcCreateBrakSchema>;

export const QcCreateSupplierQualitySchema = z.object({
  vendor_id:     z.number().int().positive().optional(),
  supplier_name: z.string().min(1).max(MAX_TITLE_LENGTH),
  material_id:   z.number().int().positive().optional(),
  batch_number:  z.string().optional(),
  sample_size:   z.number().int().min(0).optional(),
  defects_found: z.number().int().min(0).optional(),
  quality_score: z.number().min(0).max(MAX_SCORE_VALUE).optional(),
  notes:         z.string().optional(),
  status:        z.string().optional(),
  receipt_id:    z.number().int().positive().optional(),
});
export type QcCreateSupplierQualityDto = z.infer<typeof QcCreateSupplierQualitySchema>;

export const QcCreateApprovalSchema = z.object({
  type:         z.string().min(1),
  reference_id: z.number().int().positive(),
  approver_id:  z.number().int().positive().optional(),
  notes:        z.string().optional(),
});
export type QcCreateApprovalDto = z.infer<typeof QcCreateApprovalSchema>;

export const QcUpdateApprovalSchema = z.object({
  status: z.string().min(1),
  notes:  z.string().optional(),
});
export type QcUpdateApprovalDto = z.infer<typeof QcUpdateApprovalSchema>;

export const QcUpdateReclamationSchema = z.object({
  status:       z.string().optional(),
  resolution:   z.string().optional(),
  root_cause_id: z.number().int().positive().optional(),
});
export type QcUpdateReclamationDto = z.infer<typeof QcUpdateReclamationSchema>;

export const QcCompleteFinalInspectionSchema = z.object({
  result:       z.string().max(50).optional(),
  notes:        z.string().optional(),
  defect_count: z.number().int().min(0).optional(),
  passed:       z.boolean().optional(),
});
export type QcCompleteFinalInspectionDto = z.infer<typeof QcCompleteFinalInspectionSchema>;

export const QcCreateInProcessInspectionSchema = z.object({
  session_id:   z.number().int().positive(),
  inspector_id: z.number().int().positive().optional(),
  check_point:  z.string().max(MAX_TITLE_LENGTH).optional(),
  sample_size:  z.number().int().min(0),
  defects_found: z.number().int().min(0),
  notes:        z.string().optional(),
});
export type QcCreateInProcessInspectionDto = z.infer<typeof QcCreateInProcessInspectionSchema>;

export const QcCreateRootCauseSchema = z.object({
  name:        z.string().min(1).max(MAX_TITLE_LENGTH),
  description: z.string().optional(),
  category:    z.string().max(MAX_SHORT_LABEL).optional(),
});
export type QcCreateRootCauseDto = z.infer<typeof QcCreateRootCauseSchema>;

export const QcUpdateRootCauseSchema = z.object({
  name:        z.string().min(1).max(MAX_TITLE_LENGTH).optional(),
  description: z.string().optional(),
  category:    z.string().max(MAX_SHORT_LABEL).optional(),
});
export type QcUpdateRootCauseDto = z.infer<typeof QcUpdateRootCauseSchema>;
