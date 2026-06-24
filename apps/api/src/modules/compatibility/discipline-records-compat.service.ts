/**
 * @module discipline-records-compat.service
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
    // FIX (iter-77 drift catalog #11): two bugs. (1) The FE (AddDisciplineDialog) sends camelCase
    // keys (userId/type/amount/reason/reasonRu/givenBy) through CompatBodyDto.passthrough(), but the
    // service destructured snake_case → employee_id/violation_type were undefined → guard 400'd before
    // the INSERT. (2) reason + given_by are NOT NULL (no default) but were never written → 23502.
    // Accept both casings; write reason/reason_ru/given_by; default violation_type structurally.
    const employee_id    = body['employee_id']    ?? body['userId']       ?? body['employeeId'];
    const given_by       = body['given_by']        ?? body['givenBy'];
    const reason         = body['reason']          ?? body['description'];
    const reason_ru      = body['reasonRu']        ?? body['reason_ru']    ?? null;
    const discipline_type = body['discipline_type'] ?? body['disciplineType'] ?? body['type'] ?? null;
    const violation_type = body['violation_type']  ?? body['violationType'] ?? 'general';
    const severity       = body['severity']        ?? 'minor';
    const violation_date = body['violation_date']  ?? body['violationDate'] ?? null;
    const description     = body['description']      ?? body['reason']       ?? null;
    const fine_amount    = body['fine_amount']      ?? body['amount']       ?? null;
    if (!employee_id) throw new BadRequestException('employee_id (userId) majburiy');
    if (!given_by)    throw new BadRequestException('given_by (givenBy) majburiy');
    if (!reason)      throw new BadRequestException('reason majburiy');
    const r = await rawSql(sql`
      INSERT INTO discipline_records
        (employee_id, violation_type, discipline_type, severity,
         violation_date, issued_date, description, reason, reason_ru, given_by, fine_amount, status)
      VALUES (${employee_id}, ${violation_type}, ${discipline_type ?? null},
              ${severity}, ${violation_date}::date, NOW()::date,
              ${description}, ${reason}, ${reason_ru}, ${given_by}, ${fine_amount ?? null}, 'issued')
      RETURNING id, violation_type, reason, given_by, severity, status, created_at
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
