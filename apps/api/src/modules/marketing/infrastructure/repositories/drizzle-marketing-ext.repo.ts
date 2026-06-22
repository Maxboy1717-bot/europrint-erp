/**
 * @module drizzle-marketing-ext.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { and, eq, desc, isNull, sql, notInArray, lt } from 'drizzle-orm';
import { db } from '@shared/db';
import { typedExecute } from '@shared/db/typed-execute';
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

  /**
   * Attributed revenue per campaign (EP-MKT-051 — profit-based ROI input).
   *
   * Revenue chain: marketing_campaigns → its `converted` marketing_leads →
   * the CRM deal each lead became (marketing_leads.crm_lead_id → crm_deals.lead_id)
   * → sum of WON crm_deals.amount.
   *
   * All join keys are ::text-cast because the live linkage columns are of mixed,
   * currently-mismatched types (campaigns.id varchar, leads.campaign_id integer,
   * leads.crm_lead_id integer, crm_deals.lead_id uuid) and most are NULL. The casts
   * keep the query crash-safe; when no real linkage exists it honestly returns 0 —
   * NEVER a fabricated number. Returns a map of campaignId → won-deal revenue.
   *
   * KNOWN GAP: the campaign→lead→deal linkage is not yet populated in the live DB
   * (leads.campaign_id / leads.crm_lead_id / crm_deals.lead_id are all NULL), and the
   * profit-margin source for true profit-based ROI is still owner-pending (EP-MKT-051
   * sub-question). Until that wiring lands, attributed revenue computes as 0 and ROI
   * reflects spend-with-no-attributed-return rather than budget utilization.
   */
  private async getAttributedRevenueByCampaign(): Promise<Record<string, number>> {
    type RevRow = { campaign_id: string; revenue: string };
    const rows = await typedExecute<RevRow>(sql`
      SELECT mc.id::text AS campaign_id,
             COALESCE(SUM(d.amount), 0)::numeric AS revenue
      FROM marketing_campaigns mc
      JOIN marketing_leads l
        ON l.campaign_id::text = mc.id::text
       AND l.status = 'converted'
       AND l.deleted_at IS NULL
      JOIN crm_deals d
        ON d.lead_id::text = l.crm_lead_id::text
       AND d.status = 'won'
       AND d.deleted_at IS NULL
      WHERE mc.deleted_at IS NULL
      GROUP BY mc.id
    `);
    const map: Record<string, number> = {};
    for (const r of Array.isArray(rows) ? rows : []) {
      map[String(r.campaign_id)] = Number(r.revenue ?? 0);
    }
    return map;
  }

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
      // EP-MKT-051: ROI = (attributed sales revenue − marketing spend) / spend.
      // Profit-based per owner answer (NOT the old budget-utilization formula).
      const revenueMap = await this.getAttributedRevenueByCampaign();
      const revenue = revenueMap[String(id)] ?? 0;
      const roi     = spent > 0 ? Math.round(((revenue - spent) / spent) * 100 * 100) / 100 : 0;

      const base = row ?? { id };
      return {
        ...base,
        impressions:        Number(adStats?.impressions ?? 0),
        clicks:             Number(adStats?.clicks      ?? 0),
        conversions:        Number(adStats?.conversions ?? 0),
        attributedRevenue:  revenue,
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

      // EP-MKT-051: profit-based ROI — attributed sales revenue per campaign.
      const revenueMap = await this.getAttributedRevenueByCampaign();

      return (Array.isArray(campaigns) ? campaigns : []).map((c) => {
        const s     = statsMap[c.id];
        const spent   = Number(s?.totalSpent  ?? 0);
        // ROI = (attributed sales revenue − marketing spend) / spend (profit-based,
        // per owner answer) — replaces the prior budget-utilization formula.
        const revenue = revenueMap[String(c.id)] ?? 0;
        const roi     = spent > 0 ? Math.round(((revenue - spent) / spent) * 100 * 100) / 100 : 0;
        return {
          id:                c.id,
          name:              c.name,
          status:            c.status,
          impressions:       Number(s?.impressions ?? 0),
          clicks:            Number(s?.clicks      ?? 0),
          conversions:       Number(s?.conversions ?? 0),
          attributedRevenue: revenue,
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
      // Pull per-status counts in one query — all 5 live statuses: new/warm/hot/converted/lost
      const byStatus = await db
        .select({
          status: marketingLeads.status,
          cnt: sql<number>`count(*)::int`,
        })
        .from(marketingLeads)
        .where(isNull(marketingLeads.deletedAt))
        .groupBy(marketingLeads.status);

      const map: Record<string, number> = {};
      for (const r of Array.isArray(byStatus) ? byStatus : []) {
        map[String(r.status ?? 'unknown')] = Number(r.cnt ?? 0);
      }

      const total = Object.values(map).reduce((s, n) => s + n, 0);
      const converted = map['converted'] ?? 0;
      const convRate = total > 0 ? Math.round((converted / total) * 100 * 10) / 10 : 0;

      // Canonical funnel order: new → warm → hot → converted → lost
      const FUNNEL_ORDER = ['new', 'warm', 'hot', 'converted', 'lost'] as const;
      type FunnelStage = { name: string; label: string; count: number };
      const stages: FunnelStage[] = FUNNEL_ORDER.map(s => ({
        name: s as string,
        label: s === 'new' ? 'Yangi' : s === 'warm' ? 'Iliq' : s === 'hot' ? 'Issiq' : s === 'converted' ? 'Konvertatsiya' : 'Yo\'qotilgan',
        count: map[s] ?? 0,
      }));

      // Include any unknown statuses not in the canonical list
      const known = new Set(FUNNEL_ORDER as readonly string[]);
      for (const [status, cnt] of Object.entries(map)) {
        if (!known.has(status)) {
          stages.push({ name: status, label: status, count: cnt });
        }
      }

      return { stages, total, conversionRate: convRate };
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

  async getLeadsSourcesSummary(): Promise<Result<{
    total: number;
    channels: { key: string; label: string; count: number; converted: number; percent: number; conversionRate: number }[];
    topChannel: string;
  }>> {
    return safeCall(async () => {
      const grouped = await db.select({
        source:     marketingLeadsCanonical.source,
        totalCount: sql<number>`count(*)::int`,
        wonCount:   sql<number>`count(*) filter (where ${marketingLeadsCanonical.status} = 'converted')::int`,
      })
        .from(marketingLeadsCanonical)
        .where(isNull(marketingLeadsCanonical.deletedAt))
        .groupBy(marketingLeadsCanonical.source)
        .orderBy(sql`count(*) desc`);

      const rows = Array.isArray(grouped) ? grouped : [];
      const total = rows.reduce((s, r) => s + Number(r.totalCount ?? 0), 0);

      const channels = rows.map(r => {
        const count     = Number(r.totalCount ?? 0);
        const converted = Number(r.wonCount ?? 0);
        const key       = r.source ?? 'unknown';
        const label     = key.charAt(0).toUpperCase() + key.slice(1);
        const percent   = total > 0 ? Math.round((count / total) * 100 * 10) / 10 : 0;
        const conversionRate = count > 0 ? Math.round((converted / count) * 100 * 10) / 10 : 0;
        return { key, label, count, converted, percent, conversionRate };
      });

      return {
        total,
        channels,
        topChannel: channels[0]?.key ?? '',
      };
    });
  }

  /**
   * Per raw-channel rollup for the channel-ROI breakdown (EP-MKT-002 / EP-MKT-031).
   *
   * Combines three real, independent live sources by raw channel key:
   *   - SPEND + ad-conversions: marketing_ads.platform → SUM(spent_amount) / SUM(conversions)
   *   - LEADS + converted-leads: marketing_leads.source → COUNT(*) / COUNT(status='converted')
   *   - attributed REVENUE: leads.source → won crm_deals via leads.crm_lead_id → crm_deals.lead_id
   *
   * The three aggregates are FULL-OUTER-JOINed on the lower-cased channel key so a
   * channel that has spend but no leads (or vice-versa) still appears. Channel-key
   * normalization to the canonical EP-MKT-031 list happens in the service layer
   * (normalizeChannel) — the repo returns the raw lower-cased keys verbatim.
   *
   * KNOWN GAP (honest 0): marketing_leads.crm_lead_id and .campaign_id are NULL in the
   * live DB, so attributed revenue currently computes as 0 for every channel — the
   * query returns a truthful 0, never a fabricated figure. When the lead→deal linkage
   * is populated, revenue (and thus per-channel ROI) flows through automatically.
   */
  async getChannelRollup(): Promise<Result<{
    channel: string;
    spend: number;
    adConversions: number;
    leads: number;
    convertedLeads: number;
    revenue: number;
  }[]>> {
    return safeCall(async () => {
      type Row = {
        channel: string;
        spend: string | null;
        ad_conversions: number | null;
        leads: number | null;
        converted_leads: number | null;
        revenue: string | null;
      };
      const rows = await typedExecute<Row>(sql`
        WITH ads AS (
          SELECT lower(COALESCE(NULLIF(TRIM(platform), ''), 'boshqa')) AS channel,
                 COALESCE(SUM(spent_amount), 0)::numeric AS spend,
                 COALESCE(SUM(conversions), 0)::int      AS ad_conversions
          FROM marketing_ads
          WHERE deleted_at IS NULL
          GROUP BY 1
        ),
        leads AS (
          SELECT lower(COALESCE(NULLIF(TRIM(source), ''), 'boshqa')) AS channel,
                 COUNT(*)::int AS leads,
                 COUNT(*) FILTER (WHERE status = 'converted')::int AS converted_leads
          FROM marketing_leads
          WHERE deleted_at IS NULL
          GROUP BY 1
        ),
        rev AS (
          SELECT lower(COALESCE(NULLIF(TRIM(l.source), ''), 'boshqa')) AS channel,
                 COALESCE(SUM(d.amount), 0)::numeric AS revenue
          FROM marketing_leads l
          JOIN crm_deals d
            ON d.lead_id::text = l.crm_lead_id::text
           AND d.status = 'won'
           AND d.deleted_at IS NULL
          WHERE l.deleted_at IS NULL
          GROUP BY 1
        )
        SELECT COALESCE(a.channel, le.channel, r.channel) AS channel,
               COALESCE(a.spend, 0)::numeric              AS spend,
               COALESCE(a.ad_conversions, 0)::int         AS ad_conversions,
               COALESCE(le.leads, 0)::int                 AS leads,
               COALESCE(le.converted_leads, 0)::int       AS converted_leads,
               COALESCE(r.revenue, 0)::numeric            AS revenue
        FROM ads a
        FULL OUTER JOIN leads le ON le.channel = a.channel
        FULL OUTER JOIN rev   r  ON r.channel  = COALESCE(a.channel, le.channel)
        ORDER BY spend DESC, leads DESC
      `);
      return (Array.isArray(rows) ? rows : []).map((r) => ({
        channel: String(r.channel ?? 'boshqa'),
        spend: Number(r.spend ?? 0),
        adConversions: Number(r.ad_conversions ?? 0),
        leads: Number(r.leads ?? 0),
        convertedLeads: Number(r.converted_leads ?? 0),
        revenue: Number(r.revenue ?? 0),
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
