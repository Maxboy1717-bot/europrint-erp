/**
 * @module drizzle-marketing-ext.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { and, eq, desc, isNull, sql } from 'drizzle-orm';
import { db } from '@shared/db';
import { safeCall, Result, Err } from '@common/result';
import {
  marketingContentPosts, marketingSocialAccounts,
  marketingSocialPosts, marketingEmailTemplates,
  marketingCampaigns, marketingLeads,
} from '@europrint/schemas';

@Injectable()
export class DrizzleMarketingExtRepository {
  private readonly logger = new Logger(DrizzleMarketingExtRepository.name);

  async getCampaignStats(id: number): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const [row] = await db.select().from(marketingCampaigns).where(eq(marketingCampaigns.id, id)).limit(1);
      return row ? { ...row, impressions: 0, clicks: 0, conversions: 0, roi: 0 } : { id, impressions: 0, clicks: 0, conversions: 0, roi: 0 };
    });
  }

  async getDashboardStats(): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const campaigns = await db.select().from(marketingCampaigns).where(isNull(marketingCampaigns.deletedAt));
      const leads     = await db.select().from(marketingLeads).where(isNull(marketingLeads.deletedAt));
      return {
        totalCampaigns: campaigns.length,
        activeCampaigns: (Array.isArray(campaigns) ? campaigns : []).filter((c) => c.status === 'active').length,
        totalLeads: leads.length,
        conversionRate: 0,
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
      const leads     = await db.select().from(marketingLeads).where(isNull(marketingLeads.deletedAt));
      return { period: 'monthly', campaigns: campaigns.length, totalLeads: leads.length, reach: 0, engagement: 0, conversions: 0 };
    });
  }

  async getCampaignAnalytics(): Promise<Result<Record<string, unknown>[]>> {
    return safeCall(async () => {
      const rows = await db.select().from(marketingCampaigns).where(isNull(marketingCampaigns.deletedAt)).limit(20);
      return (Array.isArray(rows) ? rows : []).map((c) => ({ id: c.id, name: c.name, impressions: 0, clicks: 0, roi: 0 }));
    });
  }

  async getLeadsBySource(): Promise<Result<Record<string, unknown>[]>> {
    return safeCall(async () => {
      const rows = await db.select({
        source: marketingLeads.status,
        count: sql<number>`count(*)::int`,
      })
        .from(marketingLeads)
        .where(isNull(marketingLeads.deletedAt))
        .groupBy(marketingLeads.status);
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
}
