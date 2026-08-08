/**
 * @module telegram-bots/manager.repo
 * @description Manager-bot queries: document workflows, team, KPI, alerts, attendance.
 *
 * NOTE: Raw SQL retained intentionally — Drizzle ORM cannot express:
 *   - Correlated subquery in SELECT (COALESCE((SELECT ... LIMIT 1), 'absent'))
 *   - FILTER (WHERE ...) aggregate clauses (COUNT(...) FILTER (WHERE date = CURRENT_DATE))
 *   - UNION ALL across three sources for unified alert feed (late/absent/doc_overdue)
 *   - String concatenation with || operator inside SELECT projection
 *   - INTERVAL '30 days' / INTERVAL '2 days' literal date arithmetic
 *   - ON CONFLICT (employee_id, date) DO UPDATE SET ... = EXCLUDED.* composite upsert
 *   - NULLIF for divide-by-zero guard in KPI rate calculation
 *   See ARCHITECTURE_RULES.md Rule 4: complex SQL is permitted with documentation.
 */

import { Injectable } from '@nestjs/common';
import { runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { safeCall, Result } from '@common/result';

type Row = Record<string, unknown>;

@Injectable()
export class TelegramBotsManagerRepo {
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

  async getManagerByChatId(chatId: number): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT e.id, e.first_name, e.last_name,
               primary_org.dept_id AS department_id,
               primary_org.dept_name AS department_name
        FROM employees e
        LEFT JOIN users u ON u.employee_id = e.id AND u.deleted_at IS NULL
        LEFT JOIN LATERAL (
          SELECT eod.org_department_id AS dept_id,
                 od.name AS dept_name,
                 COALESCE(of2.position_name, '') AS pos_name
          FROM employee_org_departments eod
          JOIN org_departments od ON od.id = eod.org_department_id
          LEFT JOIN org_functions of2 ON of2.department_id = eod.org_department_id
          WHERE eod.user_id = u.id AND eod.is_primary = true
          ORDER BY eod.assigned_at DESC
          LIMIT 1
        ) primary_org ON true
        WHERE e.telegram_chat_id = ${String(chatId)}
          AND e.status = 'active'
          -- Audit 2026-08-07: ikkalasi ham fantom edi — 'employees.is_department_head' ustuni
          -- va 'app_users' jadvali bazada UMUMAN YO'Q ('events.repo.ts' da bir xil naqsh
          -- topilgan). Natijada bu metod har chaqiruvda yiqilardi, ya'ni Telegram bot hech
          -- qachon "siz menejersiz" deb tanolmasdi. Kanonik yo'l: bo'lim boshlig'i =
          -- 'org_departments.head_user_id'; rol = 'users.role'.
          AND (
            EXISTS (SELECT 1 FROM org_departments od WHERE od.head_user_id = u.id)
            OR u.role IN ('manager', 'admin', 'director', 'hr')
          )
        LIMIT 1
      `);
      return (rows.rows[0] as Row | undefined) ?? null;
    }, 'DB_ERROR');
  }

  async getPendingDocumentsForManager(managerId: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      // Audit 2026-08-07: 'document_workflows' jadvali bazada UMUMAN YO'Q — bu metod har
      // chaqiruvda yiqilardi (Telegram menejer boti "Tasdiqlash kutayotgan hujjatlar" ro'yxatini
      // hech qachon ko'rsatolmasdi). Kanonik juftlik — 'hr_documents' (hujjat) + 'document
      // _approval_steps' (kim/qaysi bosqichda tasdiqlashi kerak), aynan
      // 'hr/document-workflow/document-workflow.repository.ts' ishlatadigan bir xil jadvallar.
      // 'submitted_at' ustuni yo'q — 'hr_documents.created_at' bilan almashtirildi.
      const rows = await runQuery<Row>(sql`
        SELECT d.id, d.title, d.created_at AS submitted_at,
               e.first_name || ' ' || e.last_name AS submitter_name
        FROM hr_documents d
        JOIN document_approval_steps das ON das.document_id = d.id
        JOIN employees e ON e.id = d.employee_id
        WHERE das.status = 'pending'
          AND das.approver_id = ${managerId}
        ORDER BY d.created_at ASC
        LIMIT 20
      `);
      return rows.rows as Row[];
    }, 'DB_ERROR');
  }

  // Audit 2026-08-07 (Q-46): `approveDocument`/`rejectDocument`/`getDocumentEmployeeId` — ham
  // fantom 'document_workflows'/'documents' jadvallariga murojaat qilardi (har chaqiruvda
  // yiqilardi), HAM haqiqiy bot oqimida hech qachon chaqirilmasdi (grep tasdiqlaydi — faqat
  // fasad qayta-eksporti bor edi, real chaqiruvchi yo'q). Haqiqiy tasdiqlash/rad etish yo'li
  // allaqachon ishlaydi: `manager-bot.commands.ts:116` `documentWorkflow.approveStep()` ni
  // to'g'ridan-to'g'ri chaqiradi ('hr/document-workflow/document-workflow.service.ts' orqali).
  // Ikkinchi, buzuq va ishlatilmaydigan yo'lni saqlash — ikkita raqobatdosh tasdiqlash
  // mexanizmi degani bo'lardi ("ikki dunyo" naqshi); shuning uchun to'liq o'chirildi, yarim
  // holatda qoldirilmadi.

  async getTeamForManager(managerId: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        -- Audit 2026-08-07: bu so'rov 'al.status'/'al.date' ni 'attendance_logs'dan o'qirdi —
        -- bunday ustunlar o'sha jadvalda UMUMAN YO'Q (faqat id/employee_id/type/logged_at/source),
        -- ya'ni har chaqiruv SQL xatosi bilan yiqilardi ('safeCall' uni Err ga aylantirardi).
        -- Kanonik davomat jadvali — 'attendance' (attendance_date/status ustunlari bilan,
        -- 'attendance-check.cron.ts' ham shundan o'qiydi).
        SELECT e.id, e.first_name, e.last_name, e.position,
               COALESCE(
                 (SELECT a.status FROM attendance a
                  WHERE a.employee_id = e.id AND a.attendance_date = CURRENT_DATE
                  ORDER BY a.created_at DESC LIMIT 1),
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
          COUNT(dr.id) FILTER (WHERE dr.report_date = CURRENT_DATE::text) AS submitted,
          COUNT(e.id) - COUNT(dr.id) FILTER (WHERE dr.report_date = CURRENT_DATE::text) AS missing
        FROM employees e
        LEFT JOIN daily_reports dr ON dr.employee_id = e.id
        WHERE e.manager_id = ${managerId} AND e.status = 'active'
      `);
      return (rows.rows[0] ?? { total: 0, submitted: 0, missing: 0 }) as Row;
    }, 'DB_ERROR');
  }

  async getDepartmentKpi(departmentId: number): Promise<Result<Row | null>> {
    return safeCall(async () => {
      // Audit 2026-08-07: `al.late_minutes`/`al.status` `attendance_logs`da YO'Q (o'sha jadvalda
      // faqat id/employee_id/type/logged_at/source bor) — bu metod har chaqiruvda yiqilardi.
      // Kanonik davomat jadvali `attendance` (attendance_date/status/late_minutes ustunlari bilan).
      const rows = await runQuery<Row>(sql`
        SELECT
          ROUND(AVG(a.late_minutes) FILTER (WHERE a.late_minutes > 0)) AS avg_late_minutes,
          ROUND(100.0 * COUNT(dr.id) / NULLIF(COUNT(DISTINCT e.id) * 30, 0)) AS report_rate,
          ROUND(100.0 * COUNT(a.id) FILTER (WHERE a.status = 'present') / NULLIF(COUNT(DISTINCT e.id) * 30, 0)) AS attendance_rate,
          ROUND(100.0 * COUNT(pg.id) FILTER (WHERE pg.status = 'completed') / NULLIF(COUNT(pg.id), 0)) AS goals_completion
        FROM employees e
        LEFT JOIN attendance a ON a.employee_id = e.id AND a.attendance_date >= CURRENT_DATE - INTERVAL '30 days'
        LEFT JOIN daily_reports dr ON dr.employee_id = e.id AND dr.report_date >= (CURRENT_DATE - INTERVAL '30 days')::text
        LEFT JOIN pip_goals pg ON pg.employee_id = e.id
        WHERE EXISTS (
          SELECT 1 FROM users u2
          JOIN employee_org_departments eod2 ON eod2.user_id = u2.id
          WHERE u2.employee_id = e.id AND u2.deleted_at IS NULL
            AND eod2.org_department_id = ${departmentId} AND eod2.is_primary = true
        )
        AND e.status = 'active'
      `);
      return (rows.rows[0] ?? null) as Row | null;
    }, 'DB_ERROR');
  }

  async getManagerAlerts(managerId: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      // Audit 2026-08-07: uch joyda ham `al.*` `attendance_logs`dan o'qirdi — `late_minutes`,
      // `created_at`(o'rniga bor edi, muammo emas), `date` ustunlari o'sha jadvalda YO'Q.
      // Kanonik jadval `attendance`ga o'tkazildi (`getDepartmentKpi`/`getTeamForManager` bilan
      // bir xil tuzatish).
      const rows = await runQuery<Row>(sql`
        SELECT 'late' AS type,
               e.first_name || ' ' || e.last_name || ' kech keldi (' || a.late_minutes || ' daqiqa)' AS message,
               a.created_at AS alert_time
        FROM attendance a
        JOIN employees e ON e.id = a.employee_id
        WHERE e.manager_id = ${managerId} AND a.attendance_date = CURRENT_DATE AND a.late_minutes > 0
        UNION ALL
        SELECT 'absent' AS type,
               e.first_name || ' ' || e.last_name || ' bugun kelmadi' AS message,
               CURRENT_TIMESTAMP AS alert_time
        FROM employees e
        WHERE e.manager_id = ${managerId} AND e.status = 'active'
          AND NOT EXISTS (SELECT 1 FROM attendance a WHERE a.employee_id = e.id AND a.attendance_date = CURRENT_DATE)
        UNION ALL
        -- Audit 2026-08-07: 'document_workflows' bazada YO'Q — 'getPendingDocumentsForManager'
        -- bilan bir xil tuzatish: 'hr_documents' + 'document_approval_steps'.
        -- 'submitted_at' o'rniga 'hr_documents.created_at'.
        SELECT 'doc_overdue' AS type,
               'Hujjat "' || d.title || '" muddati o''tgan' AS message,
               d.created_at AS alert_time
        FROM hr_documents d
        JOIN document_approval_steps das ON das.document_id = d.id
        WHERE das.approver_id = ${managerId} AND das.status = 'pending'
          AND d.created_at < NOW() - INTERVAL '2 days'
        ORDER BY alert_time DESC
        LIMIT 20
      `);
      return rows.rows as Row[];
    }, 'DB_ERROR');
  }

  async recordManualAttendance(chatId: number, status: string, reason?: string): Promise<void> {
    // Audit 2026-08-07: bu yerda `date` (legacy, character varying) ustuniga yozilardi, lekin
    // `saveAttendance()` va butun qolgan tizim (getTeamForManager/getManagerAlerts/
    // attendance-check.cron.ts) `attendance_date` (date) ustunidan o'qiydi — ikkalasi hech
    // qachon sinxron bo'lmagan, ya'ni Telegram orqali qo'lda belgilangan davomat qolgan
    // tizimga KO'RINMAS edi. `ON CONFLICT DO NOTHING` ham maqsadli constraint ko'rsatmagani
    // uchun amalda ishlamasdi (target yo'q — hech narsani bloklamasdi, faqat oddiy INSERT).
    // Endi kanonik `attendance_date` ga yoziladi va yangi qo'shilgan
    // `uq_attendance_employee_date` indeksi bilan bir kunlik-bir yozuv kafolatlanadi.
    await runQuery(sql`
      INSERT INTO attendance (employee_id, attendance_date, status, source, notes, updated_at, created_at)
      SELECT e.id, CURRENT_DATE, ${status}, 'telegram', ${reason ?? null}, NOW(), NOW()
      FROM employees e
      WHERE e.telegram_chat_id = ${String(chatId)} AND e.status = 'active'
      ON CONFLICT (employee_id, attendance_date) DO UPDATE
        SET status = EXCLUDED.status, notes = EXCLUDED.notes, updated_at = NOW()
    `);
  }

  async recordLateReason(employeeId: number, reason: string): Promise<void> {
    // Audit 2026-08-07: `date = CURRENT_DATE::text` ishlatilardi — legacy ustun, yozuv
    // topilmasdi (chunki `saveAttendance()` faqat `attendance_date` ga yozadi). Kanonik ustunga
    // o'tkazildi.
    await runQuery(sql`
      UPDATE attendance
      SET notes = ${reason}, updated_at = NOW()
      WHERE employee_id = ${employeeId} AND attendance_date = CURRENT_DATE
    `);
  }

  async recordDepartureReason(chatId: number, reason: string): Promise<void> {
    // Audit 2026-08-07: `employee_departures` jadvali bazada UMUMAN YO'Q — bu metod har
    // chaqiruvda yiqilardi, ya'ni "erta ketish sababi" Telegram bot orqali hech qachon
    // saqlanmasdi. Alohida jadval o'ylab topish o'rniga (Q-40 — fabrikatsiya emas), kanonik
    // `attendance` jadvalining o'zidagi shu maqsad uchun ATAYLAB qo'yilgan ustunlar
    // ishlatiladi: `is_early_leave` (bayroq) + `notes` (sabab) + `check_out_time`.
    // `employees` ham `notes` ustuniga ega — UPDATE...FROM ichida barcha maydonlar
    // `attendance.` bilan qayd etiladi, aks holda "ambiguous column" xatosi (jonli tasdiqlangan).
    await runQuery(sql`
      UPDATE attendance
      SET is_early_leave = true,
          check_out_time = COALESCE(attendance.check_out_time, NOW()),
          notes = CASE WHEN attendance.notes IS NULL OR attendance.notes = '' THEN ${reason} ELSE attendance.notes || ' | ' || ${reason} END,
          updated_at = NOW()
      FROM employees e
      WHERE attendance.employee_id = e.id
        AND e.telegram_chat_id = ${String(chatId)} AND e.status = 'active'
        AND attendance.attendance_date = CURRENT_DATE
    `);
  }
}
