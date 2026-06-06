/**
 * @module layer-formula.service
 * @description kg<->sheet (kg<->list) conversion for paper/cardboard — vision #7, the configurable
 *   "layer formula" brain. Pure math helpers + convert() which reads a material's config
 *   (material_cards.grammage/format_a/format_b/material_kind + material_layer_config layers).
 *   Nothing is hardcoded: GSM, dimensions, flute take-up all come from the material config (owner-edited).
 * @layer Application (MM)
 */

import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { Result, Ok, Err, AppErr } from '@common/result';

export interface LayerInput { role: string; gsm: number; takeUpFactor?: number | null }
export interface ConvertResult {
  materialKind: string;
  effectiveGsm: number;   // plain = grammage; corrugated = Σliner + Σ(flute × take_up)
  areaM2: number;
  sheetWeightG: number;
  sheetCount: number | null; // set when totalKg given (kg -> sheets)
  kg: number | null;         // set when sheetCount given (sheets -> kg)
}

@Injectable()
export class LayerFormulaService {
  /** Sheet area (m²) from mm dimensions. */
  sheetAreaM2(lengthMm: number, widthMm: number): number {
    return (Number(lengthMm) / 1000) * (Number(widthMm) / 1000);
  }

  /** Plain (1-layer): total kg -> sheet count. */
  plainSheetCount(totalKg: number, gsm: number, lengthMm: number, widthMm: number): number {
    const sheetWeightG = this.sheetAreaM2(lengthMm, widthMm) * Number(gsm);
    return sheetWeightG > 0 ? (Number(totalKg) * 1000) / sheetWeightG : 0;
  }

  /** Plain (1-layer): sheet count -> kg. */
  plainKg(sheetCount: number, gsm: number, lengthMm: number, widthMm: number): number {
    return (this.sheetAreaM2(lengthMm, widthMm) * Number(gsm) * Number(sheetCount)) / 1000;
  }

  /** Corrugated total GSM: Σ(liner gsm) + Σ(flute gsm × take_up_factor). */
  corrugatedTotalGsm(layers: LayerInput[]): number {
    if (!Array.isArray(layers)) return 0;
    return layers.reduce(
      (sum, l) => sum + Number(l.gsm) * (String(l.role) === 'flute' ? Number(l.takeUpFactor ?? 1) : 1),
      0,
    );
  }

  /** Read a material's config and convert kg<->sheet. Pass totalKg for kg→sheets, sheetCount for sheets→kg. */
  async convert(materialCardId: number, opts: { totalKg?: number; sheetCount?: number }): Promise<Result<ConvertResult>> {
    try {
      const matR = await runQuery<{ grammage: string | null; format_a: string | null; format_b: string | null; material_kind: string | null }>(sql`
        SELECT grammage, format_a, format_b, material_kind FROM material_cards WHERE id = ${materialCardId} LIMIT 1`);
      const mat = matR.rows[0];
      if (!mat) return Err(AppErr('NOT_FOUND', `Material #${materialCardId} topilmadi`));

      const L = Number(mat.format_a), W = Number(mat.format_b);
      if (!(L > 0) || !(W > 0)) {
        return Err(AppErr('VALIDATION', `Material #${materialCardId}: o'lchami (format_a/format_b) belgilanmagan`));
      }

      const kind = mat.material_kind ?? 'plain';
      let effectiveGsm: number;
      if (kind === 'corrugated') {
        const layersR = await runQuery<{ role: string; gsm: string; take_up_factor: string | null }>(sql`
          SELECT role, gsm, take_up_factor FROM material_layer_config WHERE material_card_id = ${materialCardId} ORDER BY layer_index`);
        effectiveGsm = this.corrugatedTotalGsm(
          layersR.rows.map((r) => ({ role: r.role, gsm: Number(r.gsm), takeUpFactor: r.take_up_factor != null ? Number(r.take_up_factor) : null })),
        );
        if (!(effectiveGsm > 0)) return Err(AppErr('VALIDATION', `Material #${materialCardId}: gofra qatlamlari belgilanmagan`));
      } else {
        effectiveGsm = Number(mat.grammage);
        if (!(effectiveGsm > 0)) return Err(AppErr('VALIDATION', `Material #${materialCardId}: grammage (GSM) belgilanmagan`));
      }

      const areaM2 = this.sheetAreaM2(L, W);
      const sheetWeightG = areaM2 * effectiveGsm;
      return Ok({
        materialKind: kind,
        effectiveGsm,
        areaM2,
        sheetWeightG,
        sheetCount: opts.totalKg != null ? this.plainSheetCount(opts.totalKg, effectiveGsm, L, W) : null,
        kg: opts.sheetCount != null ? this.plainKg(opts.sheetCount, effectiveGsm, L, W) : null,
      });
    } catch (e) {
      return Err(AppErr('DB_ERROR', String(e)));
    }
  }
}
