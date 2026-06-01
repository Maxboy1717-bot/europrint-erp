/**
 * @module crm-contacts.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 * @layer Infrastructure (CRM)
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { castTo } from '@common/db-rows';
import { db } from '@shared/db';
import { eq, and, sql, or } from 'drizzle-orm';
import { crmContacts, crmCompanies } from '@shared/db';
import { safeCall, Result } from '@common/result';
import type { ICrmContactsAppRepo } from '../../domain/repositories/i-crm-contacts-app.repo';

type Row = Record<string, unknown>;

// Write-path projection: flatten the live emails/phones jsonb arrays back to scalar
// email/phone so create/update responses match the read endpoints' shape.
const CONTACT_RETURNING = {
  id:         crmContacts.id,
  company_id: crmContacts.company_id,
  first_name: crmContacts.first_name,
  last_name:  crmContacts.last_name,
  email:      sql<string | null>`(${crmContacts.emails} -> 0 ->> 'value')`,
  phone:      sql<string | null>`(${crmContacts.phones} -> 0 ->> 'value')`,
  position:   crmContacts.position,
  notes:      crmContacts.notes,
  created_at: crmContacts.created_at,
  updated_at: crmContacts.updated_at,
};

@Injectable()
export class CrmContactsRepository implements ICrmContactsAppRepo {
  async listContacts(search: string | undefined, companyId: number | null, lim: number, off: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const pat = search ? `%${search}%` : null;
      // email/phone live as jsonb arrays (emails/phones); flatten the first element's value
      // for the scalar API shape, and search the jsonb-as-text for matches.
      return db.select({
        id:           crmContacts.id,
        company_id:   crmContacts.company_id,
        first_name:   crmContacts.first_name,
        last_name:    crmContacts.last_name,
        email:        sql<string | null>`(${crmContacts.emails} -> 0 ->> 'value')`,
        phone:        sql<string | null>`(${crmContacts.phones} -> 0 ->> 'value')`,
        position:     crmContacts.position,
        notes:        crmContacts.notes,
        created_at:   crmContacts.created_at,
        updated_at:   crmContacts.updated_at,
        company_name: crmCompanies.title,
      })
        .from(crmContacts)
        .leftJoin(crmCompanies, eq(crmCompanies.id, crmContacts.company_id))
        .where(sql`
          (${pat}::text IS NULL OR ${crmContacts.first_name} ILIKE ${pat} OR ${crmContacts.last_name} ILIKE ${pat} OR (${crmContacts.emails})::text ILIKE ${pat} OR (${crmContacts.phones})::text ILIKE ${pat}) AND
          (${companyId}::int IS NULL OR ${crmContacts.company_id} = ${companyId})
        `)
        .orderBy(sql`${crmContacts.created_at} DESC`)
        .limit(lim)
        .offset(off).then(r => castTo<Row[]>(r));
      }, 'DB_ERROR');
  }

  async findById(cid: number): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await db.select({
        id:           crmContacts.id,
        company_id:   crmContacts.company_id,
        first_name:   crmContacts.first_name,
        last_name:    crmContacts.last_name,
        email:        sql<string | null>`(${crmContacts.emails} -> 0 ->> 'value')`,
        phone:        sql<string | null>`(${crmContacts.phones} -> 0 ->> 'value')`,
        position:     crmContacts.position,
        notes:        crmContacts.notes,
        created_at:   crmContacts.created_at,
        company_name: crmCompanies.title,
      })
        .from(crmContacts)
        .leftJoin(crmCompanies, eq(crmCompanies.id, crmContacts.company_id))
        .where(eq(crmContacts.id, cid));
      return (rows[0] ?? null) as Row | null;
      }, 'DB_ERROR');
  }

  async checkDuplicates(email?: string, phone?: string): Promise<Result<Row[]>> {
    return safeCall(async () => {
      // emails/phones are jsonb arrays; match by jsonb containment (@>) on {value}.
      return db.select({
        id:         crmContacts.id,
        first_name: crmContacts.first_name,
        last_name:  crmContacts.last_name,
        email:      sql<string | null>`(${crmContacts.emails} -> 0 ->> 'value')`,
        phone:      sql<string | null>`(${crmContacts.phones} -> 0 ->> 'value')`,
      })
        .from(crmContacts)
        .where(sql`(${email ?? null}::text IS NOT NULL AND ${crmContacts.emails} @> ${email ? JSON.stringify([{ value: email }]) : '[]'}::jsonb) OR (${phone ?? null}::text IS NOT NULL AND ${crmContacts.phones} @> ${phone ? JSON.stringify([{ value: phone }]) : '[]'}::jsonb)`)
        .limit(5).then(r => castTo<Row[]>(r));
      }, 'DB_ERROR');
  }

  async create(first_name: unknown, last_name: unknown, email: unknown, phone: unknown, company_id: unknown, position: unknown, notes: unknown): Promise<Result<Row>> {
    return safeCall(async () => {
      // email/phone wrapped into the live jsonb arrays (emails/phones).
      const payload: Omit<typeof crmContacts.$inferInsert, 'id'> = {
        first_name:  first_name as string,
        last_name:   (last_name as string) ?? undefined,
        emails:      email != null ? [{ value: String(email) }] : [],
        phones:      phone != null ? [{ value: String(phone) }] : [],
        company_id:  (company_id as number) ?? undefined,
        position:    (position as string) ?? undefined,
        notes:       (notes as string) ?? undefined,
      };
      const rows = await db.insert(crmContacts).values(payload as typeof crmContacts.$inferInsert).returning(CONTACT_RETURNING);
      return (rows[0] ?? {}) as Row;
      }, 'DB_ERROR');
  }

  async update(cid: number, first_name: unknown, last_name: unknown, email: unknown, phone: unknown, company_id: unknown, position: unknown, notes: unknown): Promise<Result<Row | null>> {
    return safeCall(async () => {
      // email/phone overwrite the jsonb arrays only when provided (undefined → Drizzle
      // omits the column → existing value preserved, matching the COALESCE intent).
      const rows = await db.update(crmContacts).set({
        first_name: sql`COALESCE(${first_name ?? null}, ${crmContacts.first_name})`,
        last_name:  sql`COALESCE(${last_name ?? null}, ${crmContacts.last_name})`,
        emails:     email != null ? [{ value: String(email) }] : undefined,
        phones:     phone != null ? [{ value: String(phone) }] : undefined,
        company_id: sql`COALESCE(${company_id ?? null}, ${crmContacts.company_id})`,
        position:   sql`COALESCE(${position ?? null}, ${crmContacts.position})`,
        notes:      sql`COALESCE(${notes ?? null}, ${crmContacts.notes})`,
        updated_at: _time.now(),
      }).where(eq(crmContacts.id, cid)).returning(CONTACT_RETURNING);
      return (rows[0] ?? null) as Row | null;
      }, 'DB_ERROR');
  }

  async remove(cid: number): Promise<void> {
    await db.delete(crmContacts).where(eq(crmContacts.id, cid));
  }
}
