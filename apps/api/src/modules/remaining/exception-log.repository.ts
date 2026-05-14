/**
 * @module exception-log.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Ok, Err, Result, safeCall } from '@common/result';
import { Injectable } from '@nestjs/common';
import { db , runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';

type Row = Record<string, unknown>;
const exec = (q: Parameters<typeof db.execute>[0]): Promise<Result<Row[]>> => safeCall(async () => (await runQuery<Row>(q)).rows as Row[]);

export type ExceptionInsert = {
  module: string;
  exceptionType: string;
  status: string;
  relatedRecordId?: unknown;
  documentNumber?: unknown;
  description?: unknown;
  requestedBy: number;
  meta?: unknown;
};

@Injectable()
export class ExceptionLogRepository {
  async getAll(q: { module?: string; exceptionType?: string; status?: string; relatedRecordId?: string; documentNumber?: string; fromDate?: string; toDate?: string; limit: number; offset: number }): Promise<Result<Row[]>>  {
  try {  
      return q.module && q.exceptionType && q.status && q.fromDate && q.toDate
        ? exec(sql`SELECT * FROM exception_logs WHERE module = ${q.module} AND exception_type = ${q.exceptionType} AND status = ${q.status} AND created_at >= ${q.fromDate}::timestamp AND created_at <= ${q.toDate}::timestamp ORDER BY created_at DESC LIMIT ${q.limit} OFFSET ${q.offset}`)
        : q.module && q.exceptionType && q.status
        ? exec(sql`SELECT * FROM exception_logs WHERE module = ${q.module} AND exception_type = ${q.exceptionType} AND status = ${q.status} ORDER BY created_at DESC LIMIT ${q.limit} OFFSET ${q.offset}`)
        : q.module && q.exceptionType
        ? exec(sql`SELECT * FROM exception_logs WHERE module = ${q.module} AND exception_type = ${q.exceptionType} ORDER BY created_at DESC LIMIT ${q.limit} OFFSET ${q.offset}`)
        : q.module && q.status
        ? exec(sql`SELECT * FROM exception_logs WHERE module = ${q.module} AND status = ${q.status} ORDER BY created_at DESC LIMIT ${q.limit} OFFSET ${q.offset}`)
        : q.module
        ? exec(sql`SELECT * FROM exception_logs WHERE module = ${q.module} ORDER BY created_at DESC LIMIT ${q.limit} OFFSET ${q.offset}`)
        : q.status
        ? exec(sql`SELECT * FROM exception_logs WHERE status = ${q.status} ORDER BY created_at DESC LIMIT ${q.limit} OFFSET ${q.offset}`)
        : exec(sql`SELECT * FROM exception_logs ORDER BY created_at DESC LIMIT ${q.limit} OFFSET ${q.offset}`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async countAll(q: { module?: string; exceptionType?: string; status?: string }): Promise<Result<number>>  {
  try {  
      const rows = q.module && q.exceptionType && q.status
        ? await exec(sql`SELECT COUNT(*) AS total FROM exception_logs WHERE module = ${q.module} AND exception_type = ${q.exceptionType} AND status = ${q.status}`)
        : q.module && q.exceptionType
        ? await exec(sql`SELECT COUNT(*) AS total FROM exception_logs WHERE module = ${q.module} AND exception_type = ${q.exceptionType}`)
        : q.module
        ? await exec(sql`SELECT COUNT(*) AS total FROM exception_logs WHERE module = ${q.module}`)
        : q.status
        ? await exec(sql`SELECT COUNT(*) AS total FROM exception_logs WHERE status = ${q.status}`)
        : await exec(sql`SELECT COUNT(*) AS total FROM exception_logs`);
      return rows.ok ? Ok(Number(rows.data[0]?.total ?? 0)) : Err(rows.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getAllForStats(): Promise<Result<Row[]>>  {
  try {  
      return exec(sql`SELECT module, exception_type, status FROM exception_logs ORDER BY created_at DESC`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async countRecent(): Promise<Result<number>>  {
  try {  
      const rows = await exec(sql`SELECT COUNT(*) AS cnt FROM exception_logs WHERE created_at >= NOW() - INTERVAL '7 days'`);
      return rows.ok ? Ok(Number(rows.data[0]?.cnt ?? 0)) : Err(rows.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getOne(id: string): Promise<Result<Row | null>>  {
  try {  
      const r = await exec(sql`SELECT * FROM exception_logs WHERE id = ${id} LIMIT 1`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async insert(p: ExceptionInsert): Promise<Result<Row>>  {
  try {  
      const r = await exec(sql`INSERT INTO exception_logs (module, exception_type, status, related_record_id, document_number, description, requested_by, meta, created_at) VALUES (${p.module}, ${p.exceptionType}, ${p.status}, ${p.relatedRecordId ?? null}, ${p.documentNumber ?? null}, ${p.description ?? null}, ${p.requestedBy}, ${p.meta ? JSON.stringify(p.meta) : null}::jsonb, NOW()) RETURNING *`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getExpiringCerts(): Promise<Result<Row[]>>  {
  try {
      return exec(sql`SELECT e.id, e.full_name, e.cert_expiry_date FROM employees e WHERE e.cert_expiry_date IS NOT NULL AND e.cert_expiry_date <= NOW() + INTERVAL '30 days' AND e.status = 'active' ORDER BY e.cert_expiry_date ASC`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async update(id: string, patch: Record<string, unknown>): Promise<Result<Row | null>> {
    try {
      const { status, description, meta } = patch;
      const r = await exec(sql`
        UPDATE exception_logs
        SET status      = COALESCE(${status      ?? null}, status),
            description = COALESCE(${description ?? null}, description),
            meta        = COALESCE(${meta ? JSON.stringify(meta) : null}::jsonb, meta),
            updated_at  = NOW()
        WHERE id = ${id}
        RETURNING *
      `);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);
    } catch (_e) { return Err(String(_e)); }
  }

  async softDelete(id: string): Promise<Result<boolean>> {
    try {
      const r = await exec(sql`SELECT id FROM exception_logs WHERE id = ${id} LIMIT 1`);
      if (!r.ok || !r.data[0]) return Ok(false);
      await exec(sql`UPDATE exception_logs SET deleted_at = NOW() WHERE id = ${id}`);
      return Ok(true);
    } catch (_e) { return Err(String(_e)); }
  }
}
