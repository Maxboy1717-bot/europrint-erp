/**
 * Communication Center — KPI va statistika xizmati.
 *
 * Maqsadli KPI qiymatlari (spec'dan):
 *  - O'rtacha javob vaqti < 4 soat
 *  - 24h o'tib ketgan inbox = 0%
 *  - Kechikkan hujjatlar < 10%
 */
import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';

export interface CcKpi {
  avgResponseTimeHours: number;
  overdue24hPct:        number;
  delayedPct:           number;
  totalActive:          number;
  approvedToday:        number;
  rejectedToday:        number;
  createdToday:         number;
  byDepartment: Array<{ deptId: number | null; deptName: string | null; count: number; overdueCount: number }>;
  employeeWorkload: Array<{ userId: number; fullName: string | null; activeCount: number }>;
  goals: { responseTimeTarget: 4; overdue24hTarget: 0; delayedTarget: 10 };
}

@Injectable()
export class CcStatsService {
  /**
   * KPI olish. Agar `userId` admin/director bo'lmasa,
   * department-statistika faqat o'sha foydalanuvchining bo'limi uchun.
   */
  async getKpi(userId: number, role: string): Promise<CcKpi> {
    const isPrivileged = ['admin', 'super_admin', 'director', 'ceo'].includes(role);

    const summary = await this.loadSummary();
    const today = await this.loadToday();
    const byDepartment = await this.loadByDepartment(userId, isPrivileged);
    const employeeWorkload = await this.loadEmployeeWorkload();

    const totalActive  = Number(summary.total_active  ?? 0);
    const overdueCount = Number(summary.overdue_count ?? 0);
    const delayedCount = Number(summary.delayed_count ?? 0);

    return {
      avgResponseTimeHours: Number(summary.avg_resp ?? 0) || 0,
      overdue24hPct:        totalActive > 0 ? Math.round((overdueCount / totalActive) * 1000) / 10 : 0,
      delayedPct:           totalActive > 0 ? Math.round((delayedCount / totalActive) * 1000) / 10 : 0,
      totalActive,
      approvedToday:        Number(today.approved ?? 0),
      rejectedToday:        Number(today.rejected ?? 0),
      createdToday:         Number(today.created  ?? 0),
      byDepartment,
      employeeWorkload,
      goals: { responseTimeTarget: 4, overdue24hTarget: 0, delayedTarget: 10 },
    };
  }

  private async loadSummary(): Promise<{
    avg_resp: string | null; total_active: string; overdue_count: string; delayed_count: string;
  }> {
    const summary = await runQuery<{
      avg_resp: string | null; total_active: string; overdue_count: string; delayed_count: string;
    }>(sql`
      WITH bh AS (
        SELECT document_id, MIN(moved_at) AS first_move
        FROM cc_basket_history
        WHERE to_basket = 'pending'
        GROUP BY document_id
      )
      SELECT
        ROUND(AVG(EXTRACT(EPOCH FROM (bh.first_move - d.created_at)) / 3600.0)::numeric, 2)::text AS avg_resp,
        COUNT(*) FILTER (WHERE d.workflow_state IN ('sent','in_progress'))::text AS total_active,
        COUNT(*) FILTER (WHERE d.is_inbox_overdue = true AND d.basket_state = 'inbox')::text AS overdue_count,
        COUNT(*) FILTER (WHERE d.created_at > NOW() - INTERVAL '30 days'
                              AND d.workflow_state IN ('sent','in_progress')
                              AND EXTRACT(EPOCH FROM (NOW() - d.created_at)) > 4 * 3600)::text AS delayed_count
      FROM cc_documents d
      LEFT JOIN bh ON bh.document_id = d.id
      WHERE d.archived_at IS NULL
    `).catch(() => ({ rows: [{ avg_resp: '0', total_active: '0', overdue_count: '0', delayed_count: '0' }] }));
    return summary.rows[0] ?? { avg_resp: '0', total_active: '0', overdue_count: '0', delayed_count: '0' };
  }

  private async loadToday(): Promise<{ created: string; approved: string; rejected: string }> {
    // WHERE covers docs created OR updated today so approved/rejected today are not missed
    const today = await runQuery<{ created: string; approved: string; rejected: string }>(sql`
      SELECT
        COUNT(*) FILTER (WHERE DATE(d.created_at) = CURRENT_DATE)::text AS created,
        COUNT(*) FILTER (WHERE DATE(d.updated_at) = CURRENT_DATE AND d.workflow_state = 'approved')::text AS approved,
        COUNT(*) FILTER (WHERE DATE(d.updated_at) = CURRENT_DATE AND d.workflow_state = 'rejected')::text AS rejected
      FROM cc_documents d
      WHERE (d.created_at >= CURRENT_DATE OR d.updated_at >= CURRENT_DATE)
        AND d.archived_at IS NULL
    `).catch(() => ({ rows: [{ created: '0', approved: '0', rejected: '0' }] }));
    return today.rows[0] ?? { created: '0', approved: '0', rejected: '0' };
  }

  private async loadByDepartment(userId: number, isPrivileged: boolean): Promise<CcKpi['byDepartment']> {
    try {
      const deptFilter = isPrivileged ? sql`TRUE` : sql`
        e.department_id = (SELECT department_id FROM employees WHERE user_id = ${userId} LIMIT 1)
      `;
      const r = await runQuery<{
        dept_id: number | null; dept_name: string | null; cnt: string; overdue_cnt: string;
      }>(sql`
        SELECT
          e.department_id::int                     AS dept_id,
          MAX(od.name)                             AS dept_name,
          COUNT(*)::text                           AS cnt,
          COUNT(*) FILTER (WHERE d.is_inbox_overdue = true)::text AS overdue_cnt
        FROM cc_documents d
        LEFT JOIN employees e        ON e.user_id = d.basket_owner_user_id
        LEFT JOIN org_departments od ON od.id = e.department_id
        WHERE d.archived_at IS NULL
          AND d.basket_owner_user_id IS NOT NULL
          AND ${deptFilter}
        GROUP BY e.department_id
        ORDER BY cnt DESC
        LIMIT 20
      `);
      return r.rows.map(row => ({
        deptId: row.dept_id, deptName: row.dept_name,
        count: Number(row.cnt), overdueCount: Number(row.overdue_cnt),
      }));
    } catch { return []; }
  }

  private async loadEmployeeWorkload(): Promise<CcKpi['employeeWorkload']> {
    try {
      const r = await runQuery<{ user_id: number; full_name: string | null; active_count: string }>(sql`
        SELECT
          d.basket_owner_user_id                            AS user_id,
          NULLIF(TRIM(COALESCE(u.first_name,'') || ' ' || COALESCE(u.last_name,'')), '') AS full_name,
          COUNT(*)::text                                    AS active_count
        FROM cc_documents d
        LEFT JOIN users u ON u.id = d.basket_owner_user_id
        WHERE d.basket_state IN ('inbox','pending')
          AND d.basket_owner_user_id IS NOT NULL
          AND d.archived_at IS NULL
        GROUP BY d.basket_owner_user_id, u.first_name, u.last_name
        ORDER BY COUNT(*) DESC
        LIMIT 10
      `);
      return r.rows.map(row => ({
        userId:      row.user_id,
        fullName:    row.full_name,
        activeCount: Number(row.active_count),
      }));
    } catch { return []; }
  }
}
