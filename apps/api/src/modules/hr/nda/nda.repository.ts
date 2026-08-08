/**
 * @module nda.repository
 * @description Tijorat siri NDA imzolari (hr_nda_acknowledgments) — modul 02 HR (02.41).
 *   NDA xodimga beriladi (pending), xodim imzolaydi (signed). Result pattern (Qoida 1).
 * @layer Repository (HR / NDA)
 */
import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { Result, Ok, Err } from '@common/result';

export interface NdaRow {
  id: number;
  user_id: number;
  document_title: string;
  document_version: string;
  status: string;
  signed_at: string | null;
  notes: string | null;
  created_at: string;
}

@Injectable()
export class NdaRepository {
  private cols = sql`id, user_id, document_title, document_version, status, signed_at, notes, created_at`;

  async list(userId: number | null, pendingOnly: boolean): Promise<Result<NdaRow[]>> {
    try {
      const userFilter = userId ? sql`AND user_id = ${userId}` : sql``;
      const pendingFilter = pendingOnly ? sql`AND status = 'pending'` : sql``;
      const r = await runQuery<NdaRow>(sql`
        SELECT ${this.cols} FROM hr_nda_acknowledgments
        WHERE 1=1 ${userFilter} ${pendingFilter}
        ORDER BY (status = 'pending') DESC, id DESC
      `);
      return Ok(r.rows);
    } catch (e) { return Err({ message: (e as Error).message, code: 'DB_ERROR' }); }
  }

  async getById(id: number): Promise<Result<NdaRow>> {
    try {
      const r = await runQuery<NdaRow>(sql`SELECT ${this.cols} FROM hr_nda_acknowledgments WHERE id = ${id}`);
      if (!r.rows[0]) return Err({ message: 'NDA topilmadi', code: 'NOT_FOUND' });
      return Ok(r.rows[0]);
    } catch (e) { return Err({ message: (e as Error).message, code: 'DB_ERROR' }); }
  }

  /** NDA xodimga berish (pending). Bir foydalanuvchi + versiya bir marta. */
  async issue(userId: number, documentTitle: string | null, documentVersion: string): Promise<Result<{ id: number }>> {
    try {
      const r = await runQuery<{ id: number }>(sql`
        INSERT INTO hr_nda_acknowledgments (user_id, document_title, document_version)
        VALUES (${userId}, COALESCE(${documentTitle}, 'Tijorat siri to''g''risida bitim (NDA)'), ${documentVersion})
        RETURNING id
      `);
      const row = r.rows[0];
      if (!row) return Err({ message: 'NDA berilmadi', code: 'DB_ERROR' });
      return Ok({ id: row.id });
    } catch (e) { return Err({ message: (e as Error).message, code: 'DB_ERROR' }); }
  }

  /**
   * Onboarding avto-NDA: xodim yaratilganda uning user_id'siga pending NDA beriladi.
   * Bir o'tishda: employeeId→user_id resolve + dedup (shu user+versiya allaqachon bo'lsa qo'shilmaydi).
   * Yaratilgan id qaytadi yoki null (allaqachon bor / user_id yo'q).
   */
  async autoIssueForEmployee(employeeId: number, documentVersion: string): Promise<Result<{ id: number | null }>> {
    try {
      const r = await runQuery<{ id: number }>(sql`
        INSERT INTO hr_nda_acknowledgments (user_id, document_version)
        SELECT e.user_id, ${documentVersion}
        FROM employees e
        WHERE e.id = ${employeeId} AND e.user_id IS NOT NULL
          AND NOT EXISTS (
            SELECT 1 FROM hr_nda_acknowledgments n
            WHERE n.user_id = e.user_id AND n.document_version = ${documentVersion}
          )
        RETURNING id
      `);
      return Ok({ id: r.rows[0]?.id ?? null });
    } catch (e) { return Err({ message: (e as Error).message, code: 'DB_ERROR' }); }
  }

  /** Xodim NDA ni imzolaydi (pending → signed). */
  async sign(id: number, notes: string | null): Promise<Result<void>> {
    try {
      const r = await runQuery<{ id: number }>(sql`
        UPDATE hr_nda_acknowledgments
        SET status = 'signed', signed_at = NOW(), notes = COALESCE(${notes}, notes), updated_at = NOW()
        WHERE id = ${id} AND status = 'pending'
        RETURNING id
      `);
      if (r.rows.length === 0) return Err({ message: 'Imzolanmagan NDA topilmadi (allaqachon imzolangan bo\'lishi mumkin)', code: 'CONFLICT' });
      return Ok(undefined);
    } catch (e) { return Err({ message: (e as Error).message, code: 'DB_ERROR' }); }
  }

  async remove(id: number): Promise<Result<void>> {
    try {
      const r = await runQuery<{ id: number }>(sql`DELETE FROM hr_nda_acknowledgments WHERE id = ${id} RETURNING id`);
      if (r.rows.length === 0) return Err({ message: 'NDA topilmadi', code: 'NOT_FOUND' });
      return Ok(undefined);
    } catch (e) { return Err({ message: (e as Error).message, code: 'DB_ERROR' }); }
  }
}
