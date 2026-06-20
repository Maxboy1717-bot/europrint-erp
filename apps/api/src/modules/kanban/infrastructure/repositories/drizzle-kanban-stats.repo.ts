/**
 * @module drizzle-kanban-stats.repo
 * @description Analytics & stats sub-repository — split out of
 *   `DrizzleKanbanAnalyticsRepository` to keep individual files under 300
 *   lines (Rule 16). Public method names preserved; the parent repo delegates.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { eq, ne, sql } from 'drizzle-orm';
import { db, kanban_tasks, runQuery } from '@shared/db';
import { safeCall, Result } from '@common/result';

const COUNT_EXPR = sql<number>`count(*)::int`;

@Injectable()
export class DrizzleKanbanStatsRepository {

  // ─── Analytics & Stats ────────────────────────────────────────────────────

  async getTaskStats(boardId?: string): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const boardFilter = boardId ? sql`AND board_id = ${boardId}` : sql``;
      const today = _time.now().toISOString().split('T')[0];
      const rows = await runQuery<Record<string, unknown>>(sql`
        SELECT
          COUNT(*) FILTER (WHERE deleted_at IS NULL)                            AS total,
          COUNT(*) FILTER (WHERE deleted_at IS NULL AND completed_at IS NOT NULL) AS completed,
          COUNT(*) FILTER (WHERE deleted_at IS NULL AND completed_at IS NULL)   AS in_progress,
          COUNT(*) FILTER (WHERE deleted_at IS NULL AND due_date < ${today} AND completed_at IS NULL) AS overdue,
          COUNT(*) FILTER (WHERE deleted_at IS NULL AND due_date = ${today})    AS today_due
        FROM kanban_cards
        WHERE 1=1 ${boardFilter}
      `);
      const s = rows.rows[0] ?? {};
      return {
        total:      Number(s.total       ?? 0),
        completed:  Number(s.completed   ?? 0),
        inProgress: Number(s.in_progress ?? 0),
        overdue:    Number(s.overdue     ?? 0),
        todayDue:   Number(s.today_due   ?? 0),
      };
    });
  }

  async getTeamMetrics(boardId?: string): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const boardFilter = boardId ? sql`AND kc.board_id = ${boardId}` : sql``;
      const today = _time.now().toISOString().split('T')[0];
      const rows = await runQuery<Record<string, unknown>>(sql`
        SELECT
          kc.owner_user_id,
          (u.first_name || ' ' || u.last_name) AS full_name,
          u.email,
          COUNT(*) FILTER (WHERE kc.deleted_at IS NULL)                              AS total,
          COUNT(*) FILTER (WHERE kc.deleted_at IS NULL AND kc.completed_at IS NOT NULL) AS completed,
          COUNT(*) FILTER (WHERE kc.deleted_at IS NULL AND kc.due_date < ${today} AND kc.completed_at IS NULL) AS overdue
        FROM kanban_cards kc
        LEFT JOIN users u ON u.id = kc.owner_user_id
        WHERE kc.owner_user_id IS NOT NULL ${boardFilter}
        GROUP BY kc.owner_user_id, u.first_name, u.last_name, u.email
        ORDER BY total DESC
        LIMIT 50
      `);
      return {
        employees: rows.rows.map((r) => ({
          userId:    r.owner_user_id,
          fullName:  r.full_name ?? 'Noma\'lum',
          email:     r.email ?? '',
          total:     Number(r.total     ?? 0),
          completed: Number(r.completed ?? 0),
          overdue:   Number(r.overdue   ?? 0),
          rate:      Number(r.total) > 0 ? Math.round((Number(r.completed) / Number(r.total)) * 100) : 0,
        })),
      };
    });
  }

  async getOverdueInbox(boardId?: string): Promise<Result<Record<string, unknown>[]>> {
    return safeCall(async () => {
      const boardFilter = boardId ? sql`AND kc.board_id = ${boardId}` : sql``;
      const rows = await runQuery<Record<string, unknown>>(sql`
        SELECT
          kc.id, kc.title, kc.due_date, kc.priority, kc.owner_user_id,
          kc.column_id, kc.board_id, kc.created_at, kc.updated_at,
          (u.first_name || ' ' || u.last_name) AS owner_name,
          kco.name   AS column_name,
          kb.name    AS board_name,
          EXTRACT(EPOCH FROM (NOW() - kc.created_at)) / 3600 AS hours_old
        FROM kanban_cards kc
        LEFT JOIN users u ON u.id = kc.owner_user_id
        LEFT JOIN kanban_columns kco ON kco.id = kc.column_id
        LEFT JOIN kanban_boards kb ON kb.id = kc.board_id
        WHERE kc.deleted_at IS NULL
          AND kc.completed_at IS NULL
          AND (
            (kc.due_date::date < CURRENT_DATE)
            OR (LOWER(kco.name) LIKE '%kiruvchi%' AND kc.created_at < NOW() - INTERVAL '24 hours')
            OR (LOWER(kco.name) LIKE '%inbox%'    AND kc.created_at < NOW() - INTERVAL '24 hours')
          )
          ${boardFilter}
        ORDER BY kc.due_date ASC NULLS LAST, kc.created_at ASC
        LIMIT 100
      `);
      return rows.rows;
    });
  }

  async getEmployees(): Promise<Result<Record<string, unknown>[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Record<string, unknown>>(sql`
        SELECT id, (first_name || ' ' || last_name) AS full_name, email, is_active, phone
        FROM users
        WHERE is_active = TRUE
        ORDER BY first_name, last_name
        LIMIT 500
      `);
      return rows.rows;
    });
  }

  // ─── Legacy helpers (keeping for backward compatibility) ──────────────────

  async getSprintInfo(): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const active = await db.select({ count: COUNT_EXPR }).from(kanban_tasks)
        .where(ne(kanban_tasks.status, 'done'));
      const done = await db.select({ count: COUNT_EXPR }).from(kanban_tasks)
        .where(eq(kanban_tasks.status, 'done'));
      return {
        activeSprint: { totalCards: Number(active[0]?.count ?? 0), completedCards: Number(done[0]?.count ?? 0) },
        upcomingSprints: [],
        completedSprints: [],
      };
    });
  }

  async getMembers(): Promise<Result<Record<string, unknown>[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Record<string, unknown>>(sql`
        SELECT DISTINCT kc.owner_user_id AS user_id,
               (u.first_name || ' ' || u.last_name) AS full_name, u.email
        FROM kanban_cards kc
        LEFT JOIN users u ON u.id = kc.owner_user_id
        WHERE kc.owner_user_id IS NOT NULL AND kc.deleted_at IS NULL
        ORDER BY full_name
      `);
      return rows.rows;
    });
  }

  async getOverdueCards(): Promise<Result<Record<string, unknown>[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Record<string, unknown>>(sql`
        SELECT kc.*, (u.first_name || ' ' || u.last_name) AS owner_name
        FROM kanban_cards kc
        LEFT JOIN users u ON u.id = kc.owner_user_id
        WHERE kc.deleted_at IS NULL AND kc.completed_at IS NULL
          AND kc.due_date::date < CURRENT_DATE
        ORDER BY kc.due_date ASC
        LIMIT 100
      `);
      return rows.rows;
    });
  }

  async getCardsByEmployee(employeeId: string): Promise<Result<Record<string, unknown>[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Record<string, unknown>>(sql`
        SELECT kc.*, kco.name AS column_name, kb.name AS board_name
        FROM kanban_cards kc
        LEFT JOIN kanban_columns kco ON kco.id = kc.column_id
        LEFT JOIN kanban_boards kb ON kb.id = kc.board_id
        WHERE kc.owner_user_id = ${employeeId} AND kc.deleted_at IS NULL
        ORDER BY kc.created_at DESC
      `);
      return rows.rows;
    });
  }

  async getProductivityReport(): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const rows = await runQuery<Record<string, unknown>>(sql`
        SELECT
          COUNT(*)                                                                AS total,
          COUNT(*) FILTER (WHERE completed_at IS NOT NULL)                       AS completed,
          COUNT(*) FILTER (WHERE due_date::date < CURRENT_DATE AND completed_at IS NULL) AS overdue,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')        AS last_7_days,
          COUNT(*) FILTER (WHERE completed_at >= NOW() - INTERVAL '7 days')      AS completed_7_days
        FROM kanban_cards WHERE deleted_at IS NULL
      `);
      const s = rows.rows[0] ?? {};
      return {
        period: 'all',
        totalCards:     Number(s.total         ?? 0),
        completedCards: Number(s.completed      ?? 0),
        overdueCards:   Number(s.overdue        ?? 0),
        last7Days:      Number(s.last_7_days    ?? 0),
        completed7Days: Number(s.completed_7_days ?? 0),
        generatedAt: _time.now().toISOString(),
      };
    });
  }

  async getOverdueReport(): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const rows = await runQuery<Record<string, unknown>>(sql`
        SELECT kc.id, kc.title, kc.due_date, kc.priority, kc.owner_user_id,
               (u.first_name || ' ' || u.last_name) AS owner_name, kb.name AS board_name
        FROM kanban_cards kc
        LEFT JOIN users u ON u.id = kc.owner_user_id
        LEFT JOIN kanban_boards kb ON kb.id = kc.board_id
        WHERE kc.deleted_at IS NULL AND kc.completed_at IS NULL
          AND kc.due_date::date < CURRENT_DATE
        ORDER BY kc.due_date ASC
        LIMIT 200
      `);
      return {
        overdueCards: rows.rows,
        totalOverdue: rows.rows.length,
        generatedAt: _time.now().toISOString(),
      };
    });
  }

  async getAnalyticsSummary(): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const rows = await runQuery<Record<string, unknown>>(sql`
        SELECT
          COUNT(*)                                                                AS total,
          COUNT(*) FILTER (WHERE completed_at IS NOT NULL)                       AS completed,
          COUNT(*) FILTER (WHERE due_date::date < CURRENT_DATE AND completed_at IS NULL) AS overdue,
          COUNT(DISTINCT owner_user_id) FILTER (WHERE owner_user_id IS NOT NULL) AS active_users
        FROM kanban_cards WHERE deleted_at IS NULL
      `);
      const s = rows.rows[0] ?? {};
      return {
        totalCards:     Number(s.total       ?? 0),
        completedCards: Number(s.completed   ?? 0),
        overdueCards:   Number(s.overdue     ?? 0),
        activeUsers:    Number(s.active_users ?? 0),
      };
    });
  }

  async getEmployeePerformance(): Promise<Result<Record<string, unknown>[]>> {
    return safeCall(async () => {
      // NOTE: kanban_cards.owner_user_id = integer, users.id = integer (direct join).
      // kanban_time_tracks.card_id = text, kanban_results.card_id = text → cast kc.id::text.
      // Return shape matches FE EmployeePerformance[] (user.id/fullName/profileImageUrl + totals).
      const rows = await runQuery<Record<string, unknown>>(sql`
        SELECT
          u.id::text                                     AS user_id,
          COALESCE(u.first_name || ' ' || u.last_name, u.email) AS full_name,
          u.profile_image_url,
          COUNT(DISTINCT kc.id)::int                    AS total_tasks,
          COALESCE(SUM(ktt.duration_minutes), 0)::int   AS total_time_minutes,
          COUNT(DISTINCT kr.id)::int                    AS total_results
        FROM kanban_cards kc
        LEFT JOIN users u ON u.id = kc.owner_user_id
        LEFT JOIN kanban_time_tracks ktt
               ON ktt.card_id = kc.id::text AND ktt.user_id = u.id
        LEFT JOIN kanban_results kr ON kr.card_id = kc.id::text
        WHERE kc.deleted_at IS NULL AND kc.owner_user_id IS NOT NULL
        GROUP BY u.id, u.first_name, u.last_name, u.email, u.profile_image_url
        ORDER BY total_tasks DESC
        LIMIT 50
      `);
      return rows.rows.map((r) => ({
        user: {
          id:              String(r.user_id ?? ''),
          fullName:        String(r.full_name ?? 'Noma\'lum'),
          profileImageUrl: (r.profile_image_url as string | null) ?? null,
        },
        totalTasks:       Number(r.total_tasks       ?? 0),
        totalTimeMinutes: Number(r.total_time_minutes ?? 0),
        totalResults:     Number(r.total_results      ?? 0),
      }));
    });
  }
}
