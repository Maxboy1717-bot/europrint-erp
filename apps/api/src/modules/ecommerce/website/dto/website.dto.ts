/**
 * @module website.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';

export const WebsiteUpdateSettingSchema = z.object({
  value: z.unknown(),
  label: z.string().optional(),
});
export type WebsiteUpdateSettingDto = z.infer<typeof WebsiteUpdateSettingSchema>;

export const WebsiteUpsertSettingSchema = WebsiteUpdateSettingSchema;
export type WebsiteUpsertSettingDto = WebsiteUpdateSettingDto;

export const WebsiteCreatePageSchema = z.object({
  title:       z.string().min(1).max(255),
  slug:        z.string().min(1).max(255).optional(),
  content:     z.string().optional(),
  is_published: z.boolean().optional(),
  meta_title:  z.string().max(255).optional(),
  meta_desc:   z.string().max(500).optional(),
});
export type WebsiteCreatePageDto = z.infer<typeof WebsiteCreatePageSchema>;

export const WebsiteUpdatePageSchema = z.object({
  title:        z.string().min(1).max(255).optional(),
  content:      z.string().optional(),
  is_published: z.boolean().optional(),
  meta_title:   z.string().max(255).optional(),
  meta_desc:    z.string().max(500).optional(),
});
export type WebsiteUpdatePageDto = z.infer<typeof WebsiteUpdatePageSchema>;

export const WebsiteCreateBannerSchema = z.object({
  title:       z.string().min(1).max(255),
  image_url:   z.string().min(1),
  link_url:    z.string().optional(),
  is_active:   z.boolean().optional(),
  sort_order:  z.number().int().min(0).optional(),
});
export type WebsiteCreateBannerDto = z.infer<typeof WebsiteCreateBannerSchema>;

export const WebsiteUpdateBannerSchema = z.object({
  title:      z.string().min(1).max(255).optional(),
  image_url:  z.string().optional(),
  link_url:   z.string().optional(),
  is_active:  z.boolean().optional(),
  sort_order: z.number().int().min(0).optional(),
});
export type WebsiteUpdateBannerDto = z.infer<typeof WebsiteUpdateBannerSchema>;

export const WebsiteCreatePortfolioSchema = z.object({
  title:       z.string().min(1).max(255),
  description: z.string().optional(),
  image_url:   z.string().optional(),
  category:    z.string().max(100).optional(),
  is_featured: z.boolean().optional(),
});
export type WebsiteCreatePortfolioDto = z.infer<typeof WebsiteCreatePortfolioSchema>;

export const WebsiteUpdatePortfolioSchema = z.object({
  title:       z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  image_url:   z.string().optional(),
  category:    z.string().max(100).optional(),
  is_featured: z.boolean().optional(),
});
export type WebsiteUpdatePortfolioDto = z.infer<typeof WebsiteUpdatePortfolioSchema>;
