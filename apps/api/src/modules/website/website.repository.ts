/**
 * @module website.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { db } from '../../infrastructure/database/database';
import {
  websiteSettings, websitePages, websiteBanners, portfolioItems,
} from '@europrint/schemas';
import { eq, desc, like } from 'drizzle-orm';
import { safeCall, Result } from '@common/result';

@Injectable()
export class WebsiteRepository {
  async getSettings(category?: string) : Promise<Result<Record<string, unknown>[]>>{
    return safeCall(async () => {
      if (category) {
        return await db.select().from(websiteSettings).where(eq(websiteSettings.category, category)).orderBy(websiteSettings.key);
      }
      return await db.select().from(websiteSettings).orderBy(websiteSettings.category, websiteSettings.key);
      }, 'DB_ERROR');
  }

  async findSettingByKey(key: string) : Promise<Result<Record<string, unknown> | undefined>>{
    return safeCall(async () => {
      const [existing] = await db.select().from(websiteSettings).where(eq(websiteSettings.key, key)).limit(1);
      return existing;
      }, 'DB_ERROR');
  }

  async updateSetting(key: string, value?: string, valueRu?: string, type?: string, category?: string) : Promise<Result<Record<string, unknown> | null>>{
    return safeCall(async () => {
      const [existing] = await db.select().from(websiteSettings).where(eq(websiteSettings.key, key)).limit(1);
      if (!existing) return null;
      const [updated] = await db.update(websiteSettings)
        .set({ value, valueRu, type: type || existing.type, category: category || existing.category, updatedAt: _time.now() } as Partial<typeof websiteSettings.$inferInsert>)
        .where(eq(websiteSettings.key, key))
        .returning();
      return updated;
      }, 'DB_ERROR');
  }

  async insertSetting(validated: typeof websiteSettings.$inferInsert) : Promise<Result<Record<string, unknown>>>{
    return safeCall(async () => {
      const [created] = await db.insert(websiteSettings).values(validated).returning();
      return created;
      }, 'DB_ERROR');
  }

  async listPages(type?: string) : Promise<Result<Record<string, unknown>[]>>{
    return safeCall(async () => {
      if (type) {
        return await db.select().from(websitePages).where(like(websitePages.slug, `${type}%`)).orderBy(desc(websitePages.createdAt));
      }
      return await db.select().from(websitePages).orderBy(desc(websitePages.createdAt));
      }, 'DB_ERROR');
  }

  async createPage(validated: typeof websitePages.$inferInsert) : Promise<Result<Record<string, unknown>>>{
    return safeCall(async () => {
      const [created] = await db.insert(websitePages).values(validated).returning();
      return created;
      }, 'DB_ERROR');
  }

  async updatePage(id: number, validatedData: Partial<typeof websitePages.$inferInsert>) : Promise<Result<Record<string, unknown>>>{
    return safeCall(async () => {
      const [updated] = await db.update(websitePages)
        .set({ ...validatedData, updatedAt: _time.now() } as Partial<typeof websitePages.$inferInsert>)
        .where(eq(websitePages.id, id))
        .returning();
      return updated;
      }, 'DB_ERROR');
  }

  async listNews() : Promise<Result<Record<string, unknown>[]>>{
    return safeCall(async () => {
      return await db.select().from(websitePages).where(like(websitePages.slug, 'news/%')).orderBy(desc(websitePages.createdAt));
      }, 'DB_ERROR');
  }

  async listBanners(position?: string) : Promise<Result<Record<string, unknown>[]>>{
    return safeCall(async () => {
      if (position) {
        return await db.select().from(websiteBanners).where(eq(websiteBanners.position, position)).orderBy(websiteBanners.sortOrder);
      }
      return await db.select().from(websiteBanners).orderBy(websiteBanners.sortOrder);
      }, 'DB_ERROR');
  }

  async createBanner(validated: typeof websiteBanners.$inferInsert) : Promise<Result<Record<string, unknown>>>{
    return safeCall(async () => {
      const [created] = await db.insert(websiteBanners).values(validated).returning();
      return created;
      }, 'DB_ERROR');
  }

  async updateBanner(id: number, validatedData: Partial<typeof websiteBanners.$inferInsert>) : Promise<Result<Record<string, unknown>>>{
    return safeCall(async () => {
      const [updated] = await db.update(websiteBanners)
        .set(validatedData)
        .where(eq(websiteBanners.id, id))
        .returning();
      return updated;
      }, 'DB_ERROR');
  }

  async listPortfolio() : Promise<Result<Record<string, unknown>[]>>{
    return safeCall(async () => {
      return await db.select().from(portfolioItems).orderBy(portfolioItems.sortOrder, desc(portfolioItems.createdAt));
      }, 'DB_ERROR');
  }

  async createPortfolioItem(validated: typeof portfolioItems.$inferInsert) : Promise<Result<Record<string, unknown>>>{
    return safeCall(async () => {
      const [created] = await db.insert(portfolioItems).values(validated).returning();
      return created;
      }, 'DB_ERROR');
  }

  async updatePortfolioItem(id: number, validatedData: Partial<typeof portfolioItems.$inferInsert>) : Promise<Result<Record<string, unknown>>>{
    return safeCall(async () => {
      const [updated] = await db.update(portfolioItems)
        .set(validatedData)
        .where(eq(portfolioItems.id, id))
        .returning();
      return updated;
      }, 'DB_ERROR');
  }
}
