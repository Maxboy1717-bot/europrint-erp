/**
 * employees-org-assignment.helper.ts — xodim ↔ org_departments multi-assignment.
 *
 * Asosiy biznes qoidalari:
 *   1. Xodim kamida BITTA org_department'ga biriktirilishi shart (saqlash uchun).
 *   2. Bitta xodim BIR NECHTA org_department'ga biriktirilishi mumkin (multi-assignment).
 *   3. Birinchi tanlov — `is_primary = true`, qolganlari `false`.
 *   4. Xodim'ning org_department'siz holati — oylik kiritishga to'sqinlik (boshqa joyda tekshiriladi).
 *
 * Strategiya:
 *   - `users.employee_id` orqali employee ↔ user bog'lash
 *   - `employee_org_departments` (M:N) — assignment'lar
 *
 * Funksiyalar:
 *   - parseOrgDepartmentIds(body)        — body'dan int[] olish + validate
 *   - validateOrgDepartmentsExist(ids)   — har bir id mavjudligini DB'da tekshirish
 *   - syncEmployeeOrgAssignments(...)    — assignment'larni replace qilish
 *   - ensureUserForEmployee(empId)       — user yaratish/topish (employee_id bilan)
 *   - hasAnyOrgAssignment(userId)        — oylik check uchun
 */
import { BadRequestException } from '@nestjs/common';
import { rawSql } from '@shared/db';
import { sql, type SQL } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { dbRows } from '../hr/common/db-rows';

/**
 * Body'dan `orgDepartmentIds` ni number[] sifatida ajratish.
 * Frontend yuborishi mumkin: [1, 2, 3] | ["1","2"] | undefined.
 */
export function parseOrgDepartmentIds(body: Record<string, unknown>): number[] {
  const raw = body['orgDepartmentIds'] ?? body['org_department_ids'];
  if (!Array.isArray(raw)) return [];
  return raw
    .map((v) => parseInt(String(v), 10))
    .filter((n) => Number.isFinite(n) && n > 0);
}

/**
 * Har bir org_department_id ning DB'da is_active=true bilan mavjudligini tekshiradi.
 * Mavjud bo'lmagan id bo'lsa — BadRequestException (foydali xato xabar).
 */
export async function validateOrgDepartmentsExist(orgIds: number[]): Promise<void> {
  if (orgIds.length === 0) {
    throw new BadRequestException(
      "Xodim kamida bitta tashkiliy bo'limga (org_department) biriktirilishi shart",
    );
  }
  // Parameterized IN list using sql.join — no sql.raw() with user-controlled values
  const paramList = sql.join(orgIds.map(id => sql`${id}`), sql`, `);
  const result = await rawSql(sql`
    SELECT id FROM org_departments
    WHERE id IN (${paramList}) AND is_active = true
  `);
  const found = new Set(dbRows(result).map((r) => Number(r['id'])));
  const missing = orgIds.filter((id) => !found.has(id));
  if (missing.length > 0) {
    throw new BadRequestException(
      `Tashkiliy bo'lim ID(lar) topilmadi yoki nofaol: ${missing.join(', ')}`,
    );
  }
}

/**
 * `employees.id` uchun `users` yozuvini topadi yoki yaratadi.
 *
 * SECURITY: PA-S2 — yangi yaratilgan user uchun bcrypt-format'ga to'g'ri kelmaydigan
 * locked placeholder hash o'rnatiladi (`!` prefix + random hex). Hech kim bu hash
 * bilan kira olmaydi — admin parolni alohida o'rnatishi kerak. Eski hardcoded
 * fixture bcrypt hash CVE-risk sifatida olib tashlandi.
 *
 * @param tx - drizzle transaction (yoki global db)
 * @param employeeId - employees.id
 * @param firstName, lastName, email, phone, hireDate, positionId
 * @returns user.id (number)
 */
interface UserCreationData {
  employeeId: number;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  hireDate: string | null;
  positionId: number | null;
  departmentId: number | null;
}

/**
 * Bcrypt-format-incompatible locked placeholder. Bcrypt verifies expect the
 * prefix `$2[abxy]$` — anything starting with `!` will never match any input.
 * The random suffix prevents two users sharing the same string in audit logs.
 */
function lockedPlaceholderHash(): string {
  return '!' + randomBytes(20).toString('hex');
}

/**
 * Maps positions.rbac_tier (owner/executive/manager/specialist/operator/standard,
 * 100% populated per live DB) to the users.role vocabulary this call site already
 * produced (super_admin/director/manager/employee) -- preserves the exact same
 * output contract, just derives it from the real semantic column instead of a
 * numeric id-range guess. Full role-enum consolidation is a separate, larger
 * effort (MAGIC-NUMBERS-AUDIT item #8).
 */
export async function resolveRoleFromPositionRbacTier(
  exec: (q: SQL) => Promise<unknown>,
  positionId: number | null,
): Promise<string> {
  if (positionId === null) return 'employee';
  const rows = dbRows(await exec(sql`SELECT rbac_tier FROM positions WHERE id = ${positionId} LIMIT 1`));
  const tier = String(rows[0]?.['rbac_tier'] ?? '');
  switch (tier) {
    case 'owner':      return 'super_admin';
    case 'executive':  return 'director';
    case 'manager':    return 'manager';
    default:           return 'employee'; // specialist / operator / standard / unknown position id
  }
}

export async function ensureUserForEmployee(
  tx: { execute: (q: SQL) => Promise<unknown> } | null,
  data: UserCreationData,
): Promise<number> {
  const exec = tx
    ? (q: SQL) => tx.execute(q)
    : (q: SQL) => rawSql(q);

  // Mavjud user'ni tekshirish
  const existing = await exec(sql`
    SELECT id FROM users WHERE employee_id = ${data.employeeId} LIMIT 1
  `);
  const existingRow = dbRows(existing)[0];
  if (existingRow) return Number(existingRow['id']);

  // Yangi user yaratish
  const username =
    data.email && data.email.includes('@')
      ? data.email.split('@')[0].toLowerCase()
      : `emp_${data.employeeId}`;
  const fullName = `${data.firstName} ${data.lastName}`.trim();
  // M7 (2026-07-05): was a raw positionId-range guess (<=2 super_admin, <=5
  // director, <=20 manager) -- fragile (silently wrong if IDs are ever
  // reassigned/reordered) AND already demonstrably incorrect for real rows,
  // e.g. position #22 "Savdo Menejeri" has positions.rbac_tier='manager' but
  // id=22 > 20, so the old logic assigned it 'employee'. Now looks up the
  // position's own rbac_tier column (100% populated, 96/96 rows) instead of
  // guessing from the numeric id.
  const role = await resolveRoleFromPositionRbacTier(exec, data.positionId);

  const lockedHash = lockedPlaceholderHash();
  const inserted = await exec(sql`
    INSERT INTO users (
      username, email, password_hash, first_name, last_name,
      full_name, employee_id, role, status, is_active,
      department_id, position_id, phone, hire_date,
      created_at, updated_at
    ) VALUES (
      ${username}, ${data.email}, ${lockedHash},
      ${data.firstName}, ${data.lastName},
      ${fullName}, ${data.employeeId}, ${role}, 'active', true,
      ${data.departmentId}, ${data.positionId}, ${data.phone}, ${data.hireDate},
      NOW(), NOW()
    )
    RETURNING id
  `);
  const insertedRow = dbRows(inserted)[0];
  // WHY: callers wrap this helper in safeCall; BadRequestException maps to BAD_REQUEST cleanly.
  if (!insertedRow) throw new BadRequestException('User yaratish bajarilmadi');
  return Number(insertedRow['id']);
}

/**
 * Xodim'ning barcha org assignment'larini berilgan ro'yxat bilan almashtiradi (DELETE + INSERT).
 * Birinchi orgId — `is_primary = true`.
 */
export async function syncEmployeeOrgAssignments(
  tx: { execute: (q: SQL) => Promise<unknown> } | null,
  userId: number,
  orgIds: number[],
): Promise<void> {
  const exec = tx
    ? (q: SQL) => tx.execute(q)
    : (q: SQL) => rawSql(q);

  // Eskilarni o'chirish
  await exec(sql`DELETE FROM employee_org_departments WHERE user_id = ${userId}`);

  // Yangilarni qo'shish
  const safeIds = Array.isArray(orgIds) ? orgIds : [];
  for (let i = 0; i < safeIds.length; i++) {
    const orgId = safeIds[i];
    const isPrimary = i === 0;
    await exec(sql`
      INSERT INTO employee_org_departments (user_id, org_department_id, is_primary, assigned_at)
      VALUES (${userId}, ${orgId}, ${isPrimary}, NOW())
    `);
  }
}

/**
 * Foydalanuvchi (xodim) hech bir org_department'ga biriktirilmaganmi?
 * Oylik kirituvchida tekshirish uchun.
 */
export async function hasAnyOrgAssignment(userId: number): Promise<boolean> {
  const r = await rawSql(sql`
    SELECT 1 FROM employee_org_departments
    WHERE user_id = ${userId} LIMIT 1
  `);
  return dbRows(r).length > 0;
}

/**
 * `employees.id` (employee) bo'yicha bog'liq `users.id` ni topadi.
 * Agar yo'q bo'lsa — null.
 */
export async function findUserIdByEmployee(employeeId: number): Promise<number | null> {
  const r = await rawSql(sql`
    SELECT id FROM users WHERE employee_id = ${employeeId} AND deleted_at IS NULL LIMIT 1
  `);
  const row = dbRows(r)[0];
  return row ? Number(row['id']) : null;
}
