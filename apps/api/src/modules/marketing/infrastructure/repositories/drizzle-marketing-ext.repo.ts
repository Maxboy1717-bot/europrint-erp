/**
 * @module drizzle-marketing-ext.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { and, eq, desc, isNull, sql, notInArray, lt } from 'drizzle-orm';
import { db } from '@shared/db';
import { safeCall, Result, Err } from '@common/result';
import {
  marketingContentPosts, marketingSocialAccounts,
  marketingSocialPosts, marketingEmailTemplates,
  marketingCampaigns, marketingLeads,
} from '@europrint/schemas';
import {
  npsResponses, socialConversations, sdCustomers,
  marketingLeads as marketingLeadsCanonical,
  marketingAds,
} from '@workspace/db';

@Injectable()
export class DrizzleMarketingExtRepository {
  private readonly logger = new Logger(DrizzleMarketingExtRepository.name);

  async getCampaignStats(id: number): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const [row] = await db.select().from(marketingCampaigns).where(eq(marketingCampaigns.id, id)).limit(1);
      const [adStats] = await db.select({
        impressions: sql<number>`coalesce(sum(${marketingAds.impressions}), 0)::int`,
        clicks:      sql<number>`coalesce(sum(${marketingAds.clicks}), 0)::int`,
        conversions: sql<number>`coalesce(sum(${marketingAds.conversions}), 0)::int`,
        totalSpent:  sql<number>`coalesce(sum(${marketingAds.spentAmount}), 0)::numeric`,
        totalBudget: sql<number>`coalesce(sum(${marketingAds.budget}), 0)::numeric`,
      }).from(marketingAds).where(eq(marketingAds.campaignId, String(id)));

      const spent   = Number(adStats?.totalSpent  ?? 0);
      const budget  = Number(adStats?.totalBudget ?? 0);
      const roi     = spent > 0 ? Math.round(((budget - spent) / spent) * 100 * 100) / 100 : 0;

      const base = row ?? { id };
      return {
        ...base,
        impressions: Number(adStats?.impressions ?? 0),
        clicks:      Number(adStats?.clicks      ?? 0),
        conversions: Number(adStats?.conversions ?? 0),
        roi,
      };
    });
  }

  async getDashboardStats(): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const campaigns = await db.select().from(marketingCampaigns).where(isNull(marketingCampaigns.deletedAt));
      const leads     = await db.select({ status: marketingLeads.status, createdAt: marketingLeads.createdAt })
        .from(marketingLeads).where(isNull(marketingLeads.deletedAt));
      const totalLeads     = leads.length;
      const convertedLeads = (Array.isArray(leads) ? leads : []).filter(l => l.status === 'converted').length;
      const conversionRate = totalLeads > 0
        ? Math.round((convertedLeads / totalLeads) * 100 * 10) / 10
        : 0;

      // totalBudget: sum of marketing_campaigns.budget (numeric column, existing)
      const [budgetRow] = await db.select({
        totalBudget: sql<number>`coalesce(sum(${marketingCampaigns.budget}::numeric), 0)`,
      }).from(marketingCampaigns).where(isNull(marketingCampaigns.deletedAt));

      // recentLeads: leads created in last 30 days (created_at column, existing)
      const cutoff30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const recentLeads = (Array.isArray(leads) ? leads : []).filter(l => {
        if (!l.createdAt) return false;
        return new Date(l.createdAt) >= cutoff30;
      }).length;

      return {
        totalCampaigns:  campaigns.length,
        activeCampaigns: (Array.isArray(campaigns) ? campaigns : []).filter((c) => c.status === 'active').length,
        totalLeads,
        convertedLeads,
        conversionRate,
        totalBudget:  Number(budgetRow?.totalBudget ?? 0),
        recentLeads,
      };
    });
  }

  async getContentPosts(page: number, limit: number): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const rows = await db.select().from(marketingContentPosts)
        .orderBy(desc(marketingContentPosts.createdAt))
        .limit(limit)
        .offset((page - 1) * limit);
      return { data: rows, total: rows.length, page, limit };
    });
  }

  async getContentPostById(id: string): Promise<Result<Record<string, unknown> | null>> {
    return safeCall(async () => {
      const [row] = await db.select().from(marketingContentPosts).where(eq(marketingContentPosts.id, id)).limit(1);
      return row ?? null;
    });
  }

  async createContentPost(data: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const [row] = await db.insert(marketingContentPosts).values({
        title:    String(data.title ?? ''),
        content:  data.content as string,
        postType: String(data.postType ?? 'blog'),
        authorId: data.authorId ? Number(data.authorId) : null,
      }).returning();
      if (!row) return Err('Post yaratishda xato: natija qaytmadi');
      return row;
    });
  }

  async updateContentPost(id: string, data: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const [row] = await db.update(marketingContentPosts)
        .set({ title: data.title as string, content: data.content as string, updatedAt: _time.now() })
        .where(eq(marketingContentPosts.id, id))
        .returning();
      return row ?? { id };
    });
  }

  async deleteContentPost(id: string): Promise<Result<void>> {
    return safeCall(async () => { await db.delete(marketingContentPosts).where(eq(marketingContentPosts.id, id)); });
  }

  async publishContentPost(id: string): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const [row] = await db.update(marketingContentPosts)
        .set({ status: 'published', publishedAt: _time.now(), updatedAt: _time.now() })
        .where(eq(marketingContentPosts.id, id))
        .returning();
      if (!row) throw new NotFoundException(`Post topilmadi: ${id}`);
      return row;
    });
  }

  async getContentCalendar(): Promise<Result<Record<string, unknown>[]>> {
    return safeCall(async () => db.select().from(marketingContentPosts)
      .orderBy(marketingContentPosts.scheduledAt)
      .limit(50));
  }

  async getContentAnalytics(): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const posts = await db.select().from(marketingContentPosts);
      return {
        totalPosts:     posts.length,
        publishedPosts: (Array.isArray(posts) ? posts : []).filter((p) => p.status === 'published').length,
        draftPosts:     (Array.isArray(posts) ? posts : []).filter((p) => p.status === 'draft').length,
      };
    });
  }

  async getSocialAccounts(): Promise<Result<Record<string, unknown>[]>> {
    return safeCall(async () => db.select().from(marketingSocialAccounts));
  }

  async createSocialAccount(data: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const [row] = await db.insert(marketingSocialAccounts)
        .values({ platform: String(data.platform ?? ''), accountName: String(data.accountName ?? '') })
        .returning();
      if (!row) return Err('Ijtimoiy tarmoq akkaunt yaratishda xato: natija qaytmadi');
      return row;
    });
  }

  async deleteSocialAccount(id: string): Promise<Result<void>> {
    return safeCall(async () => { await db.delete(marketingSocialAccounts).where(eq(marketingSocialAccounts.id, id)); });
  }

  async getSocialPosts(page: number, limit: number): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const rows = await db.select().from(marketingSocialPosts)
        .orderBy(desc(marketingSocialPosts.createdAt))
        .limit(limit)
        .offset((page - 1) * limit);
      return { data: rows, total: rows.length, page, limit };
    });
  }

  async createSocialPost(data: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const [row] = await db.insert(marketingSocialPosts)
        .values({ content: String(data.content ?? ''), platform: String(data.platform ?? 'instagram'), accountId: data.accountId as string })
        .returning();
      if (!row) return Err('Ijtimoiy post yaratishda xato: natija qaytmadi');
      return row;
    });
  }

  async updateSocialPost(id: string, data: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const [row] = await db.update(marketingSocialPosts)
        .set({ content: data.content as string, status: data.status as string })
        .where(eq(marketingSocialPosts.id, id))
        .returning();
      return row ?? { id };
    });
  }

  async deleteSocialPost(id: string): Promise<Result<void>> {
    return safeCall(async () => { await db.delete(marketingSocialPosts).where(eq(marketingSocialPosts.id, id)); });
  }

  async getEmailTemplates(): Promise<Result<Record<string, unknown>[]>> {
    return safeCall(async () => db.select().from(marketingEmailTemplates));
  }

  async createEmailTemplate(data: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const [row] = await db.insert(marketingEmailTemplates)
        .values({ name: String(data.name ?? ''), subject: String(data.subject ?? ''), body: String(data.body ?? '') })
        .returning();
      if (!row) return Err('Email shablon yaratishda xato: natija qaytmadi');
      return row;
    });
  }

  async updateEmailTemplate(id: string, data: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const [row] = await db.update(marketingEmailTemplates)
        .set({ name: data.name as string, subject: data.subject as string, body: data.body as string, updatedAt: _time.now() })
        .where(eq(marketingEmailTemplates.id, id))
        .returning();
      return row ?? { id };
    });
  }

  async deleteEmailTemplate(id: string): Promise<Result<void>> {
    return safeCall(async () => { await db.delete(marketingEmailTemplates).where(eq(marketingEmailTemplates.id, id)); });
  }

  async getAnalyticsOverview(): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const campaigns = await db.select().from(marketingCampaigns).where(isNull(marketingCampaigns.deletedAt));
      const leads     = await db.select({ status: marketingLeads.status })
        .from(marketingLeads).where(isNull(marketingLeads.deletedAt));
      const [adTotals] = await db.select({
        reach:       sql<number>`coalesce(sum(${marketingAds.impressions}), 0)::int`,
        engagement:  sql<number>`coalesce(sum(${marketingAds.clicks}), 0)::int`,
        conversions: sql<number>`coalesce(sum(${marketingAds.conversions}), 0)::int`,
      }).from(marketingAds).where(isNull(marketingAds.deletedAt));
      return {
        period:      'monthly',
        campaigns:   campaigns.length,
        totalLeads:  leads.length,
        reach:       Number(adTotals?.reach       ?? 0),
        engagement:  Number(adTotals?.engagement  ?? 0),
        conversions: Number(adTotals?.conversions ?? 0),
      };
    });
  }

  async getCampaignAnalytics(): Promise<Result<Record<string, unknown>[]>> {
    return safeCall(async () => {
      const campaigns = await db.select().from(marketingCampaigns).where(isNull(marketingCampaigns.deletedAt)).limit(20);
      // Aggregate ads metrics per campaign in one query
      const adStats = await db.select({
        campaignId:  marketingAds.campaignId,
        impressions: sql<number>`coalesce(sum(${marketingAds.impressions}), 0)::int`,
        clicks:      sql<number>`coalesce(sum(${marketingAds.clicks}), 0)::int`,
        conversions: sql<number>`coalesce(sum(${marketingAds.conversions}), 0)::int`,
        totalSpent:  sql<number>`coalesce(sum(${marketingAds.spentAmount}), 0)::numeric`,
        totalBudget: sql<number>`coalesce(sum(${marketingAds.budget}), 0)::numeric`,
      }).from(marketingAds)
        .groupBy(marketingAds.campaignId);

      const statsMap = Object.fromEntries(
        (Array.isArray(adStats) ? adStats : []).map(s => [s.campaignId, s]),
      );

      return (Array.isArray(campaigns) ? campaigns : []).map((c) => {
        const s     = statsMap[c.id];
        const spent  = Number(s?.totalSpent  ?? 0);
        const budget = Number(s?.totalBudget ?? 0);
        const roi    = spent > 0 ? Math.round(((budget - spent) / spent) * 100 * 100) / 100 : 0;
        return {
          id:          c.id,
          name:        c.name,
          status:      c.status,
          impressions: Number(s?.impressions ?? 0),
          clicks:      Number(s?.clicks      ?? 0),
          conversions: Number(s?.conversions ?? 0),
          roi,
        };
      });
    });
  }

  async getLeadsBySource(): Promise<Result<Record<string, unknown>[]>> {
    return safeCall(async () => {
      // Raw SQL on the real `source` column: the @europrint/schemas compiled type for
      // marketingLeads omits `source` (stale dist), though it exists in the live DB and
      // lib/db source schema. db.execute avoids the missing-Drizzle-field type error.
      const result = await db.execute(sql`
        SELECT COALESCE(source, 'unknown') AS source, COUNT(*)::int AS count
        FROM marketing_leads
        WHERE deleted_at IS NULL
        GROUP BY source
      `);
      const rows = (Array.isArray(result) ? result : (result as { rows?: unknown[] }).rows ?? []) as Record<string, unknown>[];
      return rows;
    });
  }

  async getMarketingFunnel(): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const total = await db.select({ count: sql<number>`count(*)::int` }).from(marketingLeads).where(isNull(marketingLeads.deletedAt));
      const converted = await db.select({ count: sql<number>`count(*)::int` }).from(marketingLeads)
        .where(and(eq(marketingLeads.status, 'converted'), isNull(marketingLeads.deletedAt)));
      return {
        stages: [
          { name: 'Leads',     count: Number(total[0]?.count ?? 0) },
          { name: 'Converted', count: Number(converted[0]?.count ?? 0) },
        ],
      };
    });
  }

  // ── GURUH 1 ─────────────────────────────────────────────────────────────────

  async getNps(): Promise<Result<{ items: Record<string, unknown>[]; avgScore: number; total: number }>> {
    return safeCall(async () => {
      const items = await db.select().from(npsResponses)
        .orderBy(desc(npsResponses.createdAt))
        .limit(50);
      const rows = Array.isArray(items) ? items : [];
      const avg = rows.length > 0
        ? rows.reduce((s, r) => s + Number(r.score ?? 0), 0) / rows.length
        : 0;
      return { items: rows as Record<string, unknown>[], avgScore: Math.round(avg * 10) / 10, total: rows.length };
    });
  }

  async getNpsStats(): Promise<Result<{
    npsScore: number;
    promoters: number;
    passives: number;
    detractors: number;
    monthlyTrend: { month: string; score: number }[];
  }>> {
    return safeCall(async () => {
      const all = await db.select({ score: npsResponses.score, createdAt: npsResponses.createdAt })
        .from(npsResponses);
      const rows = Array.isArray(all) ? all : [];
      const total = rows.length;
      const promoters  = rows.filter(r => Number(r.score) >= 9).length;
      const passives   = rows.filter(r => Number(r.score) >= 7 && Number(r.score) < 9).length;
      const detractors = rows.filter(r => Number(r.score) < 7).length;
      const npsScore   = total > 0
        ? Math.round(((promoters - detractors) / total) * 100)
        : 0;

      // Monthly trend — last 6 months
      const now = new Date();
      const monthlyTrend: { month: string; score: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const monthRows = rows.filter(r => {
          if (!r.createdAt) return false;
          const rd = new Date(r.createdAt);
          return rd.getFullYear() === d.getFullYear() && rd.getMonth() === d.getMonth();
        });
        const mTotal = monthRows.length;
        const mPro   = monthRows.filter(r => Number(r.score) >= 9).length;
        const mDet   = monthRows.filter(r => Number(r.score) < 7).length;
        monthlyTrend.push({
          month: label,
          score: mTotal > 0 ? Math.round(((mPro - mDet) / mTotal) * 100) : 0,
        });
      }
      return { npsScore, promoters, passives, detractors, monthlyTrend };
    });
  }

  async getHotLeads(): Promise<Result<Record<string, unknown>[]>> {
    return safeCall(async () => {
      // score field used as AI proxy (highest score = hottest lead)
      const rows = await db.select().from(marketingLeadsCanonical)
        .where(and(
          notInArray(marketingLeadsCanonical.status, ['converted', 'lost']),
          isNull(marketingLeadsCanonical.deletedAt),
        ))
        .orderBy(desc(marketingLeadsCanonical.score))
        .limit(10);
      return (Array.isArray(rows) ? rows : []) as Record<string, unknown>[];
    });
  }

  // Leads that have not progressed for 7+ days and are not yet closed.
  // Schema has no `next_follow_up_at` column, so staleness is derived from
  // updatedAt (or createdAt if updatedAt is null).
  async getOverdueLeads(): Promise<Result<Record<string, unknown>[]>> {
    return safeCall(async () => {
      const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const rows = await db.select().from(marketingLeadsCanonical)
        .where(and(
          notInArray(marketingLeadsCanonical.status, ['converted', 'lost']),
          isNull(marketingLeadsCanonical.deletedAt),
          lt(
            sql`coalesce(${marketingLeadsCanonical.updatedAt}, ${marketingLeadsCanonical.createdAt})`,
            cutoff,
          ),
        ))
        .orderBy(desc(marketingLeadsCanonical.score))
        .limit(50);
      return (Array.isArray(rows) ? rows : []) as Record<string, unknown>[];
    });
  }

  async getLeadsSourcesSummary(): Promise<Result<{ source: string; count: number; totalValue: number; conversionRate: number }[]>> {
    return safeCall(async () => {
      const grouped = await db.select({
        source:     marketingLeadsCanonical.source,
        totalCount: sql<number>`count(*)::int`,
        wonCount:   sql<number>`count(*) filter (where ${marketingLeadsCanonical.status} = 'converted')::int`,
      })
        .from(marketingLeadsCanonical)
        .where(isNull(marketingLeadsCanonical.deletedAt))
        .groupBy(marketingLeadsCanonical.source);

      return (Array.isArray(grouped) ? grouped : []).map(r => ({
        source:         r.source ?? 'unknown',
        count:          Number(r.totalCount ?? 0),
        totalValue:     0,
        conversionRate: Number(r.totalCount) > 0
          ? Math.round((Number(r.wonCount) / Number(r.totalCount)) * 100 * 10) / 10
          : 0,
      }));
    });
  }

  async getInboxStats(): Promise<Result<{ total: number; unread: number; pending: number; resolved: number; openRate: number }>> {
    return safeCall(async () => {
      const rows = await db.select({
        status:    socialConversations.status,
        cnt:       sql<number>`count(*)::int`,
        unreadSum: sql<number>`sum(${socialConversations.unreadCount})::int`,
      })
        .from(socialConversations)
        .groupBy(socialConversations.status);

      const byStatus = Object.fromEntries(
        (Array.isArray(rows) ? rows : []).map(r => [r.status, r]),
      ) as Record<string, { cnt: number; unreadSum: number }>;

      const open    = Number(byStatus['open']?.cnt ?? 0);
      const pending = Number(byStatus['pending']?.cnt ?? 0);
      const closed  = Number(byStatus['closed']?.cnt ?? 0);
      const total   = open + pending + closed;
      const unread  = (Array.isArray(rows) ? rows : []).reduce((s, r) => s + Number(r.unreadSum ?? 0), 0);

      return {
        total,
        unread,
        pending,
        resolved: closed,
        openRate: total > 0 ? Math.round((open / total) * 100 * 10) / 10 : 0,
      };
    });
  }

  async getChurnRisk(): Promise<Result<{
    customerId: number;
    customerName: string;
    riskLevel: 'high' | 'medium' | 'low';
    daysSinceLastOrder: number;
    openDebt: number;
  }[]>> {
    return safeCall(async () => {
      const today = new Date();

      // Pull customers with lastOrderDate set; compare as date string YYYY-MM-DD
      const rows = await db.select({
        id:            sdCustomers.id,
        name:          sdCustomers.name,
        lastOrderDate: sdCustomers.lastOrderDate,
        openDebt:      sdCustomers.openDebt,
      })
        .from(sdCustomers)
        .where(eq(sdCustomers.status, 'active'))
        .limit(100);

      const result = (Array.isArray(rows) ? rows : [])
        .map(c => {
          let daysSince = 999;
          if (c.lastOrderDate) {
            const d = new Date(c.lastOrderDate);
            daysSince = Math.floor((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
          }
          const debt = Number(c.openDebt ?? 0);
          let riskLevel: 'high' | 'medium' | 'low' = 'low';
          if (debt > 0 && daysSince >= 90) riskLevel = 'high';
          else if (daysSince >= 60) riskLevel = 'medium';
          else if (daysSince >= 30) riskLevel = 'low';
          else return null; // not at risk
          return { customerId: c.id, customerName: c.name, riskLevel, daysSinceLastOrder: daysSince, openDebt: debt };
        })
        .filter((x): x is NonNullable<typeof x> => x !== null)
        .sort((a, b) => {
          const rank = { high: 0, medium: 1, low: 2 };
          return rank[a.riskLevel] - rank[b.riskLevel];
        })
        .slice(0, 20);

      return result;
    });
  }
}
