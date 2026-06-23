/**
 * @module get-production-queue.handler
 * @description Wave 6 (500K build): wires the REAL but previously caller-less
 *   ProductionPriorityService.buildQueue into an HTTP path (501-routing kabi: real logika ulanmagan edi).
 *   Reads production_orders (id INTEGER — two-worlds YO'Q), maps to SchedulableOrder[], returns the
 *   ranked queue: frozen segment preserved (no-preempt EP-PP-061), flexible = ZARUR→deadline→band.
 *   No DDL. No fabrication (Q-40): ranking derives entirely from real production_orders columns.
 */

import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { Result, Ok, Err } from '@common/result';
import {
  ProductionPriorityService,
  SchedulableOrder,
  PoPriority,
} from '../../domain/services/production-priority.service';
import { GetProductionQueueQuery } from './get-production-queue.query';

/** production_orders.priority is a 1–4 integer band; map to the domain enum (EP-PP-059). */
const PRIORITY_INT_TO_BAND: Readonly<Record<number, PoPriority>> = {
  1: PoPriority.SHOSHILINCH,
  2: PoPriority.YUQORI,
  3: PoPriority.ODDIY,
  4: PoPriority.PAST,
};
/** Sentinel for orders with no/invalid deadline → sorted last, surfaced as null. */
const FAR_FUTURE = new Date(8640000000000000);

@Injectable()
@QueryHandler(GetProductionQueueQuery)
export class GetProductionQueueHandler implements IQueryHandler<GetProductionQueueQuery> {
  private readonly logger = new Logger(GetProductionQueueHandler.name);

  constructor(private readonly priorityService: ProductionPriorityService) {}

  async execute(_query: GetProductionQueueQuery): Promise<Result<Record<string, unknown>[]>> {
    try {
      // SELECT * — production_orders column set varies across envs; read defensively, pick in JS.
      const res = await runQuery(sql`SELECT * FROM production_orders ORDER BY id ASC`);
      const rows = (res.rows ?? []) as Record<string, unknown>[];

      const byId = new Map<number, Record<string, unknown>>();
      const orders: SchedulableOrder[] = rows.map((r, i) => {
        const id = Number(r.id);
        byId.set(id, r);
        const raw = r.planned_end_date ? new Date(String(r.planned_end_date)) : null;
        const deadline = raw && !Number.isNaN(raw.getTime()) ? raw : FAR_FUTURE;
        return {
          id,
          deadline,
          priority: PRIORITY_INT_TO_BAND[Number(r.priority)] ?? PoPriority.ODDIY,
          isUrgent: Boolean(r.is_urgent),
          isFrozen: Boolean(r.is_frozen),
          sequence: i,
        };
      });

      const ranked = this.priorityService.buildQueue(orders);
      if (!ranked.ok) return Err(ranked.error);

      const queue = ranked.data.map((o, idx) => {
        const row = byId.get(o.id) ?? {};
        return {
          rank: idx + 1,
          id: o.id,
          orderNumber: row.order_number ?? null,
          productName: row.product_name ?? null,
          status: row.status ?? null,
          priority: o.priority,
          isUrgent: o.isUrgent ?? false,
          isFrozen: o.isFrozen ?? false,
          deadline: o.deadline === FAR_FUTURE ? null : o.deadline,
        };
      });

      this.logger.debug(`Production queue ranked: ${queue.length} orders`);
      return Ok(queue);
    } catch (e: unknown) {
      this.logger.error(`Failed to build production queue: ${(e as Error).message}`);
      return Err('Ishlab chiqarish navbatini qurishda xatolik');
    }
  }
}
