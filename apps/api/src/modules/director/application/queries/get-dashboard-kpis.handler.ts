/**
 * @module get-dashboard-kpis.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { safeNum } from '@common/math';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { db , runQuery } from '@shared/db';
import { SQL, SQLWrapper, sql } from 'drizzle-orm';
import { Ok, Result, safeCall } from '@common/result';
import { GetDashboardKpisQuery } from './get-dashboard-kpis.query';
import { APPROVAL_REPO, IApprovalRepo } from '../../domain/repositories/i-approval.repo';

type Row = Record<string, unknown>;
const exec = async (q: SQL | SQLWrapper): Promise<Row[]> => {
  return (await runQuery<Row>(q)).rows as Row[];
};

interface DashboardKpis {
  salesOrders: number;
  revenue: number;
  pendingApprovals: number;
  activeProduction: number;
  qcPassRate: number;
  lowStockCount: number;
  generatedAt: Date;
  stats?: { pending: number; approvedToday: number; rejectedToday: number; avgApprovalTimeHours: number };
}

@QueryHandler(GetDashboardKpisQuery)
export class GetDashboardKpisHandler implements IQueryHandler<GetDashboardKpisQuery> {
  private readonly logger = new Logger(GetDashboardKpisHandler.name);
  constructor(@Inject(APPROVAL_REPO) private readonly approvalRepo: IApprovalRepo) {}

  async execute(_query: GetDashboardKpisQuery): Promise<Result<DashboardKpis>> {
    const now = _time.now();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const [salesOrdersResult, revenueResult, activeProductionResult, qcPassRateResult, lowStockResult, statsResult] = await Promise.all([
      this.getSalesOrders(), this.getMonthlyRevenue(monthStart), this.getActiveProduction(), this.getQcPassRate(monthStart), this.getLowStockCount(), this.approvalRepo.getStats(),
    ]);
    const salesOrders = salesOrdersResult.ok ? salesOrdersResult.data : 0;
    const revenue = revenueResult.ok ? revenueResult.data : 0;
    const activeProduction = activeProductionResult.ok ? activeProductionResult.data : 0;
    const qcPassRate = qcPassRateResult.ok ? qcPassRateResult.data : 0;
    const lowStockCount = lowStockResult.ok ? lowStockResult.data : 0;
    const pendingApprovalsResult = await this.approvalRepo.findPending({ limit: 1 });
    const pendingApprovals = pendingApprovalsResult.ok && pendingApprovalsResult.data ? pendingApprovalsResult.data.total : 0;
    const kpis: DashboardKpis = { salesOrders, revenue, pendingApprovals, activeProduction, qcPassRate, lowStockCount, generatedAt: _time.now() };
    if (statsResult.ok && statsResult.data) { kpis.stats = statsResult.data; }
    this.logger.log('Dashboard KPIs fetched');
    return Ok(kpis);
  }

  private async getSalesOrders(): Promise<Result<number>> {
    return safeCall(async () => {
      // Live sales_orders has no `status` column (this errored → silent 0). The coarse state
      // is overall_status ∈ {IN_PROCESS,COMPLETED,CANCELLED}; count the open (in-process) ones.
      const r = await exec(sql`SELECT COUNT(*) AS count FROM sales_orders WHERE overall_status NOT IN ('CANCELLED', 'COMPLETED')`);
      return parseInt(String(r[0]?.count ?? '0'), 10);
    }, 'INTERNAL');
  }

  private async getMonthlyRevenue(monthStart: Date): Promise<Result<number>> {
    return safeCall(async () => {
      const r = await exec(sql`SELECT SUM(CAST(paid_amount AS DECIMAL)) AS total FROM invoices WHERE created_at >= ${monthStart}::timestamp AND status = 'paid'`);
      return safeNum(r[0]?.total ?? '0');
    }, 'INTERNAL');
  }

  private async getActiveProduction(): Promise<Result<number>> {
    return safeCall(async () => {
      const r = await exec(sql`SELECT COUNT(*) AS count FROM production_orders WHERE status = 'in_progress'`);
      return parseInt(String(r[0]?.count ?? '0'), 10);
    }, 'INTERNAL');
  }

  private async getQcPassRate(monthStart: Date): Promise<Result<number>> {
    return safeCall(async () => {
      const r = await exec(sql`SELECT CASE WHEN SUM(items_checked) = 0 THEN 0 ELSE (SUM(items_passed)::FLOAT / SUM(items_checked) * 100) END AS pass_rate FROM qc_inspections WHERE created_at >= ${monthStart}::timestamp`);
      return safeNum(r[0]?.pass_rate ?? '0');
    }, 'INTERNAL');
  }

  private async getLowStockCount(): Promise<Result<number>> {
    return safeCall(async () => {
      const r = await exec(sql`SELECT COUNT(*) AS count FROM stock_items WHERE quantity < 10`);
      return parseInt(String(r[0]?.count ?? '0'), 10);
    }, 'INTERNAL');
  }
}
