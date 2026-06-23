/**
 * @module gofra-conversion.dto
 * @description Zod schemas for the Gofra conversion endpoint. Validation is Zod-only
 *   (CLAUDE.md Qoida 3 — class-validator forbidden). Query values arrive as strings
 *   (GET), so numerics are coerced.
 */

import { z } from 'zod';

/** Supported conversion directions for GET /pp/gofra/convert. */
export const GofraDirectionSchema = z.enum([
  'kg_to_m2',
  'm2_to_kg',
  'm2_to_sheets',
  'sheets_to_m2',
  'kg_to_sheets',
  'sheets_to_kg',
]);
export type GofraDirection = z.infer<typeof GofraDirectionSchema>;

/**
 * Convert request. `grammageGsm` is required for any kg-involving direction;
 * sheet geometry is required for any sheet-involving direction. The service
 * enforces these too (defence in depth), but the DTO documents the contract.
 */
export const GofraConvertQuerySchema = z.object({
  direction: GofraDirectionSchema,
  inputValue: z.coerce.number().positive(),
  /** Effective board grammage g/m² (Formula 2). For corrugated, the caller can
   *  instead derive it via /pp/gofra/grammage; here it is supplied directly. */
  grammageGsm: z.coerce.number().positive().optional(),
  sheetWidthMm: z.coerce.number().positive().optional(),
  sheetLengthMm: z.coerce.number().positive().optional(),
  wastePct: z.coerce.number().min(0).max(100).optional(),
});
export type GofraConvertQuery = z.infer<typeof GofraConvertQuerySchema>;

export interface GofraConvertResponse {
  direction: GofraDirection;
  inputValue: number;
  inputUnit: string;
  outputValue: number;
  outputUnit: string;
}

/** A single layer for the grammage (Formula 3) endpoint. */
export const GofraLayerSchema = z.object({
  role: z.enum(['liner', 'flute']),
  gsm: z.number().positive(),
  fluteType: z.enum(['A', 'B', 'C', 'E', 'BC', 'EB', 'F']).optional(),
});

/** Body for POST /pp/gofra/grammage — compute corrugated grammage (Formula 3). */
export const GofraGrammageBodySchema = z.object({
  layers: z.array(GofraLayerSchema).min(1),
});
export type GofraGrammageBody = z.infer<typeof GofraGrammageBodySchema>;

/** Body for PUT /pp/gofra/flute-types/:code — configure (set/change) a flute's take-up factor. */
export const UpdateFluteFactorSchema = z.object({
  takeUpFactor: z.coerce.number().positive().max(5),
});
export type UpdateFluteFactorBody = z.infer<typeof UpdateFluteFactorSchema>;
