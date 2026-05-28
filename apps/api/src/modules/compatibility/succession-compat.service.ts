/**
 * @module succession-compat.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { db,
  rawSql} from '@shared/db';
import { sql } from 'drizzle-orm';
import { dbRows } from '../hr/common/db-rows';
import { safeCall, Result, AppError } from '@common/result';

import { MAX_QUERY_LIMIT } from '@common/constants/app.constants';
const si = (v: unknown, d = 0) => parseInt(String(v ?? ''), 10) || d;

@Injectable()
export class SuccessionCompatService {

  async getCareerPlans(employeeId?: string): Promise<Result<object, AppError>> {
    return safeCall(async () => {
    const empFilter = employeeId
      ? sql`AND (sp.candidate_id = ${si(employeeId)} OR sp.current_holder_id = ${si(employeeId)})`
      : sql``;
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
      WHERE true ${empFilter}
      ORDER BY sp.priority DESC, sp.created_at DESC
      LIMIT ${MAX_QUERY_LIMIT}
    `);
    return dbRows(r);
  
    });}

  async createCareerPlan(body: Record<string, unknown>){
    return safeCall(async () => {
    // P1.22: FE sends { employee_name, target_position_title, notes, progress_percent } rather
    // than { position_id, candidate_id }. Accept both formats — store name info in development_plan.
    const {
      position_id, current_holder_id, candidate_id,
      readiness_level, development_plan, target_date, priority,
      employee_name, target_position_title, current_position_title, notes, progress_percent,
    } = body;
    const planNote = development_plan
      ?? (employee_name || target_position_title || notes
          ? JSON.stringify({ employee_name, target_position_title, current_position_title, notes, progress_percent })
          : null);
    const r = await rawSql(sql`
      INSERT INTO succession_plans
        (position_id, current_holder_id, candidate_id, readiness_level, development_plan, target_date, priority, status)
      VALUES (${position_id ?? null}, ${current_holder_id ?? null}, ${candidate_id ?? null},
              ${readiness_level ?? 'low'}, ${planNote ?? null}, ${target_date ?? null},
              ${priority ?? 1}, 'active')
      RETURNING id, position_id, candidate_id, readiness_level, development_plan, status, created_at
    `);
    const _found = dbRows(r)[0];
    if (!_found) throw new NotFoundException('Record not found');
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
    if (!_found) throw new NotFoundException('Record not found');
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
    if (!_found) throw new NotFoundException('Record not found');
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
    if (!_found) throw new NotFoundException('Record not found');
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
    if (!_found) throw new NotFoundException('Record not found');
    return _found;
  
    });}
}
