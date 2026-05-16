/**
 * @module drizzle-lead.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { castTo } from '@common/db-rows';
import { db } from '@shared/db';
import { eq, sql } from 'drizzle-orm';
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
    const payload = {
      customer_id:   lead.getCompanyId(),
      status:        lead.getStatus(),
      contact_email: lead.getEmail?.() ?? undefined,
      contact_phone: lead.getPhone?.() ?? undefined,
      contact_name:  `${lead.getFirstName()} ${lead.getLastName()}`.trim(),
      source:        lead.getSource?.() ?? undefined,
      notes:         lead.getNotes?.() ?? undefined,
      manager_id:    lead.getAssignedTo?.() ?? undefined,
    } as typeof crmLeads.$inferInsert;
    await db.insert(crmLeads).values(payload)
      .onConflictDoUpdate({
        target: crmLeads.id,
        set: {
          status:        payload.status,
          contact_email: payload.contact_email,
          contact_phone: payload.contact_phone,
          contact_name:  payload.contact_name,
          source:        payload.source,
          notes:         payload.notes,
          manager_id:    payload.manager_id,
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

  async findByCompanyId(companyId: number, limit: number, offset: number): Promise<{ ok: true; data: Lead[] }> {
    try {
      const rows = await db.select().from(crmLeads)
        .where(companyId != null ? eq(crmLeads.customer_id, companyId) : sql`true`)
        .limit(limit).offset(offset);
      return { ok: true as const, data: rows.map((r) => this.toDomain(castTo<DbRow>(r))) };
    } catch {
      return { ok: true as const, data: [] };
    }
  }

  async findByStatus(status: string, limit: number, offset: number): Promise<{ ok: true; data: Lead[] }> {
    try {
      const rows = await db.select().from(crmLeads)
        .where(eq(crmLeads.status, status))
        .limit(limit).offset(offset);
      return { ok: true as const, data: rows.map((r) => this.toDomain(castTo<DbRow>(r))) };
    } catch {
      return { ok: true as const, data: [] };
    }
  }

  async update(lead: Lead): Promise<{ ok: true; data: void }> {
    await db.update(crmLeads).set({
      status:        lead.getStatus(),
      contact_email: lead.getEmail?.() ?? undefined,
      contact_phone: lead.getPhone?.() ?? undefined,
      contact_name:  `${lead.getFirstName()} ${lead.getLastName()}`.trim(),
      source:        lead.getSource?.() ?? undefined,
      notes:         lead.getNotes?.() ?? undefined,
      manager_id:    lead.getAssignedTo?.() ?? undefined,
      updated_at:    _time.now(),
    }).where(eq(crmLeads.id, lead.getId()));
    return { ok: true as const, data: undefined };
  }

  async delete(id: number): Promise<{ ok: true; data: void }> {
    await db.update(crmLeads).set({ deleted_at: _time.now() }).where(eq(crmLeads.id, id));
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
    return new Lead({
      id:         Number(row['id']),
      companyId:  Number(row['customer_id']),
      firstName:  String(row['first_name'] ?? ''),
      lastName:   String(row['last_name'] ?? ''),
      email:      Email.fromRaw(String(row['email'] ?? '')),
      phone:      PhoneNumber.fromRaw(String(row['phone'] ?? '')),
      status:     this.parseLeadStatus(String(row['status'] ?? 'new')),
      aiScore:    this.parseAiScore(Number(row['ai_score'] ?? 0)),
      createdBy:  Number(row['created_by']),
      assignedTo: row['assigned_to'] ? Number(row['assigned_to']) : undefined,
      source:     String(row['source'] ?? ''),
      notes:      row['notes'] ? String(row['notes']) : undefined,
      createdAt:  new Date(String(row['created_at'] ?? _time.now())),
      updatedAt:  new Date(String(row['updated_at'] ?? _time.now())),
    });
  }
}
