/**
 * @module stock-issuable.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 *
 * BE-T2-BARCODE-RESERV — Ombor terminal spec (2026-06-27):
 *  (1) POST /api/pos/barcode/generate — KIRIM uchun noyob barkod hosil qiladi
 *      (ombor-prefiks + ketma-ket seq), printer etiket-data qaytaradi (o'lcham
 *      label-config'dan, ombor turiga moslashadi).
 *  (2) GET  /api/pos/stock/issuable/:barcode — CHIQIM oqimi: skanlangan barkod →
 *      material + jami qoldiq + bron → bo'sh qoldiq; bron > 0 → blocked flag
 *      (faqat super_admin/direktor override).
 *
 * Q-46: ma'lumot-mantiq buzilmaydi — interfeysni qo'llab-quvvatlovchi YANGI endpointlar
 * (mavjud BarcodeController/StockController o'zgartirilmaydi; route to'qnashuvi yo'q —
 * generate va issuable/:barcode alohida segmentlar).
 */

import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import {
  Controller, Get, Post, Body, Param, Query,
  UseGuards, UseInterceptors, Logger, UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { PermissionGuard } from '@common/guards/permission.guard';
import { RequirePermission } from '@common/decorators/require-permission.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@common/types/user.types';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { unwrapOrInternal } from '@common/http-result';
import { z } from 'zod';
import { PosStockIssuableService } from '../application/services/pos-stock-issuable.service';

// ─── KIRIM barkod-gen body ────────────────────────────────────────────────────
export const GenerateInboundBarcodeSchema = z.object({
  materialCardId: z.number().int().positive(),
  warehouseId:    z.number().int().positive(),
  quantity:       z.number().positive().optional(),
  unit:           z.string().max(50).optional(),
});
export type GenerateInboundBarcodeDto = z.infer<typeof GenerateInboundBarcodeSchema>;

@ApiTags('POS — Barcode/Stock (Terminal)')
@ApiBearerAuth()
@UseGuards(PermissionGuard)
@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@Controller('pos')
export class StockIssuableController {
  private readonly logger = new Logger(StockIssuableController.name);

  constructor(private readonly issuableService: PosStockIssuableService) {}

  // ─── (1) KIRIM: barkod generatsiya ──────────────────────────────────────────

  @Post('barcode/generate')
  @RequirePermission('pos.barcode.print')
  @UsePipes(new ZodValidationPipe(GenerateInboundBarcodeSchema))
  @ApiOperation({
    summary: 'KIRIM uchun noyob barkod hosil qilish (ombor-prefiks + seq) + printer etiket-data',
  })
  async generateInbound(
    @Body() body: GenerateInboundBarcodeDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return unwrapOrInternal(
      await this.issuableService.generateInboundBarcode({
        materialCardId: body.materialCardId,
        warehouseId:    body.warehouseId,
        quantity:       body.quantity,
        unit:           body.unit,
        requestedBy:    user.id,
      }),
    );
  }

  // ─── (2) CHIQIM: barkod → bo'sh qoldiq + bron-blok ─────────────────────────

  @Get('stock/issuable/:barcode')
  @RequirePermission('pos.reports.read')
  @ApiOperation({
    summary: 'CHIQIM: skanlangan barkod → material + jami qoldiq + bron → bo\'sh qoldiq (bron>0 → blok)',
  })
  @ApiParam({ name: 'barcode', description: 'Skanlangan barkod qiymati' })
  @ApiQuery({ name: 'warehouseId', required: false, description: 'Aniq ombor (ko\'p ombor bo\'lsa)' })
  async getIssuable(
    @Param('barcode') barcode: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query('warehouseId') warehouseId?: string,
  ) {
    const wh = warehouseId ? parseInt(warehouseId, 10) : undefined;
    return unwrapOrInternal(
      await this.issuableService.getIssuable(
        barcode,
        user.role,
        Number.isFinite(wh) ? wh : undefined,
      ),
    );
  }
}
