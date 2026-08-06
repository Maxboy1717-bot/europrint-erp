/**
 * @deprecated 2026-05-27
 * This file is a compatibility shim. Do NOT add new features here.
 * Canonical replacement: `apps/api/src/modules/hr/application/hr-employees-ext.service.ts`
 * Existing consumers continue to work. New code must import from the canonical file.
 * See: docs/modules/hr-employees.md
 */
/**
 * @module employees-compat-profile-orm.service
 * @description Drizzle-ORM part of `EmployeesCompatProfileService` — monthly
 *   report, contracts, leave/sick requests, corporate inventory, files.
 *   Kept separate so the parent service file stays under 300 lines (Rule 16).
 *   Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { db, rawSql } from '@shared/db';
import {
  employee_daily_reports,
  employee_contracts,
  hr_leave_requests,
  employee_inventory_ledger,
  employee_files,
} from '@shared/db';
import { eq, and, desc, sql } from 'drizzle-orm';
import { dbRows } from '../hr/common/db-rows';
import { safeCall, Result, AppError } from '@common/result';

type Row = Record<string, unknown>;
const si = (v: unknown, d = 0) => parseInt(String(v ?? ''), 10) || d;

@Injectable()
export class EmployeesCompatProfileOrmService {
  constructor(private readonly i18n: I18nService) {}

  /**
   * Passport ma'lumotlari `employees` jadvalining ustunlarida saqlanadi
   * (createPassport ham shu yerga yozadi — employees-compat-profile-raw.service.ts:168).
   * `@shared/db.employees` Drizzle modeli passport ustunlarini eksport qilmaydi
   * (boshqa schema variantini eksport qiladi), shuning uchun raw SQL ishlatamiz —
   * `createPassport` ham xuddi shunday raw SQL bilan ishlaydi.
   */
  async getPassport(id: string): Promise<Result<Row | null, AppError>> {
    return safeCall(async () => {
      const r = await rawSql(sql`
        SELECT passport_series, passport_number, passport_issue_date,
               passport_expiry_date, national_id
        FROM employees
        WHERE id = ${si(id)}
        LIMIT 1
      `);
      const row = dbRows(r)[0] as Row | undefined;
      if (!row) return null;
      if (
        row['passport_series'] == null &&
        row['passport_number'] == null &&
        row['passport_issue_date'] == null &&
        row['passport_expiry_date'] == null &&
        row['national_id'] == null
      ) {
        return null;
      }
      return {
        passportSeries:     row['passport_series'] ?? null,
        passportNumber:     row['passport_number'] ?? null,
        passportIssueDate:  row['passport_issue_date'] ?? null,
        passportExpiryDate: row['passport_expiry_date'] ?? null,
        // audit 2026-08-06 T29: FE PassportData (profile-types.ts) expects
        // issuedDate/expiryDate — the key-name mismatch meant even the stored dates
        // never redisplayed. Serve both spellings.
        issuedDate:         row['passport_issue_date'] ?? null,
        expiryDate:         row['passport_expiry_date'] ?? null,
        nationalId:         row['national_id'] ?? null,
      };
    });
  }

  async getMonthlyReport(id: string): Promise<Result<Row | null, AppError>> {
    return safeCall(async () => {
      const rows = await db.select()
        .from(employee_daily_reports)
        .where(eq(employee_daily_reports.employee_id, si(id)))
        .orderBy(desc(employee_daily_reports.report_date))
        .limit(1);
      return (rows[0] as Row | undefined) ?? null;
    });
  }

  async getContracts(id: string): Promise<Result<Row[], AppError>> {
    return safeCall(async () => {
      const rows = await db.select()
        .from(employee_contracts)
        .where(eq(employee_contracts.employee_id, si(id)))
        .orderBy(desc(employee_contracts.created_at))
        .limit(20);
      return rows as Row[];
    });
  }

  async getLeaveRequests(id: string): Promise<Result<Row[], AppError>> {
    return safeCall(async () => {
      const rows = await db.select()
        .from(hr_leave_requests)
        .where(eq(hr_leave_requests.employee_id, si(id)))
        .orderBy(desc(hr_leave_requests.requested_at))
        .limit(50);
      return rows as Row[];
    });
  }

  async getCorporateInventory(id: string): Promise<Result<Row[], AppError>> {
    return safeCall(async () => {
      const rows = await db.select()
        .from(employee_inventory_ledger)
        .where(eq(employee_inventory_ledger.userId, si(id)))
        .orderBy(desc(employee_inventory_ledger.createdAt))
        .limit(50);
      return rows as Row[];
    });
  }

  async getFiles(id: string): Promise<Result<Row[], AppError>> {
    return safeCall(async () => {
      const rows = await db.select()
        .from(employee_files)
        .where(eq(employee_files.employeeId, si(id)))
        .orderBy(desc(employee_files.uploadDate))
        .limit(50);
      return rows as Row[];
    });
  }

  async createContract(employeeId: string, body: Row): Promise<Result<Row, AppError>> {
    return safeCall(async () => {
      const [item] = await db.insert(employee_contracts)
        .values({
          employee_id:     si(employeeId),
          contract_number: String(body['contract_number'] ?? body['contractNumber'] ?? `EC-${Date.now()}`),
          contract_type:   String(body['contract_type'] ?? body['contractType'] ?? 'standard'),
          start_date:      (body['start_date'] ?? body['startDate'] ?? null) as string | null,
          end_date:        (body['end_date'] ?? body['endDate'] ?? null) as string | null,
          status:          String(body['status'] ?? 'active'),
        })
        .returning();
      if (!item) throw new InternalServerErrorException(await this.i18n.t('errors.contractCreationFailed'));
      return item as Row;
    });
  }

  async createCorporateInventory(employeeId: string, body: Row): Promise<Result<Row, AppError>> {
    return safeCall(async () => {
      const [item] = await db.insert(employee_inventory_ledger)
        .values({
          userId:        si(employeeId),
          materialCardId: body['item_id'] != null ? Number(body['item_id']) : (body['itemId'] != null ? Number(body['itemId']) : 0),
          warehouseId:   String(body['warehouse_id'] ?? body['warehouseId'] ?? ''),
          quantity:      Number(body['quantity'] ?? 1),
          entryType:     String(body['type'] ?? body['entryType'] ?? 'out'),
        })
        .returning();
      if (!item) throw new InternalServerErrorException(await this.i18n.t('errors.corporateInventoryCreationFailed'));
      return item as Row;
    });
  }

  async patchCorporateInventoryReturn(employeeId: string, itemId: string): Promise<Result<Row, AppError>> {
    return safeCall(async () => {
      const rows = await db.update(employee_inventory_ledger)
        .set({ entryType: 'return' })
        .where(and(
          eq(employee_inventory_ledger.id, si(itemId)),
          eq(employee_inventory_ledger.userId, si(employeeId)),
        ))
        .returning();
      return (rows[0] as Row | undefined) ?? { id: itemId, type: 'return' };
    });
  }

  async patchCorporateInventorySign(employeeId: string, itemId: string): Promise<Result<Row, AppError>> {
    return safeCall(async () => {
      const rows = await db.update(employee_inventory_ledger)
        .set({ entryType: 'signed' })
        .where(and(
          eq(employee_inventory_ledger.id, si(itemId)),
          eq(employee_inventory_ledger.userId, si(employeeId)),
        ))
        .returning();
      return (rows[0] as Row | undefined) ?? { id: itemId, type: 'signed' };
    });
  }

  async createLeaveRequest(employeeId: string, body: Row): Promise<Result<Row, AppError>> {
    return safeCall(async () => {
      const [item] = await db.insert(hr_leave_requests)
        .values({
          employee_id:  si(employeeId),
          start_date:   (body['start_date'] ?? body['startDate'] ?? null) as string | null,
          end_date:     (body['end_date'] ?? body['endDate'] ?? null) as string | null,
          reason:       (body['reason'] ?? null) as string | null,
          status:       String(body['status'] ?? 'pending'),
          requested_at: new Date(),
        })
        .returning();
      if (!item) throw new InternalServerErrorException(await this.i18n.t('errors.leaveRequestCreationFailed'));
      return item as Row;
    });
  }

  async createSickLeave(employeeId: string, body: Row): Promise<Result<Row, AppError>> {
    return safeCall(async () => {
      const [item] = await db.insert(hr_leave_requests)
        .values({
          employee_id:  si(employeeId),
          start_date:   (body['start_date'] ?? body['startDate'] ?? null) as string | null,
          end_date:     (body['end_date'] ?? body['endDate'] ?? null) as string | null,
          reason:       String(body['reason'] ?? 'sick'),
          status:       String(body['status'] ?? 'pending'),
          requested_at: new Date(),
        })
        .returning();
      if (!item) throw new InternalServerErrorException(await this.i18n.t('errors.sickLeaveCreationFailed'));
      return item as Row;
    });
  }
}
