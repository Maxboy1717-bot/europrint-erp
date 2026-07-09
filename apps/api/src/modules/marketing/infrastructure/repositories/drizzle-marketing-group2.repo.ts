/**
 * @module drizzle-marketing-group2.repo
 * @description Repository for Marketing GURUH 2 endpoints:
 *   blog, budget, calendar, competitors, lead-contacts.
 *   Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Logger } from '@nestjs/common';
import { and, eq, gte, lte, desc, sql } from 'drizzle-orm';
import { db } from '@shared/db';
import { Ok, Err, Result } from '@common/result';
import {
  marketingLeads,
  blogPosts,
  marketingBudgetItems,
  marketingCalendarEvents,
  marketingLeadContacts,
  sdCustomerCompetitors,
} from '@europrint/schemas';
import { TashkentTimeService } from '@common/time';

const _time = new TashkentTimeService();

// ─── Blog Posts ───────────────────────────────────────────────────────────────

@Injectable()
export class DrizzleMarketingGroup2Repository {
  private readonly logger = new Logger(DrizzleMarketingGroup2Repository.name);

  // ── Blog ──────────────────────────────────────────────────────────────────

  async getBlogPosts(opts: {
    limit?: number;
    offset?: number;
    status?: string;
  }): Promise<Result<{ data: unknown[]; total: number }>> {
    try {
      const lim = opts.limit ?? 20;
      const off = opts.offset ?? 0;
      const rows = await db
        .select()
        .from(blogPosts)
        .orderBy(desc(blogPosts.createdAt))
        .limit(lim)
        .offset(off);
      const filtered = opts.status
        ? (Array.isArray(rows) ? rows : []).filter(
            (r) => (r.isPublished ? 'published' : 'draft') === opts.status,
          )
        : rows;
      return Ok({ data: filtered, total: rows.length });
    } catch (e) {
      return Err(String(e));
    }
  }

  async getBlogPostById(id: string): Promise<Result<unknown>> {
    try {
      const rows = await db
        .select()
        .from(blogPosts)
        .where(eq(blogPosts.id, id))
        .limit(1);
      if (!rows[0]) return Err({ code: 'NOT_FOUND' as const, message: `Blog post topilmadi: ${id}` });
      return Ok(rows[0]);
    } catch (e) {
      return Err(String(e));
    }
  }

  async createBlogPost(data: Record<string, unknown>): Promise<Result<unknown>> {
    try {
      const slug = (data['slug'] as string | undefined) ??
        String(data['titleUz'] ?? data['title'] ?? '')
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '')
          .substring(0, 180) + '-' + Date.now();
      const [row] = await db
        .insert(blogPosts)
        .values({
          titleUz: String(data['titleUz'] ?? data['title'] ?? ''),
          titleRu: data['titleRu'] as string | undefined,
          slug,
          bodyUz: data['bodyUz'] as string | undefined,
          bodyRu: data['bodyRu'] as string | undefined,
          excerpt: data['excerpt'] as string | undefined,
          isPublished: false,
          authorId: data['authorId'] as string | undefined,
        })
        .returning();
      return Ok(row);
    } catch (e) {
      return Err(String(e));
    }
  }

  async updateBlogPost(id: string, data: Record<string, unknown>): Promise<Result<unknown>> {
    try {
      const [row] = await db
        .update(blogPosts)
        .set({
          ...(data['titleUz'] !== undefined && { titleUz: String(data['titleUz']) }),
          ...(data['titleRu'] !== undefined && { titleRu: String(data['titleRu']) }),
          ...(data['bodyUz'] !== undefined && { bodyUz: String(data['bodyUz']) }),
          ...(data['bodyRu'] !== undefined && { bodyRu: String(data['bodyRu']) }),
          ...(data['excerpt'] !== undefined && { excerpt: String(data['excerpt']) }),
          updatedAt: _time.now(),
        })
        .where(eq(blogPosts.id, id))
        .returning();
      if (!row) return Err({ code: 'NOT_FOUND' as const, message: `Blog post topilmadi: ${id}` });
      return Ok(row);
    } catch (e) {
      return Err(String(e));
    }
  }

  async publishBlogPost(id: string): Promise<Result<unknown>> {
    try {
      const [row] = await db
        .update(blogPosts)
        .set({ isPublished: true, publishedAt: _time.now(), updatedAt: _time.now() })
        .where(eq(blogPosts.id, id))
        .returning();
      if (!row) return Err({ code: 'NOT_FOUND' as const, message: `Blog post topilmadi: ${id}` });
      return Ok(row);
    } catch (e) {
      return Err(String(e));
    }
  }

  async deleteBlogPost(id: string): Promise<Result<{ message: string }>> {
    try {
      await db.delete(blogPosts).where(eq(blogPosts.id, id));
      return Ok({ message: "O'chirildi" });
    } catch (e) {
      return Err(String(e));
    }
  }

  // ── Budget ────────────────────────────────────────────────────────────────

  async getBudgetLines(opts: {
    year?: number;
    month?: number;
  }): Promise<Result<unknown[]>> {
    try {
      const rows = await db
        .select()
        .from(marketingBudgetItems)
        .where(
          and(
            opts.year !== undefined ? eq(marketingBudgetItems.year, opts.year) : undefined,
            opts.month !== undefined ? eq(marketingBudgetItems.month, opts.month) : undefined,
          ),
        )
        .orderBy(desc(marketingBudgetItems.year), marketingBudgetItems.month);
      return Ok(Array.isArray(rows) ? rows : []);
    } catch (e) {
      return Err(String(e));
    }
  }

  async getBudgetLineById(id: string): Promise<Result<unknown>> {
    try {
      const rows = await db
        .select()
        .from(marketingBudgetItems)
        .where(eq(marketingBudgetItems.id, id))
        .limit(1);
      if (!rows[0]) return Err({ code: 'NOT_FOUND' as const, message: `Byudjet qatori topilmadi: ${id}` });
      return Ok(rows[0]);
    } catch (e) {
      return Err(String(e));
    }
  }

  async createBudgetLine(data: Record<string, unknown>): Promise<Result<unknown>> {
    try {
      // marketing_budget_items has `name` column — maps directly from FE form
      const [row] = await db
        .insert(marketingBudgetItems)
        .values({
          year: Number(data['year']),
          month: data['month'] != null ? Number(data['month']) : null,
          category: String(data['category'] ?? 'other'),
          name: String(data['name'] ?? data['description'] ?? ''),
          plannedAmount: String(data['plannedAmount'] ?? data['planned_amount'] ?? '0'),
          actualAmount: String(data['actualAmount'] ?? data['actual_amount'] ?? '0'),
          notes: (data['notes'] as string | undefined) ?? (data['description'] as string | undefined),
        })
        .returning();
      return Ok(row);
    } catch (e) {
      return Err(String(e));
    }
  }

  async updateBudgetLine(id: string, data: Record<string, unknown>): Promise<Result<unknown>> {
    try {
      const updateData: Partial<typeof marketingBudgetItems.$inferInsert> = {};
      if (data['year'] !== undefined) updateData.year = Number(data['year']);
      if (data['month'] !== undefined) updateData.month = data['month'] != null ? Number(data['month']) : null;
      if (data['category'] !== undefined) updateData.category = String(data['category']);
      if (data['name'] !== undefined) updateData.name = String(data['name']);
      if (data['plannedAmount'] !== undefined) updateData.plannedAmount = String(data['plannedAmount']);
      if (data['actualAmount'] !== undefined) updateData.actualAmount = String(data['actualAmount']);
      if (data['notes'] !== undefined) updateData.notes = String(data['notes']);
      if (data['description'] !== undefined && updateData.notes === undefined) {
        updateData.notes = String(data['description']);
      }
      const [row] = await db
        .update(marketingBudgetItems)
        .set(updateData)
        .where(eq(marketingBudgetItems.id, id))
        .returning();
      if (!row) return Err({ code: 'NOT_FOUND' as const, message: `Byudjet qatori topilmadi: ${id}` });
      return Ok(row);
    } catch (e) {
      return Err(String(e));
    }
  }

  // ── Calendar ──────────────────────────────────────────────────────────────

  async getCalendarEvents(opts: {
    from?: string;
    to?: string;
  }): Promise<Result<unknown[]>> {
    try {
      const rows = await db
        .select()
        .from(marketingCalendarEvents)
        .where(
          and(
            opts.from !== undefined ? gte(marketingCalendarEvents.startDate, opts.from) : undefined,
            opts.to !== undefined ? lte(marketingCalendarEvents.startDate, opts.to) : undefined,
          ),
        )
        .orderBy(marketingCalendarEvents.startDate);
      return Ok(Array.isArray(rows) ? rows : []);
    } catch (e) {
      return Err(String(e));
    }
  }

  async getCalendarEventById(id: number): Promise<Result<unknown>> {
    try {
      const rows = await db
        .select()
        .from(marketingCalendarEvents)
        .where(eq(marketingCalendarEvents.id, id))
        .limit(1);
      if (!rows[0]) return Err({ code: 'NOT_FOUND' as const, message: `Tadbir topilmadi: ${id}` });
      return Ok(rows[0]);
    } catch (e) {
      return Err(String(e));
    }
  }

  async createCalendarEvent(data: Record<string, unknown>): Promise<Result<unknown>> {
    try {
      const [row] = await db
        .insert(marketingCalendarEvents)
        .values({
          title: String(data['title'] ?? ''),
          eventType: String(data['eventType'] ?? data['event_type'] ?? 'campaign') as 'campaign' | 'meeting' | 'deadline' | 'exhibition',
          startDate: String(data['startDate'] ?? data['start_date'] ?? ''),
          endDate: data['endDate'] != null ? String(data['endDate']) : null,
          description: data['description'] as string | undefined,
          status: String(data['status'] ?? 'planned') as 'planned' | 'ongoing' | 'completed' | 'cancelled',
        })
        .returning();
      return Ok(row);
    } catch (e) {
      return Err(String(e));
    }
  }

  // ── Competitors ───────────────────────────────────────────────────────────

  async getCompetitors(): Promise<Result<unknown[]>> {
    try {
      const rows = await db
        .select({
          name: sdCustomerCompetitors.competitorName,
          customersCount: sql<number>`count(*)::int`,
          avgOurShare: sql<number>`round(avg(${sdCustomerCompetitors.ourSharePct})::numeric, 1)`,
          avgTheirShare: sql<number>`round(avg(${sdCustomerCompetitors.competitorSharePct})::numeric, 1)`,
          switchRisk: sdCustomerCompetitors.switchRisk,
        })
        .from(sdCustomerCompetitors)
        .groupBy(sdCustomerCompetitors.competitorName, sdCustomerCompetitors.switchRisk)
        .orderBy(desc(sql<number>`count(*)`));
      return Ok(Array.isArray(rows) ? rows : []);
    } catch (e) {
      this.logger.error('getCompetitors error', e);
      return Err(String(e));
    }
  }

  // ── Lead Contacts ─────────────────────────────────────────────────────────

  async getLeadContacts(leadId: string): Promise<Result<unknown[]>> {
    try {
      const rows = await db
        .select()
        .from(marketingLeadContacts)
        .where(eq(marketingLeadContacts.leadId, leadId))
        .orderBy(desc(marketingLeadContacts.contactedAt));
      return Ok(Array.isArray(rows) ? rows : []);
    } catch (e) {
      return Err(String(e));
    }
  }

  async createLeadContact(leadId: string, data: Record<string, unknown>): Promise<Result<unknown>> {
    try {
      const [row] = await db
        .insert(marketingLeadContacts)
        .values({
          leadId,
          type: String(data['type'] ?? 'call') as 'call' | 'meeting' | 'email' | 'whatsapp' | 'telegram',
          summary: data['summary'] as string | undefined,
          outcome: data['outcome'] as string | undefined,
          contactedBy: data['contactedBy'] as string | undefined,
          nextFollowUp: data['nextFollowUp'] ? new Date(String(data['nextFollowUp'])) : undefined,
        })
        .returning();
      return Ok(row);
    } catch (e) {
      return Err(String(e));
    }
  }

  async softDeleteLead(id: string): Promise<Result<{ message: string }>> {
    try {
      // marketing_leads.id is varchar (slug ids like "demo-lead-004"); Number(id)=NaN
      // matched 0 rows yet still returned success (fake delete). Bind the string id via
      // sql`` (the @europrint/schemas def mistypes id as integer so eq() can't take a
      // string — same pattern as the canonical leads.repository.softDelete), and confirm
      // a row was actually flagged before reporting success.
      const rows = await db
        .update(marketingLeads)
        .set({ deletedAt: _time.now() })
        .where(sql`${marketingLeads.id} = ${id}`)
        .returning({ id: marketingLeads.id });
      if (!Array.isArray(rows) || rows.length === 0) {
        // Structured NOT_FOUND (not a bare string) so unwrapOrThrow maps it to HTTP 404,
        // matching every other method in this repo. A bare Err(string) becomes code
        // 'INTERNAL' -> 500, which is wrong for a missing lead and noisy in monitoring.
        return Err({ code: 'NOT_FOUND' as const, message: `Lead topilmadi: ${id}` });
      }
      return Ok({ message: "Lead o'chirildi" });
    } catch (e) {
      return Err(String(e));
    }
  }
}
