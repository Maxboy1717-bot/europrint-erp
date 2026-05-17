/**
 * NOTE: Raw SQL retained intentionally — Drizzle ORM cannot express:
 *   • OR-fallback joins (sc.product_name = X OR p.name = X)
 *   • multi-table compatibility selects (boms, routings, mes_sessions, stock_movements)
 *   whose Drizzle schemas are not fully unified.
 *   See ARCHITECTURE_RULES.md Rule 4: complex SQL is permitted with documentation.
 */

/**
 * @module drizzle-finance-costing.repo
 * @description Costing sub-repo (P0-2): Standard Cost, Price Tiers, Variance Analysis.
 *              Extracted from drizzle-finance.repo as part of Rule 13/16 split.
 */

import { Injectable } from '@nestjs/common';
import { runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import {
  StandardCostRecord,
  StandardCostCalcInputs,
  StandardCostUpsertInput,
  PriceTierRow,
  PriceTierUpsertInput,
} from '../../domain/repositories/i-finance.repo';

type RawRow = Record<string, unknown>;
const toNum = (v: unknown, fallback = 0): number => {
  if (v === null || v === undefined) return fallback;
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : fallback;
};

@Injectable()
export class FinanceCostingRepo {
  // ============================================================
  // P0-2 Standard Cost
  // ============================================================

  private toStdCostRecord(row: RawRow): StandardCostRecord {
    const mat   = toNum(row['std_material_uzs'], 0);
    const lab   = toNum(row['std_labor_uzs'], 0);
    const ovh   = toNum(row['std_overhead_uzs'], 0);
    const total = toNum(row['std_total_uzs'], mat + lab + ovh);
    return {
      productName:    String(row['product_name'] ?? ''),
      productId:      row['product_id'] != null ? Number(row['product_id']) : null,
      period:         String(row['period'] ?? ''),
      stdMaterialUzs: mat,
      stdLaborUzs:    lab,
      stdOverheadUzs: ovh,
      stdTotalUzs:    total,
      createdAt:      row['created_at'] ? new Date(String(row['created_at'])) : null,
    };
  }

  async findStandardCostByName(productName: string, period: string): Promise<StandardCostRecord | null> {
    const r = await runQuery<RawRow>(sql`
      SELECT sc.product_name, sc.product_id, sc.period,
             sc.std_material_uzs, sc.std_labor_uzs, sc.std_overhead_uzs,
             sc.std_material_uzs + sc.std_labor_uzs + sc.std_overhead_uzs AS std_total_uzs,
             sc.created_at
      FROM standard_cost sc
      LEFT JOIN products p ON p.id = sc.product_id
      WHERE (sc.product_name = ${productName} OR p.name = ${productName})
        AND sc.period = ${period}
      ORDER BY sc.period DESC LIMIT 1
    `);
    return r.rows[0] ? this.toStdCostRecord(r.rows[0]) : null;
  }

  async findStandardCostById(productId: number, period: string): Promise<StandardCostRecord | null> {
    const r = await runQuery<RawRow>(sql`
      SELECT sc.product_name, sc.product_id, sc.period,
             sc.std_material_uzs, sc.std_labor_uzs, sc.std_overhead_uzs,
             sc.std_material_uzs + sc.std_labor_uzs + sc.std_overhead_uzs AS std_total_uzs,
             sc.created_at
      FROM standard_cost sc
      WHERE sc.product_id = ${productId}
        AND sc.period = ${period}
      ORDER BY sc.period DESC LIMIT 1
    `);
    return r.rows[0] ? this.toStdCostRecord(r.rows[0]) : null;
  }

  async listStandardCosts(productName: string, limit: number): Promise<StandardCostRecord[]> {
    const r = await runQuery<RawRow>(sql`
      SELECT sc.product_name, sc.product_id, sc.period,
             sc.std_material_uzs, sc.std_labor_uzs, sc.std_overhead_uzs,
             sc.std_material_uzs + sc.std_labor_uzs + sc.std_overhead_uzs AS std_total_uzs,
             sc.created_at
      FROM standard_cost sc
      LEFT JOIN products p ON p.id = sc.product_id
      WHERE sc.product_name = ${productName} OR p.name = ${productName}
      ORDER BY sc.period DESC LIMIT ${limit}
    `);
    return r.rows.map(row => this.toStdCostRecord(row));
  }

  async fetchStandardCostCalcInputs(productName: string): Promise<StandardCostCalcInputs> {
    const prodRes = await runQuery<RawRow>(sql`
      SELECT id FROM products WHERE name = ${productName} AND is_active = true LIMIT 1
    `);
    const productId = prodRes.rows[0] ? Number(prodRes.rows[0]['id']) : null;

    const [bomRes, routingRes] = await Promise.all([
      runQuery<RawRow>(sql`
        SELECT items FROM boms
        WHERE product_name = ${productName} AND is_active = true
        ORDER BY created_at DESC LIMIT 1
      `).catch(() => ({ rows: [] as RawRow[] })),
      productId !== null
        ? runQuery<RawRow>(sql`
            SELECT r.steps
            FROM routings r
            JOIN production_orders po ON po.routing_id = r.id
            WHERE po.product_id = ${productId}
            ORDER BY po.created_at DESC LIMIT 1
          `).catch(() => ({ rows: [] as RawRow[] }))
        : Promise.resolve({ rows: [] as RawRow[] }),
    ]);

    return {
      productId,
      bomItemsJson:     String(bomRes.rows[0]?.['items']  ?? '[]'),
      routingStepsJson: String(routingRes.rows[0]?.['steps'] ?? '[]'),
    };
  }

  async upsertStandardCost(input: StandardCostUpsertInput): Promise<void> {
    if (input.productId !== null) {
      await runQuery(sql`
        INSERT INTO standard_cost (product_name, product_id, period, std_material_uzs, std_labor_uzs, std_overhead_uzs)
        VALUES (${input.productName}, ${input.productId}, ${input.period},
                ${input.stdMaterialUzs}, ${input.stdLaborUzs}, ${input.stdOverheadUzs})
        ON CONFLICT (product_name, period) DO UPDATE
          SET product_id       = EXCLUDED.product_id,
              std_material_uzs = EXCLUDED.std_material_uzs,
              std_labor_uzs    = EXCLUDED.std_labor_uzs,
              std_overhead_uzs = EXCLUDED.std_overhead_uzs,
              updated_at       = now()
      `);
    } else {
      await runQuery(sql`
        INSERT INTO standard_cost (product_name, period, std_material_uzs, std_labor_uzs, std_overhead_uzs)
        VALUES (${input.productName}, ${input.period},
                ${input.stdMaterialUzs}, ${input.stdLaborUzs}, ${input.stdOverheadUzs})
        ON CONFLICT (product_name, period) DO UPDATE
          SET std_material_uzs = EXCLUDED.std_material_uzs,
              std_labor_uzs    = EXCLUDED.std_labor_uzs,
              std_overhead_uzs = EXCLUDED.std_overhead_uzs,
              updated_at       = now()
      `);
    }
  }

  async findLatestStandardCost(
    productId: number | null,
    productName: string,
  ): Promise<{ stdMaterialUzs: number; stdLaborUzs: number; stdOverheadUzs: number; stdTotal: number } | null> {
    const r = productId !== null
      ? await runQuery<RawRow>(sql`
          SELECT std_material_uzs, std_labor_uzs, std_overhead_uzs,
                 std_material_uzs + std_labor_uzs + std_overhead_uzs AS std_total
          FROM standard_cost
          WHERE product_id = ${productId}
          ORDER BY period DESC LIMIT 1
        `)
      : await runQuery<RawRow>(sql`
          SELECT std_material_uzs, std_labor_uzs, std_overhead_uzs,
                 std_material_uzs + std_labor_uzs + std_overhead_uzs AS std_total
          FROM standard_cost
          WHERE product_name = ${productName}
          ORDER BY period DESC LIMIT 1
        `);
    const row = r.rows[0];
    if (!row) return null;
    return {
      stdMaterialUzs: toNum(row['std_material_uzs'], 0),
      stdLaborUzs:    toNum(row['std_labor_uzs'], 0),
      stdOverheadUzs: toNum(row['std_overhead_uzs'], 0),
      stdTotal:       toNum(row['std_total'], 0),
    };
  }

  // ============================================================
  // P0-2 Tiered Pricing
  // ============================================================

  private toPriceTier(row: RawRow): PriceTierRow {
    return {
      id:          String(row['id'] ?? ''),
      productName: String(row['product_name'] ?? ''),
      productId:   row['product_id'] != null ? Number(row['product_id']) : null,
      tierName:    String(row['tier_name'] ?? ''),
      minQty:      toNum(row['min_qty'], 0),
      maxQty:      row['max_qty'] != null ? toNum(row['max_qty'], 0) : null,
      priceUzs:    toNum(row['price_uzs'], 0),
      validFrom:   String(row['valid_from'] ?? ''),
      validTo:     row['valid_to'] ? String(row['valid_to']) : null,
    };
  }

  async findPriceTierForQty(
    productName: string, qty: number, effectiveDateIso: string,
  ): Promise<PriceTierRow | null> {
    const r = await runQuery<RawRow>(sql`
      SELECT pt.id::text AS id, pt.product_name, pt.product_id,
             pt.tier_name, pt.min_qty, pt.max_qty, pt.price_uzs,
             pt.valid_from, pt.valid_to
      FROM price_tier pt
      LEFT JOIN products p ON p.id = pt.product_id
      WHERE (pt.product_name = ${productName} OR p.name = ${productName})
        AND pt.min_qty <= ${qty}
        AND (pt.max_qty IS NULL OR pt.max_qty >= ${qty})
        AND pt.valid_from <= ${effectiveDateIso}::date
        AND (pt.valid_to IS NULL OR pt.valid_to >= ${effectiveDateIso}::date)
      ORDER BY pt.min_qty DESC
      LIMIT 1
    `);
    return r.rows[0] ? this.toPriceTier(r.rows[0]) : null;
  }

  async listPriceTiers(productName: string): Promise<PriceTierRow[]> {
    const r = await runQuery<RawRow>(sql`
      SELECT pt.id::text AS id, pt.product_name, pt.product_id,
             pt.tier_name, pt.min_qty, pt.max_qty,
             pt.price_uzs, pt.valid_from::text AS valid_from, pt.valid_to::text AS valid_to
      FROM price_tier pt
      LEFT JOIN products p ON p.id = pt.product_id
      WHERE pt.product_name = ${productName} OR p.name = ${productName}
      ORDER BY pt.min_qty ASC
    `);
    return r.rows.map(row => this.toPriceTier(row));
  }

  async upsertPriceTier(input: PriceTierUpsertInput): Promise<PriceTierRow | null> {
    const prodRes = await runQuery<RawRow>(sql`
      SELECT id FROM products WHERE name = ${input.productName} AND is_active = true LIMIT 1
    `);
    const productId = prodRes.rows[0] ? Number(prodRes.rows[0]['id']) : null;

    const r = productId !== null
      ? await runQuery<RawRow>(sql`
          INSERT INTO price_tier (product_name, product_id, tier_name, min_qty, max_qty, price_uzs, valid_from, valid_to)
          VALUES (${input.productName}, ${productId}, ${input.tierName}, ${input.minQty}, ${input.maxQty},
                  ${input.priceUzs}, ${input.validFrom}::date, ${input.validTo}::date)
          RETURNING id::text AS id, product_name, product_id, tier_name, min_qty, max_qty,
                    price_uzs, valid_from::text AS valid_from, valid_to::text AS valid_to
        `)
      : await runQuery<RawRow>(sql`
          INSERT INTO price_tier (product_name, tier_name, min_qty, max_qty, price_uzs, valid_from, valid_to)
          VALUES (${input.productName}, ${input.tierName}, ${input.minQty}, ${input.maxQty},
                  ${input.priceUzs}, ${input.validFrom}::date, ${input.validTo}::date)
          RETURNING id::text AS id, product_name, product_id, tier_name, min_qty, max_qty,
                    price_uzs, valid_from::text AS valid_from, valid_to::text AS valid_to
        `);
    return r.rows[0] ? this.toPriceTier(r.rows[0]) : null;
  }

}
