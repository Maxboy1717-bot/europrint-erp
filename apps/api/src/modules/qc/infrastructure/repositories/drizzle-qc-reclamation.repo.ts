/**
 * @module drizzle-qc-reclamation.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 *   Uses the canonical INTEGER-PK `qcReclamations` schema (lib/db/src/schema/qc-schema.ts,
 *   re-exported via shared/db/schema-compat-3.ts) which matches the live `qc_reclamations`
 *   table (id = serial, matches `information_schema` — verified 2026-07-02). The previous
 *   version imported the UUID-PK stub from shared/db/schema-misc-qc.ts, which does not
 *   match the live column type and made every reclamation query/write a latent 22P02 crash.
 */

import { Injectable, Logger } from '@nestjs/common';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
import { Result } from '@common/types/result.type';
import { db, qcReclamations } from '@shared/db';
import { typedExecute } from '@shared/db/typed-execute';
import { Reclamation, ReclamationStatus } from '../../domain/aggregates/reclamation.aggregate';
import { DefectSeverity } from '../../domain/aggregates/defect.aggregate';

import { MS_PER_DAY } from '@common/constants/app.constants';

// Re-exported for downstream repos that previously imported this constant from here.
export { qcReclamations };

@Injectable()
export class DrizzleQcReclamationRepo {
  private readonly logger = new Logger(DrizzleQcReclamationRepo.name);

  mapRowToReclamation(row: Record<string, unknown>): Reclamation {
    return new Reclamation(
      Number(row.id),
      String(row.customerName ?? row.clientName ?? ''),
      row.customerId != null ? Number(row.customerId) : null,
      row.orderId ? String(row.orderId) : null,
      String(row.description ?? ''),
      (row.severity as DefectSeverity | null) ?? DefectSeverity.MAJOR,
      (row.status as ReclamationStatus | null) ?? ReclamationStatus.NEW,
      (row.reportedAt as Date | null) ?? (row.createdAt as Date),
      null, // assignedTo — not tracked on the canonical schema (no live writer today).
      row.resolution ? String(row.resolution) : null,
      row.resolvedAt as Date | null,
      row.createdAt as Date,
      row.updatedAt as Date,
    );
  }

  async findReclamationById(id: number): Promise<Result<Reclamation | null>> {
    try {
      const [row] = await db.select().from(qcReclamations).where(eq(qcReclamations.id, id)).limit(1);
      if (!row) return { ok: true as const, data: null };
      return { ok: true as const, data: this.mapRowToReclamation(row as Record<string, unknown>) };
    } catch (error: unknown) {
      this.logger.error('Failed to find reclamation by id');
      return { ok: false as const, error: { code: 'INTERNAL' as const, message: 'Failed to find reclamation' } };
    }
  }

  async findReclamations(filters: { status?: ReclamationStatus; severity?: DefectSeverity; from?: Date; to?: Date; page?: number; limit?: number }): Promise<Result<{ data: Reclamation[]; total: number }>> {
    try {
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const offset = (page - 1) * limit;
      const conditions = [];
      if (filters.status) conditions.push(eq(qcReclamations.status, filters.status));
      if (filters.severity) conditions.push(eq(qcReclamations.severity, filters.severity));
      if (filters.from) conditions.push(gte(qcReclamations.createdAt, filters.from));
      if (filters.to) conditions.push(lte(qcReclamations.createdAt, filters.to));
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      const rows = await db.select().from(qcReclamations).where(whereClause).orderBy(desc(qcReclamations.createdAt)).limit(limit).offset(offset);
      const countResult = await db.select({ count: sql`COUNT(*)` }).from(qcReclamations).where(whereClause);
      return { ok: true as const, data: { data: rows.map((r) => this.mapRowToReclamation(r as Record<string, unknown>)), total: Number(countResult[0]?.count || 0) } };
    } catch (error: unknown) {
      this.logger.error('Failed to find reclamations');
      return { ok: false as const, error: { code: 'INTERNAL' as const, message: 'Failed to find reclamations' } };
    }
  }

  async saveReclamation(reclamation: Reclamation): Promise<Result<Reclamation>> {
    try {
      // id is a DB serial (qc_reclamations_id_seq) — pull it explicitly so the
      // NOT NULL legacy `reclamation_number` business key can embed it (mirrors
      // sd/infrastructure/repositories/drizzle-sd-lost-orders-reclamations.repo.ts).
      const seqRows = await typedExecute<{ n: string }>(sql`SELECT nextval('qc_reclamations_id_seq') AS n`);
      const newId = Number(seqRows[0]?.n ?? 0);
      const year = reclamation.reportedDate.getFullYear();
      const reclamationNumber = `QC-REC-${year}-${String(newId).padStart(5, '0')}`;
      const claimDate = reclamation.reportedDate.toISOString().slice(0, 10);

      const [row] = await db.insert(qcReclamations).values({
        id: newId,
        reclamationNumber,
        // clientName/claimDate/issueType: legacy TZ_04 required columns (no live
        // CHECK, but Drizzle declares them NOT NULL) — filled from the same data
        // the CQRS aggregate collects; issueType has no dedicated input yet so it
        // is recorded as 'other' (a real, valid enum member — not fabricated data).
        clientName: reclamation.customerName,
        claimDate,
        issueType: 'other',
        description: reclamation.description,
        customerName: reclamation.customerName,
        customerId: reclamation.customerId,
        orderId: reclamation.orderId,
        severity: reclamation.severity,
        status: reclamation.status,
        reportedAt: reclamation.reportedDate,
        resolution: reclamation.resolution,
        resolvedAt: reclamation.resolvedAt,
        createdAt: reclamation.createdAt,
        updatedAt: reclamation.updatedAt,
        createdBy: reclamation.createdBy,
      }).returning();
      if (!row) return { ok: false as const, error: { code: 'INTERNAL' as const, message: 'Reclamation insert returned no row' } };
      return { ok: true as const, data: this.mapRowToReclamation(row as Record<string, unknown>) };
    } catch (error: unknown) {
      this.logger.error('Failed to save reclamation');
      return { ok: false as const, error: { code: 'INTERNAL' as const, message: 'Failed to save reclamation' } };
    }
  }

  async updateReclamation(reclamation: Reclamation): Promise<Result<Reclamation>> {
    try {
      await db.update(qcReclamations).set({ status: reclamation.status, resolution: reclamation.resolution, resolvedAt: reclamation.resolvedAt, updatedAt: reclamation.updatedAt }).where(eq(qcReclamations.id, reclamation.id));
      return { ok: true as const, data: reclamation };
    } catch (error: unknown) {
      this.logger.error('Failed to update reclamation');
      return { ok: false as const, error: { code: 'INTERNAL' as const, message: 'Failed to update reclamation' } };
    }
  }

  async getReclamationStats(): Promise<Result<{ byStatus: Record<string, number>; avgResolutionDays: number; openCount: number }>> {
    try {
      const rows = await db.select().from(qcReclamations);
      const byStatus: Record<string, number> = {};
      let totalResolutionDays = 0, resolvedCount = 0, openCount = 0;
      for (const _row of rows) {
        const row = _row as Record<string, unknown>;
        byStatus[String(row.status)] = (byStatus[String(row.status)] || 0) + 1;
        if (row.status === ReclamationStatus.NEW) openCount++;
        if (row.status === ReclamationStatus.RESOLVED && row.resolvedAt) {
          const reportedAt = (row.reportedAt as Date | null) ?? (row.createdAt as Date);
          const days = Math.floor(((row.resolvedAt as Date).getTime() - reportedAt.getTime()) / MS_PER_DAY);
          totalResolutionDays += days;
          resolvedCount++;
        }
      }
      return { ok: true as const, data: { byStatus, avgResolutionDays: resolvedCount > 0 ? Math.round(totalResolutionDays / resolvedCount) : 0, openCount } };
    } catch (error: unknown) {
      this.logger.error('Failed to get reclamation stats');
      return { ok: false as const, error: { code: 'INTERNAL' as const, message: 'Failed to get reclamation stats' } };
    }
  }
}
