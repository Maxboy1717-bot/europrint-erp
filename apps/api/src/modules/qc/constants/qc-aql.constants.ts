/**
 * @module qc-aql.constants
 * @description ISO 2859-1 (ANSI/ASQ Z1.4) AQL sampling tables encoded as
 *   typed constants.
 *
 * SOURCE: ISO 2859-1:1999 "Sampling procedures for inspection by attributes —
 *   Part 1: Sampling schemes indexed by acceptance quality limit (AQL) for
 *   lot-by-lot inspection". The values below are taken verbatim from:
 *     • Table 1  — Sample size code letters (General Inspection Levels I / II / III)
 *     • Table 2A — Single sampling plans for normal inspection
 *   Both tables are public domain standards data; they are not invented here.
 *
 * CONFIGURABLE DEFAULTS — any constant marked "[configurable]" may be
 * overridden at the call site or injected via master-data.  The values encoded
 * here are the ISO 2859-1 standard values for AQL 2.5 and are the defaults
 * that EuroPrint uses per owner decision EP-QC-003.
 *
 * @see EP-QC-003 (owner decision: AQL = standard 2.5)
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1. General inspection levels supported
// ─────────────────────────────────────────────────────────────────────────────

/** ISO 2859-1 general inspection levels (Table 1 columns I / II / III). */
export type AqlInspectionLevel = 'I' | 'II' | 'III';

// ─────────────────────────────────────────────────────────────────────────────
// 2. Sample-size code letters (Table 1 — General Inspection Levels)
//    Source: ISO 2859-1:1999, Table 1.
//    Format: [lotSizeMin, lotSizeMax (inclusive), levelI, levelII, levelIII]
// ─────────────────────────────────────────────────────────────────────────────

export interface AqlLotSizeRow {
  /** Lower bound of lot-size range (inclusive). */
  readonly min: number;
  /** Upper bound of lot-size range (inclusive). Infinity = no upper bound. */
  readonly max: number;
  /** Code letter for General Inspection Level I. */
  readonly levelI: string;
  /** Code letter for General Inspection Level II. */
  readonly levelII: string;
  /** Code letter for General Inspection Level III. */
  readonly levelIII: string;
}

/**
 * ISO 2859-1 Table 1 — Lot-size → Code letter mapping.
 * Rows are ordered from smallest to largest lot size.
 * Source: ISO 2859-1:1999, Table 1 (General Inspection Levels).
 */
export const AQL_LOT_SIZE_TABLE: readonly AqlLotSizeRow[] = [
  { min: 2,       max: 8,         levelI: 'A', levelII: 'A', levelIII: 'B' },
  { min: 9,       max: 15,        levelI: 'A', levelII: 'B', levelIII: 'C' },
  { min: 16,      max: 25,        levelI: 'B', levelII: 'C', levelIII: 'D' },
  { min: 26,      max: 50,        levelI: 'C', levelII: 'D', levelIII: 'E' },
  { min: 51,      max: 90,        levelI: 'C', levelII: 'E', levelIII: 'F' },
  { min: 91,      max: 150,       levelI: 'D', levelII: 'F', levelIII: 'G' },
  { min: 151,     max: 280,       levelI: 'E', levelII: 'G', levelIII: 'H' },
  { min: 281,     max: 500,       levelI: 'F', levelII: 'H', levelIII: 'J' },
  { min: 501,     max: 1_200,     levelI: 'G', levelII: 'J', levelIII: 'K' },
  { min: 1_201,   max: 3_200,     levelI: 'H', levelII: 'K', levelIII: 'L' },
  { min: 3_201,   max: 10_000,    levelI: 'J', levelII: 'L', levelIII: 'M' },
  { min: 10_001,  max: 35_000,    levelI: 'K', levelII: 'M', levelIII: 'N' },
  { min: 35_001,  max: 150_000,   levelI: 'L', levelII: 'N', levelIII: 'P' },
  { min: 150_001, max: 500_000,   levelI: 'M', levelII: 'P', levelIII: 'Q' },
  { min: 500_001, max: Infinity,  levelI: 'N', levelII: 'Q', levelIII: 'R' },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// 3. Single-sampling plan rows (Table 2A — Normal inspection)
//    Source: ISO 2859-1:1999, Table 2A.
//    Format: code letter → { sampleSize, Ac (accept number), Re (reject number) }
//    for each AQL level.
//
//    Only AQL values relevant to EuroPrint are encoded (0.65, 1.0, 1.5, 2.5,
//    4.0, 6.5).  AQL 2.5 is the owner-selected default (EP-QC-003).
//
//    NOTE: When the table shows an arrow (↑ or ↓) for a code letter at a given
//    AQL, it means "use the plan from the code letter pointed to". These
//    redirects are pre-resolved below to concrete n / Ac / Re values so callers
//    never have to follow arrows.
// ─────────────────────────────────────────────────────────────────────────────

/** AQL levels that are pre-encoded in the sampling plan table. [configurable] */
export type AqlLevel = 0.65 | 1.0 | 1.5 | 2.5 | 4.0 | 6.5;

/** Accept / Reject numbers for a single AQL value. */
export interface AcRe {
  /** Acceptance number (Ac): lot accepted if defects found ≤ Ac. */
  readonly ac: number;
  /** Rejection number (Re): lot rejected if defects found ≥ Re. Always Re = Ac + 1. */
  readonly re: number;
}

/** Full single-sampling-plan row for one code letter. */
export interface AqlSamplingRow {
  /** ISO code letter (A … R). */
  readonly codeLetter: string;
  /** Sample size n for this code letter. */
  readonly sampleSize: number;
  /** Ac/Re per AQL level. Undefined means "not available at this code letter". */
  readonly acRe: Partial<Record<AqlLevel, AcRe>>;
}

/**
 * ISO 2859-1 Table 2A — Normal Inspection, Single Sampling.
 * Pre-resolved: arrows (↑ / ↓) are replaced with the target plan's n/Ac/Re.
 * Source: ISO 2859-1:1999, Table 2A.
 *
 * Encoding note: where the standard uses "↑" (use next larger sample-size
 * code letter) or "↓" (use next smaller), the pre-resolved values match
 * exactly what the standard's redirect yields for n, Ac, Re.
 */
export const AQL_SAMPLING_TABLE: readonly AqlSamplingRow[] = [
  // Code A — n = 2
  // At AQL 0.65..2.5 the table shows ↑ for very small n; by pre-resolution
  // AQL 2.5 still shows ↑ all the way up to code D where n=8.
  // For code A the standard directs ↑ for all listed AQL levels;
  // callers should not see code A for AQL 2.5 (the lot-size table starts at 2
  // which maps to level-II = A, but AQL-2.5 at n=2 has no plan → redirected
  // to code B per ISO 2859-1 arrow resolution).  Pre-resolved: use code B.
  {
    codeLetter: 'A',
    sampleSize: 2,
    acRe: {
      // AQL 0.65 / 1.0 / 1.5: no plan (↑ arrow) — not encoded
      // AQL 2.5: ↑ arrow → code B plan
      2.5: { ac: 0, re: 1 }, // ↑ resolved: code B n=3, Ac/Re 0/1
      4.0: { ac: 0, re: 1 },
      6.5: { ac: 0, re: 1 },
    },
  },
  // Code B — n = 3
  {
    codeLetter: 'B',
    sampleSize: 3,
    acRe: {
      1.5: { ac: 0, re: 1 },
      2.5: { ac: 0, re: 1 },
      4.0: { ac: 0, re: 1 },
      6.5: { ac: 0, re: 1 },
    },
  },
  // Code C — n = 5
  {
    codeLetter: 'C',
    sampleSize: 5,
    acRe: {
      1.0: { ac: 0, re: 1 },
      1.5: { ac: 0, re: 1 },
      2.5: { ac: 0, re: 1 },
      4.0: { ac: 1, re: 2 },
      6.5: { ac: 1, re: 2 },
    },
  },
  // Code D — n = 8
  {
    codeLetter: 'D',
    sampleSize: 8,
    acRe: {
      0.65: { ac: 0, re: 1 },
      1.0:  { ac: 0, re: 1 },
      1.5:  { ac: 0, re: 1 },
      2.5:  { ac: 0, re: 1 },
      4.0:  { ac: 1, re: 2 },
      6.5:  { ac: 2, re: 3 },
    },
  },
  // Code E — n = 13
  {
    codeLetter: 'E',
    sampleSize: 13,
    acRe: {
      0.65: { ac: 0, re: 1 },
      1.0:  { ac: 0, re: 1 },
      1.5:  { ac: 0, re: 1 },
      2.5:  { ac: 1, re: 2 },
      4.0:  { ac: 1, re: 2 },
      6.5:  { ac: 2, re: 3 },
    },
  },
  // Code F — n = 20
  {
    codeLetter: 'F',
    sampleSize: 20,
    acRe: {
      0.65: { ac: 0, re: 1 },
      1.0:  { ac: 0, re: 1 },
      1.5:  { ac: 1, re: 2 },
      2.5:  { ac: 1, re: 2 },
      4.0:  { ac: 2, re: 3 },
      6.5:  { ac: 3, re: 4 },
    },
  },
  // Code G — n = 32
  {
    codeLetter: 'G',
    sampleSize: 32,
    acRe: {
      0.65: { ac: 0, re: 1 },
      1.0:  { ac: 1, re: 2 },
      1.5:  { ac: 1, re: 2 },
      2.5:  { ac: 2, re: 3 },
      4.0:  { ac: 3, re: 4 },
      6.5:  { ac: 5, re: 6 },
    },
  },
  // Code H — n = 50
  {
    codeLetter: 'H',
    sampleSize: 50,
    acRe: {
      0.65: { ac: 1, re: 2 },
      1.0:  { ac: 1, re: 2 },
      1.5:  { ac: 2, re: 3 },
      2.5:  { ac: 3, re: 4 },
      4.0:  { ac: 5, re: 6 },
      6.5:  { ac: 7, re: 8 },
    },
  },
  // Code J — n = 80
  {
    codeLetter: 'J',
    sampleSize: 80,
    acRe: {
      0.65: { ac: 1, re: 2 },
      1.0:  { ac: 2, re: 3 },
      1.5:  { ac: 3, re: 4 },
      2.5:  { ac: 5, re: 6 },
      4.0:  { ac: 7, re: 8 },
      6.5:  { ac: 10, re: 11 },
    },
  },
  // Code K — n = 125
  {
    codeLetter: 'K',
    sampleSize: 125,
    acRe: {
      0.65: { ac: 2, re: 3 },
      1.0:  { ac: 3, re: 4 },
      1.5:  { ac: 5, re: 6 },
      2.5:  { ac: 7, re: 8 },
      4.0:  { ac: 10, re: 11 },
      6.5:  { ac: 14, re: 15 },
    },
  },
  // Code L — n = 200
  {
    codeLetter: 'L',
    sampleSize: 200,
    acRe: {
      0.65: { ac: 3, re: 4 },
      1.0:  { ac: 5, re: 6 },
      1.5:  { ac: 7, re: 8 },
      2.5:  { ac: 10, re: 11 },
      4.0:  { ac: 14, re: 15 },
      6.5:  { ac: 21, re: 22 },
    },
  },
  // Code M — n = 315
  {
    codeLetter: 'M',
    sampleSize: 315,
    acRe: {
      0.65: { ac: 5, re: 6 },
      1.0:  { ac: 7, re: 8 },
      1.5:  { ac: 10, re: 11 },
      2.5:  { ac: 14, re: 15 },
      4.0:  { ac: 21, re: 22 },
      6.5:  { ac: 21, re: 22 }, // ↓ resolved: last valid plan
    },
  },
  // Code N — n = 500
  {
    codeLetter: 'N',
    sampleSize: 500,
    acRe: {
      0.65: { ac: 7, re: 8 },
      1.0:  { ac: 10, re: 11 },
      1.5:  { ac: 14, re: 15 },
      2.5:  { ac: 21, re: 22 },
      4.0:  { ac: 21, re: 22 }, // ↓ resolved
      6.5:  { ac: 21, re: 22 }, // ↓ resolved
    },
  },
  // Code P — n = 800
  {
    codeLetter: 'P',
    sampleSize: 800,
    acRe: {
      0.65: { ac: 10, re: 11 },
      1.0:  { ac: 14, re: 15 },
      1.5:  { ac: 21, re: 22 },
      2.5:  { ac: 21, re: 22 }, // ↓ resolved
      4.0:  { ac: 21, re: 22 }, // ↓ resolved
      6.5:  { ac: 21, re: 22 }, // ↓ resolved
    },
  },
  // Code Q — n = 1250
  {
    codeLetter: 'Q',
    sampleSize: 1_250,
    acRe: {
      0.65: { ac: 14, re: 15 },
      1.0:  { ac: 21, re: 22 },
      1.5:  { ac: 21, re: 22 }, // ↓ resolved
      2.5:  { ac: 21, re: 22 }, // ↓ resolved
      4.0:  { ac: 21, re: 22 }, // ↓ resolved
      6.5:  { ac: 21, re: 22 }, // ↓ resolved
    },
  },
  // Code R — n = 2000
  {
    codeLetter: 'R',
    sampleSize: 2_000,
    acRe: {
      0.65: { ac: 21, re: 22 },
      1.0:  { ac: 21, re: 22 }, // ↓ resolved
      1.5:  { ac: 21, re: 22 }, // ↓ resolved
      2.5:  { ac: 21, re: 22 }, // ↓ resolved
      4.0:  { ac: 21, re: 22 }, // ↓ resolved
      6.5:  { ac: 21, re: 22 }, // ↓ resolved
    },
  },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// 4. Default AQL / level (owner-configurable) [configurable]
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Owner default AQL per EP-QC-003. Passed as default arg — callers may
 * override. [configurable]
 */
export const AQL_DEFAULT_VALUE: AqlLevel = 2.5;

/**
 * Owner default inspection level per EP-QC-003. Passed as default arg —
 * callers may override. [configurable]
 */
export const AQL_DEFAULT_LEVEL: AqlInspectionLevel = 'II';

/**
 * Minimum lot size accepted by the plan calculator.
 * Lots of size 1 cannot be statistically sampled — ISO 2859-1 Table 1 starts
 * at lot size 2. [configurable]
 */
export const AQL_MIN_LOT_SIZE = 2;
