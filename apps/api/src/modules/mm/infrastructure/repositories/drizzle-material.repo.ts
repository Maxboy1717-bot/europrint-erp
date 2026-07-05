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
 *   materialCode            <-> kod (UNIQUE NOT NULL; generated GEN-<seq> if absent)
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
import { db, materialCards, eq, and, like, sql } from '@workspace/db';
import { Result, Ok, Err, AppErr } from '@common/types/result.type';
import { Material } from '../../domain/aggregates/material.aggregate';
import { MM_MATERIAL_REPO } from '../../domain/repositories/mm.repository';
import { MATERIAL_CODE_REGEX } from '../../domain/constants/material-code.constants';

export { MM_MATERIAL_REPO };

/**
 * B9: fallback code prefix used when the caller omits `materialCode`.
 * Deliberately generic — we do NOT invent a fake category/direction segment
 * we cannot confidently derive from `material.category` (free-text values
 * like "qogoz"/"kley", not a controlled taxonomy). "GEN" (generic) is
 * honest about not knowing the business category, while still satisfying
 * the canonical [SEGMENT]-[N] shape from MATERIAL_CODE_REGEX.
 */
const FALLBACK_CODE_PREFIX = 'GEN';
/** Numeric segment ceiling — regex allows up to 6 digits (\d{1,6}). */
const FALLBACK_CODE_MAX_SEQ = 999_999;

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

  /**
   * B11 duplicate-prevention: material_cards.kod already has a DB-level
   * UNIQUE constraint (material_cards_kod_unique), but `save()` synthesizes a
   * fallback code when the caller omits one — which bypasses that constraint
   * entirely and lets the same material be created twice under different
   * codes. Match on the natural business key (name), the only near-unique
   * identifying field besides `kod` itself. See
   * EXTENDED-GOVERNANCE-CHECK 2026-07-04 B11.
   */
  private async findDuplicateByName(name: string): Promise<Record<string, unknown> | undefined> {
    if (!name || !name.trim()) return undefined;
    const rows = await db
      .select({ id: materialCards.id, kod: materialCards.kod, xomAshyo: materialCards.xomAshyo })
      .from(materialCards)
      .where(and(eq(materialCards.xomAshyo, name), eq(materialCards.isActive, true)))
      .limit(1);
    return rows[0] as Record<string, unknown> | undefined;
  }

  /**
   * B9: generate a fallback `kod` when the caller omits one.
   *
   * Previously this fabricated `MAT-${Date.now()}` — a 13-digit epoch
   * timestamp that FAILS the project's own canonical format regex
   * (MATERIAL_CODE_REGEX, material-code.constants.ts: final segment is
   * `\d{1,6}`, max 6 digits). That fallback silently created rows whose own
   * validator (`validateMaterialCode`) would reject them if re-checked.
   *
   * Fix: derive the next sequence number from existing `GEN-%` codes (MAX of
   * the numeric suffix + 1, bounded to 6 digits via modulo so an
   * unrealistically large existing max can never overflow the regex), then
   * zero-pad to 3 digits minimum. `GEN` (generic) is used instead of a fake
   * business-category prefix because `material.category` is free-text
   * (e.g. "qogoz", "kley") — not the controlled [YO'NALISH]/[KAT] taxonomy
   * the format documents, so encoding it would fabricate meaning we don't
   * actually have.
   *
   * Collision-safety: `save()` still relies on the DB UNIQUE constraint as
   * the final authority and retries with a fresh sequence number on a
   * unique-violation race (23505), so two concurrent omitted-code saves can
   * never collide even if they read the same MAX concurrently.
   */
  private async generateFallbackCode(): Promise<string> {
    const rows = await db
      .select({ kod: materialCards.kod })
      .from(materialCards)
      .where(like(materialCards.kod, `${FALLBACK_CODE_PREFIX}-%`));

    const seqPattern = new RegExp(`^${FALLBACK_CODE_PREFIX}-(\\d{1,6})$`);
    let maxSeq = 0;
    for (const row of rows as { kod: string }[]) {
      const match = seqPattern.exec(row.kod);
      if (!match) continue;
      const n = Number.parseInt(match[1], 10);
      if (Number.isFinite(n) && n > maxSeq) maxSeq = n;
    }

    // Bound to the regex's 6-digit ceiling; wrap instead of overflowing.
    const nextSeq = (maxSeq % FALLBACK_CODE_MAX_SEQ) + 1;
    const padded = String(nextSeq).padStart(3, '0');
    const code = `${FALLBACK_CODE_PREFIX}-${padded}`;

    // Defensive self-check: the generator must never emit a code that its
    // own canonical validator would reject (this is exactly the bug B9
    // fixes — a fallback code that fails the documented format).
    if (!MATERIAL_CODE_REGEX.test(code)) {
      this.logger.error(`Generated fallback code "${code}" failed MATERIAL_CODE_REGEX — this is a bug`);
    }
    return code;
  }

  private isUniqueViolation(error: unknown): boolean {
    const code = (error as { code?: string } | undefined)?.code;
    return code === '23505';
  }

  async save(material: Material): Promise<Result<Material>> {
    try {
      const dup = await this.findDuplicateByName(material.name);
      if (dup) {
        return Err(AppErr(
          'CONFLICT',
          `Bu material allaqachon mavjud (nomi mos keldi): "${String(dup.xomAshyo)}" (kod=${String(dup.kod)})`,
        ));
      }

      // material_cards.kod is UNIQUE NOT NULL — generate a regex-compliant
      // one if the caller did not supply a business code. Bounded retry
      // guards against a concurrent-insert race on the generated sequence.
      const suppliedCode = material.materialCode && material.materialCode.trim() !== ''
        ? material.materialCode
        : null;

      const MAX_ATTEMPTS = 5;
      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        const kod = suppliedCode ?? (await this.generateFallbackCode());
        try {
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
        } catch (insertError: unknown) {
          // A caller-supplied code that collides is a real conflict — surface it.
          if (suppliedCode || !this.isUniqueViolation(insertError)) {
            throw insertError;
          }
          // Fallback-code race: another insert took this sequence number
          // between our SELECT MAX and INSERT — regenerate and retry.
        }
      }
      this.logger.error('Failed to save material: exhausted fallback-code retry attempts');
      return Err('Failed to save material');
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
