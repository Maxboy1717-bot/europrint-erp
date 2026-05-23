/**
 * @module discipline-v2.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { castTo } from '@common/db-rows';
import { db } from '@shared/db';
import { eq, sql } from 'drizzle-orm';
import { safeCall, Result } from '@common/result';
import {
  violation_catalog, discipline_records,
  employee_blocks, hrEmployees, absence_tracking,
} from '@shared/db';

type Row = Record<string, unknown>;

@Injectable()
export class DisciplineV2Repository {
  async getViolationCatalog(): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await db.select()
        .from(violation_catalog)
        .where(eq(violation_catalog.isActive, true))
        .orderBy(sql`${violation_catalog.category}, ${violation_catalog.code}`);
      return castTo<Row[]>(rows);
      }, 'DB_ERROR');
  }

  async createCatalogEntry(dto: { code: string; name: string; category: string; severity: string; defaultFineAmount?: number; description?: string }): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.insert(violation_catalog).values({
        code:                dto.code,
        name:                dto.name,
        category:            dto.category,
        severity:            dto.severity,
        defaultFineAmount: dto.defaultFineAmount != null ? String(dto.defaultFineAmount) : '0',
        description:         dto.description ?? null,
      }).returning();
      return castTo<Row>((rows[0] ?? {}));
      }, 'DB_ERROR');
  }

  async updateCatalogEntry(code: string, dto: { name?: string; category?: string; severity?: string; defaultFineAmount?: number; description?: string; isActive?: boolean }): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.update(violation_catalog).set({
        name:                sql`COALESCE(${dto.name ?? null}, ${violation_catalog.name})`,
        category:            sql`COALESCE(${dto.category ?? null}, ${violation_catalog.category})`,
        severity:            sql`COALESCE(${dto.severity ?? null}, ${violation_catalog.severity})`,
        defaultFineAmount: sql`COALESCE(${dto.defaultFineAmount ?? null}::text, ${violation_catalog.defaultFineAmount})`,
        description:       sql`COALESCE(${dto.description ?? null}, ${violation_catalog.description})`,
        isActive:          sql`COALESCE(${dto.isActive ?? null}, ${violation_catalog.isActive})`,
      }).where(eq(violation_catalog.code, code)).returning();
      return castTo<Row>((rows[0] ?? {}));
      }, 'DB_ERROR');
  }

  async softDeleteCatalogEntry(code: string): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await db.update(violation_catalog)
        .set({ isActive: false })
        .where(eq(violation_catalog.code, code))
        .returning();
      return castTo<Row | null>((rows[0] ?? null));
      }, 'DB_ERROR');
  }

  async getCatalogEntry(code: string): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await db.select().from(violation_catalog).where(eq(violation_catalog.code, code)).limit(1);
      return castTo<Row | null>((rows[0] ?? null));
      }, 'DB_ERROR');
  }

  async getPreviousViolationCount(employeeId: number, catalogCode: string): Promise<Result<number>> {
    return safeCall(async () => {
      const rows = await db.select({ cnt: sql<string>`COUNT(*)` })
        .from(discipline_records)
        .where(sql`${discipline_records.employeeId} = ${employeeId} AND ${discipline_records.catalogCode} = ${catalogCode} AND ${discipline_records.isExpired} = false`);
      return parseInt(String(rows[0]?.cnt ?? '0'));
      }, 'DB_ERROR');
  }

  async createViolationRecord(dto: { employeeId: number; catalogCode: string; violationType: string; disciplineType: string; severity: string; violationDate: string; description: string; issuedBy: number; fineAmount: number; violationCountThisCategory: number; isFirstWarning: boolean }): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.insert(discipline_records).values({
        employeeId:                  dto.employeeId,
        catalogCode:                 dto.catalogCode,
        violationType:               dto.violationType,
        disciplineType:              dto.disciplineType,
        severity:                    dto.severity,
        violationDate:               dto.violationDate,
        description:                 dto.description,
        issuedBy:                    dto.issuedBy,
        issuedDate:                  sql`CURRENT_DATE`,
        status:                      'pending_review',
        fineAmount:                  String(dto.fineAmount),
        violationCountThisCategory:  dto.violationCountThisCategory,
        isFirstWarning:              dto.isFirstWarning,
      }).returning();
      return castTo<Row>((rows[0] ?? {}));
      }, 'DB_ERROR');
  }

  async deactivatePreviousBlocks(employeeId: number): Promise<void> {
    await db.update(employee_blocks)
      .set({ isActive: false })
      .where(sql`${employee_blocks.employeeId} = ${employeeId} AND ${employee_blocks.isActive} = true`);
  }

  async createBlock(employeeId: number, reason: string, blockedBy: number): Promise<void> {
    await db.insert(employee_blocks).values({
      employeeId: employeeId,
      reason:     reason,
      blockedBy:  blockedBy,
      isActive:   true,
    });
  }

  async setEmployeeBlocked(employeeId: number, isBlocked: boolean, reason: string | null): Promise<void> {
    await db.update(hrEmployees)
      .set({ is_blocked: isBlocked, blocked_reason: reason })
      .where(eq(hrEmployees.id, employeeId));
  }

  async unblockRecord(employeeId: number, unblockedBy: number): Promise<void> {
    await db.update(employee_blocks).set({
      isActive:    false,
      unblockedBy: unblockedBy,
      unblockedAt: _time.now(),
    }).where(sql`${employee_blocks.employeeId} = ${employeeId} AND ${employee_blocks.isActive} = true`);
  }

  async getEmployeeViolations(employeeId: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await db.select().from(discipline_records)
        .where(eq(discipline_records.employeeId, employeeId))
        .orderBy(sql`${discipline_records.createdAt} DESC`);
      return castTo<Row[]>(rows);
    }, 'DB_ERROR');
  }

  async acknowledgeViolation(id: number): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.update(discipline_records)
        .set({ status: 'acknowledged' })
        .where(eq(discipline_records.id, id))
        .returning();
      return castTo<Row>(rows[0] ?? {});
    }, 'DB_ERROR');
  }

  async approveViolation(id: number, approvedBy?: number): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.update(discipline_records)
        .set({ status: 'approved' })
        .where(eq(discipline_records.id, id))
        .returning();
      return castTo<Row>(rows[0] ?? {});
    }, 'DB_ERROR');
  }

  async checkDisciplineStatus(employeeId: number): Promise<Result<Row>> {
    return safeCall(async () => {
      const blocks = await db.select().from(employee_blocks)
        .where(sql`${employee_blocks.employeeId} = ${employeeId} AND ${employee_blocks.isActive} = true`)
        .limit(1);
      if (blocks.length === 0) return castTo<Row>({ is_blocked: false });
      return castTo<Row>({ is_blocked: true, blocked_reason: blocks[0].reason });
    }, 'DB_ERROR');
  }

  async excuseAbsence(id: number, dto: { excuseReason: string }): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.update(absence_tracking)
        .set({ isExcused: true, excuseReason: dto.excuseReason })
        .where(eq(absence_tracking.id, id))
        .returning();
      return castTo<Row>(rows[0] ?? {});
    }, 'DB_ERROR');
  }
}
