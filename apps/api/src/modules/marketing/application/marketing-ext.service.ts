/**
 * @module marketing-ext.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Logger } from '@nestjs/common';
import { Result } from '@common/result';
import { DrizzleMarketingExtRepository } from '../infrastructure/repositories/drizzle-marketing-ext.repo';

@Injectable()
export class MarketingExtService {
  private readonly logger = new Logger(MarketingExtService.name);

  constructor(private readonly repo: DrizzleMarketingExtRepository) {}

  getCampaignStats(id: number): Promise<Result<Record<string, unknown>>> {
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
