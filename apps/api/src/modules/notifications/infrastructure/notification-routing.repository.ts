/**
 * @module notification-routing.repository
 * @description `notification_routing_rules` (hodisa→nishon marshrutlash) CRUD + resolve.
 *   Vizyon (docs/audit/decisions/18-notifications.md EP-NTF-007/EP-NTF-079): egasi/admin
 *   "qaysi hodisa (event_type) kimga (rol yoki aniq xodim)" borishini markazdan sozlaydi.
 *   Standalone provider (faqat `runQuery`, boshqa modul importi yo'q) — CardRepository /
 *   CkpFactRepository namunasi bo'yicha bir nechta modulga (notifications, pos, cron) to'g'ridan
 *   provider sifatida qo'shiladi (ARCHITECTURE_RULES: modul chegarasi buzilmaydi).
 *
 *   `resolveUserIds` / `resolveRoles` — qator topilmasa avvalgi hardcoded rolga qaytadi
 *   (regressiya yo'q, Q-39): jadval sozlanmagan hodisa uchun eski xatti-harakat saqlanadi.
 *
 * NOTE: Raw SQL — COALESCE bilan qisman UPDATE + `= ANY(${arr}::text[]/::int[])` (aniq cast bilan;
 *   cast'siz JS massiv ANY() satr-kortej sifatida noto'g'ri bind bo'ladi — bu loyihada allaqachon
 *   bilingan xato, qarang drizzle-gl-posting.repo.ts:25-26 izohi). ARCHITECTURE_RULES.md Rule 4.
 * @layer Repository (Notifications)
 */
import { Injectable, Logger } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { Result, Ok, Err } from '@common/result';

export interface NotificationRoutingRuleRow {
  id: number;
  event_type: string;
  target_role: string | null;
  target_user_id: number | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateRoutingRuleInput {
  eventType: string;
  targetRole: string | null;
  targetUserId: number | null;
  notes: string | null;
}

export interface UpdateRoutingRuleInput {
  targetRole?: string | null;
  targetUserId?: number | null;
  notes?: string | null;
  isActive?: boolean | null;
}

@Injectable()
export class NotificationRoutingRepository {
  private readonly logger = new Logger(NotificationRoutingRepository.name);

  async list(): Promise<Result<NotificationRoutingRuleRow[]>> {
    try {
      const r = await runQuery<NotificationRoutingRuleRow>(sql`
        SELECT id, event_type, target_role, target_user_id, is_active, notes, created_at, updated_at
        FROM notification_routing_rules
        ORDER BY event_type, id
      `);
      return Ok(r.rows);
    } catch (e) {
      return Err({ message: (e as Error).message, code: 'DB_ERROR' });
    }
  }

  async create(input: CreateRoutingRuleInput): Promise<Result<{ id: number }>> {
    try {
      const r = await runQuery<{ id: number }>(sql`
        INSERT INTO notification_routing_rules (event_type, target_role, target_user_id, notes)
        VALUES (${input.eventType}, ${input.targetRole}, ${input.targetUserId}, ${input.notes})
        RETURNING id
      `);
      const row = r.rows[0];
      if (!row) return Err({ message: 'Marshrutlash qoidasi yaratilmadi', code: 'DB_ERROR' });
      return Ok({ id: row.id });
    } catch (e) {
      return Err({ message: (e as Error).message, code: 'DB_ERROR' });
    }
  }

  async update(id: number, patch: UpdateRoutingRuleInput): Promise<Result<void>> {
    try {
      const r = await runQuery<{ id: number }>(sql`
        UPDATE notification_routing_rules SET
          target_role    = COALESCE(${patch.targetRole ?? null}, target_role),
          target_user_id = COALESCE(${patch.targetUserId ?? null}, target_user_id),
          notes          = COALESCE(${patch.notes ?? null}, notes),
          is_active      = COALESCE(${patch.isActive ?? null}, is_active),
          updated_at     = NOW()
        WHERE id = ${id}
        RETURNING id
      `);
      if (r.rows.length === 0) return Err({ message: 'Marshrutlash qoidasi topilmadi', code: 'NOT_FOUND' });
      return Ok(undefined);
    } catch (e) {
      return Err({ message: (e as Error).message, code: 'DB_ERROR' });
    }
  }

  async remove(id: number): Promise<Result<void>> {
    try {
      const r = await runQuery<{ id: number }>(sql`
        DELETE FROM notification_routing_rules WHERE id = ${id} RETURNING id
      `);
      if (r.rows.length === 0) return Err({ message: 'Marshrutlash qoidasi topilmadi', code: 'NOT_FOUND' });
      return Ok(undefined);
    } catch (e) {
      return Err({ message: (e as Error).message, code: 'DB_ERROR' });
    }
  }

  /** Berilgan hodisa-turi uchun faol marshrutlash qatorlarini qaytaradi (bo'sh bo'lishi mumkin). */
  private async findActiveRules(
    eventType: string,
  ): Promise<{ target_role: string | null; target_user_id: number | null }[]> {
    const r = await runQuery<{ target_role: string | null; target_user_id: number | null }>(sql`
      SELECT target_role, target_user_id
      FROM notification_routing_rules
      WHERE event_type = ${eventType} AND is_active = TRUE
    `);
    return r.rows;
  }

  /**
   * Hodisa-turi bo'yicha nishon xodim ID'larini hal qiladi (per-user bildirishnoma listenerlari uchun).
   * Jadvalda qator bo'lmasa — `fallbackRole` bilan avvalgi hardcoded xatti-harakatga qaytadi.
   */
  async resolveUserIds(eventType: string, fallbackRole: string): Promise<number[]> {
    try {
      const rules = await this.findActiveRules(eventType);
      const roles = new Set<string>();
      const userIds = new Set<number>();

      if (rules.length === 0) {
        roles.add(fallbackRole);
      } else {
        for (const rule of rules) {
          if (rule.target_user_id) userIds.add(rule.target_user_id);
          if (rule.target_role) roles.add(rule.target_role);
        }
      }

      if (roles.size > 0) {
        const roleArr = Array.from(roles);
        const roleRows = await runQuery<{ id: number }>(sql`
          SELECT id FROM users WHERE role = ANY(${roleArr}::text[]) AND is_active = TRUE LIMIT 200
        `);
        for (const row of roleRows.rows) userIds.add(row.id);
      }

      return Array.from(userIds);
    } catch (e) {
      this.logger.warn(`resolveUserIds(${eventType}) failed, fallback to hardcoded role query: ${(e as Error).message}`);
      try {
        const fallback = await runQuery<{ id: number }>(sql`
          SELECT id FROM users WHERE role = ${fallbackRole} AND is_active = TRUE LIMIT 200
        `);
        return fallback.rows.map(r => r.id);
      } catch {
        return [];
      }
    }
  }

  /**
   * Hodisa-turi bo'yicha nishon rol(lar)ni hal qiladi (rol-broadcast uslubidagi joblar uchun,
   * masalan pos-low-stock.job.ts). Jadvalda qator bo'lmasa — `[fallbackRole]` qaytaradi.
   */
  async resolveRoles(eventType: string, fallbackRole: string): Promise<string[]> {
    try {
      const rules = await this.findActiveRules(eventType);
      const roles = new Set<string>();
      for (const rule of rules) {
        if (rule.target_role) roles.add(rule.target_role);
      }
      if (roles.size === 0) roles.add(fallbackRole);
      return Array.from(roles);
    } catch (e) {
      this.logger.warn(`resolveRoles(${eventType}) failed, fallback to hardcoded role: ${(e as Error).message}`);
      return [fallbackRole];
    }
  }
}
