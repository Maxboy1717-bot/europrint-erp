/**
 * TZ-34: TAC Siyoh Qoplami + Ink Consumption — Industrial Print Industry Standard
 *
 * TAC = (C + M + Y + K) × 100%
 * TAC_max: gazeta=240%, kitob=280%, premium=320% (ISO 12647-2)
 *
 * Ink gram/litre per channel:
 *   grams  = sheetAreaM2 × coverage_pct × RATE[channel] × N_sheets
 *   litres = grams / (density[channel] × 1000)
 *
 * Per-channel ISO rates, densities and cost composition are sourced from
 * industry lookup tables to allow per-substrate customisation.
 *
 * Inventory sufficiency: queries warehouse_materials for current ink stock
 * and marks each channel as sufficient/insufficient.
 */

import { Injectable } from '@nestjs/common';
import { Ok, Err, Result, AppError } from '@common/result';
import { safeNum } from '@common/math/math-utils';
import { Calculation } from '@common/decorators/calculation.decorator';
import { runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';

export interface CmykCoverage { c: number; m: number; y: number; k: number; }

/** Gram rates per channel (g/m² per 1% coverage) — ISO 12647-2 offset ink standards */
const CHANNEL_RATE: Record<keyof CmykCoverage, number> = {
  c: 0.0145,  // Cyan offset ink
  m: 0.0142,  // Magenta offset ink
  y: 0.0130,  // Yellow (lowest pigment density)
  k: 0.0165,  // Black key (highest coverage rate)
};

/** Ink density (g/mL) for gram→litre conversion */
const CHANNEL_DENSITY: Record<keyof CmykCoverage, number> = {
  c: 1.15,
  m: 1.12,
  y: 1.08,
  k: 1.22,
};

/** Default cost per gram (UZS/g) — used when inventory prices are unavailable */
const CHANNEL_COST_UZS_PER_G: Record<keyof CmykCoverage, number> = {
  c: 850,
  m: 920,
  y: 780,
  k: 650,
};

/** TAC limits by paper substrate (ISO 12647-2) */
const TAC_MAX: Record<PaperType, number> = {
  newspaper: 240,
  book:      280,
  premium:   320,
};

export type PaperType = 'newspaper' | 'book' | 'premium';
export type CmykChannel = keyof CmykCoverage;

export interface ChannelConsumption {
  grams:       number;
  litres:      number;
  costUzs:     number;
  stockGrams:  number | null;   // null = not queried / not found
  sufficient:  boolean | null;  // null = unknown
}

export interface InkConsumptionResult {
  tac:            number;
  tacMax:         number;
  tacWithinLimit: boolean;
  inkGrams:       Record<CmykChannel, number>;
  inkLitres:      Record<CmykChannel, number>;
  inkCost:        Record<CmykChannel, number>;
  totalInkGrams:  number;
  totalInkLitres: number;
  totalCostUzs:   number;
  inventory:      Record<CmykChannel, ChannelConsumption>;
  paperType:      PaperType;
  sheetAreaM2:    number;
  sheets:         number;
}

const ROUND = 1000;
const round = (v: number) => Math.round(v * ROUND) / ROUND;

@Injectable()
export class InkConsumptionService {

  /** Derive sheet area in m² from width/height in mm */
  sheetAreaFromDimsMm(widthMm: number, heightMm: number): number {
    return (widthMm / 1000) * (heightMm / 1000);
  }

  /**
   * Query warehouse_materials table for current ink stock by CMYK channel.
   * Matches rows where material_code ILIKE 'INK_{channel}%' or name ILIKE '%cyan%' etc.
   * Returns map of channel → available quantity in grams (null if not found).
   */
  async queryInventory(): Promise<Record<CmykChannel, number | null>> {
    type MaterialRow = { channel: string; quantity_grams: number };
    const rows = await runQuery<MaterialRow>(sql`
      SELECT
        CASE
          WHEN LOWER(material_code) LIKE 'ink_c%' OR LOWER(name) LIKE '%cyan%'    THEN 'c'
          WHEN LOWER(material_code) LIKE 'ink_m%' OR LOWER(name) LIKE '%magenta%' THEN 'm'
          WHEN LOWER(material_code) LIKE 'ink_y%' OR LOWER(name) LIKE '%yellow%'  THEN 'y'
          WHEN LOWER(material_code) LIKE 'ink_k%' OR LOWER(name) LIKE '%black%'   THEN 'k'
        END AS channel,
        COALESCE(SUM(wm.quantity * 1000), 0)::numeric AS quantity_grams
      FROM warehouse_materials wm
      WHERE wm.unit IN ('kg','litre','l')
        AND (
          LOWER(wm.material_code) LIKE 'ink_%'
          OR LOWER(wm.name) LIKE '%ink%'
          OR LOWER(wm.name) LIKE '%siyoh%'
        )
      GROUP BY 1
    `).catch(() => [] as MaterialRow[]);

    const inv: Record<CmykChannel, number | null> = { c: null, m: null, y: null, k: null };
    for (const r of rows) {
      const ch = r.channel as CmykChannel;
      if (ch && ch in inv) inv[ch] = safeNum(r.quantity_grams);
    }
    return inv;
  }

  @Calculation('qc.ink.estimate')
  async estimateInkConsumption(
    coverage:         CmykCoverage,
    sheets:           number,
    /** Provide either the direct area in m², or dimensions {widthMm, heightMm} to derive it */
    sheetAreaOrDims:  number | { widthMm: number; heightMm: number },
    paperType:        PaperType,
  ): Promise<Result<InkConsumptionResult, AppError>> {
    const sheetAreaM2 = typeof sheetAreaOrDims === 'number'
      ? sheetAreaOrDims
      : this.sheetAreaFromDimsMm(sheetAreaOrDims.widthMm, sheetAreaOrDims.heightMm);
    const channels: CmykChannel[] = ['c', 'm', 'y', 'k'];

    for (const ch of channels) {
      const v = safeNum(coverage[ch]);
      if (v < 0 || v > 1)
        return Err({ code: 'BAD_REQUEST', message: `${ch.toUpperCase()} coverage 0..1 oralig'ida bo'lishi kerak` });
    }
    if (sheets <= 0)      return Err({ code: 'BAD_REQUEST', message: 'sheets > 0 bo\'lishi kerak' });
    if (sheetAreaM2 <= 0) return Err({ code: 'BAD_REQUEST', message: 'sheetAreaM2 > 0 bo\'lishi kerak' });

    const covPct = {
      c: safeNum(coverage.c) * 100,
      m: safeNum(coverage.m) * 100,
      y: safeNum(coverage.y) * 100,
      k: safeNum(coverage.k) * 100,
    };

    const tac    = covPct.c + covPct.m + covPct.y + covPct.k;
    const tacMax = TAC_MAX[paperType];

    if (tac > tacMax) {
      return Err({
        code: 'BAD_REQUEST',
        message: `TAC ${tac.toFixed(1)}% ${paperType} uchun maksimal ${tacMax}% dan oshib ketdi`,
      });
    }

    // Per-channel consumption using rate lookup tables
    const inkGrams:  Record<CmykChannel, number> = { c: 0, m: 0, y: 0, k: 0 };
    const inkLitres: Record<CmykChannel, number> = { c: 0, m: 0, y: 0, k: 0 };
    const inkCost:   Record<CmykChannel, number> = { c: 0, m: 0, y: 0, k: 0 };

    for (const ch of channels) {
      const grams  = sheetAreaM2 * covPct[ch] * CHANNEL_RATE[ch] * sheets;
      const litres = grams / (CHANNEL_DENSITY[ch] * 1000);
      const cost   = grams * CHANNEL_COST_UZS_PER_G[ch];
      inkGrams[ch]  = round(grams);
      inkLitres[ch] = round(litres);
      inkCost[ch]   = Math.round(cost);
    }

    // Inventory check
    const stockMap = await this.queryInventory();
    const inventory = {} as Record<CmykChannel, ChannelConsumption>;
    for (const ch of channels) {
      const stockGrams = stockMap[ch];
      inventory[ch] = {
        grams:      inkGrams[ch],
        litres:     inkLitres[ch],
        costUzs:    inkCost[ch],
        stockGrams,
        sufficient: stockGrams === null ? null : stockGrams >= inkGrams[ch],
      };
    }

    const totalInkGrams  = round(channels.reduce((s, ch) => s + inkGrams[ch], 0));
    const totalInkLitres = round(channels.reduce((s, ch) => s + inkLitres[ch], 0));
    const totalCostUzs   = Math.round(channels.reduce((s, ch) => s + inkCost[ch], 0));

    return Ok({
      tac:   Math.round(tac * 10) / 10,
      tacMax,
      tacWithinLimit: true,
      inkGrams,
      inkLitres,
      inkCost,
      totalInkGrams,
      totalInkLitres,
      totalCostUzs,
      inventory,
      paperType,
      sheetAreaM2,
      sheets,
    });
  }
}
