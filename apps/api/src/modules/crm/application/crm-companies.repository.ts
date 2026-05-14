/**
 * @module crm-companies.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { castTo } from '@common/db-rows';
import { db } from '@shared/db';
import { and, eq, sql } from 'drizzle-orm';
import { crmCompanies, crmContacts, crmDeals, crm_lead_stages } from '@shared/db';
import { safeCall, Result } from '@common/result';

type Row = Record<string, unknown>;

@Injectable()
export class CrmCompaniesRepository {
  async listCompanies(pat: string | null, lim: number, off: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      return db.select({
        id:            crmCompanies.id,
        title:         crmCompanies.title,
        status:        crmCompanies.status,
        industry:      crmCompanies.industry,
        website:       crmCompanies.website,
        inn:           crmCompanies.inn,
        address:       crmCompanies.address,
        credit_limit:  crmCompanies.credit_limit,
        created_at:    crmCompanies.created_at,
        contact_count: sql<number>`COUNT(${crmContacts.id})::int`,
      })
        .from(crmCompanies)
        .leftJoin(crmContacts, eq(crmContacts.company_id, crmCompanies.id))
        .where(sql`(${pat}::text IS NULL OR ${crmCompanies.title} ILIKE ${pat} OR ${crmCompanies.inn} ILIKE ${pat})`)
        .groupBy(crmCompanies.id)
        .orderBy(sql`${crmCompanies.created_at} DESC`)
        .limit(lim)
        .offset(off).then(r => castTo<Row[]>(r));
      }, 'DB_ERROR');
  }

  async getCompany(cid: number): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await db.select().from(crmCompanies).where(eq(crmCompanies.id, cid));
      return (rows[0] ?? null) as Row | null;
      }, 'DB_ERROR');
  }

  async getCompanyContacts(cid: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      return db.select().from(crmContacts)
        .where(eq(crmContacts.company_id, cid))
        .orderBy(crmContacts.first_name).then(r => castTo<Row[]>(r));
      }, 'DB_ERROR');
  }

  async getCompanyDeals(cid: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      return db.select().from(crmDeals)
        .where(sql`${crmDeals.company_id}::int = ${cid}`)
        .orderBy(sql`${crmDeals.created_at} DESC`).then(r => castTo<Row[]>(r));
      }, 'DB_ERROR');
  }

  async getCompanyCredit(cid: number): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await db.select({
        credit_limit: crmCompanies.credit_limit,
        used_credit:  crmCompanies.used_credit,
      }).from(crmCompanies).where(eq(crmCompanies.id, cid));
      return (rows[0] ?? null) as Row | null;
      }, 'DB_ERROR');
  }

  async checkDuplicates(name?: string, inn?: string): Promise<Result<unknown[]>> {
    return safeCall(async () => {
      return db.select({ id: crmCompanies.id, title: crmCompanies.title, inn: crmCompanies.inn })
        .from(crmCompanies)
        .where(sql`(${name ?? null}::text IS NOT NULL AND ${crmCompanies.title} ILIKE ${name ?? null}) OR (${inn ?? null}::text IS NOT NULL AND ${crmCompanies.inn} = ${inn ?? null})`)
        .limit(5).then(r => castTo<unknown[]>(r));
      }, 'DB_ERROR');
  }

  async createCompany(body: Row): Promise<Result<Row>> {
    return safeCall(async () => {
      const { name, title, inn, industry, address, website, credit_limit } = body;
      const payload = {
        title:        (title ?? name) as string,
        inn:          (inn as string) ?? undefined,
        industry:     (industry as string) ?? undefined,
        address:      (address as string) ?? undefined,
        website:      (website as string) ?? undefined,
        credit_limit: credit_limit ? String(credit_limit) : '0',
      };
      const rows = await db.insert(crmCompanies).values(payload as typeof crmCompanies.$inferInsert).returning();
      return (rows[0] ?? {}) as Row;
      }, 'DB_ERROR');
  }

  async updateCompany(cid: number, body: Row): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const { name, title, inn, industry, address, website, credit_limit } = body;
      const rows = await db.update(crmCompanies).set({
        title:        sql`COALESCE(${(title ?? name) ?? null}, ${crmCompanies.title})`,
        inn:          sql`COALESCE(${inn ?? null}, ${crmCompanies.inn})`,
        industry:     sql`COALESCE(${industry ?? null}, ${crmCompanies.industry})`,
        address:      sql`COALESCE(${address ?? null}, ${crmCompanies.address})`,
        website:      sql`COALESCE(${website ?? null}, ${crmCompanies.website})`,
        credit_limit: sql`COALESCE(${credit_limit ?? null}, ${crmCompanies.credit_limit})`,
        updated_at:   _time.now(),
      }).where(eq(crmCompanies.id, cid)).returning();
      return (rows[0] ?? null) as Row | null;
      }, 'DB_ERROR');
  }

  async updateCreditLimit(cid: number, credit_limit: number): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await db.update(crmCompanies).set({
        credit_limit: String(credit_limit),
        updated_at:   _time.now(),
      }).where(eq(crmCompanies.id, cid)).returning({
        id:           crmCompanies.id,
        credit_limit: crmCompanies.credit_limit,
      });
      return (rows[0] ?? null) as Row | null;
      }, 'DB_ERROR');
  }

  async listLeadStages(): Promise<Result<Row[]>> {
    return safeCall(async () => {
      return db.select().from(crm_lead_stages)
        .orderBy(crm_lead_stages.order_index, crm_lead_stages.id).then(r => castTo<Row[]>(r));
      }, 'DB_ERROR');
  }

  async getLeadStage(sid: number): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await db.select().from(crm_lead_stages).where(eq(crm_lead_stages.id, sid));
      return (rows[0] ?? null) as Row | null;
      }, 'DB_ERROR');
  }

  async createLeadStage(name: string, color?: string, sort_order?: number): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.insert(crm_lead_stages).values({
        name,
        color:       color ?? '#6b7280',
        order_index: sort_order ?? 0,
      }).returning();
      return (rows[0] ?? {}) as Row;
      }, 'DB_ERROR');
  }

  async updateLeadStage(sid: number, body: Row): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await db.update(crm_lead_stages).set({
        name:        sql`COALESCE(${body.name ?? null}, ${crm_lead_stages.name})`,
        color:       sql`COALESCE(${body.color ?? null}, ${crm_lead_stages.color})`,
        order_index: sql`COALESCE(${body.sort_order ?? null}, ${crm_lead_stages.order_index})`,
      }).where(eq(crm_lead_stages.id, sid)).returning();
      return (rows[0] ?? null) as Row | null;
      }, 'DB_ERROR');
  }

  async deleteCompany(cid: number): Promise<void> {
    await db.delete(crmCompanies).where(eq(crmCompanies.id, cid));
  }

  async createCompanyContact(companyId: number, body: Row): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.insert(crmContacts).values({
        company_id: companyId,
        first_name: (body.firstName ?? body.first_name ?? 'Unknown') as string,
        last_name:  (body.lastName ?? body.last_name) as string | undefined,
        email:      (body.email) as string | undefined,
        phone:      (body.phone) as string | undefined,
        position:   (body.post ?? body.position) as string | undefined,
      } as unknown as typeof crmContacts.$inferInsert).returning();
      return (rows[0] ?? {}) as Row;
    }, 'DB_ERROR');
  }

  async deleteCompanyContact(companyId: number, contactId: number): Promise<void> {
    await db.delete(crmContacts)
      .where(and(eq(crmContacts.company_id, companyId), eq(crmContacts.id, contactId)));
  }
}
