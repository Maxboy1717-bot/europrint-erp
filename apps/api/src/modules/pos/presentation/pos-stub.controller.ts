/**
 * @module pos-stub.controller
 * @description POS inventory/sales stub endpoints.
 *
 * P3-26: Read endpoints (sales/daily, inventory/low-stock, etc.) previously
 * returned `{ data: [], total: 0 }`. Per Rule 10 those now return HTTP 501 so the
 * POS frontend shows a "Coming soon" empty state instead of pretending the till is
 * empty.
 *
 * A.2 (P0): The legacy `/pos/sales` POST endpoint previously echoed payloads
 * without persisting to the database (real bug - POSDashboard.tsx and pos-sync.ts
 * both hit this URL). It now DELEGATES to `CashRegisterService.createTransaction`,
 * so the frontend's existing URL writes to `retail_pos_transactions`. The legacy
 * payload shape is adapted to the service's `CreateTransactionSchema` here so we
 * keep wire compatibility without touching callers.
 */

import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, UseInterceptors, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { z } from 'zod';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@common/types/user.types';
import { CashRegisterService } from '../application/services/cash-register.service';
import { StockLedgerService } from '../application/services/stock-ledger.service';
import { unwrapOrInternal } from '@common/http-result';
import { rawSql } from '@shared/db';
import { sql } from 'drizzle-orm';

const LegacySaleItemSchema = z.object({
  productId: z.union([z.string(), z.number()]).transform((v) => String(v)),
  name:      z.string().optional(),
  quantity:  z.union([z.string(), z.number()]).transform((v) => Number(v)).pipe(z.number().positive()),
});

const LegacyCreateSaleSchema = z.object({
  items:          z.array(LegacySaleItemSchema).min(1),
  paymentMethod:  z.string().max(50).optional(),
  customerName:   z.string().optional(),
  customerId:     z.union([z.string(), z.number()]).optional(),
  discountAmount: z.union([z.string(), z.number()]).optional(),
  notes:          z.string().optional(),
  taxRate:        z.union([z.string(), z.number()]).optional(),
}).passthrough();

const AdjustInventorySchema = z.object({
  quantity: z.union([z.string(), z.number()]).optional(),
  reason: z.string().max(500).optional(),
}).passthrough();

/**
 * Map legacy `/pos/sales` payload to the canonical CashRegisterService DTO.
 *
 * WHY: Two callers (POSDashboard.tsx, pos-sync.ts) still POST to `/api/pos/sales`
 * with `{ items: [{productId, quantity}], paymentMethod, customerName, discountAmount }`.
 * The canonical schema (`CreateTransactionSchema` in cash-register.service.ts)
 * requires `items[].name` and a payment method from the enum
 * `cash|card|transfer|mixed`. This helper bridges the gap so the legacy URL
 * persists exactly the same row the canonical `/pos/transactions` does.
 */
function adaptLegacySale(body: unknown): Record<string, unknown> {
  const dto = LegacyCreateSaleSchema.parse(body);
  const allowedMethods = new Set(['cash', 'card', 'transfer', 'mixed']);
  const rawMethod = (dto.paymentMethod ?? 'cash').toLowerCase();
  const paymentMethod = allowedMethods.has(rawMethod)
    ? rawMethod
    : rawMethod === 'bank_transfer' ? 'transfer' : 'cash';
  return {
    items: dto.items.map((i) => ({
      productId: i.productId,
      name:      i.name ?? `Item ${i.productId}`,
      quantity:  i.quantity,
    })),
    customerName:   dto.customerName,
    paymentMethod,
    discountAmount: dto.discountAmount !== undefined ? Number(dto.discountAmount) : 0,
    notes:          dto.notes,
    ...(dto.taxRate !== undefined ? { taxRate: Number(dto.taxRate) } : {}),
  };
}

@ApiTags('POS - Inventar (Stub)')
@ApiBearerAuth()
@Roles('cashier', 'pos_manager', 'admin', 'super_admin', 'manager', 'director')
@UseGuards(RolesGuard)
@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@Controller('pos')
export class PosStubController {
  constructor(
    private readonly cashRegisterService: CashRegisterService,
    private readonly stockLedgerService: StockLedgerService,
  ) {}

  // A.2 (P0): Legacy `/pos/sales` now persists via CashRegisterService.
  // The wire payload (`items[].productId`, `items[].quantity`, `paymentMethod`,
  // `customerName`, `discountAmount`) is adapted to the canonical Zod schema
  // before delegation. Response shape preserves the `{ saleNumber, sale }`
  // contract POSDashboard.tsx and pos-sync.ts already consume.
  @Post('sales')
  @ApiOperation({ summary: 'Yangi sotuv yaratish (haqiqiy persistence - CashRegisterService.createTransaction)' })
  async createSale(@Body() body: unknown, @CurrentUser() user: AuthenticatedUser) {
    const dto = adaptLegacySale(body);
    const cashierId = user?.id !== undefined && user?.id !== null ? String(user.id) : undefined;
    const sale = unwrapOrInternal(await this.cashRegisterService.createTransaction(dto, cashierId));
    const saleNumber = (sale as { transactionNumber?: string; id?: string }).transactionNumber
                    ?? (sale as { id?: string }).id
                    ?? `POS-${Date.now()}`;
    return { saleNumber, sale };
  }

  @Get('sales/daily')
  @ApiOperation({ summary: 'Kunlik sotuvlar (retail_pos_transactions)' })
  async getSalesDaily(@Query('date') date?: string) {
    return this.cashRegisterService.getDailySales(date);
  }

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
