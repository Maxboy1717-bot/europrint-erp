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
  recategorizeDefect(id: string, defectType: string): Promise<Result<{ id: number; defectType: string }>>;
  setWasteCategory(id: string, category: 'production' | 'setup'): Promise<Result<{ id: number; wasteCategory: string }>>;
  // Owner decision 2026-07-13 (chat) — customer-fault flag; inspectionId/defectCode are
  // returned alongside so the handler can publish QcDefectCustomerFaultEvent without a
  // second round-trip query.
  setFaultAttribution(
    id: string,
    isCustomerFault: boolean,
  ): Promise<Result<{ id: number; isCustomerFault: boolean; inspectionId: number | null; defectCode: string }>>;
  getDefectStats(): Promise<Result<{ byStatus: Record<string, number>; bySeverity: Record<string, number>; totalQuantity: number; resolvedThisMonth: number }>>;
  findReclamationById(id: number): Promise<Result<Reclamation | null>>;
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
    return new Defect(String(row.id), String(row.inspectionId ?? ''), String(row.productionOrderId ?? ''), String(row.workCenterId ?? ''), String(row.defectCode ?? ''), String(row.description ?? ''), row.severity as DefectSeverity, row.status as DefectStatus, Number(row.quantity), String(row.unit ?? ''), String(row.reportedBy ?? ''), row.resolvedBy ? String(row.resolvedBy) : null, row.resolvedAt as Date | null, row.resolution ? String(row.resolution) : null, row.createdAt as Date, row.updatedAt as Date,
      row.papkaOrderId != null ? Number(row.papkaOrderId) : null,
      row.stage != null ? String(row.stage) : null,
      row.costImpact != null ? Number(row.costImpact) : null,
      row.isReworkable != null ? Boolean(row.isReworkable) : null,
      row.reworked != null ? Boolean(row.reworked) : null,
      row.brakDate != null ? String(row.brakDate) : null,
    );
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
      // Live qc_defects.id is an INTEGER sequence (Drizzle drift declares text/uuid); the handler hands
      // a random STRING id, which cast-crashed every report-defect (22P02). Let the sequence assign id.
      // production_order_id / work_center_id are uuid columns but the system's PO/WC ids are integers,
      // so they can't be stored here -- the defect links via inspection_id (integer). Raw SQL, no cast.
      const inspectionId = defect.inspectionId != null && String(defect.inspectionId) !== '' ? Number(defect.inspectionId) : null;
      // QC-birlashtirish (2026-07-02): brak-maxsus ustunlar (qc_braks-dan ko'chirilgan) --
      // faqat createBrak oqimida to'ldiriladi, oddiy defect report'da NULL qoladi.
      await db.execute(sql`
        INSERT INTO qc_defects (inspection_id, defect_code, description, severity, status, quantity, unit, reported_by, created_at, updated_at, papka_order_id, stage, cost_impact, is_reworkable, reworked, brak_date)
        VALUES (${inspectionId}, ${defect.defectCode}, ${defect.description}, ${defect.severity}, ${defect.status}, ${defect.quantity}, ${defect.unit}, ${defect.reportedBy}, NOW(), NOW(), ${defect.papkaOrderId}, ${defect.stage}, ${defect.costImpact}, ${defect.isReworkable}, ${defect.reworked}, ${defect.brakDate})`);
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

  // Vision 18-notifications#20: operator faqat "brak" bosadi; brak tabiatini (defect_type)
  // QC texnolog belgilaydi/qayta-toifalaydi. Xom SQL — live qc_defects.id INTEGER sequence,
  // defect_type Drizzle sxemasida yo'q (drift), shuning uchun saveDefect kabi parametrli xom SQL.
  async recategorizeDefect(id: string, defectType: string): Promise<Result<{ id: number; defectType: string }>> {
    try {
      const oid = Number.parseInt(id, 10);
      if (!Number.isInteger(oid) || oid <= 0) {
        return { ok: false as const, error: { code: 'NOT_FOUND' as const, message: 'Defect not found' } };
      }
      const res = await db.execute(sql`
        UPDATE qc_defects
        SET defect_type = ${defectType}, updated_at = NOW()
        WHERE id = ${oid}
        RETURNING id, defect_type AS "defectType"`);
      const rows = ((res as unknown as { rows?: Array<{ id: number; defectType: string }> }).rows) ?? [];
      const row = rows[0];
      if (!row) {
        return { ok: false as const, error: { code: 'NOT_FOUND' as const, message: 'Defect not found' } };
      }
      return { ok: true as const, data: row };
    } catch (error: unknown) {
      this.logger.error('Failed to recategorize defect');
      return { ok: false as const, error: { code: 'INTERNAL' as const, message: 'Failed to recategorize defect' } };
    }
  }

  // vision 09-qc#96 (APPROVED owner 2026-07-11 Q-35): setup/priladka braki alohida hisoblansin.
  // Xom parametrli SQL -- live qc_defects.id INTEGER sequence (Drizzle drift uuid), saveDefect kabi.
  async setWasteCategory(id: string, category: 'production' | 'setup'): Promise<Result<{ id: number; wasteCategory: string }>> {
    try {
      const oid = Number.parseInt(id, 10);
      if (!Number.isInteger(oid) || oid <= 0) {
        return { ok: false as const, error: { code: 'NOT_FOUND' as const, message: 'Defect not found' } };
      }
      if (category !== 'production' && category !== 'setup') {
        return { ok: false as const, error: { code: 'VALIDATION' as const, message: 'Invalid waste category' } };
      }
      const res = await db.execute(sql`
        UPDATE qc_defects
        SET waste_category = ${category}, updated_at = NOW()
        WHERE id = ${oid}
        RETURNING id, waste_category AS "wasteCategory"`);
      const rows = ((res as unknown as { rows?: Array<{ id: number; wasteCategory: string }> }).rows) ?? [];
      const row = rows[0];
      if (!row) {
        return { ok: false as const, error: { code: 'NOT_FOUND' as const, message: 'Defect not found' } };
      }
      return { ok: true as const, data: row };
    } catch (error: unknown) {
      this.logger.error('Failed to set waste category');
      return { ok: false as const, error: { code: 'INTERNAL' as const, message: 'Failed to set waste category' } };
    }
  }

  // Owner decision 2026-07-13 (chat): QC defect customer-fault flag -> auto-notify sales
  // manager. Xom parametrli SQL — live qc_defects.id INTEGER sequence (Drizzle drift uuid),
  // recategorizeDefect/setWasteCategory kabi. inspection_id/defect_code RETURNING'ga
  // qo'shildi — chaqiruvchi handler QcDefectCustomerFaultEvent uchun qayta so'rov qilmasin.
  async setFaultAttribution(
    id: string,
    isCustomerFault: boolean,
  ): Promise<Result<{ id: number; isCustomerFault: boolean; inspectionId: number | null; defectCode: string }>> {
    try {
      const oid = Number.parseInt(id, 10);
      if (!Number.isInteger(oid) || oid <= 0) {
        return { ok: false as const, error: { code: 'NOT_FOUND' as const, message: 'Defect not found' } };
      }
      const res = await db.execute(sql`
        UPDATE qc_defects
        SET is_customer_fault = ${isCustomerFault}, updated_at = NOW()
        WHERE id = ${oid}
        RETURNING id, is_customer_fault AS "isCustomerFault", inspection_id AS "inspectionId", defect_code AS "defectCode"`);
      const rows = ((res as unknown as { rows?: Array<{ id: number; isCustomerFault: boolean; inspectionId: number | null; defectCode: string | null }> }).rows) ?? [];
      const row = rows[0];
      if (!row) {
        return { ok: false as const, error: { code: 'NOT_FOUND' as const, message: 'Defect not found' } };
      }
      return { ok: true as const, data: { ...row, defectCode: row.defectCode ?? '' } };
    } catch (error: unknown) {
      this.logger.error('Failed to set defect fault attribution');
      return { ok: false as const, error: { code: 'INTERNAL' as const, message: 'Failed to set defect fault attribution' } };
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
  findReclamationById(id: number) { return this.reclamationRepo.findReclamationById(id); }
  findReclamations(filters: Record<string, unknown>) { return this.reclamationRepo.findReclamations(filters); }
  saveReclamation(r: Reclamation) { return this.reclamationRepo.saveReclamation(r); }
  updateReclamation(r: Reclamation) { return this.reclamationRepo.updateReclamation(r); }
  getReclamationStats() { return this.reclamationRepo.getReclamationStats(); }
}
