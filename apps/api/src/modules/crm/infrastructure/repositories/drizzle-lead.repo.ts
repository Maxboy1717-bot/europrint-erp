/**
 * @module drizzle-lead.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { castTo } from '@common/db-rows';
import { db } from '@shared/db';
import { eq, isNull, sql } from 'drizzle-orm';
import { crmLeads } from '@shared/db';
import { Lead } from '../../domain/aggregates/lead.aggregate';
import { ILeadRepository } from '../../domain/repositories/i-lead.repo';
import { LeadStatus } from '../../domain/value-objects/lead-status.vo';
import { AIScore } from '../../domain/value-objects/ai-score.vo';
import { Email } from '@shared/domain/value-objects/email.vo';
import { PhoneNumber } from '@shared/domain/value-objects/phone-number.vo';

type DbRow = Record<string, unknown>;

@Injectable()
export class DrizzleLeadRepository implements ILeadRepository {
  async save(lead: Lead): Promise<{ ok: true; data: Lead }> {
    const now = _time.now();
    const contactName = `${lead.getFirstName()} ${lead.getLastName()}`.trim();
    // CRM-1: compat stub (@shared/db) uses snake_case accessor names.
    // title exposed in stub (ADD-ONLY, 2026-05-27) so NOT NULL constraint is satisfied.
    const payload = {
      title:              contactName || 'Yangi lid',
      // Live crm_leads has no customer_id (no company FK at lead stage — linked at
      // conversion → sd_customers). Lead lifecycle code goes to status_description
      // (consistent with the CRM ops repos), Bitrix state id to status_id.
      status_description: lead.getStatus(),
      status_id:          String(lead.getStatus()).toUpperCase(),
      contact_email:      lead.getEmail?.() ?? undefined,
      contact_phone:      lead.getPhone?.() ?? undefined,
      contact_name:       contactName,
      source:             lead.getSource?.() ?? undefined,
      notes:              lead.getNotes?.() ?? undefined,
      manager_id:         lead.getAssignedTo?.() ?? lead.getCreatedBy?.() ?? undefined,
      created_at:         now,
      updated_at:         now,
    } as unknown as typeof crmLeads.$inferInsert;
    await db.insert(crmLeads).values(payload)
      .onConflictDoUpdate({
        target: crmLeads.id,
        set: {
          status_id:          payload.status_id,
          status_description: payload.status_description,
          contact_email:      payload.contact_email,
          contact_phone:      payload.contact_phone,
          contact_name:       payload.contact_name,
          source:             payload.source,
          notes:              payload.notes,
          manager_id:         payload.manager_id,
          updated_at:         now,
        },
      });
    return { ok: true as const, data: lead };
  }

  async findById(id: number): Promise<{ ok: true; data: Lead | null }> {
    const rows = await db.select().from(crmLeads).where(eq(crmLeads.id, id)).limit(1);
    if (!rows[0]) return { ok: true as const, data: null };
    return { ok: true as const, data: this.toDomain(castTo<DbRow>(rows[0])) };
  }

  async findByEmail(email: string): Promise<{ ok: true; data: Lead | null }> {
    const rows = await db.select().from(crmLeads).where(eq(crmLeads.contact_email, email)).limit(1);
    if (!rows[0]) return { ok: true as const, data: null };
    return { ok: true as const, data: this.toDomain(castTo<DbRow>(rows[0])) };
  }

  async findByCompanyId(_companyId: number, limit: number, offset: number): Promise<{ ok: true; data: Lead[] }> {
    try {
      // Live crm_leads (Bitrix) has no company FK — a lead is not yet linked to a
      // company (that link is created at conversion → sd_customers). Return recent
      // leads unfiltered rather than filtering on a non-existent column.
      const rows = await db.select().from(crmLeads)
        .where(isNull(crmLeads.deleted_at))
        .limit(limit).offset(offset);
      return { ok: true as const, data: rows.map((r) => this.toDomain(castTo<DbRow>(r))) };
    } catch {
      return { ok: true as const, data: [] };
    }
  }

  async findByStatus(status: string, limit: number, offset: number): Promise<{ ok: true; data: Lead[] }> {
    try {
      const rows = await db.select().from(crmLeads)
        .where(eq(crmLeads.status_description, status))
        .limit(limit).offset(offset);
      return { ok: true as const, data: rows.map((r) => this.toDomain(castTo<DbRow>(r))) };
    } catch {
      return { ok: true as const, data: [] };
    }
  }

  async update(lead: Lead): Promise<{ ok: true; data: void }> {
    await db.update(crmLeads).set({
      status_description: lead.getStatus(),
      status_id:     String(lead.getStatus()).toUpperCase(),
      contact_email: lead.getEmail?.() ?? undefined,
      contact_phone: lead.getPhone?.() ?? undefined,
      contact_name:  `${lead.getFirstName()} ${lead.getLastName()}`.trim(),
      source:        lead.getSource?.() ?? undefined,
      notes:         lead.getNotes?.() ?? undefined,
      manager_id:    lead.getAssignedTo?.() ?? undefined,
      updated_at:    _time.now(),
    } as unknown as Partial<typeof crmLeads.$inferInsert>).where(eq(crmLeads.id, lead.getId()));
    return { ok: true as const, data: undefined };
  }

  async delete(id: number): Promise<{ ok: true; data: void }> {
    await db.update(crmLeads).set({ deleted_at: _time.now() } as unknown as Partial<typeof crmLeads.$inferInsert>).where(eq(crmLeads.id, id));
    return { ok: true as const, data: undefined };
  }

  async count(): Promise<{ ok: true; data: number }> {
    const rows = await db.select({ count: sql<string>`COUNT(*)` }).from(crmLeads);
    return { ok: true as const, data: Number(rows[0]?.count ?? 0) };
  }

  private parseLeadStatus(raw: string): LeadStatus {
    const r = LeadStatus.create(raw);
    if (r.ok && r.data) return r.data;
    const fallback = LeadStatus.create('new');
    if (fallback.ok && fallback.data) return fallback.data;
    throw new InternalServerErrorException(`Cannot create LeadStatus from: ${raw}`);
  }

  private parseAiScore(raw: number): AIScore {
    const r = AIScore.create(Math.max(0, Math.min(100, raw)));
    if (r.ok && r.data) return r.data;
    const fallback = AIScore.create(0);
    if (fallback.ok && fallback.data) return fallback.data;
    throw new InternalServerErrorException(`Cannot create AIScore from: ${raw}`);
  }

  private toDomain(row: DbRow): Lead {
    // CRM-1: DB columns use legacy names (contact_name, contact_email, contact_phone,
    // manager_id). Modern columns (name, emails, assignedById) also exist but save()
    // writes legacy names — read from those to round-trip correctly.
    const contactName = String(row['contact_name'] ?? row['name'] ?? '');
    const nameParts = contactName.split(' ');
    // status_description now holds the lifecycle code (not ai_score). ai_score has no
    // dedicated live column → defaults to 0 (it was never authoritatively persisted).
    const aiScore = Number(row['ai_score'] ?? 0);
    return new Lead({
      id:         Number(row['id']),
      companyId:  Number(row['customer_id'] ?? row['company_id'] ?? 0),
      firstName:  nameParts[0] ?? '',
      lastName:   nameParts.slice(1).join(' '),
      email:      Email.fromRaw(String(row['contact_email'] ?? row['email'] ?? '')),
      phone:      PhoneNumber.fromRaw(String(row['contact_phone'] ?? row['phone'] ?? '')),
      status:     this.parseLeadStatus(String(row['status_description'] ?? row['status_id'] ?? 'new').toLowerCase()),
      aiScore:    this.parseAiScore(aiScore),
      createdBy:  Number(row['created_by'] ?? 0),
      assignedTo: (row['manager_id'] ?? row['assigned_by_id'] ?? row['assignedById']) ? Number(row['manager_id'] ?? row['assigned_by_id'] ?? row['assignedById']) : undefined,
      source:     String(row['source'] ?? row['sourceId'] ?? ''),
      notes:      row['notes'] ? String(row['notes']) : undefined,
      createdAt:  new Date(String(row['created_at'] ?? _time.now())),
      updatedAt:  new Date(String(row['updated_at'] ?? _time.now())),
    });
  }
}
