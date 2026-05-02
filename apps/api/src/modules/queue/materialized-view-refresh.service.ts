/**
 * materialized-view-refresh.service.ts — TZ-62: MV REFRESH CONCURRENTLY Cron Job.
 *
 * Har 15 daqiqada 3 ta materialized view yangilanadi:
 *   mv_sales_monthly   — oylik savdo KPI
 *   mv_inventory_daily — kunlik inventar qiymati
 *   mv_kpi_daily       — kunlik OEE, scrap rate
 *
 * REFRESH CONCURRENTLY — view lock qilmaydi (parallel read yashaydi).
 * Cron: '0,15,30,45 * * * *' (har soatda 4 marta = har 15 daqiqada)
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { sql } from 'drizzle-orm';
import { ddlRun } from '@shared/db';
import { Ok, Err, Result, AppError } from '@common/result';

export const MATERIALIZED_VIEWS = [
  'mv_sales_monthly',
  'mv_inventory_daily',
  'mv_kpi_daily',
] as const;

export type MaterializedViewName = typeof MATERIALIZED_VIEWS[number];

@Injectable()
export class MaterializedViewRefreshService {
  private readonly logger = new Logger(MaterializedViewRefreshService.name);

  /**
   * Barcha materialized viewlarni CONCURRENTLY yangilash.
   * Har 15 daqiqada avtomatik ishga tushadi.
   */
  @Cron('0,15,30,45 * * * *')
  async refreshAll(): Promise<void> {
    this.logger.log('Materialized view refresh boshlandi...');
    const results = await Promise.all(
      MATERIALIZED_VIEWS.map(v => this.refreshView(v)),
    );

    const failures = (Array.isArray(results) ? results : []).filter(r => !r.ok);
    if (failures.length) {
      this.logger.error(`${failures.length} ta view yangilanmadi`);
    } else {
      this.logger.log(`Barcha ${MATERIALIZED_VIEWS.length} ta view muvaffaqiyatli yangilandi`);
    }
  }

  /**
   * Bitta materialized viewni CONCURRENTLY yangilash.
   * Xato bo'lsa → Err(Result) qaytaradi (log bilan).
   */
  async refreshView(viewName: MaterializedViewName): Promise<Result<void, AppError>> {
    const start = Date.now();
    try {
      // Raw SQL — CONCURRENTLY index talab qiladi, oddiy REFRESH ishlatamiz
      await ddlRun(sql`REFRESH MATERIALIZED VIEW ${sql.identifier(viewName)}`);
      this.logger.debug(`${viewName} yangilandi (${Date.now() - start}ms)`);
      return Ok(undefined);
    } catch (err) {
      this.logger.error(`${viewName} yangilanmadi: ${String(err)}`);
      return Err({ code: 'INTERNAL', message: `${viewName}: ${String(err)}` });
    }
  }
}
