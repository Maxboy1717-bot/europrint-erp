/**
 * @module rulon-card.dto
 * @description Zod schemas + DTO types for RULON QOG'OZ KARTA endpoints.
 *   Validatsiya FAQAT Zod (Qoida 3). Chegaralar wms-roll.constants.ts dan keladi.
 */

import { z } from 'zod';
import {
  ROLL_GRAMMAGE_GSM_MIN,
  ROLL_GRAMMAGE_GSM_MAX,
  ROLL_WIDTH_MM_MIN,
  ROLL_WIDTH_MM_MAX,
  ROLL_WEIGHT_KG_MIN,
  ROLL_WEIGHT_KG_MAX,
} from '../../domain/constants/wms-roll.constants';
import { RULON_TYPES, RULON_STATUSES } from '@workspace/db';

export const CreateRulonCardSchema = z.object({
  rollCode: z.string().min(1).max(64).optional(),
  widthMm: z.number().int().min(ROLL_WIDTH_MM_MIN).max(ROLL_WIDTH_MM_MAX),
  diameterMm: z.number().int().positive().optional(),
  grammageGsm: z.number().int().min(ROLL_GRAMMAGE_GSM_MIN).max(ROLL_GRAMMAGE_GSM_MAX),
  initialWeightKg: z.number().min(ROLL_WEIGHT_KG_MIN).max(ROLL_WEIGHT_KG_MAX),
  rollType: z.enum(RULON_TYPES),
  supplier: z.string().max(500).optional(),
  certificate: z.string().max(500).optional(),
  humidityPct: z.number().min(0).max(100).optional(),
  storageZone: z.string().max(40).optional(),
  warehouseId: z.string().max(50).optional(),
});
export type CreateRulonCardDto = z.infer<typeof CreateRulonCardSchema>;

export const ListRulonCardSchema = z.object({
  status: z.enum(RULON_STATUSES).optional(),
  rollType: z.enum(RULON_TYPES).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});
export type ListRulonCardDto = z.infer<typeof ListRulonCardSchema>;

export const UpdateRulonWeightSchema = z.object({
  currentWeightKg: z.number().min(0).max(ROLL_WEIGHT_KG_MAX),
});
export type UpdateRulonWeightDto = z.infer<typeof UpdateRulonWeightSchema>;

export const ChangeRulonStatusSchema = z.object({
  status: z.enum(RULON_STATUSES),
});
export type ChangeRulonStatusDto = z.infer<typeof ChangeRulonStatusSchema>;

export const RemnantSuggestionsQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(20),
});
export type RemnantSuggestionsQueryDto = z.infer<typeof RemnantSuggestionsQuerySchema>;
