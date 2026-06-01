/**
 * @module crm-leads-ops.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 * @layer Infrastructure (CRM)
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { castTo } from '@common/db-rows';
import { db } from '@shared/db';
import { eq, sql } from 'drizzle-orm';
import { crmLeads, crm_lead_stages, crm_activities, crmDeals } from '@shared/db';
import { safeCall, Result } from '@common/result';
import type { ICrmLeadsOpsRepo } from '../../domain/repositories/i-crm-leads-ops.repo';

type Row = Record<string, unknown>;

@Injectable()
export class CrmLeadsOpsRepository implements ICrmLeadsOpsRepo {
  async updateLead(lid: number, body: Row): Promise<Result<Row[]>> {
    return safeCall(async () => {
      // company_id intentionally not written — live crm_leads has no company FK
      // (lead→company link is created at conversion into sd_customers).
      const { first_name, last_name, email, phone, source, notes, status } = body;
      const contactName = [first_name, last_name].filter(Boolean).join(' ') || null;
      const rows = await db.update(crmLeads).set({
        contact_name:  sql`COALESCE(${contactName ?? null}, ${crmLeads.contact_name})`,
        contact_email: sql`COALESCE(${email ?? null}, ${crmLeads.contact_email})`,
        contact_phone: sql`COALESCE(${phone ?? null}, ${crmLeads.contact_phone})`,
        source:        sql`COALESCE(${source ?? null}, ${crmLeads.source})`,
        notes:         sql`COALESCE(${notes ?? null}, ${crmLeads.notes})`,
        status_description: sql`COALESCE(${status ?? null}, ${crmLeads.status_description})`,
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

  async updateLeadStage(lid: number, _stageId: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      // crm_leads has no stage_id column; touch updated_at until column is added
      const rows = await db.update(crmLeads).set({
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
      // Live crm_deals: title (not name), forecast_amount (alias expected_amount),
      // stage_semantic_id (alias status), integer company_id; lead_id → metadata jsonb.
      const payload: Omit<typeof crmDeals.$inferInsert, 'id'> = {
        title:           name,
        company_id:      companyId != null ? Number(companyId) : null,
        expected_amount: String(expectedAmount),
        status:          'open',
        metadata:        { lead_id: lid },
      };
      const rows = await db.insert(crmDeals).values(payload as typeof crmDeals.$inferInsert).returning();
      return (rows[0] ?? {}) as Row;
      }, 'DB_ERROR');
  }

  async convertLead(lid: number): Promise<void> {
    // Raw SQL: live crm_leads has status_description (NOT a `status` column — that
    // exists only in the Drizzle def = drift). db.update(crmLeads).set({status})
    // would target a phantom column and throw.
    await db.execute(sql`
      UPDATE crm_leads SET status_description = 'converted', date_modify = NOW()
      WHERE id = ${lid}
    `);

    // Promote the won lead into the canonical customer base (sd_customers) so a won
    // CRM lead becomes a customer that orders/quotes can attach to (owner's flow:
    // "lead yutilsa → sd_customers'ga konversiya"). Raw SQL avoids the crm_leads
    // phantom-status drift. Idempotent: skip if a customer with this name exists.
    // sd_customers live constraints: segment ∈ {vip,regular,new,potential}; status ∈ {active,inactive}.
    const leadRes = await db.execute(sql`
      SELECT contact_name, full_name, name, contact_phone, contact_email
      FROM crm_leads WHERE id = ${lid} LIMIT 1
    `);
    const lead = (leadRes.rows?.[0] ?? null) as Record<string, unknown> | null;
    if (!lead) return;

    const custName = String(
      lead['contact_name'] ?? lead['full_name'] ?? lead['name'] ?? '',
    ).trim() || `Lead #${lid}`;
    const phone = lead['contact_phone'] ?? null;
    const email = lead['contact_email'] ?? null;

    await db.execute(sql`
      INSERT INTO sd_customers (name, phone, email, segment, status, is_blocked, notes)
      SELECT ${custName}, ${phone}, ${email}, 'new', 'active', false,
             ${'CRM lid #' + lid + ' dan konvertatsiya qilindi'}
      WHERE NOT EXISTS (
        SELECT 1 FROM sd_customers WHERE name = ${custName}
      )
    `);
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
