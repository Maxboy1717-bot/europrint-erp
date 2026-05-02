import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { castTo } from '@common/db-rows';
import { db } from '@shared/db';
import { eq, sql } from 'drizzle-orm';
import { crmLeads, crm_lead_stages, crm_activities, crmDeals } from '@shared/db';
import { safeCall, Result } from '@common/result';

type Row = Record<string, unknown>;

@Injectable()
export class CrmLeadsOpsRepository {
  async updateLead(lid: number, body: Row): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const { first_name, last_name, email, phone, source, notes, status, company_id } = body;
      const rows = await db.update(crmLeads).set({
        first_name: sql`COALESCE(${first_name ?? null}, ${crmLeads.first_name})`,
        last_name:  sql`COALESCE(${last_name ?? null}, ${crmLeads.last_name})`,
        email:      sql`COALESCE(${email ?? null}, ${crmLeads.email})`,
        phone:      sql`COALESCE(${phone ?? null}, ${crmLeads.phone})`,
        source:     sql`COALESCE(${source ?? null}, ${crmLeads.source})`,
        notes:      sql`COALESCE(${notes ?? null}, ${crmLeads.notes})`,
        status:     sql`COALESCE(${status ?? null}, ${crmLeads.status})`,
        company_id: sql`COALESCE(${company_id ?? null}, ${crmLeads.company_id})`,
        updated_at: _time.now(),
      }).where(eq(crmLeads.id, lid)).returning();
      return castTo<Row[]>(rows);
      }, 'DB_ERROR');
  }

  async findStage(stageId: number): Promise<Result<boolean>> {
    return safeCall(async () => {
      const rows = await db.select({ id: crm_lead_stages.id })
        .from(crm_lead_stages).where(eq(crm_lead_stages.id, stageId)).limit(1);
      return rows.length > 0;
      }, 'DB_ERROR');
  }

  async updateLeadStage(lid: number, stageId: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await db.update(crmLeads).set({
        stage_id:   stageId,
        updated_at: _time.now(),
      }).where(eq(crmLeads.id, lid)).returning();
      return castTo<Row[]>(rows);
      }, 'DB_ERROR');
  }

  async insertActivityNote(lid: number, notes: string): Promise<void> {
    await db.insert(crm_activities).values({
      type:    'note',
      subject: 'Stage changed',
      lead_id:  lid,
      notes,
      status:  'completed',
    });
  }

  async findLead(lid: number): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await db.select().from(crmLeads).where(eq(crmLeads.id, lid));
      return (rows[0] ?? null) as Row | null;
      }, 'DB_ERROR');
  }

  async insertDeal(lid: number, name: string, companyId: unknown, expectedAmount: number): Promise<Result<Row>> {
    return safeCall(async () => {
      const payload: Omit<typeof crmDeals.$inferInsert, 'id'> = {
        name,
        lead_id:         lid,
        company_id:      companyId as string ?? undefined,
        expected_amount: String(expectedAmount),
        status:          'open',
      };
      const rows = await db.insert(crmDeals).values(payload as typeof crmDeals.$inferInsert).returning();
      return (rows[0] ?? {}) as Row;
      }, 'DB_ERROR');
  }

  async convertLead(lid: number): Promise<void> {
    await db.update(crmLeads).set({
      status:     'converted',
      updated_at: _time.now(),
    }).where(eq(crmLeads.id, lid));
  }

  async leadExists(lid: number): Promise<Result<boolean>> {
    return safeCall(async () => {
      const rows = await db.select({ id: crmLeads.id }).from(crmLeads)
        .where(eq(crmLeads.id, lid)).limit(1);
      return rows.length > 0;
      }, 'DB_ERROR');
  }

  async deleteLead(lid: number): Promise<void> {
    await db.delete(crmLeads).where(eq(crmLeads.id, lid));
  }
}
