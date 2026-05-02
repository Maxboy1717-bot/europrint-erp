import z from 'zod';

export const insertCustomerOrderSchema = z.object({
  customerId: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(z.unknown()).optional(),
});

export const insertWebsitePageSchema = z.object({
  slug: z.string(),
  title: z.string(),
  content: z.string().optional(),
  isPublished: z.boolean().optional(),
});

export const insertWebsiteBannerSchema = z.object({
  title: z.string(),
  imageUrl: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const insertPortfolioItemSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  categoryId: z.string().optional(),
});

export const insertWebsiteSettingSchema = z.object({
  key: z.string(),
  value: z.string(),
});

export const insertProductCategorySchema = z.object({
  name: z.string(),
  slug: z.string().optional(),
  parentId: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().optional(),
});

export const insertPublicProductSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  price: z.number().optional(),
  categoryId: z.string().optional(),
  isActive: z.boolean().optional(),
  imageUrl: z.string().optional(),
});
