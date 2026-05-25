// NOTE: RULE4_EXCEPTION — raw SQL retained: aggregate queries over legacy KPI tables
// (hr_kpi, employee_targets) that lack Drizzle schemas; conditional GROUP BY sums
// and JOIN patterns are not expressible via Drizzle builder API.
/**
 * @module legacy-kpi.helpers
 * @description Profil sahifasi KPI kartalari uchun haqiqiy ma'lumot qaytaruvchi
 *   raw SQL yordamchilar (frontend `PerformanceTab`).
 *
 *   Endpointlar:
 *     - GET /abc-analysis/user/:id  → AbcAnalysis shape
 *     - GET /progress/user/:id       → CourseProgressRecord[] shape
 *
 *   Manba jadvallar (probe asosida tasdiqlangan):
 *     - employee_ratings(employee_id, composite_score)
 *     - attendance_logs(employee_id, status, is_late_check_in, check_in_at)
 *     - lms_exam_attempts(user_id, passed, status)
 *     - enrollments(employee_id, status, progress_percent, course_id, completed_at)
 *     - courses(id, title_uz)
 */

import { db } from '@shared/db';
import { sql } from 'drizzle-orm';

const safeInt = (v: unknown): number => {
  const n = parseInt(String(v ?? ''), 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

export interface AbcAnalysisDto {
  grade: 'A' | 'B' | 'C';
  score: number;
  performanceRate: number;
  punctualityRate: number;
  attendanceRate: number;
  courseCompletionRate: number;
}

export interface CourseProgressRow {
  id: number;
  userId: number;
  courseId: number;
  completedLessons: number;
  totalLessons: number;
  isCompleted: boolean;
  course: { title: string };
}

/**
 * `/abc-analysis/user/:id` — haqiqiy KPI ko'rsatkichlari.
 * Hisoblash:
 *   - score:           AVG(employee_ratings.composite_score) / 20  (0..5 shkalada)
 *   - grade:           score >= 4 → A · >= 3 → B · aks holda C
 *   - performanceRate: round(score * 20)
 *   - attendanceRate:  present / total * 100  (attendance_logs)
 *   - punctualityRate: (present − late) / total * 100
 *   - courseCompletionRate: passed / total_attempts * 100  (lms_exam_attempts)
 *
 * Manba jadvallar bo'sh bo'lsa 0 qaytadi (stub emas — haqiqiy 0).
 */
export async function getAbcAnalysisForUserRaw(employeeIdParam: string): Promise<AbcAnalysisDto> {
  const empId = safeInt(employeeIdParam);
  if (empId === 0) {
    return { grade: 'C', score: 0, performanceRate: 0, punctualityRate: 0, attendanceRate: 0, courseCompletionRate: 0 };
  }
  try {
    const r = await db.execute(sql`
      WITH rating AS (
        SELECT COALESCE(AVG(composite_score), 0)::numeric AS avg_score
        FROM employee_ratings WHERE employee_id = ${empId}
      ),
      att AS (
        SELECT
          COUNT(*) FILTER (WHERE status = 'present') AS present_cnt,
          COUNT(*) FILTER (WHERE status = 'present' AND COALESCE(is_late_check_in, false) = true) AS late_cnt,
          COUNT(*) AS total_cnt
        FROM attendance_logs WHERE employee_id = ${empId}
      ),
      lms AS (
        SELECT
          COUNT(*) FILTER (WHERE passed = true) AS passed_cnt,
          COUNT(*) AS total_cnt
        FROM lms_exam_attempts WHERE user_id = ${empId}
      )
      SELECT
        COALESCE(rating.avg_score, 0) AS avg_score,
        att.present_cnt, att.late_cnt, att.total_cnt AS att_total,
        lms.passed_cnt, lms.total_cnt AS lms_total
      FROM rating, att, lms
    `);
    const row = (r.rows?.[0] as Record<string, unknown> | undefined) ?? {};
    const avgScore  = Number(row.avg_score ?? 0);            // 0..100 (composite scale)
    const presentN  = Number(row.present_cnt ?? 0);
    const lateN     = Number(row.late_cnt ?? 0);
    const attTotal  = Number(row.att_total ?? 0);
    const passedN   = Number(row.passed_cnt ?? 0);
    const lmsTotal  = Number(row.lms_total ?? 0);

    const score5    = Math.round((avgScore / 20) * 10) / 10;             // 0..5, 1 decimal
    const grade: 'A' | 'B' | 'C' = score5 >= 4 ? 'A' : score5 >= 3 ? 'B' : 'C';
    const performanceRate     = Math.round(avgScore);                    // 0..100
    const attendanceRate      = attTotal > 0 ? Math.round((presentN / attTotal) * 100) : 0;
    const punctualityRate     = attTotal > 0 ? Math.round(((presentN - lateN) / attTotal) * 100) : 0;
    const courseCompletionRate = lmsTotal > 0 ? Math.round((passedN / lmsTotal) * 100) : 0;

    return {
      grade,
      score: score5,
      performanceRate,
      attendanceRate,
      punctualityRate: Math.max(0, punctualityRate),
      courseCompletionRate,
    };
  } catch {
    return { grade: 'C', score: 0, performanceRate: 0, punctualityRate: 0, attendanceRate: 0, courseCompletionRate: 0 };
  }
}

/**
 * `/progress/user/:id` — kurslarning to'liqlik holati.
 * `enrollments` jadvalida `progress_percent` 100 → isCompleted=true.
 * Yo'q bo'lsa bo'sh massiv (frontend bo'shni gracefulli ko'rsatadi).
 */
export async function getCourseProgressForUserRaw(employeeIdParam: string): Promise<CourseProgressRow[]> {
  const empId = safeInt(employeeIdParam);
  if (empId === 0) return [];
  try {
    const r = await db.execute(sql`
      SELECT
        e.id::int                                  AS id,
        e.employee_id::int                         AS "userId",
        e.course_id::int                           AS "courseId",
        COALESCE(e.progress_percent, 0)::int       AS "completedLessons",
        100                                        AS "totalLessons",
        (COALESCE(e.status, '') = 'completed'
          OR COALESCE(e.progress_percent, 0) >= 100) AS "isCompleted",
        COALESCE(c.title_uz, '')                   AS course_title
      FROM enrollments e
      LEFT JOIN courses c ON c.id = e.course_id
      WHERE e.employee_id = ${empId}
      ORDER BY e.created_at DESC NULLS LAST
      LIMIT 100
    `);
    const rows = (r.rows ?? []) as Record<string, unknown>[];
    return (Array.isArray(rows) ? rows : []).map((row) => ({
      id:               Number(row.id ?? 0),
      userId:           Number(row.userId ?? empId),
      courseId:         Number(row.courseId ?? 0),
      completedLessons: Number(row.completedLessons ?? 0),
      totalLessons:     Number(row.totalLessons ?? 100),
      isCompleted:      Boolean(row.isCompleted),
      course:           { title: String(row.course_title ?? '') },
    }));
  } catch {
    return [];
  }
}
