/**
 * @module recruitment-bot-helpers
 * @description Source module. See exports for details.
 */

import { Logger } from '@nestjs/common';
import { db , runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { errMsg } from '../hr-v2-error';
import type { RecruitSession } from './recruitment-bot.i18n';
import {
  execBotCandidateUpsert, execRecruitmentBotAttemptIncrement,
  execRecruitmentBotAttemptInsert,
} from '@common/database/queries-bots';

type Row = Record<string, unknown>;
const log = new Logger('RecruitmentBotHelpers');

export async function getVacancyInfo(vacancyId: number): Promise<{ title: string } | null> {
  try {
    const rows = await runQuery<{ title: string }>(sql`SELECT title FROM vacancies WHERE id = ${vacancyId} AND status = 'published' LIMIT 1`);
    return (rows.rows[0] ?? null) as { title: string } | null;
  } catch (e) { log.warn('[RecruitBot] getVacancyInfo failed', String(e)); return null; }
}

export async function saveCandidateApplication(session: RecruitSession, chatId: number): Promise<boolean> {
  const questions = ['q1', 'q2', 'q3', 'q4', 'q5'];
  const answersJson = JSON.stringify(
    questions.reduce<Record<string, string>>((acc, q, i) => { acc[q] = session.answers[i] ?? ''; return acc; }, {})
  );
  try {
    await execBotCandidateUpsert(
      session.name ?? '', String(chatId), session.vacancyId ?? null,
      session.cvFileId ?? null, session.cvFileName ?? null, answersJson, session.lang,
    );
    return true;
  } catch (err) {
    log.error(`saveCandidateApplication error: ${errMsg(err as Error)}`);
    return false;
  }
}

export async function checkAttempts(chatId: number, vacancyId: number | null): Promise<number> {
  try {
    const rows = vacancyId !== null
      ? await runQuery<{ attempts: number }>(sql`SELECT attempts FROM recruitment_bot_attempts WHERE telegram_chat_id = ${String(chatId)} AND vacancy_id = ${vacancyId} AND last_attempt_at > NOW() - INTERVAL '30 days' LIMIT 1`)
      : await runQuery<{ attempts: number }>(sql`SELECT attempts FROM recruitment_bot_attempts WHERE telegram_chat_id = ${String(chatId)} AND vacancy_id IS NULL AND last_attempt_at > NOW() - INTERVAL '30 days' LIMIT 1`);
    return Number(rows.rows[0]?.attempts ?? 0);
  } catch { return 0; }
}

export async function incrementAttempts(chatId: number, vacancyId: number | null): Promise<void> {
  try {
    const existingRows = vacancyId !== null
      ? await runQuery<{ id: number }>(sql`SELECT id FROM recruitment_bot_attempts WHERE telegram_chat_id = ${String(chatId)} AND vacancy_id = ${vacancyId} LIMIT 1`)
      : await runQuery<{ id: number }>(sql`SELECT id FROM recruitment_bot_attempts WHERE telegram_chat_id = ${String(chatId)} AND vacancy_id IS NULL LIMIT 1`);

    if (existingRows.rows.length > 0) {
      await execRecruitmentBotAttemptIncrement(existingRows.rows[0].id as number);
    } else {
      await execRecruitmentBotAttemptInsert(chatId, vacancyId);
    }
  } catch (err) {
    log.warn(`incrementAttempts error: ${errMsg(err as Error)}`);
  }
}
