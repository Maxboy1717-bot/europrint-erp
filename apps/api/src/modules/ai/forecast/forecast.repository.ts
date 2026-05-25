/**
 * @module forecast.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable } from '@nestjs/common';
import { rawSql } from '@shared/db';
import { runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { safeNum } from '@common/math/math-utils';
import type { ForecastRecord } from './forecast-persistence.service';

@Injectable()
export class ForecastRepository {
  /**
   * INSERT / UPSERT forecast_series rows.
   * rawSql() = db.execute() — INSERT/UPDATE uchun to'g'ri yo'l.
   * safeNum() — NaN/Infinity/undefined dan himoya.
   */
  async upsertRecords(records: ForecastRecord[]): Promise<number> {
    let saved = 0;
    for (const rec of records) {
      await rawSql(sql`
        INSERT INTO forecast_series
          (material_id, period, forecast_qty, actual_qty, method, alpha, rmse, mape, mae)
        VALUES
        (
          ${rec.materialId},
          ${rec.period.toISOString()},
          ${safeNum(rec.forecastQty)},
          ${rec.actualQty !== undefined ? safeNum(rec.actualQty) : null},
          ${rec.method},
          ${rec.alpha !== undefined ? rec.alpha : null},
          ${rec.metrics?.rmse !== undefined ? rec.metrics.rmse : null},
          ${rec.metrics?.mape !== undefined ? rec.metrics.mape : null},
          ${rec.metrics?.mae !== undefined ? rec.metrics.mae : null}
        )
        ON CONFLICT (material_id, period, method)
        DO UPDATE SET
          forecast_qty = EXCLUDED.forecast_qty,
          alpha        = EXCLUDED.alpha,
          rmse         = EXCLUDED.rmse,
          mape         = EXCLUDED.mape,
          mae          = EXCLUDED.mae
      `);
      saved++;
    }
    return saved;
  }

  /**
   * Material uchun oxirgi n ta actual tarixni yuklash.
   */
  async fetchHistory(materialId: string, limit: number): Promise<Array<Record<string, unknown>>> {
    const result = await runQuery<Record<string, unknown>>(sql`
      SELECT actual_qty
      FROM forecast_series
      WHERE material_id = ${materialId}
        AND actual_qty IS NOT NULL
      ORDER BY period DESC
      LIMIT ${limit}
    `);
    return Array.isArray(result?.rows) ? result.rows : [];
  }
}
