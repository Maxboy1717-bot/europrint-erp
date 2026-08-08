/**
 * @module employees-compat.helpers
 * @description SQL helpers extracted from employees-compat.service.ts to keep
 *   the service file <300 lines (Rule 16). Pure functions that take a tx handle.
 */

import { NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { sql } from 'drizzle-orm';
import { db } from '@shared/db';
import { dbRows } from '../hr/common/db-rows';
import {
  syncEmployeeOrgAssignments, ensureUserForEmployee,
} from './employees-org-assignment.helper';
import type { adaptEmployeePayload } from './employees-payload.adapter';

export type Row = Record<string, unknown>;
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type EmployeeAdapted = ReturnType<typeof adaptEmployeePayload>;

export const si = (v: unknown, d = 0): number => parseInt(String(v ?? ''), 10) || d;

export async function resolveOrCreateUserForEmployee(tx: Tx, empId: number, i18n: I18nService): Promise<number> {
  const userResult = await tx.execute(sql`
    SELECT id FROM users WHERE employee_id = ${empId} AND deleted_at IS NULL LIMIT 1
  `);
  const userRow = dbRows(userResult)[0];
  if (userRow) return Number(userRow['id']);

  const emp = await tx.execute(sql`
    SELECT first_name, last_name, email_personal, phone_number,
           position_id, department_id, hire_date::text AS hire_date
    FROM employees WHERE id = ${empId}
  `);
  const e = dbRows(emp)[0] as Row;
  return ensureUserForEmployee(tx, {
    employeeId: empId,
    firstName: String(e['first_name'] ?? ''),
    lastName: String(e['last_name'] ?? ''),
    email: (e['email_personal'] as string | null) ?? null,
    phone: (e['phone_number'] as string | null) ?? null,
    hireDate: (e['hire_date'] as string | null) ?? null,
    positionId: e['position_id'] ? Number(e['position_id']) : null,
    departmentId: e['department_id'] ? Number(e['department_id']) : null,
  }, i18n);
}

export async function insertEmployeeRow(tx: Tx, a: EmployeeAdapted, i18n: I18nService): Promise<Row> {
  const empResult = await tx.execute(sql`
    INSERT INTO employees (
      first_name, last_name, email_personal, department_id, position_id,
      employee_code, status, hire_date, birth_date, phone_number,
      telegram_chat_id, address_actual
    )
    VALUES (
      ${a.firstName}, ${a.lastName}, ${a.email}, ${a.departmentId}, ${a.positionId},
      ${a.employeeCode}, ${a.status}, ${a.hireDate}, ${a.birthDate}, ${a.phoneNumber},
      ${a.telegramChatId}, ${a.address}
    )
    RETURNING id::text AS id, id AS num_id, first_name, last_name, employee_code, status
  `);
  const emp = dbRows(empResult)[0] as Row | undefined;
  if (!emp) throw new InternalServerErrorException(await i18n.t('errors.employeeCreationFailed'));
  return emp;
}

export async function updateEmployeeRow(tx: Tx, id: string, a: EmployeeAdapted, i18n: I18nService): Promise<Row> {
  const r = await tx.execute(sql`
    UPDATE employees
    SET first_name        = COALESCE(${a.firstName}, first_name),
        last_name         = COALESCE(${a.lastName}, last_name),
        email_personal    = COALESCE(${a.email}, email_personal),
        department_id     = COALESCE(${a.departmentId}, department_id),
        position_id       = COALESCE(${a.positionId}, position_id),
        status            = COALESCE(${a.status}, status),
        hire_date         = COALESCE(${a.hireDate}, hire_date),
        birth_date        = COALESCE(${a.birthDate}, birth_date),
        phone_number      = COALESCE(${a.phoneNumber}, phone_number),
        telegram_chat_id  = COALESCE(${a.telegramChatId}, telegram_chat_id),
        address_actual    = COALESCE(${a.address}, address_actual),
        employee_code     = COALESCE(${a.employeeCode}, employee_code),
        updated_at        = NOW()
    WHERE id = ${si(id)}
    RETURNING id::text AS id, first_name, last_name, employee_code, status, updated_at
  `);
  const found = dbRows(r)[0] as Row | undefined;
  if (!found) throw new NotFoundException(await i18n.t('errors.recordNotFound'));
  return found;
}

export async function syncOrgAssignmentsIfUserExists(tx: Tx, id: string, orgIds: number[]): Promise<void> {
  const userResult = await tx.execute(sql`
    SELECT id FROM users WHERE employee_id = ${si(id)} AND deleted_at IS NULL LIMIT 1
  `);
  const userRow = dbRows(userResult)[0];
  if (userRow) {
    await syncEmployeeOrgAssignments(tx, Number(userRow['id']), orgIds);
  }
}
