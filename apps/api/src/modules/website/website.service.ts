/**
 * @module website.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  insertWebsiteSettingSchema, insertWebsitePageSchema,
  insertWebsiteBannerSchema, insertPortfolioItemSchema,
} from '@europrint/schemas';
import { safeCall, Ok, Result, AppError } from '@common/result';
import { WebsiteRepository } from './website.repository';

@Injectable()
export class WebsiteService {
  private readonly logger = new Logger(WebsiteService.name);

  constructor(private readonly repo: WebsiteRepository) {}

  async getSettings(category?: string): Promise<Result<object, AppError>> {
    const r = await this.repo.getSettings(category);
    if (!r.ok) {
      this.logger.warn('website_settings unavailable', r.error.message);
      return Ok([]);
    }
    return r;
  }

  async upsertSetting(key: string, body: Record<string, unknown>) {
    return safeCall(async () => {
      const validatedData = insertWebsiteSettingSchema.partial().parse(body) as { value?: string; valueRu?: string; type?: string; category?: string; key?: string };
      const { value, valueRu, type, category } = validatedData;
      const existing = await this.repo.findSettingByKey(key);
      if (existing) {
        return this.repo.updateSetting(key, value, valueRu, type, category);
      }
      const validated = insertWebsiteSettingSchema.parse({ key, value, valueRu, type, category });
      return this.repo.insertSetting(validated as Parameters<typeof this.repo.insertSetting>[0]);
    });
  }

  async listPages(type?: string) {
    const r = await this.repo.listPages(type);
    if (!r.ok) {
      this.logger.warn('website_pages unavailable', r.error.message);
      return Ok([]);
    }
    return r;
  }

  async createPage(body: Record<string, unknown>) {
    return safeCall(async () => {
      const validated = insertWebsitePageSchema.parse(body);
      return this.repo.createPage(validated as Parameters<typeof this.repo.createPage>[0]);
    });
  }

  async updatePage(id: number, body: Record<string, unknown>) {
    return safeCall(async () => {
      const validatedData = insertWebsitePageSchema.partial().parse(body);
      const updated = await this.repo.updatePage(id, validatedData as Parameters<typeof this.repo.updatePage>[1]);
      if (!updated) throw new NotFoundException('Sahifa topilmadi');
      return updated;
    });
  }

  async listNews() {
    const r = await this.repo.listNews();
    if (!r.ok) {
      this.logger.warn('website_pages (news) unavailable', r.error.message);
      return Ok([]);
    }
    return r;
  }

  async listBanners(position?: string) {
    const r = await this.repo.listBanners(position);
    if (!r.ok) {
      this.logger.warn('website_banners unavailable', r.error.message);
      return Ok([]);
    }
    return r;
  }

  async createBanner(body: Record<string, unknown>) {
    return safeCall(async () => {
      const validated = insertWebsiteBannerSchema.parse(body);
      return this.repo.createBanner(validated as Parameters<typeof this.repo.createBanner>[0]);
    });
  }

  async updateBanner(id: number, body: Record<string, unknown>) {
    return safeCall(async () => {
      const validatedData = insertWebsiteBannerSchema.partial().parse(body);
      const updated = await this.repo.updateBanner(id, validatedData as Parameters<typeof this.repo.updateBanner>[1]);
      if (!updated) throw new NotFoundException('Banner topilmadi');
      return updated;
    });
  }

  async listPortfolio() {
    const r = await this.repo.listPortfolio();
    if (!r.ok) {
      this.logger.warn('portfolio_items unavailable', r.error.message);
      return Ok([]);
    }
    return r;
  }

  async createPortfolioItem(body: Record<string, unknown>) {
    return safeCall(async () => {
      const validated = insertPortfolioItemSchema.parse(body);
      return this.repo.createPortfolioItem(validated as Parameters<typeof this.repo.createPortfolioItem>[0]);
    });
  }

  async updatePortfolioItem(id: number, body: Record<string, unknown>) {
    return safeCall(async () => {
      const validatedData = insertPortfolioItemSchema.partial().parse(body);
      const updated = await this.repo.updatePortfolioItem(id, validatedData as Parameters<typeof this.repo.updatePortfolioItem>[1]);
      if (!updated) throw new NotFoundException('Portfolio elementi topilmadi');
      return updated;
    });
  }
}
