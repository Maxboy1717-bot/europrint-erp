/**
 * @module adaptation-compat.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { db,
  rawSql} from '@shared/db';
import { sql } from 'drizzle-orm';
import { dbRows } from '../hr/common/db-rows';
import { safeCall, Result } from '@common/result';

import { MAX_QUERY_LIMIT } from '@common/constants/app.constants';
const si = (v: unknown, d = 0) => parseInt(String(v ?? ''), 10) || d;

@Injectable()
export class AdaptationCompatService {

  async getPrograms(status?: string): Promise<Result<Record<string, unknown>[]>>{
    return safeCall(async () => {
    const statusFilter = status ? sql`AND ap.status = ${status}` : sql``;
    const r = await rawSql(sql`
      SELECT ap.id, ap.program_name, ap.duration_days, ap.description,
             ap.is_active, ap.status, ap.created_at, ap.updated_at,
             ap.department_id, ap.position_id,
             d.name AS department_name,
             COALESCE(p.name, p.name_uz) AS position_name
      FROM adaptation_programs ap
      LEFT JOIN departments d ON d.id = ap.department_id
      LEFT JOIN positions p ON p.id = ap.position_id
      WHERE ap.deleted_at IS NULL ${statusFilter}
      ORDER BY ap.created_at DESC LIMIT ${MAX_QUERY_LIMIT}
    `);
    return dbRows(r);
  
    });}

  async createProgram(body: Record<string, unknown>){
    return safeCall(async () => {
    const { program_name, department_id, position_id, duration_days, description, status } = body;
    if (!program_name || !department_id) throw new BadRequestException('program_name va department_id majburiy');
    const r = await rawSql(sql`
      INSERT INTO adaptation_programs (program_name, department_id, position_id, duration_days, description, status)
      VALUES (${program_name ?? ''}, ${department_id ?? null}, ${position_id ?? null},
              ${duration_days ?? 90}, ${description ?? null}, ${status ?? 'active'})
      RETURNING id, program_name, duration_days, status, created_at
    `);
    const created = dbRows(r)[0];
    return created;
  
    });}

  async getProgram(id: string){
    return safeCall(async () => {
    const r = await rawSql(sql`
      SELECT ap.id, ap.program_name, ap.duration_days, ap.description,
             ap.is_active, ap.status, ap.created_at, ap.updated_at,
             d.name AS department_name, COALESCE(p.name, p.name_uz) AS position_name
      FROM adaptation_programs ap
      LEFT JOIN departments d ON d.id = ap.department_id
      LEFT JOIN positions p ON p.id = ap.position_id
      WHERE ap.id = ${si(id)} AND ap.deleted_at IS NULL
    `);
    const _found = dbRows(r)[0];
    if (!_found) throw new NotFoundException('Record not found');
    return _found;
  
    });}

  async updateProgram(id: string, body: Record<string, unknown>){
    return safeCall(async () => {
    const { program_name, duration_days, description, status } = body;
    const r = await rawSql(sql`
      UPDATE adaptation_programs
      SET program_name = COALESCE(${program_name ?? null}, program_name),
          duration_days = COALESCE(${duration_days ?? null}, duration_days),
          description = COALESCE(${description ?? null}, description),
          status = COALESCE(${status ?? null}, status),
          updated_at = NOW()
      WHERE id = ${si(id)} AND deleted_at IS NULL
      RETURNING id, program_name, status, updated_at
    `);
    const _found = dbRows(r)[0];
    if (!_found) throw new NotFoundException('Record not found');
    return _found;
  
    });}

  async deleteProgram(id: string){
    return safeCall(async () => {
    await rawSql(sql`UPDATE adaptation_programs SET deleted_at = NOW() WHERE id = ${si(id)}`);
    return { ok: true, deleted: true };
  
    });}

  async getNewEmployees(limit: string, offset: string){
    return safeCall(async () => {
    const lim = Math.min(si(limit, 50), MAX_QUERY_LIMIT);
    const off = si(offset, 0);
    const r = await rawSql(sql`
      SELECT ar.id, ar.employee_id, ar.program_id, ar.start_date, ar.end_date,
             ar.status, ar.progress_percent, ar.current_milestone, ar.created_at,
             ap.program_name,
             e.first_name || ' ' || e.last_name AS full_name,
             d.name AS department_name, COALESCE(p.name, p.name_uz) AS position_name
      FROM adaptation_records ar
      LEFT JOIN adaptation_programs ap ON ap.id = ar.program_id
      LEFT JOIN employees e ON e.id = ar.employee_id
      LEFT JOIN departments d ON d.id = e.department_id
      LEFT JOIN positions p ON p.id = e.position_id
      ORDER BY ar.created_at DESC LIMIT ${lim} OFFSET ${off}
    `);
    return dbRows(r);
  
    });}

  async getFeedback(employeeId?: string){
    return safeCall(async () => {
    const empFilter = employeeId ? sql`AND ar.employee_id = ${si(employeeId)}` : sql``;
    const r = await rawSql(sql`
      SELECT af.id, af.new_employee_id, af.feedback_type, af.scheduled_date,
             af.completed_date, af.rating, af.status, af.created_at,
             ar.employee_id, e.first_name || ' ' || e.last_name AS employee_name
      FROM adaptation_feedback af
      LEFT JOIN adaptation_records ar ON ar.id = af.new_employee_id
      LEFT JOIN employees e ON e.id = ar.employee_id
      WHERE true ${empFilter}
      ORDER BY af.created_at DESC LIMIT ${MAX_QUERY_LIMIT}
    `);
    return dbRows(r);
  
    });}

  async createFeedback(body: Record<string, unknown>){
    return safeCall(async () => {
    const { new_employee_id, feedback_type, scheduled_date, rating, strengths, weaknesses } = body;
    const r = await rawSql(sql`
      INSERT INTO adaptation_feedback (new_employee_id, feedback_type, scheduled_date, rating, strengths, weaknesses)
      VALUES (${new_employee_id ?? null}, ${feedback_type ?? 'check-in'},
              ${scheduled_date ?? null}, ${rating ?? null}, ${strengths ?? null}, ${weaknesses ?? null})
      RETURNING id, feedback_type, status, created_at
    `);
    const created = dbRows(r)[0];
    return created;
  
    });}

  async getFeedbackById(id: string){
    return safeCall(async () => {
    const r = await rawSql(sql`
      SELECT af.*, ar.employee_id, e.first_name || ' ' || e.last_name AS employee_name
      FROM adaptation_feedback af
      LEFT JOIN adaptation_records ar ON ar.id = af.new_employee_id
      LEFT JOIN employees e ON e.id = ar.employee_id
      WHERE af.id = ${si(id)}
    `);
    const _found = dbRows(r)[0];
    if (!_found) throw new NotFoundException('Record not found');
    return _found;
  
    });}

  async updateFeedback(id: string, body: Record<string, unknown>){
    return safeCall(async () => {
    const { rating, strengths, weaknesses, suggestions, status } = body;
    const r = await rawSql(sql`
      UPDATE adaptation_feedback
      SET rating = COALESCE(${rating ?? null}, rating),
          strengths = COALESCE(${strengths ?? null}, strengths),
          weaknesses = COALESCE(${weaknesses ?? null}, weaknesses),
          suggestions = COALESCE(${suggestions ?? null}, suggestions),
          status = COALESCE(${status ?? null}, status),
          updated_at = NOW()
      WHERE id = ${si(id)}
      RETURNING id, rating, status, updated_at
    `);
    const _found = dbRows(r)[0];
    if (!_found) throw new NotFoundException('Record not found');
    return _found;
  
    });}

  async getWelcomeEvents(){
    return safeCall(async () => {
    const r = await rawSql(sql`
      SELECT am.id, am.record_id, am.milestone_number, am.milestone_title,
             am.description, am.due_date, am.status, am.created_at,
             ar.employee_id, ap.program_name,
             e.first_name || ' ' || e.last_name AS employee_name
      FROM adaptation_milestones am
      JOIN adaptation_records ar ON ar.id = am.record_id
      JOIN adaptation_programs ap ON ap.id = ar.program_id
      LEFT JOIN employees e ON e.id = ar.employee_id
      ORDER BY am.created_at DESC LIMIT 100
    `);
    return dbRows(r);
  
    });}

  async createWelcomeEvent(body: Record<string, unknown>){
    return safeCall(async () => {
    const { record_id, milestone_number, milestone_title, description, due_date } = body;
    const r = await rawSql(sql`
      INSERT INTO adaptation_milestones (record_id, milestone_number, milestone_title, description, due_date)
      VALUES (${record_id ?? null}, ${milestone_number ?? 1},
              ${milestone_title ?? ''}, ${description ?? null}, ${due_date ?? null})
      RETURNING id, milestone_title, status, created_at
    `);
    const created = dbRows(r)[0];
    return created;
  
    });}

  async getWelcomeEventById(id: string){
    return safeCall(async () => {
    const r = await rawSql(sql`
      SELECT am.id, am.record_id, am.milestone_number, am.milestone_title,
             am.description, am.due_date, am.status, am.created_at,
             ar.employee_id, ap.program_name, e.first_name || ' ' || e.last_name AS employee_name
      FROM adaptation_milestones am
      JOIN adaptation_records ar ON ar.id = am.record_id
      JOIN adaptation_programs ap ON ap.id = ar.program_id
      LEFT JOIN employees e ON e.id = ar.employee_id
      WHERE am.id = ${si(id)}
    `);
    const _found = dbRows(r)[0];
    if (!_found) throw new NotFoundException('Record not found');
    return _found;
  
    });}
}
