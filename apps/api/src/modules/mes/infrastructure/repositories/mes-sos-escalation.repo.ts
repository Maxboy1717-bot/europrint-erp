/**
 * @module mes-sos-escalation.repo
 * @description SOS/downtime org-zanjir eskalatsiya (#11) data-access layer.
 *   Eskalatsiya yo'li: work_centers.org_department_id (KARTA) → org_departments.parent_id
 *   bo'ylab usta → bo'lim → direktor. Javob (resolved) bo'lmasa, timeout-cron keyingi
 *   parent'ga ko'taradi (escalation_level += 1) va yangi javobgarga bildirishnoma yozadi.
 *
 *   ⚠️ FABRIKATSIYA YO'Q (Q-40): org_departments.head_user_id egasi-data (hozir NULL).
 *   Kartada head yo'q bo'lsa, assigned_user_id NULL qoldiriladi (soxta foydalanuvchi YOZILMAYDI) —
 *   eskalatsiya baribir parent kartaga ko'tariladi, faqat shaxsiy bildirishnoma yuborilmaydi.
 */

import { Injectable, Logger } from '@nestjs/common';
import { runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';

type Row = Record<string, unknown>;

/** Eskalatsiya javobsizlik deadline'i (daqiqa) — har timeout'dan keyin keyingi darajaga. */
export const SOS_ESCALATION_TIMEOUT_MINUTES = 10;

export interface ChainNode {
  department_id: number;
  head_user_id: number | null;
  name: string | null;
  parent_id: number | null;
}

@Injectable()
export class MesSosEscalationRepository {
  private readonly logger = new Logger(MesSosEscalationRepository.name);

  /**
   * SOS hodisasining boshlang'ich javobgar kartasini (org_departments) work_center'dan topadi.
   * work_centers.org_department_id → KARTA. Topilmasa null (eskalatsiya bo'lmaydi, faqat log).
   */
  async resolveInitialDepartment(workCenterId: number | null): Promise<ChainNode | null> {
    if (!workCenterId) return null;
    try {
      const rows = await runQuery<Row>(sql`
        SELECT d.id AS department_id, d.head_user_id, d.name, d.parent_id
        FROM work_centers wc
        JOIN org_departments d ON d.id = wc.org_department_id
        WHERE wc.id = ${workCenterId}
      `);
      const r = rows.rows[0] as Row | undefined;
      if (!r) return null;
      return {
        department_id: Number(r.department_id),
        head_user_id: r.head_user_id != null ? Number(r.head_user_id) : null,
        name: (r.name as string) ?? null,
        parent_id: r.parent_id != null ? Number(r.parent_id) : null,
      };
    } catch (err) {
      this.logger.error(`resolveInitialDepartment: ${(err as Error).message}`);
      return null;
    }
  }

  /** Zanjirdagi keyingi (yuqori) kartani parent_id bo'ylab qaytaradi. Tepa = null. */
  async getParentDepartment(departmentId: number): Promise<ChainNode | null> {
    try {
      const rows = await runQuery<Row>(sql`
        SELECT p.id AS department_id, p.head_user_id, p.name, p.parent_id
        FROM org_departments d
        JOIN org_departments p ON p.id = d.parent_id
        WHERE d.id = ${departmentId}
      `);
      const r = rows.rows[0] as Row | undefined;
      if (!r) return null;
      return {
        department_id: Number(r.department_id),
        head_user_id: r.head_user_id != null ? Number(r.head_user_id) : null,
        name: (r.name as string) ?? null,
        parent_id: r.parent_id != null ? Number(r.parent_id) : null,
      };
    } catch (err) {
      this.logger.error(`getParentDepartment: ${(err as Error).message}`);
      return null;
    }
  }

  /** SOS qatorini boshlang'ich javobgar + deadline + tarix bilan yangilaydi (level 0). */
  async assignInitialResponsible(sosId: number, node: ChainNode): Promise<Row | null> {
    try {
      const historyEntry = JSON.stringify([
        { level: 0, department_id: node.department_id, user_id: node.head_user_id, at: new Date().toISOString() },
      ]);
      const rows = await runQuery<Row>(sql`
        UPDATE mes_sos_events
        SET escalation_level     = 0,
            current_department_id = ${node.department_id},
            assigned_user_id      = ${node.head_user_id},
            escalation_due_at     = NOW() + (${SOS_ESCALATION_TIMEOUT_MINUTES} || ' minutes')::interval,
            status                = 'open',
            escalation_history    = ${historyEntry}::jsonb
        WHERE id = ${sosId}
        RETURNING *
      `);
      return (rows.rows[0] ?? null) as Row | null;
    } catch (err) {
      this.logger.error(`assignInitialResponsible: ${(err as Error).message}`);
      return null;
    }
  }

  /** Hal qilinmagan, deadline'i o'tgan SOS hodisalarini qaytaradi (timeout-cron uchun). */
  async findOverdue(limit = 50): Promise<Row[]> {
    try {
      const rows = await runQuery<Row>(sql`
        SELECT id, escalation_level, current_department_id, assigned_user_id, reason, work_center_id, escalation_history
        FROM mes_sos_events
        WHERE status <> 'resolved'
          AND escalation_due_at IS NOT NULL
          AND escalation_due_at < NOW()
        ORDER BY escalation_due_at ASC
        LIMIT ${limit}
      `);
      return rows.rows as Row[];
    } catch (err) {
      this.logger.error(`findOverdue: ${(err as Error).message}`);
      return [];
    }
  }

  /** SOS'ni keyingi (yuqori) kartaga eskalatsiya qiladi: level+1, yangi deadline, tarixga qo'shadi. */
  async escalateTo(sosId: number, level: number, node: ChainNode, history: unknown[]): Promise<Row | null> {
    try {
      const newHistory = JSON.stringify([
        ...(Array.isArray(history) ? history : []),
        { level, department_id: node.department_id, user_id: node.head_user_id, at: new Date().toISOString() },
      ]);
      const rows = await runQuery<Row>(sql`
        UPDATE mes_sos_events
        SET escalation_level      = ${level},
            current_department_id = ${node.department_id},
            assigned_user_id      = ${node.head_user_id},
            escalation_due_at     = NOW() + (${SOS_ESCALATION_TIMEOUT_MINUTES} || ' minutes')::interval,
            status                = 'escalated',
            escalation_history    = ${newHistory}::jsonb
        WHERE id = ${sosId}
        RETURNING *
      `);
      return (rows.rows[0] ?? null) as Row | null;
    } catch (err) {
      this.logger.error(`escalateTo: ${(err as Error).message}`);
      return null;
    }
  }

  /** Zanjir tepasiga yetdi (parent yo'q) — deadline'ni tozalaydi, holatni escalated qoldiradi. */
  async markChainExhausted(sosId: number): Promise<void> {
    try {
      await runQuery(sql`
        UPDATE mes_sos_events
        SET escalation_due_at = NULL, status = 'escalated'
        WHERE id = ${sosId}
      `);
    } catch (err) {
      this.logger.error(`markChainExhausted: ${(err as Error).message}`);
    }
  }

  /** Javobgar foydalanuvchiga bildirishnoma yozadi (head_user_id mavjud bo'lsa). */
  async notifyResponsible(userId: number | null, sosId: number, reason: string, level: number): Promise<void> {
    if (!userId) return;
    try {
      await runQuery(sql`
        INSERT INTO notifications (user_id, type, title, message, reference_id, reference_type, created_at)
        VALUES (
          ${userId}, 'mes_sos_escalation',
          ${'SOS eskalatsiya (daraja ' + level + ')'},
          ${'Ishlab chiqarishda SOS/downtime hal qilinmagan: ' + reason},
          ${sosId}, 'mes_sos_event', NOW()
        )
      `);
    } catch (err) {
      this.logger.error(`notifyResponsible: ${(err as Error).message}`);
    }
  }

  /** SOS'ni resolved deb belgilaydi (eskalatsiya to'xtaydi). */
  async markResolved(sosId: number, resolvedBy: number | null): Promise<Row | null> {
    try {
      const rows = await runQuery<Row>(sql`
        UPDATE mes_sos_events
        SET status = 'resolved', resolved_at = NOW(), resolved_by = ${resolvedBy ?? null},
            escalation_due_at = NULL
        WHERE id = ${sosId}
        RETURNING *
      `);
      return (rows.rows[0] ?? null) as Row | null;
    } catch (err) {
      this.logger.error(`markResolved: ${(err as Error).message}`);
      return null;
    }
  }
}
