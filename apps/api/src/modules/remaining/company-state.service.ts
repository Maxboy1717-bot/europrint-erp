/**
 * @module company-state.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { CompanyStateRepository } from './company-state.repository';

const THRESHOLDS = {
  profit:    { osish: 130_000_000, normal: 100_000_000, ehtiyot: 70_000_000, xavf: 40_000_000 },
  revenue:   { osish: 1_000_000_000, normal: 800_000_000, ehtiyot: 600_000_000, xavf: 400_000_000 },
  retention: { osish: 98, normal: 95, ehtiyot: 90, xavf: 85 },
};
type StateKey = 'osish' | 'normal' | 'ehtiyot' | 'xavf' | 'inqiroz';

const STATE_LABELS: Record<StateKey, { uz: string; ru: string; emoji: string }> = {
  osish:   { uz: "O'SISH",  ru: 'РОСТ',      emoji: '🚀' },
  normal:  { uz: 'NORMAL',  ru: 'НОРМА',     emoji: '✅' },
  ehtiyot: { uz: 'EHTIYOT', ru: 'ОСТОРОЖНО', emoji: '⚠️' },
  xavf:    { uz: 'XAVF',    ru: 'РИСК',      emoji: '🔶' },
  inqiroz: { uz: 'INQIROZ', ru: 'КРИЗИС',    emoji: '🚨' },
};

function calcStateKey(profit: number, revenue: number, retentionPct: number): StateKey {
  const t = THRESHOLDS;
  if (profit >= t.profit.osish && revenue >= t.revenue.osish && retentionPct >= t.retention.osish) return 'osish';
  if (profit >= t.profit.normal && revenue >= t.revenue.normal && retentionPct >= t.retention.normal) return 'normal';
  if (profit >= t.profit.ehtiyot && revenue >= t.revenue.ehtiyot && retentionPct >= t.retention.ehtiyot) return 'ehtiyot';
  if (profit >= t.profit.xavf || revenue >= t.revenue.xavf || retentionPct >= t.retention.xavf) return 'xavf';
  return 'inqiroz';
}

@Injectable()
export class CompanyStateService {
  private readonly logger = new Logger(CompanyStateService.name);

  constructor(private readonly repo: CompanyStateRepository) {}

  async getCurrent(): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const [revenueR, expensesR, empR, orderCountR] = await Promise.all([
        this.repo.getRevenue(),
        this.repo.getExpenses(),
        this.repo.getEmployeeStats(),
        this.repo.getActiveOrderCount(),
      ]);
      const revenue    = revenueR.ok ? (revenueR.data as number) : 0;
      const expenses   = expensesR.ok ? (expensesR.data as number) : 0;
      const empData    = (empR.ok ? empR.data : { total: 0, active: 0 }) as { total: number; active: number };
      const orderCount = orderCountR.ok ? (orderCountR.data as number) : 0;
      const profit       = revenue - expenses;
      const retentionPct = empData.total > 0 ? Math.round((empData.active / empData.total) * 100) : 0;
      const stateKey     = calcStateKey(profit, revenue, retentionPct);
      const label        = STATE_LABELS[stateKey];
      const fmt = (n: number) =>
        n >= 1_000_000_000 ? `${(n / 1_000_000_000).toFixed(1)} mlrd` :
        n >= 1_000_000     ? `${(n / 1_000_000).toFixed(1)} mln` :
        n.toLocaleString('uz-UZ');
      return {
        state: stateKey,
        label: { uz: label.uz, ru: label.ru, emoji: label.emoji },
        kpis: { profit, revenue, expenses, retentionPct, totalEmployees: empData.total, activeEmployees: empData.active, activeOrders: orderCount },
        summary: { profitFormatted: fmt(profit), revenueFormatted: fmt(revenue), expensesFormatted: fmt(expenses) },
        thresholds: THRESHOLDS,
        generatedAt: _time.now().toISOString(),
      };
    });
  }
}
