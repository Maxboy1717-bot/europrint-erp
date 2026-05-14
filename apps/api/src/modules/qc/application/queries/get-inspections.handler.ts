/**
 * @module get-inspections.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { db, qc_inspections } from '@shared/db';
import { desc, eq, sql } from 'drizzle-orm';
import { GetInspectionsQuery } from './get-inspections.query';

type InspectionRow = {
  id: string;
  status: string;
  sampleSize: number;
  referenceType: string;
  createdAt: string;
};

type InspectionsResponse = {
  ok: boolean;
  data: { items: InspectionRow[]; total: number };
};

@Injectable()
@QueryHandler(GetInspectionsQuery)
export class GetInspectionsHandler implements IQueryHandler<GetInspectionsQuery, InspectionsResponse> {
  private readonly logger = new Logger(GetInspectionsHandler.name);

  async execute(query: GetInspectionsQuery): Promise<InspectionsResponse> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    const base = db.select().from(qc_inspections);
    const filtered = query.status
      ? base.where(eq(qc_inspections.status, query.status as typeof qc_inspections.$inferSelect.status))
      : base;

    const countQuery = query.status
      ? db.select({ count: sql<number>`count(*)::int` }).from(qc_inspections).where(eq(qc_inspections.status, query.status as typeof qc_inspections.$inferSelect.status))
      : db.select({ count: sql<number>`count(*)::int` }).from(qc_inspections);

    const [rows, countResult] = await Promise.all([
      filtered.orderBy(desc(qc_inspections.created_at)).limit(limit).offset(offset),
      countQuery,
    ]);

    const items: InspectionRow[] = rows.map((r) => ({
      id: r.id,
      status: r.status,
      sampleSize: r.items_checked,
      referenceType: r.reference_type,
      createdAt: r.created_at?.toISOString() ?? '',
    }));

    this.logger.log({ page, limit }, 'Inspections retrieved');

    return {
      ok: true,
      data: {
        items,
        total: countResult[0]?.count ?? 0,
      },
    };
  }
}
