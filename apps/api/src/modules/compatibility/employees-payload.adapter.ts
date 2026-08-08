/**
 * employees-payload.adapter.ts — frontend camelCase body'ni `employees` jadvali snake_case
 * ustunlariga moslab beradi.
 *
 * Sabab: frontend `EmployeeDialog.tsx` `EmployeeFormData` (camelCase) yuboradi:
 *   { fullName, employeeId, phone, departmentId, birthDate, telegramChatId, address, ... }
 * Backend `employees` jadvali snake_case:
 *   { first_name, last_name, employee_code, phone_number, birth_date, telegram_chat_id, address_actual, ... }
 *
 * Adapter ikkala formatni qabul qiladi (frontend yangi camelCase + backward compat snake_case).
 *
 * `fullName` → `firstName + lastName` ga split bo'shliq bo'yicha (birinchi so'z = ism, qolgani = familiya).
 *
 * Yana: `validateEmployeeFks` — INSERT'dan oldin FK mavjudligini va `employee_code` UNIQUE
 * tekshiradi. PostgreSQL'ning umumiy `Failed query` o'rniga aniq xato xabar beradi.
 */
import { BadRequestException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { rawSql } from '@shared/db';
import { sql } from 'drizzle-orm';
import { dbRows } from '../hr/common/db-rows';

const safeStr = (v: unknown): string | null => {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s.length > 0 ? s : null;
};

const safeInt = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = parseInt(String(v), 10);
  return Number.isFinite(n) ? n : null;
};

/**
 * "Aziz Karimov Olimovich" → { firstName: "Aziz", lastName: "Karimov Olimovich" }
 * "Aziz" → { firstName: "Aziz", lastName: "" } (lastName majburiy emasdek qaraladi)
 */
function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = fullName.trim();
  const spaceIdx = trimmed.indexOf(' ');
  if (spaceIdx === -1) {
    return { firstName: trimmed, lastName: '' };
  }
  return {
    firstName: trimmed.slice(0, spaceIdx).trim(),
    lastName: trimmed.slice(spaceIdx + 1).trim(),
  };
}

export interface AdaptedEmployee {
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  employeeCode: string | null;
  phoneNumber: string | null;
  telegramChatId: string | null;
  birthDate: string | null;
  hireDate: string | null;
  address: string | null;
  status: string | null;
  departmentId: number | null;
  positionId: number | null;
}

/**
 * INSERT/UPDATE'dan oldin FK va UNIQUE tekshiruvi.
 * PostgreSQL umumiy "Failed query" o'rniga aniq xato xabar beradi.
 */
export async function validateEmployeeFks(
  a: AdaptedEmployee,
  i18n: I18nService,
  excludeEmployeeId?: number,
): Promise<void> {
  if (a.departmentId !== null) {
    // Audit 2026-08-06: this validated against the legacy `departments` table, which holds
    // 0 rows live — so supplying any department while creating or editing an employee was
    // rejected outright with "department not found". org_departments is canonical (10 rows).
    // Both are accepted here: the mirror-sync writes departments rows with their own serial
    // ids, so an id that resolves in either space is a real department.
    const dept = await rawSql(sql`
      SELECT id FROM org_departments WHERE id = ${a.departmentId}
      UNION ALL
      SELECT id FROM departments WHERE id = ${a.departmentId}
      LIMIT 1
    `);
    if (dbRows(dept).length === 0) {
      throw new BadRequestException(await i18n.t('errors.departmentIdNotFound', { args: { id: a.departmentId } }));
    }
  }
  if (a.positionId !== null) {
    const pos = await rawSql(sql`SELECT id FROM positions WHERE id = ${a.positionId} LIMIT 1`);
    if (dbRows(pos).length === 0) {
      throw new BadRequestException(await i18n.t('errors.positionIdNotFound', { args: { id: a.positionId } }));
    }
  }
  if (a.employeeCode !== null) {
    const dup = await rawSql(
      excludeEmployeeId !== undefined
        ? sql`SELECT id FROM employees WHERE employee_code = ${a.employeeCode} AND id != ${excludeEmployeeId} LIMIT 1`
        : sql`SELECT id FROM employees WHERE employee_code = ${a.employeeCode} LIMIT 1`,
    );
    if (dbRows(dup).length > 0) {
      throw new BadRequestException(await i18n.t('errors.employeeCodeAlreadyExists', { args: { code: a.employeeCode } }));
    }
  }
}

export function adaptEmployeePayload(body: Record<string, unknown>): AdaptedEmployee {
  // 1. Ism — fullName (frontend) yoki first_name + last_name (legacy)
  let firstName: string | null = safeStr(body['first_name']) ?? safeStr(body['firstName']);
  let lastName: string | null = safeStr(body['last_name']) ?? safeStr(body['lastName']);

  const fullName = safeStr(body['fullName']) ?? safeStr(body['full_name']);
  if (fullName !== null && (firstName === null || lastName === null)) {
    const split = splitFullName(fullName);
    firstName = firstName ?? (split.firstName.length > 0 ? split.firstName : null);
    lastName = lastName ?? (split.lastName.length > 0 ? split.lastName : null);
  }

  // 2. Boshqa maydonlar — camelCase yoki snake_case
  return {
    firstName,
    lastName,
    email: safeStr(body['email']) ?? safeStr(body['email_personal']) ?? safeStr(body['emailPersonal']),
    employeeCode: safeStr(body['employee_code']) ?? safeStr(body['employeeCode']) ?? safeStr(body['employeeId']),
    phoneNumber: safeStr(body['phone_number']) ?? safeStr(body['phoneNumber']) ?? safeStr(body['phone']),
    telegramChatId: safeStr(body['telegram_chat_id']) ?? safeStr(body['telegramChatId']),
    birthDate: safeStr(body['birth_date']) ?? safeStr(body['birthDate']),
    hireDate: safeStr(body['hire_date']) ?? safeStr(body['hireDate']),
    address: safeStr(body['address_actual']) ?? safeStr(body['addressActual']) ?? safeStr(body['address']),
    status: safeStr(body['status']) ?? 'active',
    departmentId: safeInt(body['department_id']) ?? safeInt(body['departmentId']),
    positionId: safeInt(body['position_id']) ?? safeInt(body['positionId']),
  };
}
