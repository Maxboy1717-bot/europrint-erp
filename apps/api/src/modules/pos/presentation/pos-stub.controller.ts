/**
 * @module pos-stub.controller
 * @description POS inventory stub endpoints.
 *
 * P3-26: Read endpoints (inventory/low-stock, etc.) previously returned
 * `{ data: [], total: 0 }`. Per Rule 10 those now return HTTP 501 so the POS
 * frontend shows a "Coming soon" empty state instead of pretending the till is
 * empty.
 *
 * Egasi 2026-07-01: retail-do'kon kontsepti (CashRegisterService, "chakana
 * do'kon POS") butunlay retiring qilindi — naqd-nazorat-hub (finance/cashier-hub)
 * bilan almashtirildi. Legacy `/pos/sales` + `/pos/sales/daily` (CashRegisterService
 * ga bog'liq edi) shu bilan birga olib tashlandi — hech qanday live FE chaqiruvchi
 * yo'q edi (POSDashboard.tsx allaqachon mavjud emas, pos-sync.ts hech qayerdan
 * import qilinmaydi — ikkalasi ham tasdiqlangan orfan).
 */

import { Controller, Get, Patch, Body, Param, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { z } from 'zod';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { StockLedgerService } from '../application/services/stock-ledger.service';
import { unwrapOrInternal } from '@common/http-result';
import { rawSql } from '@shared/db';
import { sql } from 'drizzle-orm';

const AdjustInventorySchema = z.object({
  quantity: z.union([z.string(), z.number()]).optional(),
  reason: z.string().max(500).optional(),
}).passthrough();

@ApiTags('POS - Inventar (Stub)')
@ApiBearerAuth()
@Roles('pos_manager', 'admin', 'super_admin', 'manager', 'director')
@UseGuards(RolesGuard)
@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@Controller('pos')
export class PosStubController {
  constructor(
    private readonly stockLedgerService: StockLedgerService,
  ) {}

  @Get('inventory/low-stock')
  @ApiOperation({ summary: 'Ombordagi kam qoldiq mahsulotlar (pos_stock_ledger balansidan)' })
  async getInventoryLowStock() {
    return unwrapOrInternal(await this.stockLedgerService.getLowStock());
  }

  @Get('inventory/movements')
  @ApiOperation({ summary: 'Inventar harakatlari (pos_stock_ledger jurnali)' })
  async getInventoryMovements(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('warehouseId') warehouseId?: string,
  ) {
    const lim = Math.min(limit ? parseInt(limit, 10) : 50, 200);
    const off = offset ? parseInt(offset, 10) : 0;
    return unwrapOrInternal(await this.stockLedgerService.getMovements(lim, off, warehouseId));
  }

  @Get('inventory/monthly-report')
  @ApiOperation({ summary: 'Oylik inventar hisoboti (pos_stock_ledger oylik aggregat)' })
  async getInventoryMonthlyReport(@Query('warehouseId') warehouseId?: string) {
    return unwrapOrInternal(await this.stockLedgerService.getMonthlyReport(warehouseId));
  }

  // Legacy adjust shim — writes a pos_stock_ledger entry so the adjustment is
  // recorded. Canonical warehouse stock lives in warehouse_stock (WMS); this
  // endpoint is kept for backward-compatibility with older screens.
  // (pos-v2 module removed 2026-06-22 — it was a dead orphan duplicate.)
  @Patch('inventory/:productId/adjust')
  @ApiOperation({ summary: 'Inventar miqdorini moslashtirish (legacy v1)' })
  async adjustInventory(@Param('productId') productId: string, @Body() body: unknown) {
    const dto = AdjustInventorySchema.parse(body);
    const matId = parseInt(productId, 10);
    const qtyChange = dto.quantity !== undefined ? Number(dto.quantity) : null;
    const reason = dto.reason ?? null;
    let rowsWritten = 0;
    if (!isNaN(matId) && qtyChange !== null) {
      try {
        const r = await rawSql(sql`
          INSERT INTO pos_stock_ledger (material_id, qty_change, reason, ts)
          VALUES (${matId}, ${qtyChange}, ${reason}, NOW())
          RETURNING id
        `);
        rowsWritten = (r as { rows?: unknown[] }).rows?.length ?? 0;
      } catch (_e) { /* ledger insert failed — non-fatal, continue */ }
    }
    return { productId, adjusted: rowsWritten > 0, rowsWritten, ...dto };
  }
}
