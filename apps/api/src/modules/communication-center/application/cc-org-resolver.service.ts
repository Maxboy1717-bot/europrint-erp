/**
 * Communication Center — Orgsxema asosida tasdiqlovchini topish
 *
 * `cc_workflow_steps.approver_position_code` formatlari:
 *   - `CEO`               → org_departments root head_user_id
 *   - `MANAGER_OF_SENDER` → sender's employees.manager_id → users.id
 *   - `DEPT_HEAD`         → head of sender's department
 *   - `POSITION:<CODE>`   → faol xodim, positions.code = <CODE>
 *
 * Yana faol delegatsiya tekshiriladi (cc_delegations) — agar bor bo'lsa,
 * delegatsiya egasi qaytariladi.
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';

@Injectable()
export class CcOrgResolverService {
  private readonly logger = new Logger(CcOrgResolverService.name);

  /**
   * Position kod va yuboruvchi ID bo'yicha tasdiqlovchi xodim ID'sini topadi.
   * Faol delegatsiya bo'lsa, o'rinbosar qaytariladi.
   */
  async resolveApprover(positionCode: string, senderUserId: number): Promise<number> {
    const baseUserId = await this.resolveBase(positionCode, senderUserId);
    const delegated  = await this.checkDelegation(baseUserId);
    return delegated ?? baseUserId;
  }

  // ── ichki: kod bo'yicha asosiy egasi ─────────────────────────────────
  private async resolveBase(positionCode: string, senderUserId: number): Promise<number> {
    const code = positionCode.trim().toUpperCase();

    if (code === 'CEO') {
      const r = await runQuery<{ head_user_id: number | null }>(sql`
        SELECT head_user_id FROM org_departments
        WHERE parent_id IS NULL AND head_user_id IS NOT NULL
        ORDER BY id ASC LIMIT 1
      `);
      const id = r.rows[0]?.head_user_id ?? null;
      if (!id) throw new BadRequestException('CEO orgsxemada belgilanmagan');
      return id;
    }

    if (code === 'MANAGER_OF_SENDER') {
      // sender → employee → manager_id → manager.user_id
      const r = await runQuery<{ user_id: number | null }>(sql`
        SELECT m.user_id
        FROM employees e
        LEFT JOIN employees m ON m.id = e.manager_id
        WHERE e.user_id = ${senderUserId}
        LIMIT 1
      `);
      const id = r.rows[0]?.user_id ?? null;
      if (!id) throw new BadRequestException("Yuboruvchining bo'lim rahbari orgsxemada belgilanmagan");
      return id;
    }

    if (code === 'DEPT_HEAD') {
      // sender's department → org_departments.head_user_id (employees.department_id = org_departments.id deb hisoblaymiz)
      const r = await runQuery<{ head_user_id: number | null }>(sql`
        SELECT od.head_user_id
        FROM employees e
        LEFT JOIN org_departments od ON od.id = e.department_id
        WHERE e.user_id = ${senderUserId}
        LIMIT 1
      `);
      const id = r.rows[0]?.head_user_id ?? null;
      if (!id) throw new BadRequestException("Yuboruvchining bo'lim rahbari topilmadi");
      return id;
    }

    if (code.startsWith('POSITION:')) {
      const posCode = code.slice('POSITION:'.length).trim();
      if (!posCode) throw new BadRequestException('POSITION: kod ko\'rsatilmagan');
      const r = await runQuery<{ user_id: number | null }>(sql`
        SELECT e.user_id
        FROM employees e
        INNER JOIN positions p ON p.id = e.position_id
        WHERE UPPER(p.code) = ${posCode}
          AND COALESCE(e.is_active, true) = true
          AND e.user_id IS NOT NULL
        ORDER BY e.id ASC
        LIMIT 1
      `);
      const id = r.rows[0]?.user_id ?? null;
      if (!id) throw new BadRequestException(`Lavozim ${posCode} bo'sh — orgsxemada xodim biriktirilmagan`);
      return id;
    }

    throw new BadRequestException(`Noma'lum tasdiqlash lavozim kodi: ${positionCode}`);
  }

  // ── ichki: faol delegatsiya tekshiruvi ───────────────────────────────
  private async checkDelegation(userId: number): Promise<number | null> {
    const r = await runQuery<{ to_user_id: number }>(sql`
      SELECT to_user_id
      FROM cc_delegations
      WHERE from_user_id = ${userId}
        AND is_active = true
        AND starts_at <= NOW()
        AND ends_at   >= NOW()
      ORDER BY created_at DESC
      LIMIT 1
    `);
    return r.rows[0]?.to_user_id ?? null;
  }
}
