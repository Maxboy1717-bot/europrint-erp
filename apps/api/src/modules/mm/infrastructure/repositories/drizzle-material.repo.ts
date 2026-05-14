/**
 * @module drizzle-material.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger } from '@nestjs/common';
import { pgTable, uuid, text, decimal, boolean, timestamp } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
import { eq, and, sql } from 'drizzle-orm';
import { Result, Ok, Err } from '@common/types/result.type';
import { db } from '@shared/db';
import { Material } from '../../domain/aggregates/material.aggregate';

const materials = pgTable('materials', {
  id: uuid('id').primaryKey().$defaultFn(() => createId()),
  materialCode: text('material_code').unique().notNull(),
  name: text('name').notNull(),
  category: text('category').notNull().default('raw_material'),
  unitOfMeasure: text('unit_of_measure').notNull().default('kg'),
  minStock: decimal('min_stock', { precision: 12, scale: 3 }).notNull().default('0'),
  maxStock: decimal('max_stock', { precision: 12, scale: 3 }).notNull().default('0'),
  unitCost: decimal('unit_cost', { precision: 18, scale: 2 }).notNull().default('0'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export interface IMmMaterialRepository {
  findById(id: string): Promise<Result<Material | null>>;
  findAll(filters: {
    category?: string;
    isActive?: boolean;
    lowStock?: boolean;
    page?: number;
    limit?: number;
  }): Promise<Result<{ data: Material[]; total: number }>>;
  save(material: Material): Promise<Result<Material>>;
  update(material: Material): Promise<Result<Material>>;
  getStats(): Promise<
    Result<{
      total: number;
      byCategory: Record<string, number>;
      lowStockCount: number;
      totalValue: number;
    }>
  >;
}

@Injectable()
export class DrizzleMaterialRepository implements IMmMaterialRepository {
  private readonly logger = new Logger(DrizzleMaterialRepository.name);

  constructor() {}

  async findById(id: string): Promise<Result<Material | null>> {
    try {
      const rows = await db.select().from(materials).where(eq(materials.id, id)).limit(1);
      const row = rows[0] as Record<string, unknown> | undefined;

      if (!row) {
        return Ok(null);
      }

      const material = this.mapRowToMaterial(row);
      return Ok(material);
    } catch (error: unknown) {
      this.logger.error('Failed to find material by id');
      return Err('Failed to find material');
    }
  }

  async findAll(filters: {
    category?: string;
    isActive?: boolean;
    lowStock?: boolean;
    page?: number;
    limit?: number;
  }): Promise<Result<{ data: Material[]; total: number }>> {
    try {
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const offset = (page - 1) * limit;

      const conditions = [];

      if (filters.category) {
        conditions.push(eq(materials.category, filters.category));
      }
      if (filters.isActive !== undefined) {
        conditions.push(eq(materials.isActive, filters.isActive));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const rawRows = await db.select().from(materials).where(whereClause).limit(limit).offset(offset);

      const rows = filters.lowStock
        ? (rawRows as (typeof rawRows[number] & Record<string, unknown>)[]).filter((row) => Number(row['minStock']) > 0)
        : rawRows;

      const countResult = await db
        .select({ count: sql`COUNT(*)` })
        .from(materials)
        .where(whereClause);

      const total = Number(countResult[0]?.count || 0);
      const materialObjects = (rows as Record<string, unknown>[]).map((row) => this.mapRowToMaterial(row));

      return Ok({ data: materialObjects, total });
    } catch (error: unknown) {
      this.logger.error('Failed to find materials');
      return Err('Failed to find materials');
    }
  }

  async save(material: Material): Promise<Result<Material>> {
    try {
      await db.insert(materials).values({
        id: material.id,
        materialCode: material.materialCode,
        name: material.name,
        category: material.category,
        unitOfMeasure: material.unitOfMeasure,
        minStock: material.minStock.toString(),
        maxStock: material.maxStock.toString(),
        unitCost: material.unitCost.toString(),
        isActive: material.isActive,
        createdAt: material.createdAt,
        updatedAt: material.updatedAt,
      });

      return Ok(material);
    } catch (error: unknown) {
      this.logger.error('Failed to save material');
      return Err('Failed to save material');
    }
  }

  async update(material: Material): Promise<Result<Material>> {
    try {
      await db
        .update(materials)
        .set({
          name: material.name,
          category: material.category,
          unitOfMeasure: material.unitOfMeasure,
          minStock: material.minStock.toString(),
          maxStock: material.maxStock.toString(),
          unitCost: material.unitCost.toString(),
          isActive: material.isActive,
          updatedAt: material.updatedAt,
        })
        .where(eq(materials.id, material.id));

      return Ok(material);
    } catch (error: unknown) {
      this.logger.error('Failed to update material');
      return Err('Failed to update material');
    }
  }

  async getStats(): Promise<
    Result<{
      total: number;
      byCategory: Record<string, number>;
      lowStockCount: number;
      totalValue: number;
    }>
  > {
    try {
      const rows = await db.select().from(materials);

      const byCategory: Record<string, number> = {};
      let lowStockCount = 0;
      let totalValue = 0;

      for (const row of (rows as Record<string, unknown>[])) {
        const cat = String(row['category'] ?? 'other');
        byCategory[cat] = (byCategory[cat] || 0) + 1;
        const minStock = Number(row['minStock'] || 0);
        const unitCost = Number(row['unitCost'] || 0);
        totalValue += unitCost * minStock;

        if (minStock > 0) {
          lowStockCount++;
        }
      }

      return Ok({
        total: rows.length,
        byCategory,
        lowStockCount,
        totalValue,
      });
    } catch (error: unknown) {
      this.logger.error('Failed to get material stats');
      return Err('Failed to get material stats');
    }
  }

  private mapRowToMaterial(row: Record<string, unknown>): Material {
    return new Material(
      String(row['id'] ?? ''),
      String(row['materialCode'] ?? ''),
      String(row['name'] ?? ''),
      String(row['category'] ?? ''),
      String(row['unitOfMeasure'] ?? ''),
      Number(row['minStock'] ?? 0),
      Number(row['maxStock'] ?? 0),
      Number(row['unitCost'] ?? 0),
      0,
      Boolean(row['isActive']),
      row['createdAt'] ? new Date(String(row['createdAt'])) : _time.now(),
      row['updatedAt'] ? new Date(String(row['updatedAt'])) : _time.now());
  }
}
