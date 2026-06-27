/**
 * @module warehouse-open.dto
 * @description POS Terminal — etiket config DTO + Zod schema (Qoida 3).
 */

import { z } from 'zod';

/** Etiket o'lcham chegaralari (mm) — termoprinter realistik diapazon. */
export const UpsertLabelConfigSchema = z.object({
  warehouseType:  z.string().min(1).max(64),
  labelWidthMm:   z.number().int().min(10).max(210),
  labelHeightMm:  z.number().int().min(10).max(297),
  template:       z.string().min(1).max(64).default('standard'),
});
export type UpsertLabelConfigDto = z.infer<typeof UpsertLabelConfigSchema>;
