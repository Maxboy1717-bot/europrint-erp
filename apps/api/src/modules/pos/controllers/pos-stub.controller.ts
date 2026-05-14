/**
 * @module pos-stub.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Controller, Get, Post, Patch, Body, Param, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';

@ApiTags('POS — Inventar (Stub)')
@ApiBearerAuth()
@Roles('cashier', 'pos_manager', 'admin', 'super_admin', 'manager', 'director')
@UseGuards(RolesGuard)
@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@Controller('pos')
export class PosStubController {

  @Post('sales')
  @ApiOperation({ summary: 'Yangi sotuv yaratish' })
  createSale(@Body() body: Record<string, unknown>) {
    const saleNumber = `POS-${Date.now()}`;
    return { saleNumber, sale: { id: saleNumber, ...body, createdAt: new Date().toISOString() } };
  }

  @Get('sales/daily')
  @ApiOperation({ summary: 'Kunlik sotuvlar' })
  getSalesDaily() { return { data: [], total: 0 }; }

  @Get('inventory/low-stock')
  @ApiOperation({ summary: 'Ombordagi kam qoldiq mahsulotlar' })
  getInventoryLowStock() { return { data: [], total: 0 }; }

  @Get('inventory/movements')
  @ApiOperation({ summary: 'Inventar harakatlari' })
  getInventoryMovements() { return { data: [], total: 0 }; }

  @Get('inventory/monthly-report')
  @ApiOperation({ summary: 'Oylik inventar hisoboti' })
  getInventoryMonthlyReport() { return { data: [] }; }

  @Patch('inventory/:productId/adjust')
  @ApiOperation({ summary: 'Inventar miqdorini moslashtirish' })
  adjustInventory(@Param('productId') productId: string, @Body() body: Record<string, unknown>) {
    return { productId, adjusted: true, ...body };
  }
}
