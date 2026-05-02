import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
/**
 * POS — Stock Controller
 * Stok balans va ogohlantirishlar endpointlari
 */
import {
  Controller, Get, Post, Body, Param, Query,
  UseGuards, UseInterceptors, Logger, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { PermissionGuard } from '@common/guards/permission.guard';
import { RequirePermission } from '@common/decorators/require-permission.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@common/types/user.types';
import { unwrapOrInternal } from '@common/http-result';
import { StockLedgerService } from '../services/stock-ledger.service';
import { z } from 'zod';

const AdjustStockSchema = z.object({
  materialCardId: z.number().int().positive(),
  warehouseId: z.string().min(1),
  newQty: z.number().min(0),
});

const EXPIRY_DAYS_DEFAULT = 7;

@ApiTags('POS — Stok')
@ApiBearerAuth()
@UseGuards(PermissionGuard)
@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@Controller('pos/stock')
export class StockController {
  private readonly logger = new Logger(StockController.name);

  constructor(private readonly stockLedgerService: StockLedgerService) {}

  @Get()
  @RequirePermission('pos.reports.read')
  @ApiOperation({ summary: 'Barcha ombor balanslarining qisqacha ko\'rinishi' })
  async getAllStock() {
    return unwrapOrInternal(await this.stockLedgerService.getAllSummary());
  }

  @Post('adjust')
  @RequirePermission('pos.inventory_count.approve')
  @ApiOperation({ summary: 'Qo\'lda stok tuzatish (manual adjustment)' })
  async adjustStock(
    @Body() body: unknown,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const parsed = AdjustStockSchema.parse(body);
    return unwrapOrInternal(
      await this.stockLedgerService.adjustStock(
        parsed.materialCardId,
        parsed.warehouseId,
        parsed.newQty,
        user.id,
      ),
    );
  }

  @Get('low-alerts')
  @RequirePermission('pos.reports.read')
  @ApiOperation({ summary: 'Past stok ogohlantirishlari' })
  async getLowAlerts() {
    return unwrapOrInternal(await this.stockLedgerService.getLowAlerts());
  }

  @Get('expiry-alerts')
  @RequirePermission('pos.reports.read')
  @ApiOperation({ summary: 'Muddati yaqinlashayotgan materiallar' })
  @ApiQuery({ name: 'days', required: false, description: 'Necha kun ichida (default: 7)' })
  async getExpiryAlerts(@Query('days') days?: string) {
    const daysAhead = days ? parseInt(days, 10) : EXPIRY_DAYS_DEFAULT;
    return unwrapOrInternal(await this.stockLedgerService.getExpiryAlerts(daysAhead));
  }

  @Get(':warehouseId/:materialId')
  @RequirePermission('pos.reports.read')
  @ApiOperation({ summary: 'Real-time material balansi (ombor va material bo\'yicha)' })
  async getBalance(
    @Param('warehouseId') warehouseId: string,
    @Param('materialId', ParseIntPipe) materialId: number,
  ) {
    return unwrapOrInternal(await this.stockLedgerService.getBalance(materialId, warehouseId));
  }
}
