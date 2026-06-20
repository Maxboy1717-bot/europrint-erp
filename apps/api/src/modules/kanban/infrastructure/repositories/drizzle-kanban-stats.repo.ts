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
      const boardFilter     = boardId ? sql`AND board_id = ${boardId}`    : sql``;
      const boardFilterKtt  = boardId
        ? sql`AND ktt.card_id IN (SELECT id::text FROM kanban_cards WHERE board_id = ${boardId})`
        : sql``;

      // ── 1. Summary ────────────────────────────────────────────────────────
      const [summaryRes, weeklyRes, timeRes, empRes] = await Promise.all([

        runQuery<Record<string, unknown>>(sql`
          SELECT
            COUNT(*) FILTER (WHERE deleted_at IS NULL)                                               AS total_tasks,
            COUNT(*) FILTER (WHERE deleted_at IS NULL AND completed_at IS NOT NULL)                  AS completed_tasks,
            COUNT(*) FILTER (WHERE deleted_at IS NULL AND completed_at IS NULL)                      AS pending_tasks,
            COUNT(*) FILTER (WHERE deleted_at IS NULL AND accepted_at IS NOT NULL AND completed_at IS NULL) AS accepted_not_completed,
            COUNT(*) FILTER (WHERE deleted_at IS NULL AND source = 'telegram')                       AS telegram_tasks,
            COUNT(*) FILTER (WHERE deleted_at IS NULL AND due_date::date < CURRENT_DATE AND completed_at IS NULL) AS overdue_tasks,
            ROUND(
              CASE WHEN COUNT(*) FILTER (WHERE deleted_at IS NULL) = 0 THEN 0
                   ELSE COUNT(*) FILTER (WHERE deleted_at IS NULL AND completed_at IS NOT NULL)::numeric
                      / COUNT(*) FILTER (WHERE deleted_at IS NULL) * 100
              END
            )                                                                                         AS completion_rate,
            ROUND(
              AVG(
                EXTRACT(EPOCH FROM (completed_at - created_at)) / 86400.0
              ) FILTER (WHERE deleted_at IS NULL AND completed_at IS NOT NULL)
            )                                                                                         AS avg_completion_days
          FROM kanban_cards
          WHERE 1=1 ${boardFilter}
        `),

        // ── 2. Weekly trend (last 7 days) ──────────────────────────────────
        runQuery<Record<string, unknown>>(sql`
          SELECT
            DATE_TRUNC('day', d.day)::date::text                        AS date,
            TO_CHAR(d.day, 'Dy')                                        AS day_name,
            COUNT(kc_created.id)::int                                   AS created,
            COUNT(kc_completed.id)::int                                 AS completed
          FROM generate_series(
            CURRENT_DATE - INTERVAL '6 days',
            CURRENT_DATE,
            INTERVAL '1 day'
          ) AS d(day)
          LEFT JOIN kanban_cards kc_created
            ON kc_created.deleted_at IS NULL
            AND DATE_TRUNC('day', kc_created.created_at) = DATE_TRUNC('day', d.day)
            ${boardFilter}
          LEFT JOIN kanban_cards kc_completed
            ON kc_completed.deleted_at IS NULL
            AND kc_completed.completed_at IS NOT NULL
            AND DATE_TRUNC('day', kc_completed.completed_at) = DATE_TRUNC('day', d.day)
            ${boardFilter}
          GROUP BY d.day
          ORDER BY d.day
        `),

        // ── 3. Time tracking ───────────────────────────────────────────────
        runQuery<Record<string, unknown>>(sql`
          SELECT
            COALESCE(SUM(ktt.duration_minutes), 0)::int AS total_tracked_minutes
          FROM kanban_time_tracks ktt
          WHERE ktt.ended_at IS NOT NULL
            ${boardFilterKtt}
        `),

        // ── 4. Employee stats ──────────────────────────────────────────────
        runQuery<Record<string, unknown>>(sql`
          SELECT
            kc.owner_user_id::text                                       AS user_id,
            COUNT(*)::int                                                 AS assigned,
            COUNT(*) FILTER (WHERE kc.completed_at IS NOT NULL)::int     AS completed,
            COUNT(*) FILTER (
              WHERE kc.completed_at IS NOT NULL
                AND kc.due_date IS NOT NULL
                AND kc.completed_at <= kc.due_date::timestamp
            )::int                                                        AS on_time,
            COUNT(*) FILTER (
              WHERE kc.completed_at IS NOT NULL
                AND kc.due_date IS NOT NULL
                AND kc.completed_at > kc.due_date::timestamp
            )::int                                                        AS late,
            ROUND(
              AVG(
                EXTRACT(EPOCH FROM (kc.completed_at - kc.created_at)) / 3600.0
              ) FILTER (WHERE kc.completed_at IS NOT NULL)
            )::float                                                      AS avg_completion_time
          FROM kanban_cards kc
          WHERE kc.deleted_at IS NULL
            AND kc.owner_user_id IS NOT NULL
            ${boardFilter}
          GROUP BY kc.owner_user_id
          ORDER BY assigned DESC
          LIMIT 50
        `),
      ]);

      const s  = summaryRes.rows[0]  ?? {};
      const t  = timeRes.rows[0]     ?? {};

      const totalTrackedMinutes = Number(t.total_tracked_minutes ?? 0);

      return {
        summary: {
          totalTasks:           Number(s.total_tasks           ?? 0),
          completedTasks:       Number(s.completed_tasks       ?? 0),
          pendingTasks:         Number(s.pending_tasks         ?? 0),
          acceptedNotCompleted: Number(s.accepted_not_completed ?? 0),
          telegramTasks:        Number(s.telegram_tasks        ?? 0),
          overdueTasks:         Number(s.overdue_tasks         ?? 0),
          completionRate:       Number(s.completion_rate       ?? 0),
          avgCompletionDays:    Number(s.avg_completion_days   ?? 0),
        },
        weeklyTrend: (Array.isArray(weeklyRes.rows) ? weeklyRes.rows : []).map((r) => ({
          date:      String(r.date      ?? ''),
          dayName:   String(r.day_name  ?? ''),
          created:   Number(r.created   ?? 0),
          completed: Number(r.completed ?? 0),
        })),
        timeTracking: {
          totalTrackedMinutes,
          totalTrackedHours: Math.round(totalTrackedMinutes / 60),
        },
        employeeStats: (Array.isArray(empRes.rows) ? empRes.rows : []).map((r) => ({
          userId:            String(r.user_id            ?? ''),
          assigned:          Number(r.assigned           ?? 0),
          completed:         Number(r.completed          ?? 0),
          onTime:            Number(r.on_time            ?? 0),
          late:              Number(r.late               ?? 0),
          avgCompletionTime: Number(r.avg_completion_time ?? 0),
        })),
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
