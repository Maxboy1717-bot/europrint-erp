import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { db,
  rawSql} from '@shared/db';
import { sql } from 'drizzle-orm';
import { dbRows } from '../hr/common/db-rows';
import { safeCall, Result } from '@common/result';

import { MAX_QUERY_LIMIT } from '@common/constants/app.constants';
const si = (v: unknown, d = 0) => parseInt(String(v ?? ''), 10) || d;

@Injectable()
export class DisciplineRecordsCompatService {

  async getDisciplineRecords(employeeId?: string, type?: string, status?: string): Promise<Result<Record<string, unknown>[]>>{
    return safeCall(async () => {
    const empFilter = employeeId ? sql`AND dr.employee_id = ${si(employeeId)}` : sql``;
    const typeFilter = type ? sql`AND (dr.violation_type = ${type} OR dr.discipline_type = ${type})` : sql``;
    const statusFilter = status ? sql`AND dr.status = ${status}` : sql``;
    const r = await rawSql(sql`
      SELECT dr.id, dr.employee_id, dr.violation_type, dr.discipline_type,
             dr.severity, dr.violation_date, dr.issued_date, dr.description,
             dr.fine_amount, dr.suspension_days, dr.status, dr.created_at, dr.updated_at,
             e.first_name || ' ' || e.last_name AS employee_name, d.name AS department_name
      FROM discipline_records dr
      JOIN employees e ON e.id = dr.employee_id
      LEFT JOIN departments d ON d.id = e.department_id
      WHERE dr.deleted_at IS NULL AND dr.is_soft_deleted = false
        ${empFilter} ${typeFilter} ${statusFilter}
      ORDER BY dr.created_at DESC LIMIT ${MAX_QUERY_LIMIT}
    `);
    return dbRows(r);
  
    });}

  async createDisciplineRecord(body: Record<string, unknown>){
    return safeCall(async () => {
    const { employee_id, violation_type, discipline_type, severity, violation_date, description, fine_amount } = body;
    if (!employee_id || !violation_type) throw new BadRequestException('employee_id va violation_type majburiy');
    const r = await rawSql(sql`
      INSERT INTO discipline_records
        (employee_id, violation_type, discipline_type, severity,
         violation_date, issued_date, description, fine_amount, status)
      VALUES (${employee_id ?? null}, ${violation_type ?? null}, ${discipline_type ?? null},
              ${severity ?? 'minor'}, ${violation_date ?? null}::date, NOW()::date,
              ${description ?? null}, ${fine_amount ?? null}, 'issued')
      RETURNING id, violation_type, severity, status, created_at
    `);
    const _found = dbRows(r)[0];
    if (!_found) throw new NotFoundException('Record not found');
    return _found;
  
    });}

  async getDisciplineRecord(id: string){
    return safeCall(async () => {
    const r = await rawSql(sql`
      SELECT dr.id, dr.employee_id, dr.violation_type, dr.discipline_type,
             dr.severity, dr.violation_date, dr.status, dr.fine_amount, dr.description,
             e.first_name || ' ' || e.last_name AS employee_name
      FROM discipline_records dr
      JOIN employees e ON e.id = dr.employee_id
      WHERE dr.id = ${si(id)} AND dr.deleted_at IS NULL
    `);
    const _found = dbRows(r)[0];
    if (!_found) throw new NotFoundException('Record not found');
    return _found;
  
    });}

  async updateDisciplineRecord(id: string, body: Record<string, unknown>){
    return safeCall(async () => {
    const { status, fine_amount, description, suspension_days } = body;
    const r = await rawSql(sql`
      UPDATE discipline_records
      SET status = COALESCE(${status ?? null}, status),
          fine_amount = COALESCE(${fine_amount ?? null}, fine_amount),
          description = COALESCE(${description ?? null}, description),
          suspension_days = COALESCE(${suspension_days ?? null}, suspension_days),
          updated_at = NOW()
      WHERE id = ${si(id)} AND deleted_at IS NULL
      RETURNING id, status, fine_amount, updated_at
    `);
    const _found = dbRows(r)[0];
    if (!_found) throw new NotFoundException('Record not found');
    return _found;
  
    });}

  async deleteDisciplineRecord(id: string){
    return safeCall(async () => {
    await rawSql(sql`
      UPDATE discipline_records SET is_soft_deleted = true, deleted_at = NOW()
      WHERE id = ${si(id)}
    `);
    return { ok: true, deleted: true };
  
    });}
}
