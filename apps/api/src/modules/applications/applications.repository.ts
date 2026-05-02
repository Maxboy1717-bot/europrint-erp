import { Ok, Err, Result } from '@common/result';
import { Injectable } from '@nestjs/common';
import { db , runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { execHrApplicationDelete } from '@common/database/queries-remaining';

type Row = Record<string, unknown>;
// NOTE: hr_applications va hr_application_responses Drizzle schemada yo'q — raw SQL zarur
const exec = async (q: Parameters<typeof db.execute>[0]): Promise<Row[]> => {
  return (await runQuery<Row>(q)).rows as Row[];
};

@Injectable()
export class ApplicationsRepository {
  async list(status: string | null, positionId: number | null, lim: number, off: number): Promise<Result<Row[]>> {
    try {
      const rows = await (status && positionId
        ? exec(sql`SELECT a.*, p.name AS position_title, e.full_name AS reviewed_by_name FROM hr_applications a LEFT JOIN positions p ON p.id = a.position_id LEFT JOIN employees e ON e.id = a.reviewed_by WHERE a.status = ${status} AND a.position_id = ${positionId} ORDER BY a.created_at DESC LIMIT ${lim} OFFSET ${off}`)
        : status
        ? exec(sql`SELECT a.*, p.name AS position_title, e.full_name AS reviewed_by_name FROM hr_applications a LEFT JOIN positions p ON p.id = a.position_id LEFT JOIN employees e ON e.id = a.reviewed_by WHERE a.status = ${status} ORDER BY a.created_at DESC LIMIT ${lim} OFFSET ${off}`)
        : positionId
        ? exec(sql`SELECT a.*, p.name AS position_title, e.full_name AS reviewed_by_name FROM hr_applications a LEFT JOIN positions p ON p.id = a.position_id LEFT JOIN employees e ON e.id = a.reviewed_by WHERE a.position_id = ${positionId} ORDER BY a.created_at DESC LIMIT ${lim} OFFSET ${off}`)
        : exec(sql`SELECT a.*, p.name AS position_title, e.full_name AS reviewed_by_name FROM hr_applications a LEFT JOIN positions p ON p.id = a.position_id LEFT JOIN employees e ON e.id = a.reviewed_by ORDER BY a.created_at DESC LIMIT ${lim} OFFSET ${off}`));
      return Ok(rows);
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async getById(id: number): Promise<Result<Row | null>> {
    try {
      const r = await exec(sql`SELECT a.*, p.name AS position_title FROM hr_applications a LEFT JOIN positions p ON p.id = a.position_id WHERE a.id = ${id}`);
      return Ok(r[0] ?? null);
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async create(body: Row): Promise<Result<Row | null>> {
    try {
      const r = await exec(sql`INSERT INTO hr_applications (first_name, last_name, email, phone, position_id, resume_url, cover_letter, status, source) VALUES (${body.first_name ?? ''}, ${body.last_name ?? ''}, ${body.email ?? null}, ${body.phone ?? null}, ${body.position_id ?? null}, ${body.resume_url ?? null}, ${body.cover_letter ?? null}, ${body.status ?? 'pending'}, ${body.source ?? 'direct'}) RETURNING *`);
      return Ok(r[0] ?? null);
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async update(id: number, body: Row): Promise<Result<Row | null>> {
    try {
      const r = await exec(sql`UPDATE hr_applications SET status = COALESCE(${body.status ?? null}, status), notes = COALESCE(${body.notes ?? null}, notes), reviewed_by = COALESCE(${body.reviewed_by ?? null}, reviewed_by), updated_at = NOW() WHERE id = ${id} RETURNING *`);
      return Ok(r[0] ?? null);
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async delete(id: number): Promise<Result<void>> {
    try {
      await execHrApplicationDelete(id);
      return Ok(undefined);
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async listResponses(applicationId: number | null, lim: number, off: number): Promise<Result<Row[]>> {
    try {
      const rows = await (applicationId
        ? exec(sql`SELECT ar.*, e.full_name AS responder_name FROM hr_application_responses ar LEFT JOIN employees e ON e.id = ar.responder_id WHERE ar.application_id = ${applicationId} ORDER BY ar.created_at DESC LIMIT ${lim} OFFSET ${off}`)
        : exec(sql`SELECT ar.*, e.full_name AS responder_name FROM hr_application_responses ar LEFT JOIN employees e ON e.id = ar.responder_id ORDER BY ar.created_at DESC LIMIT ${lim} OFFSET ${off}`));
      return Ok(rows);
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async getResponseById(id: number): Promise<Result<Row | null>> {
    try {
      const r = await exec(sql`SELECT * FROM hr_application_responses WHERE id = ${id}`);
      return Ok(r[0] ?? null);
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async createResponse(body: Row): Promise<Result<Row | null>> {
    try {
      const r = await exec(sql`INSERT INTO hr_application_responses (application_id, responder_id, stage, decision, notes, scheduled_at) VALUES (${body.application_id ?? null}, ${body.responder_id ?? null}, ${body.stage ?? 'screening'}, ${body.decision ?? 'pending'}, ${body.notes ?? null}, ${body.scheduled_at ?? null}) RETURNING *`);
      return Ok(r[0] ?? null);
    } catch (_e) {
      return Err(String(_e));
    }
  }
}
