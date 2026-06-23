/**
 * @module gofra-conversion.controller
 * @description Thin HTTP entry for the Gofra 3-formula engine. Validates with Zod,
 *   loads flute take-up factors from master-data (owner-#6 fallback pre-seed), and
 *   delegates all arithmetic to the pure GofraConversionService.
 *
 *   GET  /api/pp/gofra/convert    — kg↔m²↔sheet conversion (Formulas 1+2)
 *   POST /api/pp/gofra/grammage   — corrugated grammage (Formula 3) from layers
 *
 *   Auth: JwtAuthGuard is applied globally (APP_GUARD in app.module.ts), so any
 *   authenticated PP/SD/MES user may read conversions; no extra guard needed here.
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Param,
  Body,
  Query,
  Inject,
  BadRequestException,
} from '@nestjs/common';
import { rawSql } from '@shared/db';
import { sql } from 'drizzle-orm';
import { z } from 'zod';
import { unwrapOrThrow } from '@common/http-result';
import { GofraConversionService } from './gofra-conversion.service';
import {
  GOFRA_FACTORS_REPO,
  type IGofraFactorsRepo,
  type FluteTypeRow,
} from './i-gofra-factors.repo';
import {
  GofraConvertQuerySchema,
  GofraGrammageBodySchema,
  UpdateFluteFactorSchema,
  type GofraConvertResponse,
  type GofraDirection,
} from './gofra-conversion.dto';
import type { SheetSpec } from './gofra-conversion.types';

const UNIT_OF_DIRECTION: Record<GofraDirection, { in: string; out: string }> = {
  kg_to_m2: { in: 'kg', out: 'm2' },
  m2_to_kg: { in: 'm2', out: 'kg' },
  m2_to_sheets: { in: 'm2', out: 'list' },
  sheets_to_m2: { in: 'list', out: 'm2' },
  kg_to_sheets: { in: 'kg', out: 'list' },
  sheets_to_kg: { in: 'list', out: 'kg' },
};

@Controller('pp/gofra')
export class GofraConversionController {
  constructor(
    private readonly svc: GofraConversionService,
    @Inject(GOFRA_FACTORS_REPO) private readonly factorsRepo: IGofraFactorsRepo,
  ) {}

  /** GET /api/pp/gofra/convert?direction=&inputValue=&grammageGsm=&sheetWidthMm=&sheetLengthMm=&wastePct= */
  @Get('convert')
  async convert(@Query() query: unknown): Promise<GofraConvertResponse> {
    const q = GofraConvertQuerySchema.parse(query);
    const sheet: SheetSpec = {
      sheetWidthMm: q.sheetWidthMm ?? 0,
      sheetLengthMm: q.sheetLengthMm ?? 0,
      wastePct: q.wastePct,
    };

    const out = this.dispatch(q.direction, q.inputValue, q.grammageGsm, sheet);
    const value = unwrapOrThrow(out);
    const units = UNIT_OF_DIRECTION[q.direction];
    return {
      direction: q.direction,
      inputValue: q.inputValue,
      inputUnit: units.in,
      outputValue: value,
      outputUnit: units.out,
    };
  }

  /**
   * GET /api/pp/gofra/flute-types — configurable flute take-up factors (master-data).
   * Read-only display source for the FE; `takeUpFactor` is null where the owner
   * has not yet entered a value (the engine then refuses to compute that flute).
   */
  @Get('flute-types')
  async fluteTypes(): Promise<FluteTypeRow[]> {
    const r = await this.factorsRepo.getFluteTypes();
    return unwrapOrThrow(r);
  }

  /**
   * PUT /api/pp/gofra/flute-types/:code — CONFIGURE (set/change) a flute's take-up factor.
   * The owner-editable knob the grammage engine consumes; changing it immediately shifts
   * every subsequent corrugated grammage computation (vizyon: hamma narsa sozlanadigan).
   */
  @Put('flute-types/:code')
  async updateFluteFactor(@Param('code') code: string, @Body() body: unknown): Promise<FluteTypeRow> {
    const { takeUpFactor } = UpdateFluteFactorSchema.parse(body);
    const r = await this.factorsRepo.updateFluteFactor(String(code).toUpperCase(), takeUpFactor);
    return unwrapOrThrow(r);
  }

  /** POST /api/pp/gofra/grammage — Formula 3: effective corrugated grammage. */
  @Post('grammage')
  async grammage(@Body() body: unknown): Promise<{ grammageGsm: number }> {
    const { layers } = GofraGrammageBodySchema.parse(body);
    const factorsR = await this.factorsRepo.getFluteFactors();
    const factors = unwrapOrThrow(factorsR);
    const g = this.svc.computeCorrugatedGrammage(layers, factors);
    return { grammageGsm: unwrapOrThrow(g) };
  }

  /** Map a direction onto the pure service. Throws 400 if required inputs are missing. */
  private dispatch(
    direction: GofraDirection,
    inputValue: number,
    grammageGsm: number | undefined,
    sheet: SheetSpec,
  ) {
    switch (direction) {
      case 'kg_to_m2':
        return this.svc.kgToM2(inputValue, this.requireGsm(grammageGsm));
      case 'm2_to_kg':
        return this.svc.m2ToKg(inputValue, this.requireGsm(grammageGsm));
      case 'm2_to_sheets':
        return this.svc.m2ToSheets(inputValue, sheet);
      case 'sheets_to_m2':
        return this.svc.sheetsToM2(inputValue, sheet);
      case 'kg_to_sheets':
        return this.svc.kgToSheets(inputValue, this.requireGsm(grammageGsm), sheet);
      case 'sheets_to_kg':
        return this.svc.sheetsToKg(inputValue, this.requireGsm(grammageGsm), sheet);
      default:
        throw new BadRequestException(`Noma'lum yo'nalish: ${String(direction)}`);
    }
  }

  // ─── gofra_config (config-mexanizm) ──────────────────────────────────────────

  private static readonly UpdateGofraConfigSchema = z.object({
    value: z.number().min(0).max(9999.9999),
  });

  /** GET /api/pp/gofra/config — list all gofra config params */
  @Get('config')
  async getGofraConfig() {
    const rows = await rawSql(sql`
      SELECT id, key, label_uz, value, unit, updated_at FROM gofra_config ORDER BY id
    `);
    return { items: rows.rows };
  }

  /** PATCH /api/pp/gofra/config/:key — update a gofra config param */
  @Patch('config/:key')
  async updateGofraConfig(@Param('key') key: string, @Body() body: unknown) {
    const dto = GofraConversionController.UpdateGofraConfigSchema.parse(body);
    const rows = await rawSql(sql`
      UPDATE gofra_config SET value = ${dto.value}, updated_at = NOW()
      WHERE key = ${key}
      RETURNING id, key, label_uz, value, unit
    `);
    const result = rows.rows[0] ?? undefined;
    if (!result) throw new BadRequestException(`gofra_config key=${key} topilmadi`);
    return result;
  }

  private requireGsm(grammageGsm: number | undefined): number {
    if (grammageGsm === undefined) {
      throw new BadRequestException('Bu yo\'nalish uchun grammageGsm kerak');
    }
    return grammageGsm;
  }
}
