/**
 * @module imposition.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Inject, Logger } from '@nestjs/common';
import { Ok, Err, Result, AppError } from '@common/result';
import { safeNum } from '@common/math/math-utils';
import { Calculation } from '@common/decorators/calculation.decorator';
import { ROUND_2DP_FACTOR, ROUND_3DP_FACTOR } from '@common/constants/app.constants';
import { IQcComputeRepository, QC_COMPUTE_REPO } from '../repositories/i-qc.repo';

const UTIL_PERCENT_DIVISOR = 10;
const SVG_VIEW_W = 600;
const SVG_COLORS = ['#4f9cf9','#f97316','#22c55e','#a855f7','#ec4899','#06b6d4','#f59e0b','#64748b'];

function escapeSvgText(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function generateSheetSvg(
  sheetIndex: number,
  placed: PlacedItem[],
  sheetWidth: number,
  sheetHeight: number,
): string {
  const viewH   = Math.round((sheetHeight / sheetWidth) * SVG_VIEW_W);
  const scaleX  = SVG_VIEW_W / sheetWidth;
  const scaleY  = viewH / sheetHeight;
  const items   = placed.filter(p => p.sheetIndex === sheetIndex);
  const idColor: Record<string, string> = {};
  let colorIdx = 0;
  let rects = '';
  for (const item of items) {
    if (!idColor[item.id]) idColor[item.id] = SVG_COLORS[colorIdx++ % SVG_COLORS.length] ?? '#4f9cf9';
    const x = Math.round(item.x * scaleX);
    const y = Math.round(item.y * scaleY);
    const w = Math.max(1, Math.round(item.width  * scaleX));
    const h = Math.max(1, Math.round(item.height * scaleY));
    const rawLabel = item.id.length > 10 ? item.id.slice(0, 10) + '\u2026' : item.id;
    const label = escapeSvgText(rawLabel);
    rects += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${idColor[item.id]}" opacity="0.85" stroke="#fff" stroke-width="1"/>`
           + `<text x="${x + 3}" y="${y + 13}" font-size="11" fill="#fff" font-family="sans-serif">${label}</text>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SVG_VIEW_W} ${viewH}" width="${SVG_VIEW_W}" height="${viewH}">`
       + `<rect width="${SVG_VIEW_W}" height="${viewH}" fill="#f3f4f6" stroke="#9ca3af" stroke-width="2"/>`
       + rects
       + `</svg>`;
}

export interface ProductItem {
  id: string;
  width: number;
  height: number;
  quantity?: number;
}

export interface PlacedItem {
  id: string;
  copyIndex: number;
  sheetIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ImpositionResult {
  placed: PlacedItem[];
  unplaced: string[];
  sheets: number;
  utilization: number;
  wastePercent: number;
  sheetArea: number;
  usedArea: number;
  svg: string[];
}

interface Strip {
  y: number;
  height: number;
  nextX: number;
  remainingWidth: number;
}

/**
 * TZ-35: Sheet Imposition / Cutting Stock — FFDH (First-Fit Decreasing Height)
 *
 * 2D bin packing (NP-hard) uchun heuristik algoritm.
 * Maqsad: sheet utilization → maximum (qog'oz isrof minimal)
 *
 * Algoritm:
 *   1. Mahsulotlarni quantity bo'yicha kengaytirish (nusxa × miqdor)
 *   2. Balandligi bo'yicha kamayish tartibida saralash (FFDH)
 *   3. Har mahsulot uchun birinchi mos strip'ga joylashtirish
 *   4. Joriy varaq to'lganda yangi varaq ochiladi (sheets++)
 *
 * U = Σ product_area / (sheets × sheet_area) × 100%
 */
@Injectable()
export class ImpositionService {
  private readonly logger = new Logger(ImpositionService.name);

  constructor(
    @Inject(QC_COMPUTE_REPO) private readonly qcRepo: IQcComputeRepository,
  ) {}

  @Calculation('qc.imposition.pack')
  async pack(
    items: ProductItem[],
    sheetWidth: number,
    sheetHeight: number,
  ): Promise<Result<ImpositionResult, AppError>> {
    if (sheetWidth <= 0 || sheetHeight <= 0) {
      return Err({ code: 'BAD_REQUEST', message: 'Varaq o\'lchami musbat bo\'lishi kerak' });
    }
    if (!items.length) {
      return Err({ code: 'BAD_REQUEST', message: 'Mahsulot ro\'yxati bo\'sh' });
    }

    // Quantity bo'yicha kengaytirish — har item quantity marta nusxa
    const expanded: Array<{ id: string; copyIndex: number; width: number; height: number }> = [];
    for (const item of items) {
      const rawQty = safeNum(item.quantity ?? 1);
      if (rawQty < 1 || !Number.isInteger(rawQty)) {
        return Err({ code: 'BAD_REQUEST', message: `'${item.id}' uchun quantity ≥ 1 butun son bo'lishi kerak` });
      }
      const qty = rawQty;
      for (let ci = 0; ci < qty; ci++) {
        expanded.push({ id: item.id, copyIndex: ci, width: safeNum(item.width), height: safeNum(item.height) });
      }
    }

    // FFDH: balandlik bo'yicha kamayish tartibida saralash
    const sorted = [...expanded].sort((a, b) => b.height - a.height);

    const placed: PlacedItem[] = [];
    const unplacedIds = new Set<string>();
    let sheets = 1;
    let strips: Strip[] = [];
    let usedArea = 0;

    const openNewSheet = (): void => {
      sheets++;
      strips = [];
    };

    for (const item of sorted) {
      const w = item.width;
      const h = item.height;

      if (w > sheetWidth || h > sheetHeight) {
        unplacedIds.add(item.id);
        continue;
      }

      let fitted = false;

      // Joriy varaqda birinchi mos strip'ni topish (FFDH)
      for (let si = 0; si < strips.length; si++) {
        const strip = strips[si];
        if (strip.remainingWidth >= w && strip.height >= h) {
          placed.push({
            id: item.id,
            copyIndex: item.copyIndex,
            sheetIndex: sheets - 1,
            x: strip.nextX,
            y: strip.y,
            width: w,
            height: h,
          });
          strip.nextX += w;
          strip.remainingWidth -= w;
          usedArea += w * h;
          fitted = true;
          break;
        }
      }

      // Joriy varaqda yangi strip ochish
      if (!fitted) {
        const lastY = strips.length > 0
          ? strips[strips.length - 1].y + strips[strips.length - 1].height
          : 0;

        if (lastY + h <= sheetHeight) {
          const newStrip: Strip = {
            y: lastY,
            height: h,
            nextX: w,
            remainingWidth: sheetWidth - w,
          };
          strips.push(newStrip);
          placed.push({
            id: item.id,
            copyIndex: item.copyIndex,
            sheetIndex: sheets - 1,
            x: 0,
            y: lastY,
            width: w,
            height: h,
          });
          usedArea += w * h;
          fitted = true;
        }
      }

      // Joriy varaq to'ldi — yangi varaq ochish
      if (!fitted) {
        openNewSheet();
        strips = [{
          y: 0,
          height: h,
          nextX: w,
          remainingWidth: sheetWidth - w,
        }];
        placed.push({
          id: item.id,
          copyIndex: item.copyIndex,
          sheetIndex: sheets - 1,
          x: 0,
          y: 0,
          width: w,
          height: h,
        });
        usedArea += w * h;
      }
    }

    const sheetArea   = sheetWidth * sheetHeight;
    const totalArea   = sheets * sheetArea;
    const utilization = Math.round((usedArea / totalArea) * ROUND_3DP_FACTOR) / UTIL_PERCENT_DIVISOR;
    const wastePercent = Math.max(0, Math.round((100 - utilization) * 100) / 100);

    const svg = Array.from({ length: sheets }, (_, i) =>
      generateSheetSvg(i, placed, sheetWidth, sheetHeight),
    );

    const result: ImpositionResult = {
      placed,
      unplaced: [...unplacedIds],
      sheets,
      utilization,
      wastePercent,
      sheetArea,
      usedArea: Math.round(usedArea * ROUND_2DP_FACTOR) / ROUND_2DP_FACTOR,
      svg,
    };

    // Persist layout summary to imposition_layouts (SVG omitted from layout_json to keep rows small)
    try {
      const layoutJson = JSON.stringify({
        placed:  result.placed,
        unplaced: result.unplaced,
        sheetArea: result.sheetArea,
        usedArea:  result.usedArea,
        wastePercent: result.wastePercent,
      });
      await this.qcRepo.saveImpositionLayout({
        sheetWidth,
        sheetHeight,
        productCount:  items.length,
        sheetCount:    sheets,
        utilization,
        placedCount:   result.placed.length,
        unplacedCount: result.unplaced.length,
        layoutJson,
      });
    } catch (e) {
      this.logger.error(`imposition_layouts ga yozishda xato: ${String(e)}`);
    }

    return Ok(result);
  }
}
