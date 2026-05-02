import { pgTable, serial, varchar, text, timestamp, boolean, integer } from 'drizzle-orm/pg-core';

export const websitePortfolio = pgTable('website_portfolio', {
  id:            serial('id').primaryKey(),
  titleUz:       varchar('title_uz', { length: 300 }).notNull(),
  titleRu:       varchar('title_ru', { length: 300 }),
  descriptionUz: text('description_uz'),
  descriptionRu: text('description_ru'),
  imageUrl:      text('image_url'),
  category:      varchar('category', { length: 100 }),
  clientName:    varchar('client_name', { length: 200 }),
  completedAt:   timestamp('completed_at'),
  isFeatured:    boolean('is_featured').notNull().default(false),
  orderIndex:    integer('order_index').notNull().default(0),
  createdAt:     timestamp('created_at').notNull().defaultNow(),
  updatedAt:     timestamp('updated_at').notNull().defaultNow(),
});
