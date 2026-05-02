import { Injectable, Logger } from '@nestjs/common';
import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
import { Result, Ok, Err } from '@common/types/result.type';
import { db } from '@shared/db';
import { Reclamation, ReclamationStatus } from '../../domain/aggregates/reclamation.aggregate';
import { DefectSeverity } from '../../domain/aggregates/defect.aggregate';

import { MS_PER_DAY } from '@common/constants/app.constants';
export const qcReclamations = pgTable('qc_reclamations', {
  id: uuid('id').primaryKey().$defaultFn(() => createId()),
  customerName: text('customer_name').notNull(),
  customerId: uuid('customer_id'),
  orderId: uuid('order_id'),
  description: text('description').notNull(),
  severity: text('severity').notNull().default('major'),
  status: text('status').notNull().default('open'),
  reportedDate: timestamp('reported_date', { withTimezone: true }).notNull().defaultNow(),
  assignedTo: text('assigned_to'),
  resolution: text('resolution'),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

@Injectable()
export class DrizzleQcReclamationRepo {
  private readonly logger = new Logger(DrizzleQcReclamationRepo.name);

  mapRowToReclamation(row: Record<string, unknown>): Reclamation {
    return new Reclamation(String(row.id), String(row.customerName ?? ''), row.customerId ? String(row.customerId) : null, row.orderId ? String(row.orderId) : null, String(row.description ?? ''), row.severity as DefectSeverity, row.status as ReclamationStatus, row.reportedDate as Date, row.assignedTo ? String(row.assignedTo) : null, row.resolution ? String(row.resolution) : null, row.resolvedAt as Date | null, row.createdAt as Date, row.updatedAt as Date);
  }

  async findReclamationById(id: string): Promise<Result<Reclamation | null>> {
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
      await db.insert(qcReclamations).values({ id: reclamation.id, customerName: reclamation.customerName, customerId: reclamation.customerId, orderId: reclamation.orderId, description: reclamation.description, severity: reclamation.severity, status: reclamation.status, reportedDate: reclamation.reportedDate, assignedTo: reclamation.assignedTo, resolution: reclamation.resolution, resolvedAt: reclamation.resolvedAt, createdAt: reclamation.createdAt, updatedAt: reclamation.updatedAt });
      return { ok: true as const, data: reclamation };
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
        if (row.status === ReclamationStatus.OPEN) openCount++;
        if (row.status === ReclamationStatus.RESOLVED && row.resolvedAt) {
          const days = Math.floor(((row.resolvedAt as Date).getTime() - (row.reportedDate as Date).getTime()) / MS_PER_DAY);
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
