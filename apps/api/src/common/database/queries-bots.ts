/**
 * @module queries-bots
 * @description Source module. See exports for details.
 */

import { db } from '@shared/db';
import {
  recruitment_bot_attempts, bot_candidates, hr_sick_reports,
  hr_leave_requests, notificationsApp, employee_blocks, users,
} from '@shared/db';
import { eq, and, sql } from 'drizzle-orm';

type Row = Record<string, unknown>;

export async function execRecruitmentBotAttemptInsert(chatId: string | number, vacancyId: number | null): Promise<void> {
  await db.insert(recruitment_bot_attempts).values({
    telegram_chat_id: String(chatId),
    vacancy_id: vacancyId,
    attempts: 1,
  });
}

export async function execBotCandidateUpsert(
  name: string, chatId: string, vacancyId: number | null,
  cvFileId: string | null, cvFileName: string | null, answersJson: string, lang: string,
): Promise<void> {
  let screeningAnswers: unknown;
  try {
    screeningAnswers = JSON.parse(answersJson);
  } catch {
    screeningAnswers = {};
  }
  await db.insert(bot_candidates).values({
    full_name: name,
    telegram_chat_id: chatId,
    vacancy_id: vacancyId,
    cv_file_id: cvFileId ?? null,
    cv_file_name: cvFileName ?? null,
    screening_answers: screeningAnswers,
    lang,
    status: 'new',
  }).onConflictDoUpdate({
    target: [bot_candidates.telegram_chat_id, bot_candidates.vacancy_id],
    set: {
      screening_answers: sql`EXCLUDED.screening_answers`,
      cv_file_id: sql`EXCLUDED.cv_file_id`,
      cv_file_name: sql`EXCLUDED.cv_file_name`,
      status: 'new',
      applied_at: sql`NOW()`,
    },
  });
}

export async function execRecruitmentBotAttemptIncrement(attemptId: number): Promise<void> {
  await db.update(recruitment_bot_attempts)
    .set({ attempts: sql`${recruitment_bot_attempts.attempts} + 1`, last_attempt_at: sql`NOW()` })
    .where(eq(recruitment_bot_attempts.id, attemptId));
}

export async function queryRecruitmentBotAttempt(chatId: string | number, vacancyId: number): Promise<Row[]> {
  const rows = await db.select({
    id: recruitment_bot_attempts.id,
    attempts: recruitment_bot_attempts.attempts,
    last_attempt_at: recruitment_bot_attempts.last_attempt_at,
  })
    .from(recruitment_bot_attempts)
    .where(and(
      eq(recruitment_bot_attempts.telegram_chat_id, String(chatId)),
      eq(recruitment_bot_attempts.vacancy_id, vacancyId),
    ));
  return rows as Row[];
}

export async function execHrSickReportInsert(
  employeeId: number, days: number, reason: string,
  documentFileId: string | null,
): Promise<void> {
  await db.insert(hr_sick_reports).values({
    employee_id: employeeId,
    days,
    reason,
    document_file_id: documentFileId ?? null,
    status: 'pending',
  });
}

export async function execHrLeaveRequestInsert(
  employeeId: number, startDate: string, endDate: string, reason: string,
): Promise<void> {
  await db.insert(hr_leave_requests).values({
    employee_id: employeeId,
    start_date: startDate,
    end_date: endDate,
    reason,
    status: 'pending',
    requested_at: sql`NOW()`,
  });
}

export async function execTelegramBotNotificationInsert(employeeId: number, message: string): Promise<void> {
  const [userRow] = await db
    .select({ id: sql<number>`id` })
    .from(users)
    .where(sql`employee_id = ${employeeId}`)
    .limit(1);
  if (userRow) {
    await db.insert(notificationsApp).values({
      user_id: userRow.id,
      title: 'HR Bildirishnomasi',
      message,
      type: 'info',
      is_read: false,
    });
  }
}

export async function execEmployeeBlockInsert(employeeId: number): Promise<void> {
  await db.insert(employee_blocks).values({
    employee_id: employeeId,
    reason: 'Oxirgi ish kuni tugadi — avtomatik bloklash',
    blocked_by: 1,
    is_active: true,
  }).onConflictDoNothing();
}
