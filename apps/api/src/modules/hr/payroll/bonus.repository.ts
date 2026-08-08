/**
 * @module bonus.repository
 * @description Repository / data-access layer for the moslashuvchan mukofot (bonus)
 * mexanizmi (master-reja 3.15). Mirrors `discipline-record.repository.ts` (jarima)
 * naqshini — rahbar mukofot beradi, `bonus_payments` ga yoziladi, so'ng payroll uni
 * yig'ib oladi (`PayrollService.generatePeriodRows`).
 *
 * `bonus_payments` LIVE DB'da mavjud (0 qator, hech qanday servis yozmasdi — Q-29
 * verify: `bonusPayments`/`employeeFines` lib/db/src/schema/payroll.ts da e'lon
 * qilingan). `@europrint/schemas` (tsc-alias → apps/api/src/shared/db/europrint-compat.ts)
 * buni eksport qilmaydi — shuning uchun to'g'ridan `@workspace/db` (lib/db paket
 * barrel) orqali import qilinadi (schema-compat-2.ts'dagi boshqa kanonik jadvallar
 * — masalan `leaveRequests` — ham shu naqshni ishlatadi). Additive-only (Q-35):
 * CREATE TABLE YO'Q; payroll.ts'dagi ta'rif 2026-07-03 da live-DB ustunlarga
 * (userId/amount/currency/paymentDate) moslashtirildi, lib/db qayta build qilindi.
 */

import { Injectable } from '@nestjs/common';
import { db, runQuery } from '@shared/db';
import { bonusPayments } from '@workspace/db';
import { sql, eq, and } from 'drizzle-orm';
import { Result, Ok, Err, AppError } from '@common/result';

export type BonusStatus = 'pending' | 'approved' | 'rejected' | 'paid';

export interface InsertBonusPayment {
  employeeId: number;
  bonusType: string;
  amount: number;
  currency?: string;
  bonusPeriodStart?: string | null;
  bonusPeriodEnd?: string | null;
  reason: string;
  givenBy: number;
}

export interface BonusPaymentRow {
  id: number;
  employeeId: number | null;
  userId: number;
  bonusType: string;
  bonusAmount: string | null;
  amount: string;
  currency: string;
  bonusPeriodStart: string | null;
  bonusPeriodEnd: string | null;
  paymentDate: string;
  reason: string | null;
  status: string;
  approvedBy: number | null;
  approvalDate: string | null;
  createdAt: Date;
}

@Injectable()
export class BonusRepository {
  /** Rahbar mukofot yozuvi yaratadi — boshlang'ich holat 'pending' (jarima naqshi bilan bir xil,
   * lekin mukofot HR/DIRECTOR tasdig'iga muhtoj bo'lishi mumkin — approve() bilan tasdiqlanadi). */
  async create(data: InsertBonusPayment): Promise<Result<BonusPaymentRow, AppError>> {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const rows = await db
        .insert(bonusPayments)
        .values({
          employeeId: data.employeeId,
          userId: data.employeeId,
          bonusType: data.bonusType,
          bonusAmount: String(data.amount),
          amount: String(data.amount),
          currency: data.currency ?? 'UZS',
          bonusPeriodStart: data.bonusPeriodStart ?? null,
          bonusPeriodEnd: data.bonusPeriodEnd ?? null,
          paymentDate: today,
          reason: data.reason,
          description: data.reason,
          status: 'pending',
          approvedBy: null,
          approvalDate: null,
        })
        .returning();
      const row = Array.isArray(rows) ? rows[0] : undefined;
      if (!row) return Err({ code: 'DB_ERROR', message: 'Mukofot yozilmadi' });
      return Ok(row as unknown as BonusPaymentRow);
    } catch (e) {
      return Err({ code: 'DB_ERROR', message: String(e) });
    }
  }

  async listByEmployee(employeeId: number): Promise<Result<BonusPaymentRow[], AppError>> {
    try {
      const rows = await db
        .select()
        .from(bonusPayments)
        .where(eq(bonusPayments.employeeId, employeeId))
        .orderBy(sql`${bonusPayments.createdAt} DESC`);
      return Ok((Array.isArray(rows) ? rows : []) as unknown as BonusPaymentRow[]);
    } catch (e) {
      return Err({ code: 'DB_ERROR', message: String(e) });
    }
  }

  async list(status?: BonusStatus, limit = 50, offset = 0): Promise<Result<BonusPaymentRow[], AppError>> {
    try {
      const wh = status ? eq(bonusPayments.status, status) : undefined;
      const query = db.select().from(bonusPayments);
      const rows = wh
        ? await query.where(wh).orderBy(sql`${bonusPayments.createdAt} DESC`).limit(limit).offset(offset)
        : await query.orderBy(sql`${bonusPayments.createdAt} DESC`).limit(limit).offset(offset);
      return Ok((Array.isArray(rows) ? rows : []) as unknown as BonusPaymentRow[]);
    } catch (e) {
      return Err({ code: 'DB_ERROR', message: String(e) });
    }
  }

  async getById(id: number): Promise<Result<BonusPaymentRow | null, AppError>> {
    try {
      const rows = await db.select().from(bonusPayments).where(eq(bonusPayments.id, id)).limit(1);
      const row = Array.isArray(rows) ? (rows[0] ?? null) : null;
      return Ok(row as unknown as BonusPaymentRow | null);
    } catch (e) {
      return Err({ code: 'DB_ERROR', message: String(e) });
    }
  }

  /** HR/DIRECTOR mukofotni tasdiqlaydi — 'approved' bo'lgan yozuvlar payroll'ga qo'shiladi. */
  async approve(id: number, approvedBy: number): Promise<Result<BonusPaymentRow, AppError>> {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const rows = await db
        .update(bonusPayments)
        .set({ status: 'approved', approvedBy, approvalDate: today })
        .where(and(eq(bonusPayments.id, id), eq(bonusPayments.status, 'pending')))
        .returning();
      const row = Array.isArray(rows) ? rows[0] : undefined;
      if (!row) return Err({ code: 'NOT_FOUND', message: `Mukofot #${id} topilmadi yoki allaqachon holat o'zgargan` });
      return Ok(row as unknown as BonusPaymentRow);
    } catch (e) {
      return Err({ code: 'DB_ERROR', message: String(e) });
    }
  }

  async reject(id: number, approvedBy: number): Promise<Result<BonusPaymentRow, AppError>> {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const rows = await db
        .update(bonusPayments)
        .set({ status: 'rejected', approvedBy, approvalDate: today })
        .where(and(eq(bonusPayments.id, id), eq(bonusPayments.status, 'pending')))
        .returning();
      const row = Array.isArray(rows) ? rows[0] : undefined;
      if (!row) return Err({ code: 'NOT_FOUND', message: `Mukofot #${id} topilmadi yoki allaqachon holat o'zgargan` });
      return Ok(row as unknown as BonusPaymentRow);
    } catch (e) {
      return Err({ code: 'DB_ERROR', message: String(e) });
    }
  }

  /**
   * Berilgan davr (from..to, ISO 'YYYY-MM-DD') ichida xodimga tasdiqlangan ('approved')
   * mukofotlar summasi — `PayrollService.generatePeriodRows` shu bilan `payroll_rows.bonus`
   * ni to'ldiradi (jarima `discipline_records.fine_amount` bilan bir xil naqsh).
   * Sana filtri `payment_date` ustuniga qo'llanadi (mukofot berilgan kun).
   */
  async sumApprovedByEmployeeAndPeriod(employeeId: number, from: string, to: string): Promise<Result<number, AppError>> {
    try {
      const result = await runQuery<{ total: string | null }>(sql`
        SELECT COALESCE(SUM(amount), 0)::numeric AS total
        FROM bonus_payments
        WHERE employee_id = ${employeeId}
          AND status = 'approved'
          AND payment_date::date >= ${from}::date
          AND payment_date::date <= ${to}::date
      `);
      const total = result.rows[0]?.total;
      const n = total == null ? 0 : Number(total);
      return Ok(Number.isFinite(n) ? n : 0);
    } catch (e) {
      return Err({ code: 'DB_ERROR', message: String(e) });
    }
  }

  /** Barcha xodimlar uchun davrdagi tasdiqlangan mukofot yig'indisi — bitta so'rov (N+1 yo'q). */
  async sumApprovedGroupedByEmployee(from: string, to: string): Promise<Result<Map<number, number>, AppError>> {
    try {
      const result = await runQuery<{ employee_id: number; total: string | null }>(sql`
        SELECT employee_id, COALESCE(SUM(amount), 0)::numeric AS total
        FROM bonus_payments
        WHERE status = 'approved'
          AND employee_id IS NOT NULL
          AND payment_date::date >= ${from}::date
          AND payment_date::date <= ${to}::date
        GROUP BY employee_id
      `);
      const map = new Map<number, number>();
      for (const r of Array.isArray(result.rows) ? result.rows : []) {
        const n = r.total == null ? 0 : Number(r.total);
        map.set(Number(r.employee_id), Number.isFinite(n) ? n : 0);
      }
      return Ok(map);
    } catch (e) {
      return Err({ code: 'DB_ERROR', message: String(e) });
    }
  }
}
