/**
 * @module financial-reports-snapshot.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { Result } from '@common/result';
import {
  FinancialReportsQueryService,
  CashSummary,
  WarehouseBalance,
  AgingBucket,
  BalanceSheet,
  ProductionMetrics,
} from './financial-reports-query.service';
import { FinancialReportsRepository } from '../repositories/financial-reports.repository';

@Injectable()
export class FinancialReportsSnapshotService {
  constructor(
    private readonly query: FinancialReportsQueryService,
    private readonly repo:  FinancialReportsRepository,
  ) {}

  // ─── Public: fetch + persist (standalone use) ────────────────────────────

  async snapshotAll(date?: string): Promise<void> {
    const d = date ?? _time.now().toISOString().slice(0, 10);
    await Promise.allSettled([
      this.snapshotKassa(d),
      this.snapshotOmbor(d),
      this.snapshotDebitors(d),
      this.snapshotCreditors(d),
      this.snapshotBalans(d),
      this.snapshotIshlab(d),
    ]);
  }

  /** Persist from pre-fetched results — no extra DB reads. */
  async snapshotAllFromPrefetched(
    date: string,
    cash:        Result<CashSummary>,
    warehouse:   Result<WarehouseBalance>,
    receivables: Result<AgingBucket[]>,
    payables:    Result<AgingBucket[]>,
    balance:     Result<BalanceSheet>,
    production:  Result<ProductionMetrics>,
  ): Promise<void> {
    await Promise.allSettled([
      this._saveKassa(date, cash),
      this._saveOmbor(date, warehouse),
      this._saveDebitors(date, receivables),
      this._saveCreditors(date, payables),
      this._saveBalans(date, balance),
      this._saveIshlab(date, production),
    ]);
  }

  async snapshotKassa(date: string): Promise<void> {
    await this._saveKassa(date, await this.query.getCashSummary(date));
  }

  async snapshotOmbor(date: string): Promise<void> {
    await this._saveOmbor(date, await this.query.getWarehouseBalance());
  }

  async snapshotDebitors(date: string): Promise<void> {
    await this._saveDebitors(date, await this.query.getReceivables(date));
  }

  async snapshotCreditors(date: string): Promise<void> {
    await this._saveCreditors(date, await this.query.getPayables(date));
  }

  async snapshotBalans(date: string): Promise<void> {
    await this._saveBalans(date, await this.query.getBalanceSheet(date));
  }

  async snapshotIshlab(date: string): Promise<void> {
    await this._saveIshlab(date, await this.query.getProductionMetrics(date));
  }

  // ─── Private: persist from already-fetched Result ────────────────────────

  private async _saveKassa(date: string, result: Result<CashSummary>): Promise<void> {
    if (!result.ok) return;
    await this.repo.saveKassa(date, result.data);
  }

  private async _saveOmbor(date: string, result: Result<WarehouseBalance>): Promise<void> {
    if (!result.ok) return;
    await this.repo.saveOmbor(date, result.data);
  }

  private async _saveDebitors(date: string, result: Result<AgingBucket[]>): Promise<void> {
    if (!result.ok || result.data.length === 0) return;
    await this.repo.saveDebitors(date, result.data);
  }

  private async _saveCreditors(date: string, result: Result<AgingBucket[]>): Promise<void> {
    if (!result.ok || result.data.length === 0) return;
    await this.repo.saveCreditors(date, result.data);
  }

  private async _saveBalans(date: string, result: Result<BalanceSheet>): Promise<void> {
    if (!result.ok) return;
    await this.repo.saveBalans(date, result.data);
  }

  private async _saveIshlab(date: string, result: Result<ProductionMetrics>): Promise<void> {
    if (!result.ok) return;
    await this.repo.saveIshlab(date, result.data);
  }
}
