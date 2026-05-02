import { Ok, Err, Result } from '@common/result';
import { Injectable } from '@nestjs/common';
import { db , runQuery } from '@shared/db';
import { eq, sql } from 'drizzle-orm';
import { hrEmployees, candidates, hr_interview_sessions } from '@shared/db';

type Row = Record<string, unknown>;

@Injectable()
export class TelegramBotsPipEventsRepository {
  async getEmpChat(employeeId: number): Promise<Result<string | null>>  {
  try {  
      const r = await db.select({ telegram_chat_id: hrEmployees.telegram_chat_id })
        .from(hrEmployees)
        .where(eq(hrEmployees.id, employeeId))
        .limit(1);
      return Ok((r[0]?.telegram_chat_id as string | null) ?? null);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getActiveChatIds(): Promise<Result<string[]>>  {
  try {  
      const r = await db.select({ telegram_chat_id: hrEmployees.telegram_chat_id })
        .from(hrEmployees)
        .where(sql`${hrEmployees.telegram_chat_id} IS NOT NULL AND ${hrEmployees.status} = 'active'`);
      return Ok((r ?? []).map((row) => row.telegram_chat_id as string).filter(Boolean));  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getCandidateChat(candidateId: number): Promise<Result<string | null>>  {
  try {  
      const r = await runQuery<Row>(sql`
        SELECT telegram_chat_id FROM candidates WHERE id = ${candidateId} LIMIT 1
      `);
      return Ok((r.rows[0]?.telegram_chat_id as string | null) ?? null);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getAdaptationAtRiskData(employeeId: number): Promise<Result<Row | null>>  {
  try {  
      const rows = await runQuery<Row>(sql`
        SELECT e.telegram_chat_id, e.first_name, e.last_name,
               m.telegram_chat_id AS manager_chat_id
        FROM employees e
        LEFT JOIN employees m ON m.id = e.manager_id
        WHERE e.id = ${employeeId}
      `);
      return Ok((rows.rows[0] ?? null) as Row | null);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getInterviewSession(sessionId: number): Promise<Result<Row | null>>  {
  try {  
      const rows = await runQuery<Row>(sql`
        SELECT s.candidate_name, s.overall_score, s.recommendation, s.ai_summary,
               e.telegram_chat_id AS recruiter_chat_id
        FROM hr_interview_sessions s
        LEFT JOIN employees e ON e.id = s.created_by
        WHERE s.id = ${sessionId}
      `);
      return Ok((rows.rows[0] ?? null) as Row | null);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getInterviewSessionBasic(sessionId: number): Promise<Result<Row | null>>  {
  try {  
      const rows = await runQuery<Row>(sql`
        SELECT s.candidate_name, e.telegram_chat_id AS recruiter_chat_id
        FROM hr_interview_sessions s
        LEFT JOIN employees e ON e.id = s.created_by
        WHERE s.id = ${sessionId}
      `);
      return Ok((rows.rows[0] ?? null) as Row | null);  } catch (_e) {
    return Err(String(_e));
  }

  }
}
