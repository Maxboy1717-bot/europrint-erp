/**
 * @module succession-compat.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { db,
  rawSql} from '@shared/db';
import { sql } from 'drizzle-orm';
import { dbRows } from '../hr/common/db-rows';
import { safeCall, Result, AppError } from '@common/result';

import { MAX_QUERY_LIMIT } from '@common/constants/app.constants';
const si = (v: unknown, d = 0) => parseInt(String(v ?? ''), 10) || d;

@Injectable()
export class SuccessionCompatService {
  constructor(private readonly i18n: I18nService) {}

  async getCareerPlans(employeeId?: string): Promise<Result<object, AppError>> {
    return safeCall(async () => {
    const empFilter = employeeId
      ? sql`AND (sp.candidate_id = ${si(employeeId)} OR sp.current_holder_id = ${si(employeeId)})`
      : sql``;
    // FIX 2026-07-13 (verified live: HRSuccessionPlanningSections.tsx CareerPlansTab always
    // rendered "—" for every column except date/status): the FE reads
    // plan.employee_name / plan.current_position_title / plan.employee_position /
    // plan.target_position_title, but this query only ever returned candidate_name /
    // position_name — none of which match. Added employee_name/target_position_title as
    // extra aliases (kept candidate_name/position_name too, for any other reader), plus a
    // real current_position_title via employees.position_id -> positions (the candidate's
    // own current position, distinct from sp.position_id which is the TARGET position).
    const r = await rawSql(sql`
      SELECT sp.id, sp.position_id, sp.current_holder_id, sp.candidate_id,
             sp.readiness_level, sp.development_plan, sp.notes, sp.target_date,
             sp.priority, sp.status, sp.created_at, sp.updated_at,
             e1.first_name || ' ' || e1.last_name AS current_holder_name,
             e2.first_name || ' ' || e2.last_name AS candidate_name,
             e2.first_name || ' ' || e2.last_name AS employee_name,
             COALESCE(p.name, p.name_uz) AS position_name,
             COALESCE(p.name, p.name_uz) AS target_position_title,
             COALESCE(p2.name, p2.name_uz) AS current_position_title
      FROM succession_plans sp
      LEFT JOIN employees e1 ON e1.id = sp.current_holder_id
      LEFT JOIN employees e2 ON e2.id = sp.candidate_id
      LEFT JOIN positions p ON p.id = sp.position_id
      LEFT JOIN positions p2 ON p2.id = e2.position_id
      WHERE true ${empFilter}
      ORDER BY sp.priority DESC, sp.created_at DESC
      LIMIT ${MAX_QUERY_LIMIT}
    `);
    // HR Nazorat fix (2026-07-13, Kasbiy O'sish / HRCareerPath.tsx page): mentor_name and
    // progress_percent have no real succession_plans column — createCareerPlan() below
    // JSON-stuffs them into development_plan when there is no real position/candidate FK
    // for them yet. Parse that blob here so HRCareerPath.tsx's PlanCard/table (which read
    // plan.mentor_name / plan.progress_percent directly) render real values instead of
    // always falling back to "mentor tayinlanmagan" / 0%.
    const rows = dbRows(r);
    return (Array.isArray(rows) ? rows : []).map((row) => {
      const raw = row['development_plan'];
      if (typeof raw !== 'string' || !raw.trim().startsWith('{')) return row;
      try {
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        return {
          ...row,
          mentor_name: row['mentor_name'] ?? parsed['mentor_name'] ?? null,
          progress_percent: row['progress_percent'] ?? parsed['progress_percent'] ?? 0,
          // real columns win; JSON blob is only a fallback for legacy free-text creates
          employee_name: (row['employee_name'] as string | null) ?? parsed['employee_name'] ?? null,
          target_position_title: (row['target_position_title'] as string | null) ?? parsed['target_position_title'] ?? null,
          current_position_title: (row['current_position_title'] as string | null) ?? parsed['current_position_title'] ?? null,
        };
      } catch {
        return row;
      }
    });

    });}

  async createCareerPlan(body: Record<string, unknown>){
    return safeCall(async () => {
    // P1.22: FE sends { employee_name, target_position_title, notes, progress_percent } rather
    // than { position_id, candidate_id }. Accept both formats — store name info in development_plan.
    //
    // FIX 2026-07-13 (verified live: create ALWAYS threw a NOT NULL violation on candidate_id):
    // the actual current FE (HRSuccessionPlanningDialogs.tsx "Yangi vorislik rejasi" form) sends
    // camelCase { userId, targetPositionId, targetDate, notes } — none of which matched
    // candidate_id/position_id/target_date above, so candidate_id (NOT NULL on succession_plans)
    // was always null and every create from the real "Vorislik Rejalari" tab failed with a raw
    // Postgres constraint error. `user_id`/`target_position_id`/`readiness` columns exist on the
    // live table (added by an auto-generated drift-fix migration) but are dead/orphaned — Q-29
    // verified they came from a since-deleted local Drizzle definition with zero real callers, not
    // a hidden newer succession module — so this reads userId/targetPositionId/targetDate as
    // additional accepted aliases for the real columns (candidate_id/position_id/target_date),
    // same pattern as the employee_name/target_position_title aliasing already here.
    const {
      position_id, current_holder_id, candidate_id,
      readiness_level, development_plan, target_date, priority,
      employee_name, target_position_title, current_position_title, notes, progress_percent,
      userId, targetPositionId, targetDate,
      // HR Nazorat fix (2026-07-13, Kasbiy O'sish / HRCareerPathDialogs.tsx NewPlanDialog):
      // mentor_name has no real succession_plans column — was silently dropped even though
      // the FE form collects and sends it. JSON-stuffed into development_plan alongside the
      // other free-text fields (same pattern already used here), parsed back out in
      // getCareerPlans() above.
      mentor_name, mentorName,
    } = body;
    const resolvedCandidateId = candidate_id ?? userId ?? null;
    const resolvedPositionId = position_id ?? (targetPositionId || null);
    const resolvedTargetDate = target_date ?? targetDate ?? null;
    const resolvedMentorName = mentor_name ?? mentorName ?? null;
    if (resolvedCandidateId == null) {
      throw new BadRequestException('candidate_id / userId talab qilinadi');
    }
    const planNote = development_plan
      ?? (employee_name || target_position_title || notes || resolvedMentorName
          ? JSON.stringify({ employee_name, target_position_title, current_position_title, notes, progress_percent, mentor_name: resolvedMentorName })
          : null);
    const r = await rawSql(sql`
      INSERT INTO succession_plans
        (position_id, current_holder_id, candidate_id, readiness_level, development_plan, target_date, priority, status, notes)
      VALUES (${resolvedPositionId}, ${current_holder_id ?? null}, ${resolvedCandidateId},
              ${readiness_level ?? 'low'}, ${planNote ?? null}, ${resolvedTargetDate},
              ${priority ?? 1}, 'active', ${notes ?? null})
      RETURNING id, position_id, candidate_id, readiness_level, development_plan, status, notes, created_at
    `);
    const _found = dbRows(r)[0];
    if (!_found) throw new NotFoundException(await this.i18n.t('errors.recordNotFound'));
    return _found;

    });}

  async getKeyPositions(){
    return safeCall(async () => {
    const r = await rawSql(sql`
      SELECT p.id, COALESCE(p.name, p.name_uz) AS position_name, p.name_uz,
             d.name AS department_name,
             COUNT(sp.id) AS succession_count,
             MAX(sp.readiness_level) AS top_readiness
      FROM positions p
      LEFT JOIN departments d ON d.id = p.department_id
      LEFT JOIN succession_plans sp ON sp.position_id = p.id
      WHERE p.is_active = true
      GROUP BY p.id, p.name, p.name_uz, d.name
      ORDER BY succession_count DESC
      LIMIT 100
    `);
    return dbRows(r);
  
    });}

  async createKeyPosition(body: Record<string, unknown>){
    return safeCall(async () => {
    const { position_id, current_holder_id, candidate_id, readiness_level, priority } = body;
    const r = await rawSql(sql`
      INSERT INTO succession_plans (position_id, current_holder_id, candidate_id, readiness_level, priority, status)
      VALUES (${position_id ?? null}, ${current_holder_id ?? null}, ${candidate_id ?? null},
              ${readiness_level ?? 'low'}, ${priority ?? 1}, 'draft')
      RETURNING id, position_id, readiness_level, status, created_at
    `);
    const _found = dbRows(r)[0];
    if (!_found) throw new NotFoundException(await this.i18n.t('errors.recordNotFound'));
    return _found;
  
    });}

  async getCandidates(positionId?: string){
    return safeCall(async () => {
    const posFilter = positionId ? sql`AND sp.position_id = ${si(positionId)}` : sql``;
    const r = await rawSql(sql`
      SELECT sp.id, sp.candidate_id, sp.readiness_level, sp.priority, sp.status,
             e.first_name || ' ' || e.last_name AS candidate_name,
             COALESCE(p.name, p.name_uz) AS position_name
      FROM succession_plans sp
      LEFT JOIN employees e ON e.id = sp.candidate_id
      LEFT JOIN positions p ON p.id = sp.position_id
      WHERE true ${posFilter}
      ORDER BY sp.priority DESC
      LIMIT 100
    `);
    return dbRows(r);
  
    });}

  async getSuccession(id: string){
    return safeCall(async () => {
    const r = await rawSql(sql`
      SELECT sp.id, sp.position_id, sp.current_holder_id, sp.candidate_id,
             sp.readiness_level, sp.development_plan, sp.target_date,
             sp.priority, sp.status, sp.created_at, sp.updated_at,
             e1.first_name || ' ' || e1.last_name AS current_holder_name,
             e2.first_name || ' ' || e2.last_name AS candidate_name,
             COALESCE(p.name, p.name_uz) AS position_name
      FROM succession_plans sp
      LEFT JOIN employees e1 ON e1.id = sp.current_holder_id
      LEFT JOIN employees e2 ON e2.id = sp.candidate_id
      LEFT JOIN positions p ON p.id = sp.position_id
      WHERE sp.id = ${si(id)}
    `);
    const _found = dbRows(r)[0];
    if (!_found) throw new NotFoundException(await this.i18n.t('errors.recordNotFound'));
    return _found;
  
    });}

  async updateCareerPlan(id: string, body: Record<string, unknown>){
    return safeCall(async () => {
    const { readiness_level, development_plan, status, target_date } = body;
    const r = await rawSql(sql`
      UPDATE succession_plans
      SET readiness_level = COALESCE(${readiness_level ?? null}, readiness_level),
          development_plan = COALESCE(${development_plan ?? null}, development_plan),
          status = COALESCE(${status ?? null}, status),
          target_date = COALESCE(${target_date ?? null}, target_date),
          updated_at = NOW()
      WHERE id = ${si(id)}
      RETURNING id, readiness_level, status, updated_at
    `);
    const _found = dbRows(r)[0];
    if (!_found) throw new NotFoundException(await this.i18n.t('errors.recordNotFound'));
    return _found;
  
    });}

  async getTalentPool(readiness?: string){
    return safeCall(async () => {
    const filter = readiness ? sql`AND sp.readiness_level = ${readiness}` : sql``;
    const r = await rawSql(sql`
      SELECT sp.id, sp.candidate_id, sp.position_id, sp.readiness_level,
             sp.development_plan, sp.target_date, sp.priority, sp.status,
             e.first_name || ' ' || e.last_name AS candidate_name,
             COALESCE(p.name, p.name_uz) AS position_name
      FROM succession_plans sp
      LEFT JOIN employees e ON e.id = sp.candidate_id
      LEFT JOIN positions p ON p.id = sp.position_id
      WHERE sp.status = 'active' ${filter}
      ORDER BY sp.readiness_level DESC, sp.priority ASC LIMIT 100
    `);
    return dbRows(r);
  
    });}

  async getSuccessionRisks(){
    return safeCall(async () => {
      const r = await rawSql(sql`
        SELECT sp.id, COALESCE(p.name, p.name_uz) AS position_name,
               e1.first_name || ' ' || e1.last_name AS current_holder_name,
               sp.readiness_level, sp.priority, sp.status,
               CASE
                 WHEN sp.readiness_level = 'low' THEN 'high'
                 WHEN sp.readiness_level = 'medium' THEN 'medium'
                 ELSE 'low'
               END AS risk_level,
               sp.created_at
        FROM succession_plans sp
        LEFT JOIN positions p ON p.id = sp.position_id
        LEFT JOIN employees e1 ON e1.id = sp.current_holder_id
        WHERE sp.status = 'active' AND sp.readiness_level IN ('low', 'medium')
        ORDER BY sp.priority DESC, sp.readiness_level ASC
        LIMIT 100
      `);
      return dbRows(r);
    });
  }

  async getReadinessStats(){
    return safeCall(async () => {
      const r = await rawSql(sql`
        SELECT
          COUNT(*) FILTER (WHERE readiness_level = 'high') AS ready,
          COUNT(*) FILTER (WHERE readiness_level = 'medium') AS near_ready,
          COUNT(*) FILTER (WHERE readiness_level = 'low' OR readiness_level IS NULL) AS not_ready
        FROM succession_plans WHERE status = 'active'
      `);
      const row = dbRows(r)[0] ?? {};
      return {
        ready:     Number(row['ready'] ?? 0),
        nearReady: Number(row['near_ready'] ?? 0),
        notReady:  Number(row['not_ready'] ?? 0),
      };
    });
  }

  async createTalentPoolEntry(body: Record<string, unknown>){
    return safeCall(async () => {
    const { candidate_id, position_id, readiness_level, development_plan, target_date, priority } = body;
    const r = await rawSql(sql`
      INSERT INTO succession_plans (candidate_id, position_id, readiness_level, development_plan, target_date, priority, status)
      VALUES (${si(candidate_id)}, ${si(position_id)}, ${readiness_level ?? 'low'},
              ${development_plan ?? null}, ${target_date ?? null}, ${priority ?? 5}, 'active')
      RETURNING id, candidate_id, position_id, readiness_level, status
    `);
    const _found = dbRows(r)[0];
    if (!_found) throw new NotFoundException(await this.i18n.t('errors.recordNotFound'));
    return _found;
  
    });}
}
