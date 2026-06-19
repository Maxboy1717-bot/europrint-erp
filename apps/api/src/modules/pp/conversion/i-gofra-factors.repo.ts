/**
 * @module i-gofra-factors.repo
 * @description Port for reading flute take-up factors (Formula 3 master-data).
 *   Kept separate from the pure GofraConversionService so the math stays DB-free
 *   and unit-testable; the runtime supplies the factor config through this port.
 */

import type { Result } from '@common/result';
import type { FluteFactorConfig } from './gofra-conversion.types';

export interface IGofraFactorsRepo {
  /**
   * Load all active flute take-up factors as a {code → factor} config map.
   * Implementations fall back to the owner-#6 defaults when the table is empty
   * (pre-seed), so the conversion engine works before the migration is applied.
   */
  getFluteFactors(): Promise<Result<FluteFactorConfig>>;
}

export const GOFRA_FACTORS_REPO = Symbol('IGofraFactorsRepo');
