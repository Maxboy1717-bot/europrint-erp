/**
 * @module candidates-compat.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { MAX_QUERY_LIMIT } from '@common/constants/app.constants';
import { db,
  rawSql} from '@shared/db';
import { sql } from 'drizzle-orm';
import { dbRows } from '../hr/common/db-rows';
import { safeCall, Result } from '@common/result';

const si = (v: unknown, d = 0) => parseInt(String(v ?? ''), 10) || d;

@Injectable()
export class CandidatesCompatService {

  async getCandidates(vacancyId?: string, status?: string, limit = '50'): Promise<Result<Record<string, unknown>[]>>{
    return safeCall(async () => {
    const lim = Math.min(si(limit, 50), MAX_QUERY_LIMIT);
    const vacancyFilter = vacancyId ? sql`AND c.vacancy_id = ${si(vacancyId)}` : sql``;
    const statusFilter = status ? sql`AND c.status = ${status}` : sql``;
    const r = await rawSql(sql`
      SELECT c.id, c.first_name, c.last_name, c.email, c.phone,
             c.vacancy_id, c.status, c.rating, c.experience_years,
             c.created_at, c.updated_at,
             COALESCE(c.full_name, c.first_name || ' ' || c.last_name) AS full_name,
             d.name AS department_name,
             COALESCE(p.name, p.name_uz) AS position_name
      FROM candidates c
      LEFT JOIN departments d ON d.id = c.department_id
      LEFT JOIN positions p ON p.id = c.position_id
      WHERE c.deleted_at IS NULL AND c.is_archived = false
        ${vacancyFilter} ${statusFilter}
      ORDER BY c.created_at DESC
      LIMIT ${lim}
    `);
    return dbRows(r);
  
    });}

  async createCandidate(body: Record<string, unknown>){
    return safeCall(async () => {
    // Accept both camelCase (frontend) and snake_case (API direct) field names
    const fullName   = (body.fullName  as string) || (body.full_name  as string) || '';
    const vacancyRaw = body.vacancyId  ?? body.vacancy_id;
    const vacancyId  = vacancyRaw && String(vacancyRaw) !== 'none' ? si(vacancyRaw) || null : null;

    let first_name = (body.first_name as string) || '';
    let last_name  = (body.last_name  as string) || '';

    // Split fullName → first_name / last_name when individual fields not provided
    if ((!first_name || !last_name) && fullName.trim()) {
      const parts = fullName.trim().split(/\s+/);
      first_name = parts[0] ?? '';
      last_name  = parts.length > 1 ? parts.slice(1).join(' ') : parts[0];
    }

    if (!first_name) throw new BadRequestException('Ism (fullName yoki first_name) majburiy');

    const email  = body.email  ?? null;
    const phone  = body.phone  ?? null;
    const srcRaw = String(body.source ?? 'OTHER').toUpperCase();
    const validSrc = ['HH_UZ','OLX_UZ','TELEGRAM','INSTAGRAM','FACEBOOK','LINKEDIN','REFERRAL','PRINT','WEBSITE','OTHER'];
    const source = validSrc.includes(srcRaw) ? srcRaw : 'OTHER';
    const notes  = body.notes  ?? null;
    const status = body.status ?? 'new';

    // Step 1: insert candidate (handle tables with or without full_name column)
    let candidateId: number | null = null;
    try {
      const r1 = await rawSql(sql`
        INSERT INTO candidates (first_name, last_name, full_name, email, phone, vacancy_id, source, status, notes)
        VALUES (${first_name}, ${last_name}, ${fullName || null}, ${email}, ${phone}, ${vacancyId}, ${source}, ${status}, ${notes})
        RETURNING id, first_name, last_name, full_name, status, created_at
      `);
      const created = dbRows(r1)[0];
      candidateId = si(created?.id);
      if (!candidateId) throw new Error('Candidate ID qaytarilmadi');

      // Step 2: automatically create pipeline entry so candidate appears in Kanban
      await rawSql(sql`
        INSERT INTO hr_candidate_funnels (candidate_id, vacancy_id, funnel_stage, is_active, source, initial_screening_notes)
        VALUES (${candidateId}, ${vacancyId}, 'NEW', true, ${source}, ${notes})
        ON CONFLICT DO NOTHING
      `);

      return created;
    } catch (e: unknown) {
      // Fallback: try without full_name column (older DB schema)
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes('full_name') && candidateId === null) {
        const r2 = await rawSql(sql`
          INSERT INTO candidates (first_name, last_name, email, phone, vacancy_id, source, status, notes)
          VALUES (${first_name}, ${last_name}, ${email}, ${phone}, ${vacancyId}, ${source}, ${status}, ${notes})
          RETURNING id, first_name, last_name, status, created_at
        `);
        const created2 = dbRows(r2)[0];
        candidateId = si(created2?.id);
        if (candidateId) {
          await rawSql(sql`
            INSERT INTO hr_candidate_funnels (candidate_id, vacancy_id, funnel_stage, is_active, source, initial_screening_notes)
            VALUES (${candidateId}, ${vacancyId}, 'NEW', true, ${source}, ${notes})
            ON CONFLICT DO NOTHING
          `);
        }
        return created2;
      }
      throw e;
    }

    });}

  async getCandidate(id: string){
    return safeCall(async () => {
    const r = await rawSql(sql`
      SELECT c.id, c.first_name, c.last_name, c.email, c.phone,
             c.vacancy_id, c.status, c.rating, c.experience_years,
             c.created_at, c.updated_at,
             COALESCE(c.full_name, c.first_name || ' ' || c.last_name) AS full_name,
             d.name AS department_name,
             COALESCE(p.name, p.name_uz) AS position_name
      FROM candidates c
      LEFT JOIN departments d ON d.id = c.department_id
      LEFT JOIN positions p ON p.id = c.position_id
      WHERE c.id = ${si(id)} AND c.deleted_at IS NULL
    `);
    const _found = dbRows(r)[0];
    if (!_found) throw new NotFoundException('Record not found');
    return _found;
  
    });}

  async updateCandidate(id: string, body: Record<string, unknown>){
    return safeCall(async () => {
    const { status, rating, notes, expected_salary } = body;
    const r = await rawSql(sql`
      UPDATE candidates
      SET status = COALESCE(${status ?? null}, status),
          rating = COALESCE(${rating ?? null}, rating),
          notes = COALESCE(${notes ?? null}, notes),
          expected_salary = COALESCE(${expected_salary ?? null}, expected_salary),
          updated_at = NOW()
      WHERE id = ${si(id)} AND deleted_at IS NULL
      RETURNING id, status, rating, updated_at
    `);
    const _found = dbRows(r)[0];
    if (!_found) throw new NotFoundException('Record not found');
    return _found;
  
    });}

  async deleteCandidate(id: string){
    return safeCall(async () => {
    await rawSql(sql`
      UPDATE candidates SET deleted_at = NOW(), is_archived = true WHERE id = ${si(id)}
    `);
    return { ok: true, deleted: true };
  
    });}
}
