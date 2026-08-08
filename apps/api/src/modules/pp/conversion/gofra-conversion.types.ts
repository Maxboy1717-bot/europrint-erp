/**
 * @module gofra-conversion.types
 * @description Pure value types for the Gofra/Sloy 3-formula conversion engine
 *   (kg <-> m² <-> list/sheet). No NestJS / no DB imports — these are plain data
 *   contracts so the math in `gofra-conversion.service.ts` stays unit-testable.
 *
 * Vision: CHAT-TARIXI-YANGI-2026-06-08.md §29 (⭐ starred element, "kg ↔ list avtomatik"):
 *   Formula 1: m²       = (sheetWidthMm × sheetLengthMm / 1_000_000) × sheetCount × wasteFactor
 *   Formula 2: kg       = m² × (grammageGsm / 1000)
 *   Formula 3: grammage = liner1 + liner2 + (fluteMediumGsm × takeUpFactor[fluteType])
 *
 * RULE (CLAUDE.md Qoida 13 / Q-47 §13): no unit-conversion coefficient is hardcoded
 * in the logic. The flute take-up factors arrive via {@link FluteFactorConfig}, which a
 * thin repo supplies from master-data (or owner-#6 defaults pre-seed). The only literal
 * constants here are the *definitional* unit relations (1 m² = 1_000_000 mm², 1 kg = 1000 g)
 * which are SI identities, not configurable business coefficients.
 * @layer Application (PP) — pure helpers
 */

/**
 * Flute (to'lqin) type codes used by corrugated grammage (Formula 3).
 * A/B/C/E are single-wall flutes; BC/EB are double-wall composites.
 * Codes mirror `pp_flute_types.code` + `material_layer_config.flute_type`.
 */
export type FluteType = 'A' | 'B' | 'C' | 'E' | 'BC' | 'EB' | 'F';

/**
 * Master-data take-up factor table, keyed by flute code.
 * Passed into the pure service so nothing is hardcoded in the math.
 * A value may be `null` when the owner has not yet measured/entered it —
 * the service then refuses to compute (returns Err) instead of guessing.
 */
export type FluteFactorConfig = Partial<Record<FluteType, number | null>>;

/** A single layer of a corrugated board for Formula 3. */
export interface GrammageLayer {
  /** 'liner' (flat facing) or 'flute' (corrugated medium). */
  role: 'liner' | 'flute';
  /** Layer paper weight in grams per m² (GSM). */
  gsm: number;
  /** Required only for flute layers: which flute the take-up factor applies to. */
  fluteType?: FluteType;
}

/** Sheet geometry + spread/waste inputs for Formula 1. */
export interface SheetSpec {
  /** Flat (yoyilgan) sheet width in millimetres. */
  sheetWidthMm: number;
  /** Flat (yoyilgan) sheet length in millimetres. */
  sheetLengthMm: number;
  /**
   * Trim/scrap allowance as a percentage (chiqindi foizi), 0–100.
   * Area is multiplied by (1 + wastePct/100). Optional → treated as 0%.
   */
  wastePct?: number;
}
