/**
 * @module warehouse-exit-guard.dto
 * @description DTO + Zod schema — FAZA Q (Ombor AI-kamera nazorati).
 */

import { z } from 'zod';
import { MAX_SHORT_TEXT } from '@common/constants/app.constants';

export const VerifyExitBodySchema = z.object({
  cameraId: z.coerce.number().int().positive(),
  claimedEmployeeId: z.coerce.number().int().positive(),
  /** Chiqish darvozasi kamerasidan olingan surat (base64, data-URI prefiksisiz). */
  imageBase64: z.string().min(1),
  goodsIssueId: z.coerce.number().int().positive().optional(),
});
export type VerifyExitBody = z.infer<typeof VerifyExitBodySchema>;

export const CrossCheckListQuerySchema = z.object({
  anomalyOnly: z.coerce.boolean().default(false),
  limit: z.coerce.number().int().min(1).max(MAX_SHORT_TEXT).default(50),
});
export type CrossCheckListQuery = z.infer<typeof CrossCheckListQuerySchema>;
