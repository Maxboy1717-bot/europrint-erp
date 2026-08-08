/**
 * @module candidates-compat.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { MAX_QUERY_LIMIT } from '@common/constants/app.constants';
import { db,
  rawSql} from '@shared/db';
import { sql } from 'drizzle-orm';
import { dbRows } from '../hr/common/db-rows';
import { safeCall, Result } from '@common/result';

const si = (v: unknown, d = 0) => parseInt(String(v ?? ''), 10) || d;

@Injectable()
export class CandidatesCompatService {
  constructor(private readonly i18n: I18nService) {}

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
      const fields = this.parseCandidateFields(body);
      if (!fields.first_name) throw new BadRequestException(await this.i18n.t('validation.candidateFirstNameRequired'));
      return await this.insertCandidateWithFallback(fields);
    });
  }

  private parseCandidateFields(body: Record<string, unknown>): {
    fullName: string; vacancyId: number | null;
    first_name: string; last_name: string;
    email: unknown; phone: unknown; source: string; notes: unknown; status: unknown;
  } {
    // Accept both camelCase (frontend) and snake_case (API direct) field names
    const fullName   = (body.fullName  as string) || (body.full_name  as string) || '';
    const vacancyRaw = body.vacancyId  ?? body.vacancy_id;
    const vacancyId  = vacancyRaw && String(vacancyRaw) !== 'none' ? si(vacancyRaw) || null : null;
    const { first_name, last_name } = this.resolveName(body, fullName);
    const source = this.normalizeSource(body.source);
    return {
      fullName, vacancyId, first_name, last_name,
      email: body.email ?? null,
      phone: body.phone ?? null,
      source,
      notes: body.notes ?? null,
      status: body.status ?? 'new',
    };
  }

  private resolveName(body: Record<string, unknown>, fullName: string): { first_name: string; last_name: string } {
    let first_name = (body.first_name as string) || '';
    let last_name  = (body.last_name  as string) || '';
    // Split fullName → first_name / last_name when individual fields not provided
    if ((!first_name || !last_name) && fullName.trim()) {
      const parts = fullName.trim().split(/\s+/);
      first_name = parts[0] ?? '';
      last_name  = parts.length > 1 ? parts.slice(1).join(' ') : parts[0];
    }
    return { first_name, last_name };
  }

  private normalizeSource(raw: unknown): string {
    const srcRaw = String(raw ?? 'OTHER').toUpperCase();
    const validSrc = ['HH_UZ','OLX_UZ','TELEGRAM','INSTAGRAM','FACEBOOK','LINKEDIN','REFERRAL','PRINT','WEBSITE','OTHER'];
    return validSrc.includes(srcRaw) ? srcRaw : 'OTHER';
  }

  private async insertCandidateWithFallback(f: {
    fullName: string; vacancyId: number | null; first_name: string; last_name: string;
    email: unknown; phone: unknown; source: string; notes: unknown; status: unknown;
  }): Promise<Record<string, unknown> | undefined> {
    try {
      const r1 = await rawSql(sql`
        INSERT INTO candidates (first_name, last_name, full_name, email, phone, vacancy_id, source, status, notes)
        VALUES (${f.first_name}, ${f.last_name}, ${f.fullName || null}, ${f.email}, ${f.phone}, ${f.vacancyId}, ${f.source}, ${f.status}, ${f.notes})
        RETURNING id, first_name, last_name, full_name, status, created_at
      `);
      const created = dbRows(r1)[0];
      const candidateId = si(created?.id);
      // WHY: si() returns 0 for missing / non-numeric ids. Treat as success-without-funnel
      // rather than throwing — caller still gets the row it inserted.
      if (candidateId) await this.createFunnelEntry(candidateId, f.vacancyId, f.source, f.notes);
      return created;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes('full_name')) return await this.insertCandidateLegacy(f);
      throw e;
    }
  }

  private async insertCandidateLegacy(f: {
    vacancyId: number | null; first_name: string; last_name: string;
    email: unknown; phone: unknown; source: string; notes: unknown; status: unknown;
  }): Promise<Record<string, unknown> | undefined> {
    // Fallback: try without full_name column (older DB schema)
    const r2 = await rawSql(sql`
      INSERT INTO candidates (first_name, last_name, email, phone, vacancy_id, source, status, notes)
      VALUES (${f.first_name}, ${f.last_name}, ${f.email}, ${f.phone}, ${f.vacancyId}, ${f.source}, ${f.status}, ${f.notes})
      RETURNING id, first_name, last_name, status, created_at
    `);
    const created2 = dbRows(r2)[0];
    const candidateId = si(created2?.id);
    if (candidateId) await this.createFunnelEntry(candidateId, f.vacancyId, f.source, f.notes);
    return created2;
  }

  private async createFunnelEntry(candidateId: number, vacancyId: number | null, source: string, notes: unknown): Promise<void> {
    // Automatically create pipeline entry so candidate appears in Kanban
    await rawSql(sql`
      INSERT INTO hr_candidate_funnels (candidate_id, vacancy_id, funnel_stage, is_active, source, initial_screening_notes)
      VALUES (${candidateId}, ${vacancyId}, 'NEW', true, ${source}, ${notes})
      ON CONFLICT DO NOTHING
    `);
  }

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
    if (!_found) throw new NotFoundException(await this.i18n.t('errors.recordNotFound'));
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
    if (!_found) throw new NotFoundException(await this.i18n.t('errors.recordNotFound'));
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
