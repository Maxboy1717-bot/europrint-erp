import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { castTo } from '@common/db-rows';
import { db } from '@shared/db';
import { eq, and, sql, or } from 'drizzle-orm';
import { crmContacts, crmCompanies } from '@shared/db';
import { safeCall, Result } from '@common/result';

type Row = Record<string, unknown>;

@Injectable()
export class CrmContactsRepository {
  async listContacts(search: string | undefined, companyId: number | null, lim: number, off: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const pat = search ? `%${search}%` : null;
      return db.select({
        id:           crmContacts.id,
        company_id:   crmContacts.company_id,
        first_name:   crmContacts.first_name,
        last_name:    crmContacts.last_name,
        email:        crmContacts.email,
        phone:        crmContacts.phone,
        position:     crmContacts.position,
        notes:        crmContacts.notes,
        created_at:   crmContacts.created_at,
        updated_at:   crmContacts.updated_at,
        company_name: crmCompanies.title,
      })
        .from(crmContacts)
        .leftJoin(crmCompanies, eq(crmCompanies.id, crmContacts.company_id))
        .where(sql`
          (${pat}::text IS NULL OR ${crmContacts.first_name} ILIKE ${pat} OR ${crmContacts.last_name} ILIKE ${pat} OR ${crmContacts.email} ILIKE ${pat} OR ${crmContacts.phone} ILIKE ${pat}) AND
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
        email:        crmContacts.email,
        phone:        crmContacts.phone,
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
      return db.select({
        id:         crmContacts.id,
        first_name: crmContacts.first_name,
        last_name:  crmContacts.last_name,
        email:      crmContacts.email,
        phone:      crmContacts.phone,
      })
        .from(crmContacts)
        .where(sql`(${email ?? null}::text IS NOT NULL AND ${crmContacts.email} = ${email ?? null}) OR (${phone ?? null}::text IS NOT NULL AND ${crmContacts.phone} = ${phone ?? null})`)
        .limit(5).then(r => castTo<Row[]>(r));
      }, 'DB_ERROR');
  }

  async create(first_name: unknown, last_name: unknown, email: unknown, phone: unknown, company_id: unknown, position: unknown, notes: unknown): Promise<Result<Row>> {
    return safeCall(async () => {
      const payload: Omit<typeof crmContacts.$inferInsert, 'id'> = {
        first_name:  first_name as string,
        last_name:   (last_name as string) ?? undefined,
        email:       (email as string) ?? undefined,
        phone:       (phone as string) ?? undefined,
        company_id:  (company_id as number) ?? undefined,
        position:    (position as string) ?? undefined,
        notes:       (notes as string) ?? undefined,
      };
      const rows = await db.insert(crmContacts).values(payload as typeof crmContacts.$inferInsert).returning();
      return (rows[0] ?? {}) as Row;
      }, 'DB_ERROR');
  }

  async update(cid: number, first_name: unknown, last_name: unknown, email: unknown, phone: unknown, company_id: unknown, position: unknown, notes: unknown): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await db.update(crmContacts).set({
        first_name: sql`COALESCE(${first_name ?? null}, ${crmContacts.first_name})`,
        last_name:  sql`COALESCE(${last_name ?? null}, ${crmContacts.last_name})`,
        email:      sql`COALESCE(${email ?? null}, ${crmContacts.email})`,
        phone:      sql`COALESCE(${phone ?? null}, ${crmContacts.phone})`,
        company_id: sql`COALESCE(${company_id ?? null}, ${crmContacts.company_id})`,
        position:   sql`COALESCE(${position ?? null}, ${crmContacts.position})`,
        notes:      sql`COALESCE(${notes ?? null}, ${crmContacts.notes})`,
        updated_at: _time.now(),
      }).where(eq(crmContacts.id, cid)).returning();
      return (rows[0] ?? null) as Row | null;
      }, 'DB_ERROR');
  }

  async remove(cid: number): Promise<void> {
    await db.delete(crmContacts).where(eq(crmContacts.id, cid));
  }
}
