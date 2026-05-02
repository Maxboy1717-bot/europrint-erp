import { Logger } from '@nestjs/common';
import { db , runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { safeCall, Ok } from '@common/result';
import { execHrInterviewQuestionDeactivate } from '@common/database/queries-remaining';

type Row = Record<string, unknown>;
const logger = new Logger('AiInterviewQuestions');
const exec = async (q: Parameters<typeof db.execute>[0]): Promise<Row[]> => {
  return (await runQuery<Row>(q)).rows as Row[];
};

export async function aiInterviewGetQuestionsForJob(jobTitle?: string, language = 'uz') {
  return safeCall(async () => {
    const langCol = language === 'ru' ? 'question_ru' : language === 'en' ? 'question_en' : 'question_uz';
    const r = jobTitle
      ? await exec(sql`SELECT id, job_title, question, question_uz, question_ru, question_en, category, difficulty, expected_keywords, max_score FROM hr_interview_questions WHERE is_active = true AND (job_title = ${jobTitle} OR job_title IS NULL) ORDER BY (CASE WHEN job_title = ${jobTitle} THEN 0 ELSE 1 END), id ASC LIMIT 8`)
      : await exec(sql`SELECT id, job_title, question, question_uz, question_ru, question_en, category, difficulty, expected_keywords, max_score FROM hr_interview_questions WHERE is_active = true ORDER BY id ASC LIMIT 8`);
    return (r ?? []).map((row: Row) => ({ ...row, question: (row[langCol] as string) || (row['question_uz'] as string) || (row['question'] as string) }));
  });
}

export async function aiInterviewListQuestions(jobTitle?: string) {
  const r = await safeCall(async () =>
    jobTitle
      ? exec(sql`SELECT * FROM hr_interview_questions WHERE is_active = true AND (job_title IS NULL OR job_title = ${jobTitle}) ORDER BY id ASC`)
      : exec(sql`SELECT * FROM hr_interview_questions WHERE is_active = true ORDER BY id ASC`)
  );
  if (!r.ok) { logger.warn(`listQuestions (hr_interview_questions not migrated): ${r.error.message}`); return Ok([]); }
  return r;
}

export async function aiInterviewCreateQuestion(dto: { jobTitle?: string; question: string; questionUz?: string; questionRu?: string; questionEn?: string; category?: string; difficulty?: string; expectedKeywords?: string; maxScore?: number; createdBy?: number }) {
  return safeCall(async () => {
    const r = await exec(sql`INSERT INTO hr_interview_questions (job_title, question, question_uz, question_ru, question_en, category, difficulty, expected_keywords, max_score, created_by) VALUES (${dto.jobTitle || null}, ${dto.question}, ${dto.questionUz || dto.question}, ${dto.questionRu || null}, ${dto.questionEn || null}, ${dto.category || 'general'}, ${dto.difficulty || 'medium'}, ${dto.expectedKeywords || null}, ${dto.maxScore || 10}, ${dto.createdBy || null}) RETURNING *`);
    return r[0];
  });
}

export async function aiInterviewDeleteQuestion(id: number) {
  return safeCall(async () => {
    await execHrInterviewQuestionDeactivate(id);
    return { success: true };
  });
}
