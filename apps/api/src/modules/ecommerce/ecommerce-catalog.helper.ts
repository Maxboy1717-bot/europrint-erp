/**
 * @module ecommerce-catalog.helper
 * @description Source module. See exports for details.
 */

import { NotFoundException, HttpException, HttpStatus, BadRequestException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { db } from '../../infrastructure/database/database';
import { publicProducts, productCategories, insertPublicProductSchema, insertProductCategorySchema } from '@europrint/schemas';
import { eq, desc, count, and, sql } from 'drizzle-orm';
import { safeCall } from '@common/result';

export async function ecommerceListCategories() {
  return safeCall(async () => {
  return db.select().from(productCategories).orderBy(productCategories.sortOrder, productCategories.name);
  });}

export async function ecommerceGetCategoryById(id: string, i18n: I18nService) {
  return safeCall(async () => {
  const [category] = await db.select().from(productCategories).where(eq(productCategories.id, parseInt(id))).limit(1);
  if (!category) throw new NotFoundException(await i18n.t('errors.categoryNotFound'));
  return category;
  });}

export async function ecommerceCreateCategory(body: Record<string, unknown>, i18n: I18nService) {
  return safeCall(async () => {
  const validated = insertProductCategorySchema.parse(body);
  const [created] = await db.insert(productCategories).values(validated as typeof productCategories.$inferInsert).returning();
  if (!created) throw new HttpException(await i18n.t('errors.createFailed'), HttpStatus.INTERNAL_SERVER_ERROR);
  return created;
  });}

export async function ecommerceUpdateCategory(id: string, body: Record<string, unknown>, i18n: I18nService) {
  return safeCall(async () => {
  const validatedData = insertProductCategorySchema.partial().parse(body);
  const [updated] = await db.update(productCategories).set(validatedData).where(eq(productCategories.id, parseInt(id))).returning();
  if (!updated) throw new NotFoundException(await i18n.t('errors.categoryNotFound'));
  return updated;
  });}

export async function ecommerceCheckCategoryEmpty(id: string, i18n: I18nService) {
  return safeCall(async () => {
  const [productCount] = await db.select({ count: count() }).from(publicProducts).where(eq(publicProducts.categoryId, parseInt(id)));
  if (productCount && Number(productCount.count) > 0) {
    throw new BadRequestException(await i18n.t('errors.categoryHasProducts'));
  }
  });}

export async function ecommerceGetPublicCategories() {
  return safeCall(async () => {
  return db.select().from(productCategories).where(eq(productCategories.isActive, true)).orderBy(productCategories.sortOrder, productCategories.name);
  });}

export async function ecommerceGetPublicProductBySlug(slug: string, i18n: I18nService) {
  return safeCall(async () => {
  const [result] = await db.select({ product: publicProducts, category: productCategories })
    .from(publicProducts)
    .leftJoin(productCategories, eq(publicProducts.categoryId, productCategories.id))
    .where(eq(publicProducts.slug, slug))
    .limit(1);
  if (!result) throw new NotFoundException(await i18n.t('errors.productNotFound'));
  return { ...result.product, category: result.category };
  });}

export async function ecommerceListProducts(query: Record<string, unknown>) {
  return safeCall(async () => {
  const page = parseInt(String(query.page)) || 1;
  const limit = parseInt(String(query.limit)) || 20;
  const offset = (page - 1) * limit;
  const categoryId = query.categoryId ? parseInt(String(query.categoryId)) : undefined;
  const search = query.search as string | undefined;
  const inStock = query.inStock !== undefined && query.inStock !== '' ? query.inStock === 'true' : undefined;
  const conditions = [];
  if (categoryId !== undefined && !Number.isNaN(categoryId)) conditions.push(eq(publicProducts.categoryId, categoryId));
  if (search) conditions.push(sql`(${publicProducts.name} ILIKE ${`%${search}%`} OR ${publicProducts.slug} ILIKE ${`%${search}%`})`);
  if (inStock !== undefined) conditions.push(eq(publicProducts.inStock, inStock));
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const [products, totalResult] = await Promise.all([
    db.select({ product: publicProducts, category: productCategories })
      .from(publicProducts)
      .leftJoin(productCategories, eq(publicProducts.categoryId, productCategories.id))
      .where(whereClause)
      .orderBy(desc(publicProducts.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: count() }).from(publicProducts).where(whereClause),
  ]);
  const total = totalResult[0]?.count || 0;
  return {
    products: (Array.isArray(products) ? products : []).map((p) => ({ ...p.product, category: p.category })),
    pagination: { page, limit, total, totalPages: Math.ceil(Number(total) / limit) },
  };
  });}

export async function ecommerceGetProduct(id: string, i18n: I18nService) {
  return safeCall(async () => {
  const [result] = await db.select({ product: publicProducts, category: productCategories })
    .from(publicProducts)
    .leftJoin(productCategories, eq(publicProducts.categoryId, productCategories.id))
    .where(eq(publicProducts.id, parseInt(id)))
    .limit(1);
  if (!result) throw new NotFoundException(await i18n.t('errors.productNotFound'));
  return { ...result.product, category: result.category };
  });}

export async function ecommerceCreateProduct(body: Record<string, unknown>, i18n: I18nService) {
  return safeCall(async () => {
  const validated = insertPublicProductSchema.parse(body);
  const [created] = await db.insert(publicProducts).values(validated as typeof publicProducts.$inferInsert).returning();
  if (!created) throw new HttpException(await i18n.t('errors.createFailed'), HttpStatus.INTERNAL_SERVER_ERROR);
  return created;
  });}

export async function ecommerceUpdateProduct(id: string, body: Record<string, unknown>, i18n: I18nService) {
  return safeCall(async () => {
  const validatedData = insertPublicProductSchema.partial().parse(body);
  const [updated] = await db.update(publicProducts).set(validatedData as Partial<typeof publicProducts.$inferInsert>).where(eq(publicProducts.id, parseInt(id))).returning();
  if (!updated) throw new NotFoundException(await i18n.t('errors.productNotFound'));
  return updated;
  });}


