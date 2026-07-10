/**
 * @module qc-first-article.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 *
 * 09-qc #62 — First-article (birinchi namuna) approval GATE. Owns all DB access for the
 * qc_first_article_approvals table (Qoida 15: repo-owns-DB). A run is RELEASED only when
 * its single gate row has status='approved'; otherwise the tiraj stays HALTED.
 */

import { Injectable } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { db, qc_first_article_approvals } from '@shared/db';
import { safeCall, Result } from '@common/result';

export type FirstArticleDecision = 'approved' | 'rejected';

export interface FirstArticleGateRow {
  id: number;
  productionOrderId: number;
  inspectionId: number | null;
  status: string;
  sampleSize: number;
  defectCount: number;
  decidedBy: number | null;
  decidedAt: string | null;
  notes: string | null;
}

export interface RecordDecisionInput {
  productionOrderId: number;
  decision: FirstArticleDecision;
  sampleSize: number;
  defectCount: number;
  inspectionId: number | null;
  decidedBy: number | null;
  notes: string | null;
}

const mapRow = (r: Record<string, unknown>): FirstArticleGateRow => ({
  id: Number(r['id']),
  productionOrderId: Number(r['production_order_id']),
  inspectionId: r['inspection_id'] == null ? null : Number(r['inspection_id']),
  status: String(r['status'] ?? 'pending'),
  sampleSize: Number(r['sample_size'] ?? 0),
  defectCount: Number(r['defect_count'] ?? 0),
  decidedBy: r['decided_by'] == null ? null : Number(r['decided_by']),
  decidedAt: r['decided_at'] == null ? null : String(r['decided_at']),
  notes: r['notes'] == null ? null : String(r['notes']),
});

@Injectable()
export class QcFirstArticleRepository {
  /** True when the production order row exists (the FK target for the gate). */
  async productionOrderExists(productionOrderId: number): Promise<Result<boolean>> {
    return safeCall(async () => {
      const r = await db.execute(sql`SELECT 1 FROM production_orders WHERE id = ${productionOrderId} LIMIT 1`);
      return (((r as { rows?: unknown[] }).rows) ?? []).length > 0;
    }, 'DB_ERROR');
  }

  /** The single gate row for a production order, or null when none has been recorded. */
  async findGate(productionOrderId: number): Promise<Result<FirstArticleGateRow | null>> {
    return safeCall(async () => {
      const rows = await db
        .select()
        .from(qc_first_article_approvals)
        .where(eq(qc_first_article_approvals.production_order_id, productionOrderId))
        .limit(1);
      const row = rows[0] as Record<string, unknown> | undefined;
      return row ? mapRow(row) : null;
    }, 'DB_ERROR');
  }

  /**
   * Upsert the first-article decision for a run. The unique constraint on
   * production_order_id guarantees exactly one gate row per run (ON CONFLICT updates it).
   * decided_at is stamped whenever a real decision (approved/rejected) is recorded.
   */
  async recordDecision(input: RecordDecisionInput): Promise<Result<FirstArticleGateRow>> {
    return safeCall(async () => {
      const decidedAt = new Date();
      const rows = await db
        .insert(qc_first_article_approvals)
        .values({
          production_order_id: input.productionOrderId,
          inspection_id: input.inspectionId,
          status: input.decision,
          sample_size: input.sampleSize,
          defect_count: input.defectCount,
          decided_by: input.decidedBy,
          decided_at: decidedAt,
          notes: input.notes,
        })
        .onConflictDoUpdate({
          target: qc_first_article_approvals.production_order_id,
          set: {
            inspection_id: input.inspectionId,
            status: input.decision,
            sample_size: input.sampleSize,
            defect_count: input.defectCount,
            decided_by: input.decidedBy,
            decided_at: decidedAt,
            notes: input.notes,
            updated_at: new Date(),
          },
        })
        .returning();
      return mapRow(rows[0] as Record<string, unknown>);
    }, 'DB_ERROR');
  }
}
