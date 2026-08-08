/**
 * @module ckp.controller
 * @description HTTP routes — ЦКП kunlik fakt (FAZA-05, EP-ORG-014..018). Yozish + tarix + kaskad-agregat.
 */

import {
  Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Query, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@common/types/user.types';
import { unwrapOrThrow, unwrapOrInternal } from '@common/http-result';
import { z } from 'zod';
import {
  CkpFactService, CKP_FORMULA_BOOLEAN, CKP_FORMULA_FOIZ, CKP_FORMULA_QUANTITY_PCT, CKP_FORMULA_VAQT,
} from './ckp-fact.service';

const FactSchema = z.object({
  cardId: z.number().int().positive(),
  employeeId: z.number().int().positive().optional(),
  productId: z.number().int().positive().optional(),
  factDate: z.string().min(8).max(10),
  actualValue: z.number().optional(),
  source: z.enum(['MANUAL', 'AI_CHAT', 'MES_AUTO', 'IOT']).optional(),
  errorCode: z.string().max(64).optional(),
  notes: z.string().max(2000).optional(),
}).strict();

/** ck_ckp_card_products_formula / ck_ckp_personal_targets_formula CHECK bilan bir xil 4 tur. */
const CKP_FORMULA_ENUM = [CKP_FORMULA_QUANTITY_PCT, CKP_FORMULA_FOIZ, CKP_FORMULA_VAQT, CKP_FORMULA_BOOLEAN] as const;

/** GAP #10 — karta+mahsulot ЦКП norma slot (ckp_card_products) yaratish/yangilash. */
const CardProductUpsertSchema = z.object({
  cardId: z.number().int().positive(),
  productId: z.number().int().positive(),
  targetValue: z.number().nullable().optional(),
  formulaType: z.enum(CKP_FORMULA_ENUM).nullable().optional(),
  measurementUnit: z.string().max(50).nullable().optional(),
  isActive: z.boolean().optional(),
  notes: z.string().max(2000).nullable().optional(),
}).strict();

/** GAP #14 — xodim shaxsiy ЦКП norma override (ckp_personal_targets) yaratish/yangilash. */
const PersonalTargetUpsertSchema = z.object({
  employeeId: z.number().int().positive(),
  cardId: z.number().int().positive(),
  productId: z.number().int().positive().nullable().optional(),
  /** 'YYYY-MM' yoki NULL (davrsiz override). */
  period: z.string().regex(/^\d{4}-\d{2}$/, "period 'YYYY-MM' formatida bo'lishi kerak").nullable().optional(),
  targetValue: z.number().nullable().optional(),
  formulaType: z.enum(CKP_FORMULA_ENUM).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
}).strict();

@Roles('admin', 'manager', 'hr_manager', 'director', 'super_admin', 'supervisor', 'viewer')
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard)
@ApiTags('Org CKP')
@ApiBearerAuth()
@Controller('org-structure/ckp')
export class CkpController {
  constructor(private readonly service: CkpFactService) {}

  @ApiOperation({ summary: 'ЦКП kunlik fakt yozish' })
  @ApiResponse({ status: 201, description: 'OK' })
  @Post('fact')
  async record(@Body() body: unknown, @CurrentUser() user: AuthenticatedUser) {
    const dto = FactSchema.parse(body);
    const uid = user?.id ?? user?.sub ?? null;
    return unwrapOrThrow(await this.service.recordFact({
      cardId: dto.cardId,
      employeeId: dto.employeeId ?? null,
      productId: dto.productId ?? null,
      factDate: dto.factDate,
      actualValue: dto.actualValue ?? null,
      source: dto.source,
      errorCode: dto.errorCode ?? null,
      notes: dto.notes ?? null,
      recordedBy: uid == null ? null : Number(uid),
    }));
  }

  @ApiOperation({ summary: 'Karta ЦКП fakt tarixi' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('fact')
  async list(@Query('cardId') cardId: string, @Query('from') from?: string, @Query('to') to?: string) {
    const data = unwrapOrInternal(await this.service.listByCard(Number(cardId), from ?? null, to ?? null));
    const items = Array.isArray(data) ? data : [];
    return { items, total: items.length };
  }

  @ApiOperation({ summary: "ЦКП kaskad-agregat (karta + farzandlar)" })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('aggregate/:cardId')
  async aggregate(@Param('cardId', ParseIntPipe) cardId: number, @Query('date') date: string) {
    return unwrapOrInternal(await this.service.aggregate(cardId, date));
  }

  // ─── GAP #10 — karta+mahsulot ЦКП norma slot boshqaruvi (ckp_card_products). ───

  @ApiOperation({ summary: "Karta+mahsulot ЦКП norma slotlari ro'yxati (#10)" })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('card-products')
  async listCardProducts(@Query('cardId') cardId: string) {
    const data = unwrapOrInternal(await this.service.listCardProducts(Number(cardId)));
    const items = Array.isArray(data) ? data : [];
    return { items, total: items.length };
  }

  @ApiOperation({ summary: "Karta+mahsulot ЦКП norma slot yaratish/yangilash (#10)" })
  @ApiResponse({ status: 201, description: 'OK' })
  @Post('card-products')
  async upsertCardProduct(@Body() body: unknown) {
    const dto = CardProductUpsertSchema.parse(body);
    return unwrapOrThrow(await this.service.upsertCardProduct({
      cardId: dto.cardId,
      productId: dto.productId,
      targetValue: dto.targetValue ?? null,
      formulaType: dto.formulaType ?? null,
      measurementUnit: dto.measurementUnit ?? null,
      isActive: dto.isActive ?? true,
      notes: dto.notes ?? null,
    }));
  }

  @ApiOperation({ summary: 'Karta+mahsulot ЦКП norma slotni deaktivatsiya qilish (#10)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Delete('card-products/:id')
  async deactivateCardProduct(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrThrow(await this.service.deactivateCardProduct(id));
  }

  // ─── GAP #14 — xodim shaxsiy ЦКП norma override boshqaruvi (ckp_personal_targets). ───

  @ApiOperation({ summary: 'Xodim shaxsiy ЦКП norma override ro\'yxati (#14)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('personal-targets')
  async listPersonalTargets(@Query('cardId') cardId: string) {
    const data = unwrapOrInternal(await this.service.listPersonalTargets(Number(cardId)));
    const items = Array.isArray(data) ? data : [];
    return { items, total: items.length };
  }

  @ApiOperation({ summary: 'Xodim shaxsiy ЦКП norma override yaratish/yangilash (#14)' })
  @ApiResponse({ status: 201, description: 'OK' })
  @Post('personal-targets')
  async upsertPersonalTarget(@Body() body: unknown) {
    const dto = PersonalTargetUpsertSchema.parse(body);
    return unwrapOrThrow(await this.service.upsertPersonalTarget({
      employeeId: dto.employeeId,
      cardId: dto.cardId,
      productId: dto.productId ?? null,
      period: dto.period ?? null,
      targetValue: dto.targetValue ?? null,
      formulaType: dto.formulaType ?? null,
      notes: dto.notes ?? null,
    }));
  }

  @ApiOperation({ summary: "Xodim shaxsiy ЦКП norma override'ni o'chirish (#14)" })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Delete('personal-targets/:id')
  async deletePersonalTarget(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrThrow(await this.service.deletePersonalTarget(id));
  }
}
