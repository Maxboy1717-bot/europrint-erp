/**
 * @module qc-aql.service
 * @description ISO 2859-1 AQL 2.5 sampling plan calculator.
 *
 *   Pure domain service: no DB access, no NestJS HTTP exceptions, no side
 *   effects.  All inputs arrive as plain arguments; all outputs are
 *   Result<AqlPlan, AppError> values.  This makes the service trivially
 *   unit-testable without any mocking infrastructure.
 *
 * STANDARD REFERENCE
 *   ISO 2859-1:1999 "Sampling procedures for inspection by attributes —
 *   Part 1: Sampling schemes indexed by acceptance quality limit (AQL) for
 *   lot-by-lot inspection".
 *
 *   Algorithm (§10 of the standard):
 *     Step 1 — Determine the lot-size range and look up the sample-size code
 *              letter from Table 1 using the selected inspection level.
 *     Step 2 — Look up the sample size (n) and Acceptance/Rejection numbers
 *              (Ac / Re) from Table 2A (Normal Inspection, Single Sampling)
 *              using the code letter and the selected AQL.
 *     Step 3 — Apply the arrow-resolution rule: if the table entry shows ↑
 *              or ↓, use the plan from the indicated code letter instead.
 *              (Pre-resolved in AQL_SAMPLING_TABLE — see qc-aql.constants.ts.)
 *
 * CONFIGURABILITY
 *   aqlValue and level are passed-in per call (with sensible ISO defaults).
 *   The lookup tables are typed constants from qc-aql.constants.ts and can be
 *   replaced or extended without touching this service's logic.
 *
 * @see EP-QC-003 (owner: AQL = standard AQL 2.5, ISO 2859-1)
 * @see qc-aql.constants.ts (table source)
 * @layer Domain Service — pure compute, no I/O
 */

import { Injectable } from '@nestjs/common';
import { Ok, Err, Result, AppError } from '@common/result';
import {
  AQL_LOT_SIZE_TABLE,
  AQL_SAMPLING_TABLE,
  AQL_DEFAULT_VALUE,
  AQL_DEFAULT_LEVEL,
  AQL_MIN_LOT_SIZE,
  AqlInspectionLevel,
  AqlLevel,
} from '../../constants/qc-aql.constants';

// ─────────────────────────────────────────────────────────────────────────────
// Output type
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Result payload returned by QcAqlService.plan().
 *
 * @property codeLetter  ISO 2859-1 sample-size code letter (A … R).
 * @property sampleSize  Number of units to inspect (n).
 * @property accept      Acceptance number (Ac): lot passes if defects ≤ accept.
 * @property reject      Rejection number (Re): lot fails if defects ≥ reject.
 *                       Always reject = accept + 1 per ISO 2859-1.
 */
export interface AqlPlan {
  codeLetter: string;
  sampleSize: number;
  accept: number;
  reject: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class QcAqlService {
  /**
   * Compute the ISO 2859-1 single-sampling plan for normal inspection.
   *
   * @param lotSize  Total number of units in the inspection lot.  Must be ≥ 2.
   * @param aqlValue AQL percentage value.  Default: 2.5 (owner decision EP-QC-003).
   *                 [configurable — owner may pass a different AQL level]
   * @param level    General Inspection Level I / II / III.  Default: 'II'.
   *                 [configurable — owner may override per product family]
   * @returns        Ok<AqlPlan> on success; Err<AppError> on invalid input.
   *
   * @example
   *   const result = await service.plan(500);
   *   // => Ok({ codeLetter: 'H', sampleSize: 50, accept: 3, reject: 4 })
   *
   *   const result2 = await service.plan(0);
   *   // => Err({ code: 'VALIDATION', message: '...' })
   */
  plan(
    lotSize: number,
    aqlValue: AqlLevel = AQL_DEFAULT_VALUE,
    level: AqlInspectionLevel = AQL_DEFAULT_LEVEL,
  ): Result<AqlPlan, AppError> {
    // ── Guard: lot size must be a positive integer ≥ AQL_MIN_LOT_SIZE ──────
    if (!Number.isFinite(lotSize) || lotSize <= 0) {
      return Err({
        code: 'VALIDATION',
        message: `lotSize must be a positive number; received ${lotSize}`,
      });
    }
    if (!Number.isInteger(lotSize)) {
      return Err({
        code: 'VALIDATION',
        message: `lotSize must be an integer; received ${lotSize}`,
      });
    }
    if (lotSize < AQL_MIN_LOT_SIZE) {
      return Err({
        code: 'VALIDATION',
        message: `lotSize must be ≥ ${AQL_MIN_LOT_SIZE} for ISO 2859-1 sampling; received ${lotSize}`,
      });
    }

    // ── Step 1: Resolve code letter from ISO 2859-1 Table 1 ─────────────────
    const lotRow = AQL_LOT_SIZE_TABLE.find(
      (r) => lotSize >= r.min && lotSize <= r.max,
    );
    if (!lotRow) {
      return Err({
        code: 'INTERNAL',
        message: `No lot-size row found for lotSize=${lotSize} — this should not happen (table covers 2..∞)`,
      });
    }

    const codeLetter: string =
      level === 'I'   ? lotRow.levelI   :
      level === 'III' ? lotRow.levelIII : lotRow.levelII;

    // ── Step 2: Look up the sampling plan from Table 2A ─────────────────────
    const planRow = AQL_SAMPLING_TABLE.find((r) => r.codeLetter === codeLetter);
    if (!planRow) {
      return Err({
        code: 'INTERNAL',
        message: `Code letter '${codeLetter}' not found in sampling table — table may be incomplete`,
      });
    }

    const acRe = planRow.acRe[aqlValue];
    if (acRe === undefined) {
      return Err({
        code: 'VALIDATION',
        message: `AQL ${aqlValue} is not available for code letter '${codeLetter}' (lot size ${lotSize}, level ${level}). ` +
                 `Supported AQL values for this code letter: ${Object.keys(planRow.acRe).join(', ')}`,
      });
    }

    // ── Guard: reject must always be accept + 1 (invariant check) ───────────
    if (acRe.re !== acRe.ac + 1) {
      return Err({
        code: 'INTERNAL',
        message: `ISO 2859-1 invariant violated: Re (${acRe.re}) ≠ Ac (${acRe.ac}) + 1 for code letter '${codeLetter}'`,
      });
    }

    return Ok({
      codeLetter,
      sampleSize: planRow.sampleSize,
      accept: acRe.ac,
      reject: acRe.re,
    });
  }
}
