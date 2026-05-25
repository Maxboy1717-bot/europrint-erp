/**
 * @module MarketingWebsiteCMSTypes
 * @description Type definitions for the MarketingWebsiteCMS page.
 */

export interface NewsItem {
  id: number | string;
  title: string;
  title_ru?: string;
  summary?: string;
  image_url?: string;
  published_at?: string;
  is_published?: boolean;
  created_at?: string;
}
