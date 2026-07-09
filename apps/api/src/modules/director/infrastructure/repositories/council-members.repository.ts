/**
 * @module council-members.repository
 * @description Kengash a'zoligi (council_members) CRUD — modul 04 Coordination.
 *   Vizyon 04.1/04.2: kengash a'zolari (4 rol: chair/secretary/member/guest), doimiy a'zo
 *   bayrog'i. Result pattern (Qoida 1). Avval council_members jadvali umuman yo'q edi.
 *
 * NOTE: Raw SQL — users JOIN bilan a'zo ismini olish + ON CONFLICT (council_id,user_id)
 *   upsert-role. ARCHITECTURE_RULES.md Rule 4.
 * @layer Repository (Director / Coordination)
 */
import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { Result, Ok, Err } from '@common/result';

export interface CouncilMemberRow {
  id: number;
  council_id: number;
  user_id: number;
  username: string | null;
  role: string;
  is_permanent: boolean;
  created_at: string;
}

@Injectable()
export class CouncilMembersRepository {
  async listByCouncil(councilId: number): Promise<Result<CouncilMemberRow[]>> {
    try {
      const r = await runQuery<CouncilMemberRow>(sql`
        SELECT cm.id, cm.council_id, cm.user_id, u.username,
               cm.role, cm.is_permanent, cm.created_at
        FROM council_members cm
        LEFT JOIN users u ON u.id = cm.user_id
        WHERE cm.council_id = ${councilId}
        ORDER BY
          CASE cm.role WHEN 'chair' THEN 0 WHEN 'secretary' THEN 1 WHEN 'member' THEN 2 ELSE 3 END,
          cm.id
      `);
      return Ok(r.rows);
    } catch (e) {
      return Err({ message: (e as Error).message, code: 'DB_ERROR' });
    }
  }

  // Batch 5 Item 8 — count voting members (chair/secretary/member; 'guest' excluded) for quorum.
  async countVotingMembers(councilId: number): Promise<Result<number>> {
    try {
      const r = await runQuery<{ n: number }>(sql`
        SELECT COUNT(*)::int AS n FROM council_members
        WHERE council_id = ${councilId} AND role IN ('chair', 'secretary', 'member')
      `);
      return Ok(Number(r.rows[0]?.n ?? 0));
    } catch (e) {
      return Err({ message: (e as Error).message, code: 'DB_ERROR' });
    }
  }

  async add(councilId: number, userId: number, role: string, isPermanent: boolean): Promise<Result<{ id: number }>> {
    try {
      // bir foydalanuvchi kengashda bir marta — takror qo'shilsa rolni yangilaydi (upsert)
      const r = await runQuery<{ id: number }>(sql`
        INSERT INTO council_members (council_id, user_id, role, is_permanent)
        VALUES (${councilId}, ${userId}, ${role}, ${isPermanent})
        ON CONFLICT (council_id, user_id)
        DO UPDATE SET role = EXCLUDED.role, is_permanent = EXCLUDED.is_permanent, updated_at = NOW()
        RETURNING id
      `);
      const row = r.rows[0];
      if (!row) return Err({ message: 'A\'zo qo\'shilmadi', code: 'DB_ERROR' });
      return Ok({ id: row.id });
    } catch (e) {
      return Err({ message: (e as Error).message, code: 'DB_ERROR' });
    }
  }

  async updateRole(id: number, role: string): Promise<Result<void>> {
    try {
      const r = await runQuery<{ id: number }>(sql`
        UPDATE council_members SET role = ${role}, updated_at = NOW() WHERE id = ${id} RETURNING id
      `);
      if (r.rows.length === 0) return Err({ message: 'A\'zo topilmadi', code: 'NOT_FOUND' });
      return Ok(undefined);
    } catch (e) {
      return Err({ message: (e as Error).message, code: 'DB_ERROR' });
    }
  }

  async remove(id: number): Promise<Result<void>> {
    try {
      const r = await runQuery<{ id: number }>(sql`
        DELETE FROM council_members WHERE id = ${id} RETURNING id
      `);
      if (r.rows.length === 0) return Err({ message: 'A\'zo topilmadi', code: 'NOT_FOUND' });
      return Ok(undefined);
    } catch (e) {
      return Err({ message: (e as Error).message, code: 'DB_ERROR' });
    }
  }
}
