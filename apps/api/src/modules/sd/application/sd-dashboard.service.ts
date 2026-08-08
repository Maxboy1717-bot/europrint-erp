/**
 * @module sd-dashboard.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Inject } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { ISdDashboardRepo, SD_DASHBOARD_REPO } from '../domain/repositories/i-sd-dashboard.repo';

@Injectable()
export class SdDashboardService {
  constructor(@Inject(SD_DASHBOARD_REPO) private readonly repo: ISdDashboardRepo) {}

  async getOverview(): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const [statsRes, customersRes, extRes, funnelRes, debitorRes] = await Promise.all([
        this.repo.getOverview(),
        this.repo.getTopCustomers(),
        this.repo.getExtendedStats(),
        this.repo.getLeadFunnelStats(),
        this.repo.getDebitorStats(),
      ]);
      const stats = statsRes.ok ? statsRes.data : {};
      const ext = extRes.ok ? extRes.data : {} as Record<string, unknown>;
      const debitor = debitorRes.ok ? debitorRes.data : {} as Record<string, unknown>;
      const funnelRows = funnelRes.ok ? funnelRes.data : [];
      const leadFunnel = Object.fromEntries(funnelRows.map((r) => [String(r['status']), Number(r['count'] ?? 0)]));

      return {
        // Existing shape (SDDashboard.tsx uses overview?.stats)
        stats,
        top_customers: customersRes.ok ? customersRes.data : [],

        // Extended shape (SDOverviewDashboard.tsx uses top-level fields)
        newOrders:    { count: Number(ext['new_orders_count'] ?? 0), amount: Number(ext['new_orders_amount'] ?? 0) },
        inProduction: { count: Number(ext['in_production_count'] ?? 0), amount: Number(ext['in_production_amount'] ?? 0) },
        inWarehouse:  { count: Number(ext['in_warehouse_count'] ?? 0), amount: Number(ext['in_warehouse_amount'] ?? 0) },
        delivering:   { count: Number(ext['delivering_count'] ?? 0), amount: Number(ext['delivering_amount'] ?? 0) },
        debitors:     { count: Number(debitor['debitor_count'] ?? 0), amount: Number(debitor['debitor_amount'] ?? 0) },
        monthlyRevenue:   Number(stats['monthly_revenue'] ?? 0),
        monthlyCollected: Number(debitor['monthly_collected'] ?? 0),
        monthlyOrders:    Number(ext['monthly_orders_count'] ?? 0),
        leadFunnel,
      };
    });
  }

  async getManagerActions(mid: number | null, lim: number) {
    return safeCall(async () => {
      const [pendingAdvR, techChkR] = await Promise.all([
        this.repo.getPendingAdvanceOrders(mid, lim),
        this.repo.getPendingTechCheckpoints(mid, lim),
      ]);
      const pending_advance = pendingAdvR.ok ? pendingAdvR.data : [];
      const tech_checkpoints = techChkR.ok ? techChkR.data : [];
      return { pending_advance, tech_checkpoints, total: pending_advance.length + tech_checkpoints.length };
    });
  }

  async getQuotaStats(mid: number | null) {
    return safeCall(async () => {
      const managersRes = await this.repo.getQuotaStats(mid);
      const managers = managersRes.ok ? managersRes.data : [];
      const totalAchieved = managers.reduce((s, m) => s + (Number(m['achieved']) || 0), 0);
      const totalTarget = managers.reduce((s, m) => s + (Number(m['target']) || 0), 0);
      const now = new Date();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const dayOfMonth = now.getDate();
      return {
        // Array shape for SDDashboard.tsx (use quotaData?.managers)
        managers,
        // Object shape for SDQuotaDashboard.tsx
        quota: {
          target: totalTarget,
          achieved: totalAchieved,
          percent: totalTarget > 0 ? Math.round(totalAchieved / totalTarget * 100) : 0,
          remaining: Math.max(0, totalTarget - totalAchieved),
          dailyTarget: totalTarget > 0 ? Math.round(totalTarget / daysInMonth) : 0,
          dailyActual: dayOfMonth > 0 ? Math.round(totalAchieved / dayOfMonth) : 0,
          pace: totalTarget > 0 && dayOfMonth > 0
            ? Math.round((totalAchieved / totalTarget) / (dayOfMonth / daysInMonth) * 100)
            : 0,
        },
        period: now.toLocaleString('default', { month: 'long', year: 'numeric' }),
        daysLeft: daysInMonth - dayOfMonth,
      };
    });
  }

  async getLeaderboard(period: string | null, lim: number) {
    return safeCall(async () => {
      const rowsRes = await this.repo.getManagerLeaderboard(period, lim);
      const leaderboard = rowsRes.ok ? rowsRes.data : [];
      return { leaderboard, period: period ?? 'monthly' };
    });
  }
}
