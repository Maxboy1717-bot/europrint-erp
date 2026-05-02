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
    const { first_name, last_name, email, phone, vacancy_id, source, status, experience_years } = body;
    if (!first_name || !last_name) throw new BadRequestException('first_name va last_name majburiy');
    const r = await rawSql(sql`
      INSERT INTO candidates (first_name, last_name, email, phone, vacancy_id, source, status, experience_years)
      VALUES (${first_name ?? ''}, ${last_name ?? ''}, ${email ?? null}, ${phone ?? null},
              ${vacancy_id ?? null}, ${source ?? null}, ${status ?? 'new'}, ${experience_years ?? 0})
      RETURNING id, first_name, last_name, status, created_at
    `);
    const created = dbRows(r)[0];
    return created;
  
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
