import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { castTo } from '@common/db-rows';
import { db , runQuery } from '@shared/db';
import { eq, sql } from 'drizzle-orm';
import { execTelegramBotNotificationInsert, execEmployeeBlockInsert } from '@common/database/queries-bots';
import { safeCall, Result } from '@common/result';
import {
  hrEmployees, notificationsApp,
  gamification_totals,
  hr_adaptation_cases, offboarding_cases,
} from '@shared/db';

type Row = Record<string, unknown>;

@Injectable()
export class TelegramBotsRepository {
  async insertFallbackNotification(message: string): Promise<void> {
    await db.insert(notificationsApp).values({
      user_id: 1,
      title:   'Telegram Bildirishnoma',
      message: message,
      type:    'telegram',
      is_read: false,
    }).onConflictDoNothing();
  }

  async getActiveTelegramChatIds(): Promise<Result<string[]>> {
    return safeCall(async () => {
      const rows = await db.select({ telegram_chat_id: hrEmployees.telegram_chat_id })
        .from(hrEmployees)
        .where(sql`${hrEmployees.telegram_chat_id} IS NOT NULL AND ${hrEmployees.status} = 'active'`);
      return (rows ?? []).map((r) => r.telegram_chat_id as string).filter(Boolean);
      }, 'DB_ERROR');
  }

  async getEmployeeTelegramChatId(employeeId: number): Promise<Result<string | null>> {
    return safeCall(async () => {
      const rows = await db.select({ telegram_chat_id: hrEmployees.telegram_chat_id })
        .from(hrEmployees)
        .where(eq(hrEmployees.id, employeeId))
        .limit(1);
      return (rows[0]?.telegram_chat_id as string | null) ?? null;
      }, 'DB_ERROR');
  }

  async insertNotificationByEmployeeId(employeeId: number, message: string): Promise<void> {
    await execTelegramBotNotificationInsert(employeeId, message);
  }

  async getBirthdayEmployeesToday(): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT e.id, e.first_name, e.last_name, e.telegram_chat_id, d.name AS department_name
        FROM employees e
        LEFT JOIN departments d ON d.id = e.department_id
        WHERE e.status = 'active'
          AND e.telegram_chat_id IS NOT NULL
          AND EXTRACT(month FROM e.birth_date) = EXTRACT(month FROM CURRENT_DATE)
          AND EXTRACT(day FROM e.birth_date) = EXTRACT(day FROM CURRENT_DATE)
      `);
      return rows.rows as Row[];
      }, 'DB_ERROR');
  }

  async getBirthdayEmployeesYesterday(): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT e.first_name, e.last_name, d.name AS department_name
        FROM employees e
        LEFT JOIN departments d ON d.id = e.department_id
        WHERE e.status = 'active'
          AND EXTRACT(month FROM e.birth_date) = EXTRACT(month FROM CURRENT_DATE - INTERVAL '1 day')
          AND EXTRACT(day FROM e.birth_date) = EXTRACT(day FROM CURRENT_DATE - INTERVAL '1 day')
      `);
      return rows.rows as Row[];
      }, 'DB_ERROR');
  }

  async getWorkAnniversaryEmployeesToday(): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT e.id, e.first_name, e.last_name, e.telegram_chat_id,
               d.name AS department_name,
               EXTRACT(YEAR FROM AGE(CURRENT_DATE, e.hire_date)) AS years_worked
        FROM employees e
        LEFT JOIN departments d ON d.id = e.department_id
        WHERE e.status = 'active'
          AND e.telegram_chat_id IS NOT NULL
          AND e.hire_date IS NOT NULL
          AND EXTRACT(month FROM e.hire_date) = EXTRACT(month FROM CURRENT_DATE)
          AND EXTRACT(day FROM e.hire_date) = EXTRACT(day FROM CURRENT_DATE)
          AND EXTRACT(YEAR FROM AGE(CURRENT_DATE, e.hire_date)) >= 1
      `);
      return rows.rows as Row[];
      }, 'DB_ERROR');
  }

  async getExpiringProbations(): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT e.id, e.first_name, e.last_name, e.telegram_chat_id,
               e.probation_end_date,
               (e.probation_end_date::date - CURRENT_DATE) AS days_left
        FROM employees e
        WHERE e.status = 'active'
          AND e.telegram_chat_id IS NOT NULL
          AND e.probation_end_date IS NOT NULL
          AND (e.probation_end_date::date - CURRENT_DATE) IN (7, 3, 1)
      `);
      return rows.rows as Row[];
      }, 'DB_ERROR');
  }

  async getExpiringContracts(): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT e.id, e.first_name, e.last_name, e.telegram_chat_id,
               c.end_date AS contract_end_date,
               (c.end_date::date - CURRENT_DATE) AS days_left
        FROM employees e
        JOIN contracts c ON c.employee_id = e.id AND c.status = 'active'
        WHERE e.status = 'active'
          AND e.telegram_chat_id IS NOT NULL
          AND (c.end_date::date - CURRENT_DATE) BETWEEN 28 AND 32
      `);
      return rows.rows as Row[];
      }, 'DB_ERROR');
  }

  async getOffboardingDueEmployees(): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT oc.employee_id, oc.id AS case_id,
               e.first_name || ' ' || e.last_name AS full_name,
               e.telegram_chat_id
        FROM offboarding_cases oc
        JOIN employees e ON e.id = oc.employee_id
        WHERE oc.status = 'active'
          AND oc.last_working_day IS NOT NULL
          AND oc.last_working_day::date <= CURRENT_DATE
          AND e.status NOT IN ('terminated', 'blocked')
      `);
      return rows.rows as Row[];
      }, 'DB_ERROR');
  }

  async getUnrecognizedByCameraToday(): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT e.id, e.telegram_chat_id
        FROM employees e
        WHERE e.status = 'active'
          AND e.telegram_chat_id IS NOT NULL
          AND NOT EXISTS (
            SELECT 1 FROM attendance_logs al
            WHERE al.employee_id = e.id
              AND al.date = CURRENT_DATE
              AND al.source = 'camera'
          )
      `);
      return rows.rows as Row[];
      }, 'DB_ERROR');
  }

  async getCoursesDeadlineIn3Days(): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT ec.employee_id, e.telegram_chat_id,
               e.first_name, e.last_name,
               c.title AS course_title, c.url AS course_url,
               ec.deadline, ec.progress,
               (ec.deadline::date - CURRENT_DATE) AS days_left
        FROM employee_courses ec
        JOIN employees e ON e.id = ec.employee_id
        JOIN courses c ON c.id = ec.course_id
        WHERE ec.status != 'completed'
          AND ec.deadline IS NOT NULL
          AND e.telegram_chat_id IS NOT NULL
          AND (ec.deadline::date - CURRENT_DATE) = 3
          AND ec.is_mandatory = true
      `);
      return rows.rows as Row[];
      }, 'DB_ERROR');
  }

  async getEmergencyRecipients(): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT DISTINCT e.id, e.telegram_chat_id, e.phone
        FROM employees e
        LEFT JOIN app_users u ON u.employee_id = e.id
        WHERE e.status = 'active'
          AND (
            u.role IN ('admin', 'hr', 'director')
            OR e.is_department_head = true
          )
      `);
      return rows.rows as Row[];
      }, 'DB_ERROR');
  }

  async getBoomerangCandidates(since: string): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT c.id,
               c.name,
               c.phone,
               c.telegram_chat_id,
               COALESCE(c.desired_position, c.last_position, '') AS position_hint,
               COALESCE(c.department_name, '')                   AS department_hint,
               COALESCE(c.skills, '')                            AS skills_hint
        FROM candidates c
        WHERE c.is_archived = true
          AND c.updated_at >= ${since}
          AND (c.telegram_chat_id IS NOT NULL OR c.phone IS NOT NULL)
        LIMIT 500
      `);
      return rows.rows as Row[];
      }, 'DB_ERROR');
  }

  async getEmployeeByChatId(chatId: number): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await db.select()
        .from(hrEmployees)
        .where(eq(hrEmployees.telegram_chat_id, String(chatId)))
        .limit(1);
      return (rows[0] as Row | undefined) ?? null;
      }, 'DB_ERROR');
  }

  async findEmployeeByPhone(phone: string): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const normalized = phone.replace(/\D/g, '');
      const rows = await runQuery<Row>(sql`
        SELECT id, first_name, last_name, status, is_department_head,
               department_id, telegram_chat_id
        FROM employees
        WHERE phone_number ~ ${`[^0-9]?${normalized}[^0-9]?`}
           OR REGEXP_REPLACE(phone_number, '[^0-9]', '', 'g') = ${normalized}
        LIMIT 1
      `);
      return (rows.rows[0] as Row | undefined) ?? null;
      }, 'DB_ERROR');
  }

  async linkEmployeeChatId(employeeId: number, chatId: number): Promise<void> {
    await db.update(hrEmployees)
      .set({ telegram_chat_id: String(chatId), updated_at: _time.now() })
      .where(eq(hrEmployees.id, employeeId));
  }

  async getCurrentPendingStepId(docId: number, approverId: number): Promise<Result<number | null>> {
    return safeCall(async () => {
      const rows = await runQuery<{ id: number }>(sql`
        SELECT das.id
        FROM document_approval_steps das
        WHERE das.document_id = ${docId}
          AND das.status = 'pending'
          AND das.approver_id = ${approverId}
        ORDER BY das.step_number ASC
        LIMIT 1
      `);
      return (rows.rows[0]?.id ?? null) as number | null;
      }, 'DB_ERROR');
  }

  async getDocumentEmployeeId(docId: number): Promise<Result<number | null>> {
    return safeCall(async () => {
      const rows = await runQuery<{ employee_id: number }>(sql`
        SELECT employee_id FROM documents WHERE id = ${docId} LIMIT 1
      `);
      return (rows.rows[0]?.employee_id ?? null) as number | null;
      }, 'DB_ERROR');
  }

  async getAbsentEmployees(consecutiveDays: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT e.id, e.first_name, e.last_name, e.telegram_chat_id,
               COUNT(al.id) AS absent_days
        FROM employees e
        JOIN attendance_logs al ON al.employee_id = e.id
          AND al.status IN ('absent', 'no_show')
          AND al.date >= CURRENT_DATE - (INTERVAL '1 day' * ${consecutiveDays})
        WHERE e.status = 'active'
          AND e.telegram_chat_id IS NOT NULL
        GROUP BY e.id, e.first_name, e.last_name, e.telegram_chat_id
        HAVING COUNT(al.id) = ${consecutiveDays}
      `);
      return rows.rows as Row[];
      }, 'DB_ERROR');
  }

  async getManagerByChatId(chatId: number): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT e.id, e.first_name, e.last_name, e.department_id,
               d.name AS department_name
        FROM employees e
        LEFT JOIN departments d ON d.id = e.department_id
        WHERE e.telegram_chat_id = ${String(chatId)}
          AND e.status = 'active'
          AND (e.is_department_head = true OR EXISTS (
            SELECT 1 FROM app_users u WHERE u.employee_id = e.id AND u.role IN ('manager', 'admin', 'director', 'hr')
          ))
        LIMIT 1
      `);
      return (rows.rows[0] as Row | undefined) ?? null;
      }, 'DB_ERROR');
  }

  async getPendingDocumentsForManager(managerId: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT dw.id, dw.title, dw.submitted_at,
               e.first_name || ' ' || e.last_name AS submitter_name
        FROM document_workflows dw
        JOIN employees e ON e.id = dw.employee_id
        WHERE dw.status = 'pending'
          AND dw.current_approver_id = ${managerId}
        ORDER BY dw.submitted_at ASC
        LIMIT 20
      `);
      return rows.rows as Row[];
      }, 'DB_ERROR');
  }

  async approveDocument(docId: number, approverId: number): Promise<void> {
    await runQuery(sql`
      UPDATE document_workflows
      SET status = 'approved', approved_by = ${approverId}, approved_at = NOW()
      WHERE id = ${docId} AND status = 'pending' AND current_approver_id = ${approverId}
    `);
  }

  async rejectDocument(docId: number, rejecterId: number, reason: string): Promise<void> {
    await runQuery(sql`
      UPDATE document_workflows
      SET status = 'rejected', rejected_by = ${rejecterId}, rejection_reason = ${reason}, rejected_at = NOW()
      WHERE id = ${docId} AND status = 'pending' AND current_approver_id = ${rejecterId}
    `);
  }

  async getTeamForManager(managerId: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT e.id, e.first_name, e.last_name, e.position,
               COALESCE(
                 (SELECT al.status FROM attendance_logs al
                  WHERE al.employee_id = e.id AND al.date = CURRENT_DATE
                  ORDER BY al.created_at DESC LIMIT 1),
                 'absent'
               ) AS attendance_today
        FROM employees e
        WHERE e.manager_id = ${managerId} AND e.status = 'active'
        ORDER BY e.first_name
        LIMIT 50
      `);
      return rows.rows as Row[];
      }, 'DB_ERROR');
  }

  async getDailyReportStatusForManager(managerId: number): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT
          COUNT(e.id) AS total,
          COUNT(dr.id) FILTER (WHERE dr.date = CURRENT_DATE) AS submitted,
          COUNT(e.id) - COUNT(dr.id) FILTER (WHERE dr.date = CURRENT_DATE) AS missing
        FROM employees e
        LEFT JOIN daily_reports dr ON dr.employee_id = e.id
        WHERE e.manager_id = ${managerId} AND e.status = 'active'
      `);
      return (rows.rows[0] ?? { total: 0, submitted: 0, missing: 0 }) as Row;
      }, 'DB_ERROR');
  }

  async getDepartmentKpi(departmentId: number): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT
          ROUND(AVG(al.late_minutes) FILTER (WHERE al.late_minutes > 0)) AS avg_late_minutes,
          ROUND(100.0 * COUNT(dr.id) / NULLIF(COUNT(DISTINCT e.id) * 30, 0)) AS report_rate,
          ROUND(100.0 * COUNT(al.id) FILTER (WHERE al.status = 'present') / NULLIF(COUNT(DISTINCT e.id) * 30, 0)) AS attendance_rate,
          ROUND(100.0 * COUNT(pg.id) FILTER (WHERE pg.status = 'completed') / NULLIF(COUNT(pg.id), 0)) AS goals_completion
        FROM employees e
        LEFT JOIN attendance_logs al ON al.employee_id = e.id AND al.date >= CURRENT_DATE - INTERVAL '30 days'
        LEFT JOIN daily_reports dr ON dr.employee_id = e.id AND dr.date >= CURRENT_DATE - INTERVAL '30 days'
        LEFT JOIN pip_goals pg ON pg.employee_id = e.id
        WHERE e.department_id = ${departmentId} AND e.status = 'active'
      `);
      return (rows.rows[0] ?? null) as Row | null;
      }, 'DB_ERROR');
  }

  async getManagerAlerts(managerId: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT 'late' AS type,
               e.first_name || ' ' || e.last_name || ' kech keldi (' || al.late_minutes || ' daqiqa)' AS message,
               al.created_at AS alert_time
        FROM attendance_logs al
        JOIN employees e ON e.id = al.employee_id
        WHERE e.manager_id = ${managerId} AND al.date = CURRENT_DATE AND al.late_minutes > 0
        UNION ALL
        SELECT 'absent' AS type,
               e.first_name || ' ' || e.last_name || ' bugun kelmadi' AS message,
               CURRENT_TIMESTAMP AS alert_time
        FROM employees e
        WHERE e.manager_id = ${managerId} AND e.status = 'active'
          AND NOT EXISTS (SELECT 1 FROM attendance_logs al WHERE al.employee_id = e.id AND al.date = CURRENT_DATE)
        UNION ALL
        SELECT 'doc_overdue' AS type,
               'Hujjat "' || dw.title || '" muddati o''tgan' AS message,
               dw.submitted_at AS alert_time
        FROM document_workflows dw
        WHERE dw.current_approver_id = ${managerId} AND dw.status = 'pending'
          AND dw.submitted_at < NOW() - INTERVAL '2 days'
        ORDER BY alert_time DESC
        LIMIT 20
      `);
      return rows.rows as Row[];
      }, 'DB_ERROR');
  }

  async recordManualAttendance(chatId: number, status: string, reason?: string): Promise<void> {
    await runQuery(sql`
      INSERT INTO attendance_logs (employee_id, date, status, source, notes, created_at)
      SELECT e.id, CURRENT_DATE, ${status}, 'telegram', ${reason ?? null}, NOW()
      FROM employees e
      WHERE e.telegram_chat_id = ${String(chatId)} AND e.status = 'active'
      ON CONFLICT (employee_id, date) DO UPDATE
        SET status = EXCLUDED.status, notes = EXCLUDED.notes, updated_at = NOW()
    `);
  }

  async recordLateReason(employeeId: number, reason: string): Promise<void> {
    await runQuery(sql`
      UPDATE attendance_logs
      SET late_reason = ${reason}, updated_at = NOW()
      WHERE employee_id = ${employeeId} AND date = CURRENT_DATE
    `);
  }

  async recordDepartureReason(chatId: number, reason: string): Promise<void> {
    await runQuery(sql`
      INSERT INTO employee_departures (employee_id, departure_time, reason, created_at)
      SELECT e.id, NOW(), ${reason}, NOW()
      FROM employees e
      WHERE e.telegram_chat_id = ${String(chatId)} AND e.status = 'active'
    `);
  }

  async getEmployeeCourses(employeeId: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT c.id, c.title, ec.progress, ec.deadline, ec.status
        FROM employee_courses ec
        JOIN courses c ON c.id = ec.course_id
        WHERE ec.employee_id = ${employeeId}
        ORDER BY ec.deadline ASC NULLS LAST
        LIMIT 20
      `);
      return rows.rows as Row[];
      }, 'DB_ERROR');
  }

  async getEmployeeCertificates(employeeId: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT cert.id, cert.name, cert.issued_at, cert.pdf_url
        FROM employee_certificates cert
        WHERE cert.employee_id = ${employeeId}
        ORDER BY cert.issued_at DESC
        LIMIT 20
      `);
      return rows.rows as Row[];
      }, 'DB_ERROR');
  }

  async terminateEmployee(employeeId: number): Promise<void> {
    await db.update(hrEmployees).set({
      status:     'terminated',
      is_blocked: true,
      updated_at: _time.now(),
    }).where(eq(hrEmployees.id, employeeId));
  }

  async completeOffboardingCase(caseId: number): Promise<void> {
    await db.update(offboarding_cases).set({
      status:     'completed',
      updated_at: _time.now(),
    }).where(eq(offboarding_cases.id, caseId));
  }

  async insertTerminationBlock(employeeId: number): Promise<void> {
    await execEmployeeBlockInsert(employeeId);
  }

  async archiveInactiveFunnels(): Promise<Result<number>> {
    return safeCall(async () => {
      const rows = await runQuery<{ id: number }>(sql`
        UPDATE hr_candidate_funnels
        SET is_archived = true, is_active = false, updated_at = NOW()
        WHERE NOT COALESCE(is_archived, false)
          AND funnel_stage = 'REJECTED'
          AND rejected_at IS NOT NULL
          AND rejected_at < NOW() - INTERVAL '6 months'
        RETURNING id
      `);
      return rows.rows.length;
      }, 'DB_ERROR');
  }

  async archiveInactiveCandidates(): Promise<Result<number>> {
    return safeCall(async () => {
      const rows = await runQuery<{ id: number }>(sql`
        UPDATE candidates
        SET is_archived = true, updated_at = NOW()
        WHERE is_archived = false
          AND NOT EXISTS (
            SELECT 1 FROM hr_candidate_funnels f
            WHERE f.candidate_id = candidates.id
              AND (f.is_active = true OR f.funnel_stage = 'HIRED')
          )
          AND updated_at < NOW() - INTERVAL '6 months'
        RETURNING id
      `);
      return rows.rows.length;
      }, 'DB_ERROR');
  }

  async getActiveEmployeesWithChatId(): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await db.select({ id: hrEmployees.id, telegram_chat_id: hrEmployees.telegram_chat_id })
        .from(hrEmployees)
        .where(sql`${hrEmployees.status} = 'active' AND ${hrEmployees.telegram_chat_id} IS NOT NULL`);
      return castTo<Row[]>(rows);
      }, 'DB_ERROR');
  }

  async getAllActiveChatIds(): Promise<Result<string[]>> {
    return safeCall(async () => {
      const rows = await db.select({ telegram_chat_id: hrEmployees.telegram_chat_id })
        .from(hrEmployees)
        .where(sql`${hrEmployees.status} = 'active' AND ${hrEmployees.telegram_chat_id} IS NOT NULL`);
      return rows.map(r => r.telegram_chat_id as string);
      }, 'DB_ERROR');
  }

  async getAdaptationRisks(): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT ac.employee_id, ac.risk_level, ac.adaptation_day, ac.risk_reason,
               e.first_name || ' ' || e.last_name AS employee_name,
               e.telegram_chat_id,
               m.telegram_chat_id AS manager_chat_id
        FROM hr_adaptation_cases ac
        JOIN employees e ON e.id = ac.employee_id
        LEFT JOIN employees m ON m.id = e.manager_id
        WHERE ac.status = 'active'
          AND ac.risk_level IN ('high', 'medium')
          AND ac.notified_at < NOW() - INTERVAL '1 day'
        LIMIT 50
      `);
      return rows.rows as Row[];
      }, 'DB_ERROR');
  }

  async markAdaptationNotified(employeeId: number): Promise<void> {
    await db.update(hr_adaptation_cases)
      .set({ notified_at: _time.now() })
      .where(eq(hr_adaptation_cases.employee_id, employeeId));
  }

  async getActivePipWithPendingGoals(): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT pp.employee_id, pp.due_date,
               COUNT(pg.id) FILTER (WHERE pg.status = 'pending') AS pending_goals,
               e.telegram_chat_id
        FROM pip_plans pp
        JOIN employees e ON e.id = pp.employee_id
        LEFT JOIN pip_goals pg ON pg.pip_plan_id = pp.id
        WHERE pp.status = 'active' AND e.telegram_chat_id IS NOT NULL
        GROUP BY pp.employee_id, pp.due_date, e.telegram_chat_id
        HAVING COUNT(pg.id) FILTER (WHERE pg.status = 'pending') > 0
        LIMIT 100
      `);
      return rows.rows as Row[];
      }, 'DB_ERROR');
  }

  async getGamificationPoints(employeeId: number): Promise<Result<{ total_points: unknown; monthly_points: unknown } | null>> {
    return safeCall(async () => {
      const rows = await db.select({
        total_points:   gamification_totals.total_points,
        monthly_points: gamification_totals.monthly_points,
      })
        .from(gamification_totals)
        .where(eq(gamification_totals.employee_id, employeeId))
        .limit(1);
      return (rows[0] ?? null) as { total_points: unknown; monthly_points: unknown } | null;
      }, 'DB_ERROR');
  }
}
