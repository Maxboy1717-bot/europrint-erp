/**
 * @module schema-forecast
 * @description Source module. See exports for details.
 */

import {
  pgTable,
  text,
  timestamp,
  decimal,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

/**
 * forecast_series — TZ-06/07/08: Prognoz natijalari jadvali
 *
 * EMA, Holt-Winters, OLS — barcha metodlar natijasi shu yerga yoziladi.
 * ForecastWeeklyJob har dushanba kuni 00:00 UTC barcha materiallar uchun yangilaydi.
 *
 * method: 'EMA' | 'HW' | 'LINEAR'
 *
 * Unique constraint: (material_id, period, method) — haftalik upsert idempotensi kafolati.
 */
export const forecast_series = pgTable(
  'forecast_series',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    material_id: text('material_id').notNull(),
    period: timestamp('period', { withTimezone: true }).notNull(),
    actual_qty: decimal('actual_qty', { precision: 14, scale: 3 }),
    forecast_qty: decimal('forecast_qty', { precision: 14, scale: 3 }).notNull(),
    method: text('method').notNull(), // 'EMA' | 'HW' | 'LINEAR'
    alpha: decimal('alpha', { precision: 6, scale: 4 }),
    rmse: decimal('rmse', { precision: 14, scale: 6 }),
    mape: decimal('mape', { precision: 10, scale: 4 }),
    mae: decimal('mae', { precision: 14, scale: 6 }),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    matPeriodMethodUq: uniqueIndex('forecast_series_mat_period_method_uq').on(
      t.material_id,
      t.period,
      t.method,
    ),
    matPeriodIdx: index('forecast_series_mat_period_idx').on(t.material_id, t.period),
    methodIdx: index('forecast_series_method_idx').on(t.method),
  }),
);
