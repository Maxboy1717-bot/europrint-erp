/**
 * @module drizzle-defect.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger } from '@nestjs/common';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
import { Result, Ok, Err } from '@common/types/result.type';
import { db, qc_defects as qcDefects } from '@shared/db';
import { Defect, DefectSeverity, DefectStatus } from '../../domain/aggregates/defect.aggregate';
import { Reclamation, ReclamationStatus } from '../../domain/aggregates/reclamation.aggregate';
import { DrizzleQcReclamationRepo } from './drizzle-qc-reclamation.repo';

/**
 * DI token for IQcDefectRepository — Symbol-based to avoid string-literal collisions.
 * (P2-20: replaces the legacy `'IQcDefectRepository'` string token.)
 */
export const QC_DEFECT_REPO = Symbol('QC_DEFECT_REPO');

export interface IQcDefectRepository {
  findDefectById(id: string): Promise<Result<Defect | null>>;
  findDefects(filters: { severity?: DefectSeverity; status?: DefectStatus; productionOrderId?: string; from?: Date; to?: Date; page?: number; limit?: number }): Promise<Result<{ data: Defect[]; total: number }>>;
  saveDefect(defect: Defect): Promise<Result<Defect>>;
  updateDefect(defect: Defect): Promise<Result<Defect>>;
  getDefectStats(): Promise<Result<{ byStatus: Record<string, number>; bySeverity: Record<string, number>; totalQuantity: number; resolvedThisMonth: number }>>;
  findReclamationById(id: string): Promise<Result<Reclamation | null>>;
  findReclamations(filters: { status?: ReclamationStatus; severity?: DefectSeverity; from?: Date; to?: Date; page?: number; limit?: number }): Promise<Result<{ data: Reclamation[]; total: number }>>;
  saveReclamation(reclamation: Reclamation): Promise<Result<Reclamation>>;
  updateReclamation(reclamation: Reclamation): Promise<Result<Reclamation>>;
  getReclamationStats(): Promise<Result<{ byStatus: Record<string, number>; avgResolutionDays: number; openCount: number }>>;
}

@Injectable()
export class DrizzleDefectRepository implements IQcDefectRepository {
  private readonly logger = new Logger(DrizzleDefectRepository.name);

  constructor(private readonly reclamationRepo: DrizzleQcReclamationRepo) {}

  private mapRowToDefect(row: Record<string, unknown>): Defect {
    return new Defect(String(row.id), String(row.inspectionId ?? ''), String(row.productionOrderId ?? ''), String(row.workCenterId ?? ''), String(row.defectCode ?? ''), String(row.description ?? ''), row.severity as DefectSeverity, row.status as DefectStatus, Number(row.quantity), String(row.unit ?? ''), String(row.reportedBy ?? ''), row.resolvedBy ? String(row.resolvedBy) : null, row.resolvedAt as Date | null, row.resolution ? String(row.resolution) : null, row.createdAt as Date, row.updatedAt as Date);
  }

  async findDefectById(id: string): Promise<Result<Defect | null>> {
    try {
      const [row] = await db.select().from(qcDefects).where(eq(qcDefects.id, id)).limit(1);
      if (!row) return { ok: true as const, data: null };
      return { ok: true as const, data: this.mapRowToDefect(row as Record<string, unknown>) };
    } catch (error: unknown) {
      this.logger.error('Failed to find defect by id');
      return { ok: false as const, error: { code: 'INTERNAL' as const, message: 'Failed to find defect' } };
    }
  }

  async findDefects(filters: { severity?: DefectSeverity; status?: DefectStatus; productionOrderId?: string; from?: Date; to?: Date; page?: number; limit?: number }): Promise<Result<{ data: Defect[]; total: number }>> {
    try {
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const offset = (page - 1) * limit;
      const conditions = [];
      if (filters.severity) conditions.push(eq(qcDefects.severity, filters.severity));
      if (filters.status) conditions.push(eq(qcDefects.status, filters.status));
      if (filters.productionOrderId) conditions.push(eq(qcDefects.productionOrderId, filters.productionOrderId));
      if (filters.from) conditions.push(gte(qcDefects.createdAt, filters.from));
      if (filters.to) conditions.push(lte(qcDefects.createdAt, filters.to));
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      const rows = await db.select().from(qcDefects).where(whereClause).orderBy(desc(qcDefects.createdAt)).limit(limit).offset(offset);
      const countResult = await db.select({ count: sql`COUNT(*)` }).from(qcDefects).where(whereClause);
      return { ok: true as const, data: { data: rows.map((r) => this.mapRowToDefect(r as Record<string, unknown>)), total: Number(countResult[0]?.count || 0) } };
    } catch (error: unknown) {
      this.logger.error('Failed to find defects');
      return { ok: false as const, error: { code: 'INTERNAL' as const, message: 'Failed to find defects' } };
    }
  }

  async saveDefect(defect: Defect): Promise<Result<Defect>> {
    try {
      await db.insert(qcDefects).values({ id: defect.id, inspectionId: defect.inspectionId, productionOrderId: defect.productionOrderId, workCenterId: defect.workCenterId, defectCode: defect.defectCode, description: defect.description, severity: defect.severity, status: defect.status, quantity: defect.quantity.toString(), unit: defect.unit, reportedBy: defect.reportedBy, resolvedBy: defect.resolvedBy, resolvedAt: defect.resolvedAt, resolution: defect.resolution, createdAt: defect.createdAt, updatedAt: defect.updatedAt });
      return { ok: true as const, data: defect };
    } catch (error: unknown) {
      this.logger.error('Failed to save defect');
      return { ok: false as const, error: { code: 'INTERNAL' as const, message: 'Failed to save defect' } };
    }
  }

  async updateDefect(defect: Defect): Promise<Result<Defect>> {
    try {
      await db.update(qcDefects).set({ status: defect.status, resolvedBy: defect.resolvedBy, resolvedAt: defect.resolvedAt, resolution: defect.resolution, updatedAt: defect.updatedAt }).where(eq(qcDefects.id, defect.id));
      return { ok: true as const, data: defect };
    } catch (error: unknown) {
      this.logger.error('Failed to update defect');
      return { ok: false as const, error: { code: 'INTERNAL' as const, message: 'Failed to update defect' } };
    }
  }

  async getDefectStats(): Promise<Result<{ byStatus: Record<string, number>; bySeverity: Record<string, number>; totalQuantity: number; resolvedThisMonth: number }>> {
    try {
      const currentMonth = _time.now();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);
      const rows = await db.select().from(qcDefects);
      const byStatus: Record<string, number> = {};
      const bySeverity: Record<string, number> = {};
      let totalQuantity = 0, resolvedThisMonth = 0;
      for (const _row of rows) {
        const row = _row as Record<string, unknown>;
        byStatus[String(row.status)] = (byStatus[String(row.status)] || 0) + 1;
        bySeverity[String(row.severity)] = (bySeverity[String(row.severity)] || 0) + 1;
        totalQuantity += Number(row.quantity || 0);
        if (row.status === DefectStatus.RESOLVED && row.resolvedAt && (row.resolvedAt as Date) >= currentMonth) resolvedThisMonth++;
      }
      return { ok: true as const, data: { byStatus, bySeverity, totalQuantity, resolvedThisMonth } };
    } catch (error: unknown) {
      this.logger.error('Failed to get defect stats');
      return { ok: false as const, error: { code: 'INTERNAL' as const, message: 'Failed to get defect stats' } };
    }
  }

  // ── Reclamation delegates ──────────────────────────────────────────────────
  findReclamationById(id: string) { return this.reclamationRepo.findReclamationById(id); }
  findReclamations(filters: Record<string, unknown>) { return this.reclamationRepo.findReclamations(filters); }
  saveReclamation(r: Reclamation) { return this.reclamationRepo.saveReclamation(r); }
  updateReclamation(r: Reclamation) { return this.reclamationRepo.updateReclamation(r); }
  getReclamationStats() { return this.reclamationRepo.getReclamationStats(); }
}
