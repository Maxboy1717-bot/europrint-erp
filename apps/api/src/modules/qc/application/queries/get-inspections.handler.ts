/**
 * @module get-inspections.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { db, qc_inspections, runQuery } from '@shared/db';
import { eq, sql } from 'drizzle-orm';
import { GetInspectionsQuery } from './get-inspections.query';

type InspectionRow = {
  id: string;
  status: string;
  sampleSize: number;
  referenceType: string;
  createdAt: string;
  // A56 (2026-06-26) QC card-linkage surfaced on the read side: WHO inspected (inspector card)
  // and WHAT production it covers (production card). Null when not yet resolved (no inspector
  // assigned / work-center not tied to an org card). Names resolved via a single JOIN — no N+1.
  inspectorCardId: number | null;
  inspectorCardName: string | null;
  productionCardId: number | null;
  productionCardName: string | null;
};

type RawInspectionRow = {
  id: number | string;
  status: string | null;
  items_checked: number | null;
  reference_type: string | null;
  created_at: Date | string | null;
  inspector_card_id: number | null;
  inspector_card_name: string | null;
  production_card_id: number | null;
  production_card_name: string | null;
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

    // A56: data fetch uses raw parametrized SQL (the live qc_inspections id/inspector_id are INTEGER
    // while the Drizzle decl drifted to uuid — the rest of this module reads it via raw SQL for the
    // same reason). Two LEFT JOINs to org_departments resolve the inspector card + production card
    // names in ONE query (no N+1). Count stays on the Drizzle builder (no card cols needed).
    const statusFilter = query.status ? sql`WHERE i.status = ${query.status}` : sql``;
    const rows = await runQuery<RawInspectionRow>(sql`
      SELECT
        i.id, i.status, i.items_checked, i.reference_type, i.created_at,
        i.inspector_card_id,  ic.name AS inspector_card_name,
        i.production_card_id,  pc.name AS production_card_name
      FROM qc_inspections i
      LEFT JOIN org_departments ic ON ic.id = i.inspector_card_id
      LEFT JOIN org_departments pc ON pc.id = i.production_card_id
      ${statusFilter}
      ORDER BY i.created_at DESC
      LIMIT ${limit} OFFSET ${offset}`);

    const countQuery = query.status
      ? db.select({ count: sql<number>`count(*)::int` }).from(qc_inspections).where(eq(qc_inspections.status, query.status as typeof qc_inspections.$inferSelect.status))
      : db.select({ count: sql<number>`count(*)::int` }).from(qc_inspections);

    const countResult = await countQuery;
    const safeRows = Array.isArray(rows) ? rows : [];

    const items: InspectionRow[] = safeRows.map((r) => ({
      id: String(r.id),
      status: String(r.status ?? 'pending'),
      sampleSize: Number(r.items_checked ?? 0),
      referenceType: String(r.reference_type ?? ''),
      createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at ?? ''),
      inspectorCardId: r.inspector_card_id ?? null,
      inspectorCardName: r.inspector_card_name ?? null,
      productionCardId: r.production_card_id ?? null,
      productionCardName: r.production_card_name ?? null,
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
