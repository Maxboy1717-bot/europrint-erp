/**
 * @module get-order-saga.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { db } from '@shared/db';
import { eq } from 'drizzle-orm';
import { Result, Ok, Err, AppErr } from '@common/types/result.type';
import { safeCall } from '@common/types/result.type';
import { IOrderRepo, ORDER_WF_REPO } from '../../infrastructure/repositories/i-order.repo';
import {
  owMolds, owCliches, owMaterialRequirements,
  owOrderStatusHistory, owPaymentPlanEntries,
} from '@shared/db';

export interface SagaTrackStatus {
  name:   string;
  status: string;
  progressPct: number;
  lastUpdated: Date | null;
  isBottleneck: boolean;
}

export interface OrderSagaResult {
  orderId:    string;
  status:     string;
  stateVersion: number;
  tracks:     SagaTrackStatus[];
  statusHistory: Array<{ from: string | null; to: string; changedAt: Date | null }>;
  paymentPlan: Array<{ sequence: number; dueType: string; percent: string; status: string }>;
}

export class GetOrderSagaQuery {
  constructor(
    public readonly orderId:    string,
    public readonly actorRole:  string = '',
    public readonly actorId:    number = 0,
  ) {}
}

const MOLD_DONE_STATUS   = 'RECEIVED';
const CLICHE_DONE_STATUS = 'arrived_at';
const MAT_DONE_STATUS    = 'ISSUED';
const FULL_PCT = 100;

@QueryHandler(GetOrderSagaQuery)
export class GetOrderSagaHandler implements IQueryHandler<GetOrderSagaQuery> {
  private readonly logger = new Logger(GetOrderSagaHandler.name);

  constructor(@Inject(ORDER_WF_REPO) private readonly repo: IOrderRepo) {}

  async execute(query: GetOrderSagaQuery): Promise<Result<OrderSagaResult>> {
    const found = await this.repo.findById(query.orderId);
    if (!found.ok) return Err(found.error);
    if (!found.data) return Err(AppErr('NOT_FOUND', `Buyurtma topilmadi: ${query.orderId}`));
    const order = found.data;

    if (query.actorRole === 'SALES_MANAGER' && query.actorId > 0) {
      const mgr = order.getSalesManager();
      if (mgr !== null && mgr !== query.actorId) {
        return Err(AppErr('FORBIDDEN', 'Bu buyurtmaga ruxsatingiz yo\'q'));
      }
    }

    const [moldRows, clicheRows, matRows, historyRows, paymentRows] = await Promise.all([
      safeCall(() => db.select().from(owMolds).where(eq(owMolds.orderId, query.orderId)), 'DB_ERROR'),
      safeCall(() => db.select().from(owCliches).where(eq(owCliches.orderId, query.orderId)), 'DB_ERROR'),
      safeCall(() => db.select().from(owMaterialRequirements).where(eq(owMaterialRequirements.orderId, query.orderId)), 'DB_ERROR'),
      safeCall(() => db.select().from(owOrderStatusHistory).where(eq(owOrderStatusHistory.orderId, query.orderId)), 'DB_ERROR'),
      safeCall(() => db.select().from(owPaymentPlanEntries).where(eq(owPaymentPlanEntries.orderId, query.orderId)), 'DB_ERROR'),
    ]);

    if (!historyRows.ok) return Err(historyRows.error);
    if (!paymentRows.ok) return Err(paymentRows.error);
    if (!moldRows.ok)    return Err(moldRows.error);
    if (!clicheRows.ok)  return Err(clicheRows.error);
    if (!matRows.ok)     return Err(matRows.error);

    const moldPct  = this.calcMoldPct(moldRows.data);
    const clichePct = this.calcClichePct(clicheRows.data);
    const matPct   = this.calcMatPct(matRows.data);
    const minPct   = Math.min(moldPct, clichePct, matPct);

    const tracks: SagaTrackStatus[] = [
      { name: 'Mold',     status: 'ORDERED', progressPct: moldPct,   lastUpdated: null, isBottleneck: moldPct   === minPct && minPct < FULL_PCT },
      { name: 'Cliché',   status: 'ORDERED', progressPct: clichePct, lastUpdated: null, isBottleneck: clichePct === minPct && minPct < FULL_PCT },
      { name: 'Material', status: 'NEEDED',  progressPct: matPct,    lastUpdated: null, isBottleneck: matPct    === minPct && minPct < FULL_PCT },
    ];

    const history = (historyRows.ok ? historyRows.data : []).map((h) => ({
      from:       h.fromStatus ?? null,
      to:         h.toStatus,
      changedAt:  h.changedAt,
    }));

    const plan = (paymentRows.ok ? paymentRows.data : []).map((p) => ({
      sequence:  p.sequence,
      dueType:   p.dueType,
      percent:   p.percent,
      status:    p.status,
    }));

    return Ok({
      orderId:       order.getId(),
      status:        order.getStatus(),
      stateVersion:  order.getStateVersion(),
      tracks,
      statusHistory: history,
      paymentPlan:   plan,
    });
  }

  private calcMoldPct(rows: Array<{ status: string }>): number {
    if (!rows.length) return 0;
    const done = (Array.isArray(rows) ? rows : []).filter((r) => r.status === MOLD_DONE_STATUS).length;
    return Math.round((done / rows.length) * FULL_PCT);
  }

  private calcClichePct(rows: Array<{ arrivedAt: Date | null }>): number {
    if (!rows.length) return 0;
    const done = (Array.isArray(rows) ? rows : []).filter((r) => r.arrivedAt !== null).length;
    return Math.round((done / rows.length) * FULL_PCT);
  }

  private calcMatPct(rows: Array<{ status: string }>): number {
    if (!rows.length) return 0;
    const done = (Array.isArray(rows) ? rows : []).filter((r) => r.status === MAT_DONE_STATUS).length;
    return Math.round((done / rows.length) * FULL_PCT);
  }
}
