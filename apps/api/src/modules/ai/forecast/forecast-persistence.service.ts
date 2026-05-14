/**
 * @module forecast-persistence.service
 * @description Persists forecast outputs to `forecast_series` and reads back
 *   historical actuals. Sits between the pure math services (Holt-Winters,
 *   Croston, EMA, linear) and the DB. Different forecast methods write
 *   alongside each other so dashboards can compare model accuracy.
 *
 *   Method enum:
 *     EMA       Exponential moving average
 *     HW        Holt-Winters (seasonal smoothing)
 *     LINEAR    Linear regression
 *     CROSTON   Croston/TSB for sporadic intermittent demand
 *     ENSEMBLE  Weighted blend (used after enough comparison data)
 * @layer Service (AI/forecast)
 *
 * WHY EACH FORECAST METHOD WRITES TO THE SAME TABLE (not separate tables)
 *   The `forecast_series` schema has a `method` discriminator column.
 *   Single-table storage lets the dashboard render "all methods, same chart"
 *   for accuracy comparison. Separate tables would force joins or unions on
 *   every read.
 *
 *   When we eventually pick a single best method per material, the others
 *   are kept as a benchmark — useful for re-tuning later.
 *
 * WHY upsertRecords (not append)
 *   Forecasts get refreshed nightly. A second run for the same
 *   (materialId, period, method) tuple must REPLACE the prior value, not
 *   create a duplicate. Upsert on the natural key ensures the table grows
 *   linearly with periods, not with forecast runs.
 *
 * WHY EMPTY INPUT → Ok(0) (not Err)
 *   The caller may compute "no forecast needed this run" (e.g., zero
 *   historical data for a brand-new SKU). That's normal; returning Err
 *   would force every caller to special-case it. Ok(0) means "I wrote
 *   zero rows, nothing failed".
 *
 * WHY DB error code is 'DB_ERROR' (not 'INTERNAL')
 *   Lets the controller distinguish forecast-math failures (caught
 *   upstream) from DB connection issues (caught here). The Director
 *   AI-Audit panel separates them in its error breakdown.
 */

import { Injectable } from '@nestjs/common';
import { safeNum } from '@common/math/math-utils';
import { Ok, Err, Result, AppError } from '@common/result';
import { ForecastRepository } from './forecast.repository';
import type { ErrorMetrics } from './forecast.service';

export interface ForecastRecord {
  materialId: string;
  period: Date;
  forecastQty: number;
  method: 'EMA' | 'HW' | 'LINEAR' | 'CROSTON' | 'ENSEMBLE';
  actualQty?: number;
  alpha?: number;
  metrics?: ErrorMetrics;
}

function makeErr(msg: string): AppError {
  return { code: 'DB_ERROR', message: msg };
}

/**
 * TZ-06/07/08: Prognoz natijalarini forecast_series jadvaliga yozish.
 *
 * DB ga kirish ForecastRepository orqali amalga oshiriladi.
 *
 * method: 'EMA' | 'HW' | 'LINEAR'
 */
@Injectable()
export class ForecastPersistenceService {
  constructor(private readonly repo: ForecastRepository) {}

  /**
   * Prognoz natijalarini DB ga yozish
   */
  async saveForecast(records: ForecastRecord[]): Promise<Result<number, AppError>> {
    if (!records.length) return Ok(0);

    try {
      const saved = await this.repo.upsertRecords(records);
      return Ok(saved);
    } catch (e) {
      return Err(makeErr(`forecast_series ga yozishda xato: ${String(e)}`));
    }
  }

  /**
   * Material uchun oxirgi n ta actual tarixni yuklash.
   * DB xatosi yoki bo'sh natija → Err yoki Ok([]).
   */
  async loadHistory(materialId: string, limit = 52): Promise<Result<number[], AppError>> {
    try {
      const rows = await this.repo.fetchHistory(materialId, limit);
      return Ok(
        rows
          .map((r) => safeNum(r['actual_qty']))
          .filter((v) => v > 0)
          .reverse(),
      );
    } catch (e) {
      return Err(makeErr(`Tarix yuklashda xato (${materialId}): ${String(e)}`));
    }
  }
}
