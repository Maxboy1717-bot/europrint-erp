/**
 * @module drizzle-material.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 *
 * Canonical store = `material_cards` (INT serial PK, 14 inbound FKs, the real
 * materials master). The legacy uuid `materials` orphan world is retired —
 * this repo now reads/writes `materialCards`. Field mapping:
 *   material aggregate          material_cards column
 *   ----------------            ---------------------
 *   id (string of serial)   <-> id (serial int)
 *   materialCode            <-> kod (UNIQUE NOT NULL; generated MAT-<epoch> if absent)
 *   name                    <-> xom_ashyo (NOT NULL)
 *   category                <-> category
 *   unitOfMeasure           <-> unit_of_measure (NOT NULL)
 *   minStock                <-> min_stock
 *   maxStock                <-> max_stock
 *   unitCost                <-> unit_price
 *   currentStock            <-> current_stock
 *   isActive                <-> is_active
 *   createdAt/updatedAt     <-> created_at/updated_at
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger } from '@nestjs/common';
import { db, materialCards, eq, and, sql } from '@workspace/db';
import { Result, Ok, Err } from '@common/types/result.type';
import { Material } from '../../domain/aggregates/material.aggregate';
import { MM_MATERIAL_REPO } from '../../domain/repositories/mm.repository';

export { MM_MATERIAL_REPO };

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
      const numericId = Number.parseInt(id, 10);
      if (!Number.isFinite(numericId)) {
        return Ok(null);
      }
      const rows = await db.select().from(materialCards).where(eq(materialCards.id, numericId)).limit(1);
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
        conditions.push(eq(materialCards.category, filters.category));
      }
      if (filters.isActive !== undefined) {
        conditions.push(eq(materialCards.isActive, filters.isActive));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const rawRows = await db.select().from(materialCards).where(whereClause).limit(limit).offset(offset);

      const rows = filters.lowStock
        ? (rawRows as (typeof rawRows[number] & Record<string, unknown>)[]).filter(
            (row) => Number(row['currentStock'] ?? 0) < Number(row['minStock'] ?? 0),
          )
        : rawRows;

      const countResult = await db
        .select({ count: sql`COUNT(*)` })
        .from(materialCards)
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
      // material_cards.kod is UNIQUE NOT NULL — generate one if the caller
      // did not supply a business code.
      const kod =
        material.materialCode && material.materialCode.trim() !== ''
          ? material.materialCode
          : `MAT-${Date.now()}`;

      const inserted = await db
        .insert(materialCards)
        .values({
          kod,
          xomAshyo: material.name,
          category: material.category,
          unitOfMeasure: material.unitOfMeasure,
          minStock: material.minStock,
          maxStock: material.maxStock,
          unitPrice: material.unitCost,
          isActive: material.isActive,
          createdAt: material.createdAt,
          updatedAt: material.updatedAt,
        })
        .returning();

      const row = inserted[0] as Record<string, unknown> | undefined;
      if (!row) {
        return Err('Failed to save material');
      }

      // Return the persisted aggregate carrying the real serial id + final kod.
      return Ok(this.mapRowToMaterial(row));
    } catch (error: unknown) {
      this.logger.error('Failed to save material');
      return Err('Failed to save material');
    }
  }

  async update(material: Material): Promise<Result<Material>> {
    try {
      const numericId = Number.parseInt(material.id, 10);
      if (!Number.isFinite(numericId)) {
        return Err('Failed to update material');
      }

      await db
        .update(materialCards)
        .set({
          xomAshyo: material.name,
          category: material.category,
          unitOfMeasure: material.unitOfMeasure,
          minStock: material.minStock,
          maxStock: material.maxStock,
          unitPrice: material.unitCost,
          isActive: material.isActive,
          updatedAt: material.updatedAt,
        })
        .where(eq(materialCards.id, numericId));

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
      const rows = await db.select().from(materialCards);

      const byCategory: Record<string, number> = {};
      let lowStockCount = 0;
      let totalValue = 0;

      for (const row of (rows as Record<string, unknown>[])) {
        const cat = String(row['category'] ?? 'other');
        byCategory[cat] = (byCategory[cat] || 0) + 1;
        const minStock = Number(row['minStock'] ?? 0);
        const currentStock = Number(row['currentStock'] ?? 0);
        const unitPrice = Number(row['unitPrice'] ?? 0);
        totalValue += unitPrice * currentStock;

        if (currentStock < minStock) {
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
      String(row['kod'] ?? ''),
      String(row['xomAshyo'] ?? ''),
      String(row['category'] ?? ''),
      String(row['unitOfMeasure'] ?? ''),
      Number(row['minStock'] ?? 0),
      Number(row['maxStock'] ?? 0),
      Number(row['unitPrice'] ?? 0),
      Number(row['currentStock'] ?? 0),
      Boolean(row['isActive']),
      row['createdAt'] ? new Date(String(row['createdAt'])) : _time.now(),
      row['updatedAt'] ? new Date(String(row['updatedAt'])) : _time.now());
  }
}
