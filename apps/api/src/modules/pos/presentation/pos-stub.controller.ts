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
 *
 * Discovery sweep 2026-08-03 fix (Q-46 — code that doesn't work correctly is either
 * fixed or fully removed, never left half-broken): removed the legacy
 * `PATCH inventory/:productId/adjust` shim — confirmed zero live FE callers (the real
 * adjust flow is `POST /pos/stock/adjust` -> StockLedgerService.adjustStock, already
 * wired to canonical warehouse_stock per item #53). The shim wrote directly to
 * pos_stock_ledger from inside the controller (Qoida 6/15 violation) with a swallowed
 * `catch(_e){}` that always returned 200 `adjusted: false` on failure — a fake-success
 * response (Qoida 10) for an endpoint nothing called anyway.
 */

import { Controller, Get, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { StockLedgerService } from '../application/services/stock-ledger.service';
import { unwrapOrInternal } from '@common/http-result';

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
}
