/**
 * NOTE: Raw SQL retained intentionally — Drizzle ORM cannot express:
 *   CTE chain (WITH avg_balances AS ..., current_balances AS ...) with DISTINCT ON
 *   (warehouse_id) per-group latest-row selection in the overstock-alerts query, and
 *   period-window subtraction (date::date - (N * INTERVAL '1 day')) used inside
 *   COUNT(CASE WHEN ...) conditional aggregates for AR aging.
 *   See ARCHITECTURE_RULES.md Rule 4: complex SQL is permitted with documentation.
 *
 * Rule 16: Heavy query bodies live in financial-reports-query.helpers.ts;
 * shared types live in financial-reports-query.types.ts. This file is the facade.
 */

/**
 * @module financial-reports-query.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Result, Ok, Err } from '@common/result';
import {
  queryCashSummary, queryWarehouseBalance, queryReceivables, queryPayables,
  queryBalanceSheet, queryProductionMetrics,
  queryOverstockAlerts, queryOverdueDebtAlerts, queryOutOfStockAlerts,
} from './financial-reports-query.helpers';

export type {
  CashSummary, WarehouseBalance, AgingBucket, BalanceSheet, ProductionMetrics,
} from './financial-reports-query.types';

@Injectable()
export class FinancialReportsQueryService {
  private readonly logger = new Logger(FinancialReportsQueryService.name);

  constructor(private readonly configService: ConfigService) {}

  async getCashSummary(date?: string) {
    const r = await queryCashSummary(date);
    if (!r.ok) this.logger.error(`getCashSummary error: ${String(r.error)}`);
    return r;
  }

  async getWarehouseBalance(warehouseId?: number) {
    const r = await queryWarehouseBalance(warehouseId);
    if (!r.ok) this.logger.error(`getWarehouseBalance error: ${String(r.error)}`);
    return r;
  }

  async getReceivables(date?: string) {
    const overdueRaw = this.configService.get<string>('FINANCIAL_REPORTS_OVERDUE_DAYS');
    const overdueThreshold = overdueRaw ? parseInt(overdueRaw, 10) : 30;
    const r = await queryReceivables(date, overdueThreshold);
    if (!r.ok) this.logger.error(`getReceivables error: ${String(r.error)}`);
    return r;
  }

  async getPayables(date?: string) {
    const r = await queryPayables(date);
    if (!r.ok) this.logger.error(`getPayables error: ${String(r.error)}`);
    return r;
  }

  async getBalanceSheet(date?: string) {
    const r = await queryBalanceSheet(date);
    if (!r.ok) this.logger.error(`getBalanceSheet error: ${String(r.error)}`);
    return r;
  }

  async getProductionMetrics(date?: string) {
    const r = await queryProductionMetrics(date);
    if (!r.ok) this.logger.error(`getProductionMetrics error: ${String(r.error)}`);
    return r;
  }

  async getOverstockAlerts() {
    const overstockRaw = this.configService.get<string>('FINANCIAL_REPORTS_OVERSTOCK_THRESHOLD');
    const threshold = overstockRaw ? parseInt(overstockRaw, 10) : 120;
    const r = await queryOverstockAlerts(threshold);
    if (!r.ok) this.logger.error(`getOverstockAlerts error: ${String(r.error)}`);
    return r;
  }

  async getOverdueDebtAlerts() {
    const odRaw = this.configService.get<string>('FINANCIAL_REPORTS_OVERDUE_DAYS');
    const overdueDays = odRaw ? parseInt(odRaw, 10) : 30;
    const r = await queryOverdueDebtAlerts(overdueDays);
    if (!r.ok) this.logger.error(`getOverdueDebtAlerts error: ${String(r.error)}`);
    return r;
  }

  async getOutOfStockAlerts() {
    const r = await queryOutOfStockAlerts();
    if (!r.ok) this.logger.error(`getOutOfStockAlerts error: ${String(r.error)}`);
    return r;
  }

  async getDashboard(date?: string): Promise<Result<Record<string, unknown>>> {
    try {
      const today = date ?? _time.now().toISOString().slice(0, 10);
      const [cash, warehouse, receivables, payables, balance, production] = await Promise.allSettled([
        this.getCashSummary(today),
        this.getWarehouseBalance(),
        this.getReceivables(today),
        this.getPayables(today),
        this.getBalanceSheet(today),
        this.getProductionMetrics(today),
      ]);

      return Ok({
        date: today,
        cash:        cash.status === 'fulfilled' && cash.value.ok        ? cash.value.data        : null,
        warehouse:   warehouse.status === 'fulfilled' && warehouse.value.ok   ? warehouse.value.data   : null,
        receivables: receivables.status === 'fulfilled' && receivables.value.ok ? receivables.value.data : null,
        payables:    payables.status === 'fulfilled' && payables.value.ok    ? payables.value.data    : null,
        balance:     balance.status === 'fulfilled' && balance.value.ok      ? balance.value.data      : null,
        production:  production.status === 'fulfilled' && production.value.ok  ? production.value.data  : null,
      });
    } catch (e: unknown) {
      return Err((e as Error).message || 'Dashboard ma\'lumotlari topilmadi');
    }
  }
}
