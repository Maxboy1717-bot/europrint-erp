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
        .where(eq(violation_catalog.is_active, true))
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
        default_fine_amount: dto.defaultFineAmount != null ? String(dto.defaultFineAmount) : '0',
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
        default_fine_amount: sql`COALESCE(${dto.defaultFineAmount ?? null}::text, ${violation_catalog.default_fine_amount})`,
        description:         sql`COALESCE(${dto.description ?? null}, ${violation_catalog.description})`,
        is_active:           sql`COALESCE(${dto.isActive ?? null}, ${violation_catalog.is_active})`,
      }).where(eq(violation_catalog.code, code)).returning();
      return castTo<Row>((rows[0] ?? {}));
      }, 'DB_ERROR');
  }

  async softDeleteCatalogEntry(code: string): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await db.update(violation_catalog)
        .set({ is_active: false })
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
        .where(sql`${discipline_records.employee_id} = ${employeeId} AND ${discipline_records.catalog_code} = ${catalogCode} AND ${discipline_records.is_expired} = false`);
      return parseInt(String(rows[0]?.cnt ?? '0'));
      }, 'DB_ERROR');
  }

  async createViolationRecord(dto: { employeeId: number; catalogCode: string; violationType: string; disciplineType: string; severity: string; violationDate: string; description: string; issuedBy: number; fineAmount: number; violationCountThisCategory: number; isFirstWarning: boolean }): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.insert(discipline_records).values({
        employee_id:                  dto.employeeId,
        catalog_code:                 dto.catalogCode,
        violation_type:               dto.violationType,
        discipline_type:              dto.disciplineType,
        severity:                     dto.severity,
        violation_date:               dto.violationDate,
        description:                  dto.description,
        issued_by:                    dto.issuedBy,
        issued_date:                  sql`CURRENT_DATE`,
        status:                       'pending_review',
        fine_amount:                  String(dto.fineAmount),
        violation_count_this_category: dto.violationCountThisCategory,
        is_first_warning:             dto.isFirstWarning,
      }).returning();
      return castTo<Row>((rows[0] ?? {}));
      }, 'DB_ERROR');
  }

  async deactivatePreviousBlocks(employeeId: number): Promise<void> {
    await db.update(employee_blocks)
      .set({ is_active: false })
      .where(sql`${employee_blocks.employee_id} = ${employeeId} AND ${employee_blocks.is_active} = true`);
  }

  async createBlock(employeeId: number, reason: string, blockedBy: number): Promise<void> {
    await db.insert(employee_blocks).values({
      employee_id: employeeId,
      reason:      reason,
      blocked_by:  blockedBy,
      is_active:   true,
    });
  }

  async setEmployeeBlocked(employeeId: number, isBlocked: boolean, reason: string | null): Promise<void> {
    await db.update(hrEmployees)
      .set({ is_blocked: isBlocked, blocked_reason: reason })
      .where(eq(hrEmployees.id, employeeId));
  }

  async unblockRecord(employeeId: number, unblockedBy: number): Promise<void> {
    await db.update(employee_blocks).set({
      is_active:    false,
      unblocked_by: unblockedBy,
      unblocked_at: _time.now(),
    }).where(sql`${employee_blocks.employee_id} = ${employeeId} AND ${employee_blocks.is_active} = true`);
  }

  async getEmployeeViolations(employeeId: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await db.select().from(discipline_records)
        .where(eq(discipline_records.employee_id, employeeId))
        .orderBy(sql`${discipline_records.created_at} DESC`);
      return castTo<Row[]>(rows);
    }, 'DB_ERROR');
  }

  async acknowledgeViolation(id: number): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.update(discipline_records)
        .set({ status: 'acknowledged', acknowledged_at: _time.now() })
        .where(eq(discipline_records.id, id))
        .returning();
      return castTo<Row>(rows[0] ?? {});
    }, 'DB_ERROR');
  }

  async approveViolation(id: number, approvedBy?: number): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.update(discipline_records)
        .set({ status: 'approved', approved_by: approvedBy ?? null })
        .where(eq(discipline_records.id, id))
        .returning();
      return castTo<Row>(rows[0] ?? {});
    }, 'DB_ERROR');
  }

  async checkDisciplineStatus(employeeId: number): Promise<Result<Row>> {
    return safeCall(async () => {
      const blocks = await db.select().from(employee_blocks)
        .where(sql`${employee_blocks.employee_id} = ${employeeId} AND ${employee_blocks.is_active} = true`)
        .limit(1);
      if (blocks.length === 0) return castTo<Row>({ is_blocked: false });
      return castTo<Row>({ is_blocked: true, blocked_reason: blocks[0].reason });
    }, 'DB_ERROR');
  }

  async excuseAbsence(id: number, dto: { excuseReason: string }): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.update(absence_tracking)
        .set({ is_excused: true, excuse_reason: dto.excuseReason })
        .where(eq(absence_tracking.id, id))
        .returning();
      return castTo<Row>(rows[0] ?? {});
    }, 'DB_ERROR');
  }
}
