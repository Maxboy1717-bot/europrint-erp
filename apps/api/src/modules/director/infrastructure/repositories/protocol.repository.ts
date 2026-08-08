/**
 * @module protocol.repository
 * @description Протокол (protocol — majlis bayonnomasi) CRUD + imzo/tuzatish — modul 04.
 *   Vizyon 04.34/04.36/04.37: rais/kotib, imzolangach IMMUTABLE, tuzatish-protokoli
 *   (parent_protocol_id, asl 'amended' bo'ladi), alohida fikr (jsonb). Result pattern.
 *
 * NOTE: Raw SQL — jsonb cast (dissenting_opinion), status-guard'li UPDATE, amend ikki-yozuv
 *   (yangi protokol + asl 'amended'). ARCHITECTURE_RULES.md Rule 4.
 * @layer Repository (Director / Coordination)
 */
import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { Result, Ok, Err } from '@common/result';

export interface ProtocolRow {
  id: number;
  council_id: number | null;
  title: string;
  agenda: string | null;
  decisions: string | null;
  chairperson_id: number | null;
  secretary_id: number | null;
  dissenting_opinion: unknown;
  status: string;
  signed_at: string | null;
  parent_protocol_id: number | null;
  created_at: string;
}

export interface ProtocolInput {
  councilId: number | null;
  title: string;
  agenda: string | null;
  decisions: string | null;
  chairpersonId: number | null;
  secretaryId: number | null;
  dissentingOpinion?: unknown | null;
}

@Injectable()
export class ProtocolRepository {
  private cols = sql`id, council_id, title, agenda, decisions, chairperson_id, secretary_id,
                     dissenting_opinion, status, signed_at, parent_protocol_id, created_at`;

  async list(): Promise<Result<ProtocolRow[]>> {
    try {
      const r = await runQuery<ProtocolRow>(sql`SELECT ${this.cols} FROM protocol ORDER BY id DESC`);
      return Ok(r.rows);
    } catch (e) { return Err({ message: (e as Error).message, code: 'DB_ERROR' }); }
  }

  async getById(id: number): Promise<Result<ProtocolRow>> {
    try {
      const r = await runQuery<ProtocolRow>(sql`SELECT ${this.cols} FROM protocol WHERE id = ${id}`);
      if (!r.rows[0]) return Err({ message: 'Протокол topilmadi', code: 'NOT_FOUND' });
      return Ok(r.rows[0]);
    } catch (e) { return Err({ message: (e as Error).message, code: 'DB_ERROR' }); }
  }

  async create(input: ProtocolInput): Promise<Result<{ id: number }>> {
    return this.insert(input, null);
  }

  private async insert(input: ProtocolInput, parentId: number | null): Promise<Result<{ id: number }>> {
    try {
      const opinion = input.dissentingOpinion == null ? null : JSON.stringify(input.dissentingOpinion);
      const r = await runQuery<{ id: number }>(sql`
        INSERT INTO protocol
          (council_id, title, agenda, decisions, chairperson_id, secretary_id, dissenting_opinion,
           status, parent_protocol_id)
        VALUES
          (${input.councilId}, ${input.title}, ${input.agenda}, ${input.decisions},
           ${input.chairpersonId}, ${input.secretaryId}, ${opinion}::jsonb, 'draft', ${parentId})
        RETURNING id
      `);
      const row = r.rows[0];
      if (!row) return Err({ message: 'Протокол yaratilmadi', code: 'DB_ERROR' });
      return Ok({ id: row.id });
    } catch (e) { return Err({ message: (e as Error).message, code: 'DB_ERROR' }); }
  }

  /** Faqat 'draft' tahrirlanadi — imzolangan протокол IMMUTABLE. */
  async updateDraft(id: number, patch: Partial<ProtocolInput>): Promise<Result<void>> {
    try {
      const opinion = patch.dissentingOpinion == null ? null : JSON.stringify(patch.dissentingOpinion);
      const r = await runQuery<{ id: number }>(sql`
        UPDATE protocol SET
          title = COALESCE(${patch.title ?? null}, title),
          agenda = COALESCE(${patch.agenda ?? null}, agenda),
          decisions = COALESCE(${patch.decisions ?? null}, decisions),
          chairperson_id = COALESCE(${patch.chairpersonId ?? null}, chairperson_id),
          secretary_id = COALESCE(${patch.secretaryId ?? null}, secretary_id),
          dissenting_opinion = COALESCE(${opinion}::jsonb, dissenting_opinion),
          updated_at = NOW()
        WHERE id = ${id} AND status = 'draft'
        RETURNING id
      `);
      if (r.rows.length === 0) return Err({ message: 'Faqat qoralama tahrirlanadi (imzolangan протокол immutable)', code: 'CONFLICT' });
      return Ok(undefined);
    } catch (e) { return Err({ message: (e as Error).message, code: 'DB_ERROR' }); }
  }

  async sign(id: number): Promise<Result<void>> {
    try {
      const r = await runQuery<{ id: number }>(sql`
        UPDATE protocol SET status = 'signed', signed_at = NOW(), updated_at = NOW()
        WHERE id = ${id} AND status = 'draft' RETURNING id
      `);
      if (r.rows.length === 0) return Err({ message: 'Faqat qoralama протокол imzolanadi', code: 'CONFLICT' });
      return Ok(undefined);
    } catch (e) { return Err({ message: (e as Error).message, code: 'DB_ERROR' }); }
  }

  /** Tuzatish-protokoli: yangi protokol yaratiladi (parent_protocol_id), asl 'amended' bo'ladi. */
  async amend(parentId: number, input: ProtocolInput): Promise<Result<{ id: number }>> {
    try {
      const parent = await runQuery<{ status: string }>(sql`SELECT status FROM protocol WHERE id = ${parentId}`);
      if (!parent.rows[0]) return Err({ message: 'Asl протокол topilmadi', code: 'NOT_FOUND' });
      if (parent.rows[0].status !== 'signed') return Err({ message: 'Faqat imzolangan протокол tuzatiladi', code: 'CONFLICT' });
      const created = await this.insert(input, parentId);
      if (!created.ok) return created;
      await runQuery(sql`UPDATE protocol SET status = 'amended', updated_at = NOW() WHERE id = ${parentId}`);
      return created;
    } catch (e) { return Err({ message: (e as Error).message, code: 'DB_ERROR' }); }
  }
}
