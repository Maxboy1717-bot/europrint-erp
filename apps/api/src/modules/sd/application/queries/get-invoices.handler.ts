/**
 * @module get-invoices.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { Result, Ok } from '@common/result';
import { GetInvoicesQuery } from './get-invoices.query';
import { db, invoices } from '@shared/db';
import { and, gte, lte, sql, isNull } from 'drizzle-orm';

@Injectable()
@QueryHandler(GetInvoicesQuery)
export class GetInvoicesHandler implements IQueryHandler<GetInvoicesQuery> {
  private readonly logger = new Logger(GetInvoicesHandler.name);

  constructor() {}

  async execute(query: GetInvoicesQuery): Promise<Result<{ data: Record<string, unknown>[]; pagination: Record<string, unknown> }>> {
      const page = query.page || 1;
      const limit = query.limit || 20;
      const offset = (page - 1) * limit;

      const conditions: import('drizzle-orm').SQL<unknown>[] = [];

      conditions.push(isNull(invoices.deleted_at));

      if (query.salesOrderId) {
        conditions.push(sql`${invoices.sales_order_id} = ${String(query.salesOrderId)}`);
      }
      if (query.status) {
        conditions.push(sql`${invoices.status} = ${String(query.status)}`);
      }
      if (query.from) {
        conditions.push(sql`${invoices.created_at} >= ${query.from}`);
      }
      if (query.to) {
        conditions.push(sql`${invoices.created_at} <= ${query.to}`);
      }

      const whereClause = and(...conditions);

      const [rows, countRows] = await Promise.all([
        db.select().from(invoices).where(whereClause).limit(limit).offset(offset),
        db.select({ count: sql<number>`COUNT(*)::int` }).from(invoices).where(whereClause),
      ]);

      const total = Number(countRows[0]?.count ?? 0);

      return Ok({
        data: rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
  }
}
