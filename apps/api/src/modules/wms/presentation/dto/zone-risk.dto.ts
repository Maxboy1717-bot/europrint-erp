/**
 * @module zone-risk.dto
 * @description Zod schemas + DTO types for the WMS zone at-risk endpoints (Vision 10-warehouse #6).
 */
import { z } from 'zod';

export const ZoneRiskSignalSchema = z.object({
  zoneId: z.number().int().positive(),
  reason: z.string().max(500).optional(),
});
export type ZoneRiskSignalDto = z.infer<typeof ZoneRiskSignalSchema>;

export const ZoneRiskClearSchema = z.object({
  zoneId: z.number().int().positive(),
});
export type ZoneRiskClearDto = z.infer<typeof ZoneRiskClearSchema>;
