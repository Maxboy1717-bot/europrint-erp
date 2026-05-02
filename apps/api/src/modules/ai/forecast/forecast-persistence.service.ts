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
