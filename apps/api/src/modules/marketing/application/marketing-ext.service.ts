/**
 * @module marketing-ext.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Logger } from '@nestjs/common';
import { Result, Ok, Err, AppErr } from '@common/result';
import { DrizzleMarketingExtRepository } from '../infrastructure/repositories/drizzle-marketing-ext.repo';
import { MarketingRoiService, ChannelInput } from './marketing-roi.service';
import { MKT_CHANNELS, normalizeChannel } from './marketing-roi.constants';

/** One canonical-channel row of the channel-ROI breakdown response. */
export interface ChannelRoiRow {
  /** Canonical EP-MKT-031 channel code (or raw key when not canonical). */
  channel: string;
  /** Whether `channel` is one of the owner-decided 8 (EP-MKT-031). */
  isCanonical: boolean;
  spend: number;
  revenue: number;
  /** Paying-customer conversions used for CAC (marketing_ads.conversions). */
  conversions: number;
  /** Total leads sourced from this channel (marketing_leads.source). */
  leads: number;
  /** Leads from this channel that reached status='converted'. */
  convertedLeads: number;
  /** EP-MKT-051 ROI% — null when spend <= 0. */
  roiPct: number | null;
  /** revenue / spend — null when spend <= 0. */
  ratio: number | null;
  /** EP-MKT-053 CAC = spend / conversions — null when conversions <= 0. */
  cac: number | null;
}

/** Full channel-ROI breakdown response (EP-MKT-002 / EP-MKT-031). */
export interface ChannelRoiBreakdown {
  channels: ChannelRoiRow[];
  best: ChannelRoiRow | null;
  worst: ChannelRoiRow | null;
  totalSpend: number;
  totalRevenue: number;
  totalConversions: number;
  totalLeads: number;
  aggregateRoiPct: number | null;
  /**
   * True when there is no campaign/lead data at all (honest-empty) — the FE shows
   * an empty state rather than a misleading all-zero table.
   */
  empty: boolean;
}

@Injectable()
export class MarketingExtService {
  private readonly logger = new Logger(MarketingExtService.name);

  constructor(
    private readonly repo: DrizzleMarketingExtRepository,
    private readonly roi: MarketingRoiService,
  ) {}

  /**
   * Per-channel spend / lead / ROI rollup from real campaign data
   * (EP-MKT-002 four-channel breakdown · EP-MKT-031 canonical 8 channels).
   *
   * Pipeline:
   *   1. repo.getChannelRollup() — real spend (ads.platform), leads (leads.source),
   *      ad-conversions, attributed revenue per RAW channel key.
   *   2. normalizeChannel() folds documented aliases into the canonical EP-MKT-031
   *      code (e.g. 'website' → 'veb-sayt'); unknown raw keys stay verbatim, never
   *      force-mapped (the owner sets the canonical list — we do not invent it).
   *   3. MarketingRoiService.channelEffectiveness() — the EXISTING profit-based ROI
   *      engine computes per-channel ROI%/ratio/CAC + best/worst ranking.
   *   4. Lead counts (which the pure engine does not carry) are merged back in.
   *
   * Honest-empty: when there is no spend, no leads and no revenue, returns
   * empty=true with zeroed totals instead of a fabricated table.
   */
  async getChannelRoi(): Promise<Result<ChannelRoiBreakdown>> {
    const rollupRes = await this.repo.getChannelRollup();
    if (!rollupRes.ok) return Err(rollupRes.error);
    const rollup = rollupRes.data;

    // Fold raw channels into canonical buckets; keep lead counts alongside.
    type Agg = { spend: number; revenue: number; conversions: number; leads: number; convertedLeads: number };
    const byChannel = new Map<string, Agg>();
    for (const r of rollup) {
      const key = normalizeChannel(r.channel);
      const cur = byChannel.get(key) ?? { spend: 0, revenue: 0, conversions: 0, leads: 0, convertedLeads: 0 };
      cur.spend += r.spend;
      cur.revenue += r.revenue;
      cur.conversions += r.adConversions;
      cur.leads += r.leads;
      cur.convertedLeads += r.convertedLeads;
      byChannel.set(key, cur);
    }

    const totalLeads = [...byChannel.values()].reduce((s, a) => s + a.leads, 0);
    const totalSpendRaw = [...byChannel.values()].reduce((s, a) => s + a.spend, 0);
    const totalRevenueRaw = [...byChannel.values()].reduce((s, a) => s + a.revenue, 0);

    // Honest-empty: no real signal anywhere.
    if (byChannel.size === 0 || (totalLeads === 0 && totalSpendRaw === 0 && totalRevenueRaw === 0)) {
      return Ok<ChannelRoiBreakdown>({
        channels: [], best: null, worst: null,
        totalSpend: 0, totalRevenue: 0, totalConversions: 0, totalLeads: 0,
        aggregateRoiPct: null, empty: true,
      });
    }

    const inputs: ChannelInput[] = [...byChannel.entries()].map(([channel, a]) => ({
      channel,
      spend: a.spend,
      revenue: a.revenue,
      conversions: a.conversions,
    }));

    const eff = this.roi.channelEffectiveness(inputs);
    if (!eff.ok) return Err(AppErr('INTERNAL', eff.error.message, { stage: 'channelEffectiveness' }));

    const canonical = new Set<string>(MKT_CHANNELS as readonly string[]);
    const toRow = (channel: string): ChannelRoiRow | null => {
      const e = eff.data.channels.find((c) => c.channel === channel);
      const a = byChannel.get(channel);
      if (!e || !a) return null;
      return {
        channel,
        isCanonical: canonical.has(channel),
        spend: e.spend,
        revenue: e.revenue,
        conversions: e.conversions,
        leads: a.leads,
        convertedLeads: a.convertedLeads,
        roiPct: e.roiPct,
        ratio: e.ratio,
        cac: e.cac,
      };
    };

    const channels = eff.data.channels
      .map((c) => toRow(c.channel))
      .filter((r): r is ChannelRoiRow => r !== null);

    return Ok<ChannelRoiBreakdown>({
      channels,
      best: eff.data.best ? toRow(eff.data.best.channel) : null,
      worst: eff.data.worst ? toRow(eff.data.worst.channel) : null,
      totalSpend: eff.data.totalSpend,
      totalRevenue: eff.data.totalRevenue,
      totalConversions: eff.data.totalConversions,
      totalLeads,
      aggregateRoiPct: eff.data.aggregateRoiPct,
      empty: false,
    });
  }

  getCampaignStats(id: string): Promise<Result<Record<string, unknown>>> {
    return this.repo.getCampaignStats(id);
  }

  getDashboardStats(): Promise<Result<Record<string, unknown>>> {
    return this.repo.getDashboardStats();
  }

  getContentPosts(page: number, limit: number): Promise<Result<Record<string, unknown>>> {
    return this.repo.getContentPosts(page, limit);
  }

  getContentPostById(id: string): Promise<Result<Record<string, unknown> | null>> {
    return this.repo.getContentPostById(id);
  }

  createContentPost(data: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    return this.repo.createContentPost(data);
  }

  updateContentPost(id: string, data: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    return this.repo.updateContentPost(id, data);
  }

  deleteContentPost(id: string): Promise<Result<void>> {
    return this.repo.deleteContentPost(id);
  }

  publishContentPost(id: string): Promise<Result<Record<string, unknown>>> {
    return this.repo.publishContentPost(id);
  }

  getContentCalendar(): Promise<Result<Record<string, unknown>[]>> {
    return this.repo.getContentCalendar();
  }

  getContentAnalytics(): Promise<Result<Record<string, unknown>>> {
    return this.repo.getContentAnalytics();
  }

  getSocialAccounts(): Promise<Result<Record<string, unknown>[]>> {
    return this.repo.getSocialAccounts();
  }

  createSocialAccount(data: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    return this.repo.createSocialAccount(data);
  }

  deleteSocialAccount(id: string): Promise<Result<void>> {
    return this.repo.deleteSocialAccount(id);
  }

  getSocialPosts(page: number, limit: number): Promise<Result<Record<string, unknown>>> {
    return this.repo.getSocialPosts(page, limit);
  }

  createSocialPost(data: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    return this.repo.createSocialPost(data);
  }

  updateSocialPost(id: string, data: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    return this.repo.updateSocialPost(id, data);
  }

  deleteSocialPost(id: string): Promise<Result<void>> {
    return this.repo.deleteSocialPost(id);
  }

  getEmailTemplates(): Promise<Result<Record<string, unknown>[]>> {
    return this.repo.getEmailTemplates();
  }

  createEmailTemplate(data: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    return this.repo.createEmailTemplate(data);
  }

  updateEmailTemplate(id: string, data: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    return this.repo.updateEmailTemplate(id, data);
  }

  deleteEmailTemplate(id: string): Promise<Result<void>> {
    return this.repo.deleteEmailTemplate(id);
  }

  getAnalyticsOverview(): Promise<Result<Record<string, unknown>>> {
    return this.repo.getAnalyticsOverview();
  }

  getCampaignAnalytics(): Promise<Result<Record<string, unknown>[]>> {
    return this.repo.getCampaignAnalytics();
  }

  getLeadsBySource(): Promise<Result<Record<string, unknown>[]>> {
    return this.repo.getLeadsBySource();
  }

  getMarketingFunnel(): Promise<Result<Record<string, unknown>>> {
    return this.repo.getMarketingFunnel();
  }

  // ── GURUH 1 ──────────────────────────────────────────────────────────────────

  getNps(): Promise<Result<{ items: Record<string, unknown>[]; avgScore: number; total: number }>> {
    return this.repo.getNps();
  }

  getNpsStats(): Promise<Result<{
    npsScore: number;
    promoters: number;
    passives: number;
    detractors: number;
    monthlyTrend: { month: string; score: number }[];
  }>> {
    return this.repo.getNpsStats();
  }

  getHotLeads(): Promise<Result<Record<string, unknown>[]>> {
    return this.repo.getHotLeads();
  }

  getOverdueLeads(): Promise<Result<Record<string, unknown>[]>> {
    return this.repo.getOverdueLeads();
  }

  getLeadsSourcesSummary(): Promise<Result<{
    total: number;
    channels: { key: string; label: string; count: number; converted: number; percent: number; conversionRate: number }[];
    topChannel: string;
  }>> {
    return this.repo.getLeadsSourcesSummary();
  }

  getInboxStats(): Promise<Result<{ total: number; unread: number; pending: number; resolved: number; openRate: number }>> {
    return this.repo.getInboxStats();
  }

  getChurnRisk(): Promise<Result<{
    customerId: number;
    customerName: string;
    riskLevel: 'high' | 'medium' | 'low';
    daysSinceLastOrder: number;
    openDebt: number;
  }[]>> {
    return this.repo.getChurnRisk();
  }
}
