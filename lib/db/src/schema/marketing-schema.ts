/**
 * @module marketing-schema
 * @description Drizzle ORM schema. Table definitions, CHECK constraints, FK relations.
 */

import { numericMoney } from "./numeric-money";
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, numeric, unique, date, check, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { goals } from "./core-schema";
import { Budget } from "./fi-schema";


// Marketing Campaigns (Reklama Kampaniyalari)
export const marketingCampaigns = pgTable("marketing_campaigns", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  type: varchar("type", { length: 50 }).default("digital"), // digital, print, social, email, event
  status: varchar("status", { length: 50 }).default("draft"), // draft, active, paused, completed
  budget: numeric("budget", { precision: 15, scale: 2 }).default("0"),
  spentAmount: numeric("spent_amount", { precision: 15, scale: 2 }).default("0"),
  platform: varchar("platform", { length: 100 }), // facebook, instagram, telegram, google
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  targetAudience: text("target_audience"),
  goals: text("goals"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: varchar("created_by", { length: 36 }),
  deletedAt: timestamp("deleted_at"),
}, (t) => [
  check("marketing_campaigns_status_chk", sql`${t.status} IN ('draft','active','paused','completed')`),
  check("marketing_campaigns_type_chk", sql`${t.type} IS NULL OR ${t.type} IN ('digital','print','social','email','event')`),
  check("marketing_campaigns_budget_chk", sql`${t.budget} IS NULL OR ${t.budget} >= 0`),
  check("marketing_campaigns_spent_chk", sql`${t.spentAmount} IS NULL OR ${t.spentAmount} >= 0`),
]);


export const insertMarketingCampaignSchema = createInsertSchema(marketingCampaigns, {
  name: z.string().min(3, "Nom kamida 3 ta belgidan iborat bo'lishi kerak"),
  type: z.enum(["digital", "print", "social", "email", "event"]).optional(),
  status: z.enum(["draft", "active", "paused", "completed"]).optional(),
  startDate: z.union([z.string(), z.date()]).transform(val => val ? new Date(val) : null).optional().nullable(),
  endDate: z.union([z.string(), z.date()]).transform(val => val ? new Date(val) : null).optional().nullable(),
  budget: z.union([z.string(), z.number()]).transform(val => String(val)).optional(),
  spentAmount: z.union([z.string(), z.number()]).transform(val => String(val)).optional(),
}).omit({ id: true, createdAt: true, updatedAt: true } as never);


export type MarketingCampaign = typeof marketingCampaigns.$inferSelect;

export type InsertMarketingCampaign = z.infer<typeof insertMarketingCampaignSchema>;


// Marketing Content (Kontent)
export const marketingContent = pgTable("marketing_content", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  contentRu: text("content_ru"),
  type: varchar("type", { length: 50 }).default("post"), // post, story, article, banner, video
  platform: varchar("platform", { length: 100 }), // telegram, instagram, facebook, website
  status: varchar("status", { length: 50 }).default("draft"), // draft, scheduled, published, archived
  campaignId: varchar("campaign_id", { length: 36 }).references(() => marketingCampaigns.id, { onDelete: "set null" }),
  scheduledAt: timestamp("scheduled_at"),
  publishedAt: timestamp("published_at"),
  imageUrl: text("image_url"),
  engagement: jsonb("engagement").default({}), // likes, shares, comments stats
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: varchar("created_by", { length: 36 }),
  deletedAt: timestamp("deleted_at"),
}, (t) => [
  check("marketing_content_status_chk", sql`${t.status} IN ('draft','scheduled','published','archived')`),
  check("marketing_content_type_chk", sql`${t.type} IS NULL OR ${t.type} IN ('post','story','article','banner','video')`),
]);


export const insertMarketingContentSchema = createInsertSchema(marketingContent, {
  title: z.string().min(3, "Sarlavha kamida 3 ta belgidan iborat bo'lishi kerak"),
  content: z.string().min(10, "Kontent kamida 10 ta belgidan iborat bo'lishi kerak"),
}).omit({ id: true, createdAt: true, updatedAt: true } as never);


export type MarketingContentType = typeof marketingContent.$inferSelect;

export type InsertMarketingContent = z.infer<typeof insertMarketingContentSchema>;


// Marketing Ads (Reklamalar)
export const marketingAds = pgTable("marketing_ads", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 255 }).notNull(),
  campaignId: varchar("campaign_id", { length: 36 }).references(() => marketingCampaigns.id, { onDelete: "set null" }),
  platform: varchar("platform", { length: 100 }).notNull(), // facebook, instagram, google, telegram
  type: varchar("type", { length: 50 }).default("image"), // image, video, carousel, text
  status: varchar("status", { length: 50 }).default("draft"), // draft, active, paused, completed
  budget: numeric("budget", { precision: 15, scale: 2 }).default("0"),
  spentAmount: numeric("spent_amount", { precision: 15, scale: 2 }).default("0"),
  impressions: integer("impressions").default(0),
  clicks: integer("clicks").default(0),
  conversions: integer("conversions").default(0),
  targetUrl: text("target_url"),
  adContent: text("ad_content"),
  imageUrl: text("image_url"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
}, (t) => [
  check("marketing_ads_status_chk", sql`${t.status} IN ('draft','active','paused','completed')`),
  check("marketing_ads_budget_chk", sql`${t.budget} IS NULL OR ${t.budget} >= 0`),
  check("marketing_ads_spent_chk", sql`${t.spentAmount} IS NULL OR ${t.spentAmount} >= 0`),
  check("marketing_ads_impressions_chk", sql`${t.impressions} IS NULL OR ${t.impressions} >= 0`),
  check("marketing_ads_clicks_chk", sql`${t.clicks} IS NULL OR ${t.clicks} >= 0`),
  check("marketing_ads_conversions_chk", sql`${t.conversions} IS NULL OR ${t.conversions} >= 0`),
]);


export const insertMarketingAdSchema = createInsertSchema(marketingAds, {
  name: z.string().min(3, "Nom kamida 3 ta belgidan iborat bo'lishi kerak"),
  platform: z.string().min(2, "Platforma kerak"),
  startDate: z.union([z.string(), z.date()]).transform(val => val ? new Date(val) : null).optional().nullable(),
  endDate: z.union([z.string(), z.date()]).transform(val => val ? new Date(val) : null).optional().nullable(),
  budget: z.union([z.string(), z.number()]).transform(val => String(val)).optional(),
  spentAmount: z.union([z.string(), z.number()]).transform(val => String(val)).optional(),
}).omit({ id: true, createdAt: true, updatedAt: true } as never);


export type MarketingAd = typeof marketingAds.$inferSelect;

export type InsertMarketingAd = z.infer<typeof insertMarketingAdSchema>;


// Marketing Leads (Marketing Lidlar)
export const marketingLeads = pgTable("marketing_leads", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 255 }).notNull(),
  company: varchar("company", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 255 }),
  source: varchar("source", { length: 100 }).default("website"),
  channel: varchar("channel", { length: 100 }),
  campaignId: varchar("campaign_id", { length: 36 }),
  status: varchar("status", { length: 50 }).default("new"),
  score: integer("score").default(0),
  notes: text("notes"),
  crmLeadId: varchar("crm_lead_id", { length: 36 }),
  assignedTo: varchar("assigned_to", { length: 36 }),
  lostReason: varchar("lost_reason", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
  // --- live-DB superset (A12 convergence) ---
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  convertedAt: timestamp("converted_at"),
}, (t) => [
  check("marketing_leads_status_chk", sql`${t.status} IN ('new','qualified','contacted','converted','lost')`),
  check("marketing_leads_score_chk", sql`${t.score} IS NULL OR ${t.score} >= 0`),
]);


export const insertMarketingLeadSchema = createInsertSchema(marketingLeads, {
  name: z.string().min(2, "Ism kamida 2 ta belgidan iborat bo'lishi kerak"),
  score: z.union([z.string(), z.number()]).transform(val => Number(val)).optional(),
}).omit({ id: true, createdAt: true, updatedAt: true } as never);


export type MarketingLead = typeof marketingLeads.$inferSelect;

export type InsertMarketingLead = z.infer<typeof insertMarketingLeadSchema>;


// Content Calendar (Kontent Taqvimi)
export const contentCalendar = pgTable("content_calendar", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content"),
  platform: varchar("platform", { length: 100 }).notNull(),
  type: varchar("type", { length: 50 }).default("post"),
  scheduledDate: timestamp("scheduled_date").notNull(),
  status: varchar("status", { length: 50 }).default("planned"),
  contentId: varchar("content_id", { length: 36 }),
  campaignId: varchar("campaign_id", { length: 36 }),
  assignedTo: varchar("assigned_to", { length: 36 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [
  check("content_calendar_status_chk", sql`${t.status} IN ('planned','in_progress','published','cancelled')`),
]);


export const insertContentCalendarSchema = createInsertSchema(contentCalendar, {
  title: z.string().min(2),
  scheduledDate: z.union([z.string(), z.date()]).transform(val => new Date(val)),
}).omit({ id: true, createdAt: true, updatedAt: true } as never);


export type ContentCalendar = typeof contentCalendar.$inferSelect;

export type InsertContentCalendar = z.infer<typeof insertContentCalendarSchema>;


// Exhibitions (Ko'rgazmalar)
export const exhibitions = pgTable("exhibitions", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 255 }).notNull(),
  nameRu: varchar("name_ru", { length: 255 }),
  location: varchar("location", { length: 255 }),
  country: varchar("country", { length: 100 }).default("Uzbekistan"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  budget: numeric("budget", { precision: 15, scale: 2 }).default("0"),
  spentAmount: numeric("spent_amount", { precision: 15, scale: 2 }).default("0"),
  actualSpend: numeric("actual_spend", { precision: 15, scale: 2 }).default("0"),
  leadCount: integer("lead_count").default(0),
  dealCount: integer("deal_count").default(0),
  dealValue: numeric("deal_value", { precision: 15, scale: 2 }).default("0"),
  roi: numeric("roi", { precision: 10, scale: 2 }),
  status: varchar("status", { length: 50 }).default("planned"),
  description: text("description"),
  teamMembers: text("team_members"),
  assignedTeam: jsonb("assigned_team").default([]),
  notes: text("notes"),
  qrCode: varchar("qr_code", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
}, (t) => [
  check("exhibitions_status_chk", sql`${t.status} IN ('planned','ongoing','completed','cancelled')`),
  check("exhibitions_budget_chk", sql`${t.budget} IS NULL OR ${t.budget} >= 0`),
  check("exhibitions_spent_chk", sql`${t.spentAmount} IS NULL OR ${t.spentAmount} >= 0`),
  check("exhibitions_deal_value_chk", sql`${t.dealValue} IS NULL OR ${t.dealValue} >= 0`),
]);


export const insertExhibitionSchema = createInsertSchema(exhibitions, {
  name: z.string().min(3),
  startDate: z.union([z.string(), z.date()]).transform(val => val ? new Date(val) : null).optional().nullable(),
  endDate: z.union([z.string(), z.date()]).transform(val => val ? new Date(val) : null).optional().nullable(),
  budget: z.union([z.string(), z.number()]).transform(val => String(val)).optional(),
  spentAmount: z.union([z.string(), z.number()]).transform(val => String(val)).optional(),
  dealValue: z.union([z.string(), z.number()]).transform(val => String(val)).optional(),
  roi: z.union([z.string(), z.number()]).transform(val => String(val)).optional().nullable(),
}).omit({ id: true, createdAt: true, updatedAt: true } as never);


export type Exhibition = typeof exhibitions.$inferSelect;

export type InsertExhibition = z.infer<typeof insertExhibitionSchema>;


// Exhibition Leads (Ko'rgazma Lidlari)
export const exhibitionLeads = pgTable("exhibition_leads", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  exhibitionId: varchar("exhibition_id", { length: 36 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  fullName: varchar("full_name", { length: 255 }),
  company: varchar("company", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 255 }),
  interest: text("interest"),
  estimatedVolume: varchar("estimated_volume", { length: 100 }),
  crmLeadId: varchar("crm_lead_id", { length: 36 }),
  notes: text("notes"),
  scannedAt: timestamp("scanned_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});


export const insertExhibitionLeadSchema = createInsertSchema(exhibitionLeads, {
  name: z.string().min(2),
}).omit({ id: true, createdAt: true } as never);


export type ExhibitionLead = typeof exhibitionLeads.$inferSelect;

export type InsertExhibitionLead = z.infer<typeof insertExhibitionLeadSchema>;


// PR Activities (PR Faoliyatlari)
export const prActivities = pgTable("pr_activities", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  type: varchar("type", { length: 50 }).notNull(),
  media: varchar("media", { length: 255 }),
  mediaName: varchar("media_name", { length: 255 }),
  title: varchar("title", { length: 500 }).notNull(),
  date: timestamp("date"),
  publishDate: timestamp("publish_date"),
  url: text("url"),
  reach: integer("reach").default(0),
  sentiment: varchar("sentiment", { length: 20 }),
  status: varchar("status", { length: 50 }).default("planned"),
  description: text("description"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
}, (t) => [
  check("pr_activities_status_chk", sql`${t.status} IN ('planned','in_progress','published','cancelled')`),
  check("pr_activities_sentiment_chk", sql`${t.sentiment} IS NULL OR ${t.sentiment} IN ('positive','neutral','negative')`),
  check("pr_activities_reach_chk", sql`${t.reach} IS NULL OR ${t.reach} >= 0`),
]);


export const insertPrActivitySchema = createInsertSchema(prActivities, {
  title: z.string().min(3),
  type: z.string().min(2),
  date: z.union([z.string(), z.date()]).transform(val => val ? new Date(val) : null).optional().nullable(),
}).omit({ id: true, createdAt: true, updatedAt: true } as never);


export type PrActivity = typeof prActivities.$inferSelect;

export type InsertPrActivity = z.infer<typeof insertPrActivitySchema>;


// Marketing Budget Items (Marketing Byudjet)
export const marketingBudgetItems = pgTable("marketing_budget_items", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  category: varchar("category", { length: 100 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  year: integer("year").notNull(),
  month: integer("month"),
  plannedAmount: numeric("planned_amount", { precision: 15, scale: 2 }).default("0"),
  actualAmount: numeric("actual_amount", { precision: 15, scale: 2 }).default("0"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [
  check("marketing_budget_items_month_chk", sql`${t.month} IS NULL OR (${t.month} >= 1 AND ${t.month} <= 12)`),
  check("marketing_budget_items_planned_chk", sql`${t.plannedAmount} IS NULL OR ${t.plannedAmount} >= 0`),
  check("marketing_budget_items_actual_chk", sql`${t.actualAmount} IS NULL OR ${t.actualAmount} >= 0`),
]);


export const insertMarketingBudgetItemSchema = createInsertSchema(marketingBudgetItems, {
  category: z.string().min(2),
  name: z.string().min(2),
  year: z.union([z.string(), z.number()]).transform(val => Number(val)),
  month: z.union([z.string(), z.number()]).transform(val => Number(val)).optional().nullable(),
  plannedAmount: z.union([z.string(), z.number()]).transform(val => String(val)).optional(),
  actualAmount: z.union([z.string(), z.number()]).transform(val => String(val)).optional(),
}).omit({ id: true, createdAt: true, updatedAt: true } as never);


export type MarketingBudgetItem = typeof marketingBudgetItems.$inferSelect;

export type InsertMarketingBudgetItem = z.infer<typeof insertMarketingBudgetItemSchema>;


// Social Conversations (Ijtimoiy tarmoq suhbatlari)
export const socialConversations = pgTable("social_conversations", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  platform: varchar("platform", { length: 50 }).notNull(),
  externalId: varchar("external_id", { length: 255 }),
  contactName: varchar("contact_name", { length: 255 }),
  contactPhone: varchar("contact_phone", { length: 50 }),
  contactAvatar: text("contact_avatar"),
  contactId: varchar("contact_id", { length: 255 }),
  crmLeadId: varchar("crm_lead_id", { length: 36 }),
  crmContactId: integer("crm_contact_id"),
  status: varchar("status", { length: 50 }).default("open"),
  assignedTo: varchar("assigned_to", { length: 36 }),
  isAiHandling: boolean("is_ai_handling").default(true),
  lastMessage: text("last_message"),
  lastMessageAt: timestamp("last_message_at"),
  unreadCount: integer("unread_count").default(0),
  priority: varchar("priority", { length: 20 }).default("normal"),
  tags: jsonb("tags").default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [
  check("social_conversations_status_chk", sql`${t.status} IN ('open','closed','pending')`),
  check("social_conversations_priority_chk", sql`${t.priority} IN ('low','normal','high','urgent')`),
  check("social_conversations_unread_chk", sql`${t.unreadCount} IS NULL OR ${t.unreadCount} >= 0`),
]);


export const insertSocialConversationSchema = createInsertSchema(socialConversations, {
  platform: z.string().min(2),
}).omit({ id: true, createdAt: true, updatedAt: true } as never);


export type SocialConversation = typeof socialConversations.$inferSelect;

export type InsertSocialConversation = z.infer<typeof insertSocialConversationSchema>;


// Social Messages (Ijtimoiy tarmoq xabarlari)
export const socialMessages = pgTable("social_messages", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  conversationId: varchar("conversation_id", { length: 36 }).notNull(),
  direction: varchar("direction", { length: 20 }).default("incoming"),
  text: text("text"),
  mediaUrl: text("media_url"),
  mediaType: varchar("media_type", { length: 20 }),
  isAi: boolean("is_ai").default(false),
  isAiGenerated: boolean("is_ai_generated").default(false),
  isRead: boolean("is_read").default(false),
  externalMessageId: varchar("external_message_id", { length: 255 }),
  sentAt: timestamp("sent_at").defaultNow(),
  deliveredAt: timestamp("delivered_at"),
  readAt: timestamp("read_at"),
}, (t) => [
  check("social_messages_direction_chk", sql`${t.direction} IN ('incoming','outgoing')`),
]);


export const insertSocialMessageSchema = createInsertSchema(socialMessages, {
  conversationId: z.string().min(1),
}).omit({ id: true, sentAt: true } as never);


export type SocialMessage = typeof socialMessages.$inferSelect;

export type InsertSocialMessage = z.infer<typeof insertSocialMessageSchema>;


// Social API Configs (Meta, Telegram tokens)
export const socialApiConfigs = pgTable("social_api_configs", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  platform: varchar("platform", { length: 20 }).notNull().unique(),
  accessToken: text("access_token"),
  pageId: varchar("page_id", { length: 255 }),
  accountId: varchar("account_id", { length: 255 }),
  webhookSecret: varchar("webhook_secret", { length: 255 }),
  botToken: varchar("bot_token", { length: 255 }),
  isActive: boolean("is_active").default(false),
  lastSyncAt: timestamp("last_sync_at"),
  settings: jsonb("settings").default({}),
  updatedAt: timestamp("updated_at").defaultNow(),
});


export const insertSocialApiConfigSchema = createInsertSchema(socialApiConfigs, {
  platform: z.string().min(2),
}).omit({ id: true, updatedAt: true } as never);


export type SocialApiConfig = typeof socialApiConfigs.$inferSelect;

export type InsertSocialApiConfig = z.infer<typeof insertSocialApiConfigSchema>;


// Content Posts (Kontent postlari — publishing)
export const contentPosts = pgTable("content_posts", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: varchar("title", { length: 255 }).notNull(),
  bodyUz: text("body_uz"),
  bodyRu: text("body_ru"),
  mediaUrls: jsonb("media_urls").default([]),
  platforms: jsonb("platforms").default([]),
  hashtags: text("hashtags"),
  status: varchar("status", { length: 20 }).default("draft"),
  scheduledAt: timestamp("scheduled_at"),
  publishedAt: timestamp("published_at"),
  campaignId: varchar("campaign_id", { length: 36 }),
  createdBy: varchar("created_by", { length: 36 }),
  approvedBy: varchar("approved_by", { length: 36 }),
  isAiGenerated: boolean("is_ai_generated").default(false),
  aiPromptUsed: text("ai_prompt_used"),
  publishResults: jsonb("publish_results").default({}),
  engagementStats: jsonb("engagement_stats").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [
  check("content_posts_status_chk", sql`${t.status} IN ('draft','scheduled','published','archived')`),
]);


export const insertContentPostSchema = createInsertSchema(contentPosts, {
  title: z.string().min(2),
}).omit({ id: true, createdAt: true, updatedAt: true } as never);


export type ContentPost = typeof contentPosts.$inferSelect;

export type InsertContentPost = z.infer<typeof insertContentPostSchema>;
// Blog Posts (Website blog)
export const blogPosts = pgTable("blog_posts", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  titleUz: varchar("title_uz", { length: 500 }).notNull(),
  titleRu: varchar("title_ru", { length: 500 }),
  bodyUz: text("body_uz"),
  bodyRu: text("body_ru"),
  excerpt: text("excerpt"),
  coverImage: text("cover_image"),
  tags: jsonb("tags").default([]),
  seoTitle: varchar("seo_title", { length: 255 }),
  seoDescription: text("seo_description"),
  isPublished: boolean("is_published").default(false),
  publishedAt: timestamp("published_at"),
  authorId: varchar("author_id", { length: 36 }),
  viewCount: integer("view_count").default(0),
  isAiGenerated: boolean("is_ai_generated").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});


export const insertBlogPostSchema = createInsertSchema(blogPosts, {
  titleUz: z.string().min(3),
  slug: z.string().min(3),
}).omit({ id: true, createdAt: true, updatedAt: true } as never);


export type BlogPost = typeof blogPosts.$inferSelect;

export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;


// Marketing Budget Lines (Byudjet qatorlari)
export const marketingBudgetLines = pgTable("marketing_budget_lines", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  year: integer("year").notNull(),
  month: integer("month"),
  category: varchar("category", { length: 50 }).notNull(),
  plannedAmount: numeric("planned_amount", { precision: 15, scale: 2 }).default("0"),
  actualAmount: numeric("actual_amount", { precision: 15, scale: 2 }).default("0"),
  description: varchar("description", { length: 500 }),
  approvedBy: varchar("approved_by", { length: 36 }),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [
  check("marketing_budget_lines_month_chk", sql`${t.month} IS NULL OR (${t.month} >= 1 AND ${t.month} <= 12)`),
  check("marketing_budget_lines_planned_chk", sql`${t.plannedAmount} IS NULL OR ${t.plannedAmount} >= 0`),
  check("marketing_budget_lines_actual_chk", sql`${t.actualAmount} IS NULL OR ${t.actualAmount} >= 0`),
]);


export const insertMarketingBudgetLineSchema = createInsertSchema(marketingBudgetLines, {
  category: z.string().min(2),
  year: z.union([z.string(), z.number()]).transform(val => Number(val)),
  month: z.union([z.string(), z.number()]).transform(val => Number(val)).optional().nullable(),
  plannedAmount: z.union([z.string(), z.number()]).transform(val => String(val)).optional(),
  actualAmount: z.union([z.string(), z.number()]).transform(val => String(val)).optional(),
}).omit({ id: true, createdAt: true } as never);


export type MarketingBudgetLine = typeof marketingBudgetLines.$inferSelect;

export type InsertMarketingBudgetLine = z.infer<typeof insertMarketingBudgetLineSchema>;


// Marketing Settings (Marketing Sozlamalari)
export const marketingSettings = pgTable("marketing_settings", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value"),
  category: varchar("category", { length: 100 }).default("general"),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow(),
});


export const insertMarketingSettingSchema = createInsertSchema(marketingSettings, {
  key: z.string().min(2),
}).omit({ id: true, updatedAt: true } as never);


export type MarketingSetting = typeof marketingSettings.$inferSelect;

export type InsertMarketingSetting = z.infer<typeof insertMarketingSettingSchema>;


// NPS Responses (Mijoz mamnuniyati)
export const npsResponses = pgTable("nps_responses", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  papkaOrderId: varchar("papka_order_id", { length: 36 }),
  customerId: integer("customer_id"),
  score: integer("score").notNull(), // 1-10
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [
  check("nps_responses_score_chk", sql`${t.score} >= 1 AND ${t.score} <= 10`),
]);

export const insertNpsResponseSchema = createInsertSchema(npsResponses, {
  score: z.number().int().min(1).max(10),
  comment: z.string().optional().nullable(),
}).omit({ id: true, createdAt: true } as never);

export type NpsResponse = typeof npsResponses.$inferSelect;
export type InsertNpsResponse = z.infer<typeof insertNpsResponseSchema>;


// A/B Tests (A/B Testlar)
export const marketingAbTests = pgTable("marketing_ab_tests", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  campaignId: varchar("campaign_id", { length: 36 }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  variantA: varchar("variant_a", { length: 500 }).notNull(),
  variantB: varchar("variant_b", { length: 500 }).notNull(),
  impressionsA: integer("impressions_a").default(0),
  impressionsB: integer("impressions_b").default(0),
  clicksA: integer("clicks_a").default(0),
  clicksB: integer("clicks_b").default(0),
  conversionsA: integer("conversions_a").default(0),
  conversionsB: integer("conversions_b").default(0),
  status: varchar("status", { length: 50 }).default("running"), // running, paused, completed
  winner: varchar("winner", { length: 10 }), // A or B
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date"),
  createdBy: varchar("created_by", { length: 36 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [
  check("marketing_ab_tests_status_chk", sql`${t.status} IN ('running','paused','completed')`),
  check("marketing_ab_tests_winner_chk", sql`${t.winner} IS NULL OR ${t.winner} IN ('A','B')`),
]);

export const insertMarketingAbTestSchema = createInsertSchema(marketingAbTests, {
  name: z.string().min(2),
  variantA: z.string().min(1),
  variantB: z.string().min(1),
}).omit({ id: true, createdAt: true, updatedAt: true } as never);

export type MarketingAbTest = typeof marketingAbTests.$inferSelect;
export type InsertMarketingAbTest = z.infer<typeof insertMarketingAbTestSchema>;


// Lead Contact Logs (Aloqa loglari)
export const marketingLeadContacts = pgTable("marketing_lead_contacts", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  leadId: varchar("lead_id", { length: 36 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // call, meeting, email, whatsapp, telegram
  summary: text("summary"),
  outcome: varchar("outcome", { length: 100 }), // interested, not_interested, callback, no_answer, converted
  contactedBy: varchar("contacted_by", { length: 36 }),
  contactedAt: timestamp("contacted_at").defaultNow(),
  nextFollowUp: timestamp("next_follow_up"),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [
  check("marketing_lead_contacts_type_chk", sql`${t.type} IN ('call','meeting','email','whatsapp','telegram')`),
  check("marketing_lead_contacts_outcome_chk", sql`${t.outcome} IS NULL OR ${t.outcome} IN ('interested','not_interested','callback','no_answer','converted')`),
]);

export const insertMarketingLeadContactSchema = createInsertSchema(marketingLeadContacts, {
  type: z.enum(["call", "meeting", "email", "whatsapp", "telegram"]),
  outcome: z.string().optional().nullable(),
}).omit({ id: true, createdAt: true } as never);

export type MarketingLeadContact = typeof marketingLeadContacts.$inferSelect;
export type InsertMarketingLeadContact = z.infer<typeof insertMarketingLeadContactSchema>;


// marketing_calendar_events: defined in apps/api/src/shared/db/schema-marketing-group2.ts
// (will be moved here once lib/db dist is rebuilt)

