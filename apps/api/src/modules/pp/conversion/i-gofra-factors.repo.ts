/**
 * @module i-gofra-factors.repo
 * @description Port for reading flute take-up factors (Formula 3 master-data).
 *   Kept separate from the pure GofraConversionService so the math stays DB-free
 *   and unit-testable; the runtime supplies the factor config through this port.
 */

import type { Result } from '@common/result';
import type { FluteFactorConfig } from './gofra-conversion.types';

/** One configurable flute take-up row for display (master-data, owner-editable). */
export interface FluteTypeRow {
  code: string;
  nameUz: string;
  nameRu: string | null;
  takeUpFactor: number | null;
  isActive: boolean;
}

export interface IGofraFactorsRepo {
  /**
   * Load all active flute take-up factors as a {code → factor} config map.
   * Implementations fall back to the owner-#6 defaults when the table is empty
   * (pre-seed), so the conversion engine works before the migration is applied.
   */
  getFluteFactors(): Promise<Result<FluteFactorConfig>>;

  /**
   * Load all active flute types as display rows (code + names + factor).
   * Returns an empty list when the table is missing (migration not applied)
   * so the FE master-data view degrades gracefully — never throws.
   */
  getFluteTypes(): Promise<Result<FluteTypeRow[]>>;
}

export const GOFRA_FACTORS_REPO = Symbol('IGofraFactorsRepo');
