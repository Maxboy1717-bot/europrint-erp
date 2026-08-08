/**
 * @module prikaz.repository
 * @description Приказ (prikaz — direktor buyrug'i) CRUD + imzo/bekor — modul 04 Coordination.
 *   Vizyon 04.27/04.28/04.31: raqam SEQUENCE (imzolanganda beriladi, teshik saqlanadi);
 *   imzolangach IMMUTABLE (tahrir faqat draft holatida). Result pattern (Qoida 1).
 *
 * NOTE: Raw SQL — nextval('prikaz_number_seq') imzolashda; status-guard'li UPDATE
 *   (faqat draft tahrirlanadi). ARCHITECTURE_RULES.md Rule 4.
 * @layer Repository (Director / Coordination)
 */
import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { Result, Ok, Err } from '@common/result';

export interface PrikazRow {
  id: number;
  prikaz_number: number | null;
  title: string;
  content: string | null;
  issued_by: number | null;
  status: string;
  signed_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  supersedes_id: number | null;
  created_at: string;
}

@Injectable()
export class PrikazRepository {
  private cols = sql`id, prikaz_number, title, content, issued_by, status, signed_at,
                     cancelled_at, cancel_reason, supersedes_id, created_at`;

  async list(): Promise<Result<PrikazRow[]>> {
    try {
      const r = await runQuery<PrikazRow>(sql`SELECT ${this.cols} FROM prikaz ORDER BY id DESC`);
      return Ok(r.rows);
    } catch (e) { return Err({ message: (e as Error).message, code: 'DB_ERROR' }); }
  }

  async getById(id: number): Promise<Result<PrikazRow>> {
    try {
      const r = await runQuery<PrikazRow>(sql`SELECT ${this.cols} FROM prikaz WHERE id = ${id}`);
      if (!r.rows[0]) return Err({ message: 'Приказ topilmadi', code: 'NOT_FOUND' });
      return Ok(r.rows[0]);
    } catch (e) { return Err({ message: (e as Error).message, code: 'DB_ERROR' }); }
  }

  async create(input: { title: string; content: string | null; issuedBy: number | null; supersedesId: number | null }): Promise<Result<{ id: number }>> {
    try {
      const r = await runQuery<{ id: number }>(sql`
        INSERT INTO prikaz (title, content, issued_by, supersedes_id, status)
        VALUES (${input.title}, ${input.content}, ${input.issuedBy}, ${input.supersedesId}, 'draft')
        RETURNING id
      `);
      const row = r.rows[0];
      if (!row) return Err({ message: 'Приказ yaratilmadi', code: 'DB_ERROR' });
      return Ok({ id: row.id });
    } catch (e) { return Err({ message: (e as Error).message, code: 'DB_ERROR' }); }
  }

  /** Faqat 'draft' tahrirlanadi — imzolangan/bekor qilingan приказ IMMUTABLE. */
  async updateDraft(id: number, patch: { title?: string | null; content?: string | null }): Promise<Result<void>> {
    try {
      const r = await runQuery<{ id: number }>(sql`
        UPDATE prikaz SET
          title = COALESCE(${patch.title ?? null}, title),
          content = COALESCE(${patch.content ?? null}, content),
          updated_at = NOW()
        WHERE id = ${id} AND status = 'draft'
        RETURNING id
      `);
      if (r.rows.length === 0) return Err({ message: 'Faqat qoralama tahrirlanadi (imzolangan приказ immutable)', code: 'CONFLICT' });
      return Ok(undefined);
    } catch (e) { return Err({ message: (e as Error).message, code: 'DB_ERROR' }); }
  }

  /** Imzolash — raqam beriladi (sequence), status=signed. Faqat draft → signed. */
  async sign(id: number): Promise<Result<{ prikazNumber: number }>> {
    try {
      const r = await runQuery<{ prikaz_number: number }>(sql`
        UPDATE prikaz
        SET prikaz_number = nextval('prikaz_number_seq'), status = 'signed', signed_at = NOW(), updated_at = NOW()
        WHERE id = ${id} AND status = 'draft'
        RETURNING prikaz_number
      `);
      if (r.rows.length === 0) return Err({ message: 'Faqat qoralama приказ imzolanadi', code: 'CONFLICT' });
      return Ok({ prikazNumber: r.rows[0].prikaz_number });
    } catch (e) { return Err({ message: (e as Error).message, code: 'DB_ERROR' }); }
  }

  /** Bekor qilish (sabab bilan). Raqam teshigi saqlanadi (prikaz_number o'zgarmaydi). */
  async cancel(id: number, reason: string): Promise<Result<void>> {
    try {
      const r = await runQuery<{ id: number }>(sql`
        UPDATE prikaz SET status = 'cancelled', cancelled_at = NOW(), cancel_reason = ${reason}, updated_at = NOW()
        WHERE id = ${id} AND status != 'cancelled'
        RETURNING id
      `);
      if (r.rows.length === 0) return Err({ message: 'Приказ topilmadi yoki allaqachon bekor qilingan', code: 'CONFLICT' });
      return Ok(undefined);
    } catch (e) { return Err({ message: (e as Error).message, code: 'DB_ERROR' }); }
  }
}
