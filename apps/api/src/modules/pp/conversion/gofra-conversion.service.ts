/**
 * @module gofra-conversion.service
 * @description ⭐ Gofra/Sloy 3-FORMULA conversion engine (kg ↔ m² ↔ list/sheet).
 *   Vision: CHAT-TARIXI-YANGI-2026-06-08.md §29 (starred AI-conversion element).
 *
 *   This is the centralized PURE math brain. It has NO DB calls and NO @Injectable
 *   side effects in the formulas themselves — every coefficient (GSM, waste %, flute
 *   take-up) is *passed in*, so the whole engine is fully unit-testable without a DB.
 *   A thin repo (`drizzle-gofra-factors.repo.ts`) supplies the flute factors at runtime
 *   from master-data, falling back to owner-#6 defaults when the table is empty.
 *
 *   Relationship to MM `LayerFormulaService` (Q-46 — do not duplicate working code):
 *   `LayerFormulaService` already does kg↔sheet for a material *row* (DB-coupled) for
 *   vision #7. This service is the pure, bidirectional, fully-guarded engine that adds
 *   what MM lacks — a waste/chiqindi factor in Formula 1, direct m²↔kg / m²↔sheet
 *   helpers, and divide-by-zero/negative → Result.Err (never NaN). MM stays the DB
 *   read path; this is the canonical math. They share the same Formula-3 definition.
 *
 * @layer Application (PP) — pure
 */

import { Injectable } from '@nestjs/common';
import { Result, Ok, Err, AppErr } from '@common/result';
import type {
  FluteFactorConfig,
  FluteType,
  GrammageLayer,
  SheetSpec,
} from './gofra-conversion.types';

/**
 * SI unit identities — NOT configurable business coefficients (Qoida 13 allows these:
 * they are the definition of the units, like "1 km = 1000 m"). All business
 * coefficients (take-up, GSM, waste) arrive from master-data via parameters.
 */
const MM2_PER_M2 = 1_000_000; // 1 m² = 1,000,000 mm²
const G_PER_KG = 1000; // 1 kg = 1000 g
const ROUND_DECIMALS = 6; // result rounding to avoid float dust

function round(n: number): number {
  const f = 10 ** ROUND_DECIMALS;
  return Math.round((n + Number.EPSILON) * f) / f;
}

/** Reject non-finite / non-positive where the formula requires a positive number. */
function requirePositive(value: number, label: string): Result<number> {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return Err(AppErr('VALIDATION', `${label} raqam bo'lishi kerak (NaN/cheksiz emas)`));
  }
  if (value <= 0) {
    return Err(AppErr('VALIDATION', `${label} 0 dan katta bo'lishi kerak (berildi: ${value})`));
  }
  return Ok(value);
}

/** Reject negative / non-finite where zero is allowed (e.g. waste %). */
function requireNonNegative(value: number, label: string): Result<number> {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return Err(AppErr('VALIDATION', `${label} raqam bo'lishi kerak (NaN/cheksiz emas)`));
  }
  if (value < 0) {
    return Err(AppErr('VALIDATION', `${label} manfiy bo'lmasligi kerak (berildi: ${value})`));
  }
  return Ok(value);
}

@Injectable()
export class GofraConversionService {
  // ---------------------------------------------------------------------------
  // FORMULA 1 — area (m²) from sheet geometry × count × waste/chiqindi factor
  //   m² = (widthMm × lengthMm / 1_000_000) × sheetCount × (1 + wastePct/100)
  // ---------------------------------------------------------------------------

  /** Flat area of ONE sheet in m² (no waste, no count). */
  sheetAreaM2(sheetWidthMm: number, sheetLengthMm: number): Result<number> {
    const w = requirePositive(sheetWidthMm, 'sheetWidthMm');
    if (!w.ok) return w;
    const l = requirePositive(sheetLengthMm, 'sheetLengthMm');
    if (!l.ok) return l;
    return Ok(round((w.data * l.data) / MM2_PER_M2));
  }

  /** Waste multiplier from a percentage. 5% → 1.05. 0% / undefined → 1. */
  wasteFactor(wastePct?: number): Result<number> {
    const pct = wastePct ?? 0;
    const v = requireNonNegative(pct, 'wastePct');
    if (!v.ok) return v;
    if (v.data > 100) {
      return Err(AppErr('VALIDATION', `wastePct 0–100 oralig'ida bo'lishi kerak (berildi: ${v.data})`));
    }
    return Ok(1 + v.data / 100);
  }

  /**
   * FORMULA 1: total spread area for `sheetCount` sheets, including waste.
   * m² = sheetArea × sheetCount × wasteFactor
   */
  sheetsToM2(sheetCount: number, spec: SheetSpec): Result<number> {
    const n = requirePositive(sheetCount, 'sheetCount');
    if (!n.ok) return n;
    const area = this.sheetAreaM2(spec.sheetWidthMm, spec.sheetLengthMm);
    if (!area.ok) return area;
    const wf = this.wasteFactor(spec.wastePct);
    if (!wf.ok) return wf;
    return Ok(round(area.data * n.data * wf.data));
  }

  /**
   * FORMULA 1 (reverse): how many sheets are needed to cover `m2` of demand,
   * accounting for the same waste factor (more area is consumed per usable sheet).
   * sheetCount = m² / (sheetArea × wasteFactor)
   */
  m2ToSheets(m2: number, spec: SheetSpec): Result<number> {
    const area = this.sheetAreaM2(spec.sheetWidthMm, spec.sheetLengthMm);
    if (!area.ok) return area;
    const wf = this.wasteFactor(spec.wastePct);
    if (!wf.ok) return wf;
    const m = requirePositive(m2, 'm2');
    if (!m.ok) return m;
    const perSheet = area.data * wf.data;
    if (perSheet <= 0) {
      return Err(AppErr('VALIDATION', 'Bir list yuzasi 0 — list soni hisoblab bo\'lmaydi'));
    }
    return Ok(round(m.data / perSheet));
  }

  // ---------------------------------------------------------------------------
  // FORMULA 2 — mass (kg) from area (m²) and grammage (GSM)
  //   kg = m² × (grammageGsm / 1000)
  // ---------------------------------------------------------------------------

  /** FORMULA 2: kg from m² and grammage (g/m²). */
  m2ToKg(m2: number, grammageGsm: number): Result<number> {
    const m = requirePositive(m2, 'm2');
    if (!m.ok) return m;
    const g = requirePositive(grammageGsm, 'grammageGsm');
    if (!g.ok) return g;
    return Ok(round(m.data * (g.data / G_PER_KG)));
  }

  /** FORMULA 2 (reverse): m² from kg and grammage (g/m²). */
  kgToM2(kg: number, grammageGsm: number): Result<number> {
    const k = requirePositive(kg, 'kg');
    if (!k.ok) return k;
    const g = requirePositive(grammageGsm, 'grammageGsm');
    if (!g.ok) return g;
    // g/1000 already guaranteed > 0 by requirePositive on grammageGsm
    return Ok(round(k.data / (g.data / G_PER_KG)));
  }

  // ---------------------------------------------------------------------------
  // FORMULA 3 — corrugated grammage from layers + flute take-up (master-data)
  //   grammage = liner1 + liner2 + (fluteMediumGsm × takeUpFactor[fluteType])
  // ---------------------------------------------------------------------------

  /**
   * FORMULA 3: effective board grammage (g/m²) for a corrugated stack.
   * Liner layers contribute their GSM as-is; flute (medium) layers contribute
   * `gsm × takeUpFactor`, where the factor comes ONLY from the passed-in
   * master-data `factors` config (never hardcoded). If a flute references a
   * factor that is missing/null, the computation fails with Err — it does not
   * silently assume 1.0, because that would understate material usage.
   */
  computeCorrugatedGrammage(
    layers: GrammageLayer[],
    factors: FluteFactorConfig,
  ): Result<number> {
    if (!Array.isArray(layers) || layers.length === 0) {
      return Err(AppErr('VALIDATION', 'Kamida bitta qatlam (liner/flute) kerak'));
    }
    let total = 0;
    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i];
      if (!layer) continue;
      const gsm = requirePositive(layer.gsm, `qatlam[${i}].gsm`);
      if (!gsm.ok) return gsm;

      if (layer.role === 'flute') {
        if (!layer.fluteType) {
          return Err(AppErr('VALIDATION', `qatlam[${i}] flute uchun fluteType kerak`));
        }
        const factor = this.resolveTakeUp(layer.fluteType, factors);
        if (!factor.ok) return factor;
        total += gsm.data * factor.data;
      } else {
        // liner — counted as-is, never multiplied by take-up
        total += gsm.data;
      }
    }
    if (total <= 0) {
      return Err(AppErr('VALIDATION', 'Grammaj 0 — qatlamlarni tekshiring'));
    }
    return Ok(round(total));
  }

  /** Look up a flute's take-up factor from master-data config; Err if missing/null/invalid. */
  resolveTakeUp(fluteType: FluteType, factors: FluteFactorConfig): Result<number> {
    const raw = factors?.[fluteType];
    if (raw === undefined || raw === null) {
      return Err(
        AppErr(
          'VALIDATION',
          `'${fluteType}'-flute uchun take-up faktor master-datada sozlanmagan (egasi to'ldirsin)`,
        ),
      );
    }
    return requirePositive(raw, `take-up[${fluteType}]`);
  }

  // ---------------------------------------------------------------------------
  // Composite chains — the "kg ↔ list avtomatik" convenience paths (§29)
  // ---------------------------------------------------------------------------

  /** kg → m² → list: how many sheets a given kg of material yields. */
  kgToSheets(kg: number, grammageGsm: number, spec: SheetSpec): Result<number> {
    const m2 = this.kgToM2(kg, grammageGsm);
    if (!m2.ok) return m2;
    return this.m2ToSheets(m2.data, spec);
  }

  /** list → m² → kg: the mass of a given number of sheets. */
  sheetsToKg(sheetCount: number, grammageGsm: number, spec: SheetSpec): Result<number> {
    const m2 = this.sheetsToM2(sheetCount, spec);
    if (!m2.ok) return m2;
    return this.m2ToKg(m2.data, grammageGsm);
  }
}
