/**
 * @module pos-stub.controller
 * @description POS inventory/sales stub endpoints.
 *
 * P3-26: Read endpoints (sales/daily, inventory/low-stock, etc.) previously
 * returned `{ data: [], total: 0 }`. Per Rule 10 those now return HTTP 501 so the
 * POS frontend shows a "Coming soon" empty state instead of pretending the till is
 * empty. The write endpoints (sales POST, inventory adjust PATCH) keep the original
 * passthrough shape because the POS module is in transitional state and the v2
 * controller (`pos-v2`) is now the canonical writer; these are marked LEGACY_NOOP.
 */

import { Controller, Get, Post, Patch, Body, Param, UseGuards, UseInterceptors, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { z } from 'zod';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';

const CreateSaleSchema = z.object({
  items: z.array(z.record(z.unknown())).optional(),
  total: z.union([z.string(), z.number()]).optional(),
  paymentMethod: z.string().max(50).optional(),
  customerId: z.union([z.string(), z.number()]).optional(),
}).passthrough();

const AdjustInventorySchema = z.object({
  quantity: z.union([z.string(), z.number()]).optional(),
  reason: z.string().max(500).optional(),
}).passthrough();

const notImplemented = (route: string): never => {
  throw new HttpException(
    { message: `Endpoint not yet implemented: ${route}`, code: 'NOT_IMPLEMENTED' },
    HttpStatus.NOT_IMPLEMENTED,
  );
};

@ApiTags('POS — Inventar (Stub)')
@ApiBearerAuth()
@Roles('cashier', 'pos_manager', 'admin', 'super_admin', 'manager', 'director')
@UseGuards(RolesGuard)
@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@Controller('pos')
export class PosStubController {

  // LEGACY_NOOP: POS v1 sale creation. The pos-v2 module owns persistence now;
  // this endpoint exists for legacy clients that still POST to /pos/sales. It
  // echoes the validated payload with a generated sale number for receipt
  // rendering and does not write to the till. TODO P3-26: migrate remaining
  // clients to /pos-v2 and remove this controller.
  @Post('sales')
  @ApiOperation({ summary: 'Yangi sotuv yaratish (legacy v1 — pos-v2 ga ko\'chirilsin)' })
  createSale(@Body() body: unknown) {
    const dto = CreateSaleSchema.parse(body);
    const saleNumber = `POS-${Date.now()}`;
    return { saleNumber, sale: { id: saleNumber, ...dto, createdAt: new Date().toISOString() } };
  }

  @Get('sales/daily')
  @ApiOperation({ summary: 'Kunlik sotuvlar' })
  getSalesDaily() { return notImplemented('GET /pos/sales/daily'); }

  @Get('inventory/low-stock')
  @ApiOperation({ summary: 'Ombordagi kam qoldiq mahsulotlar' })
  getInventoryLowStock() { return notImplemented('GET /pos/inventory/low-stock'); }

  @Get('inventory/movements')
  @ApiOperation({ summary: 'Inventar harakatlari' })
  getInventoryMovements() { return notImplemented('GET /pos/inventory/movements'); }

  @Get('inventory/monthly-report')
  @ApiOperation({ summary: 'Oylik inventar hisoboti' })
  getInventoryMonthlyReport() { return notImplemented('GET /pos/inventory/monthly-report'); }

  // LEGACY_NOOP: Legacy adjust shim. pos-v2's WmsInventoryService is the real
  // writer; this returns the echoed payload so old screens stay functional.
  // TODO P3-26: migrate clients to /pos-v2/inventory and delete.
  @Patch('inventory/:productId/adjust')
  @ApiOperation({ summary: 'Inventar miqdorini moslashtirish (legacy v1)' })
  adjustInventory(@Param('productId') productId: string, @Body() body: unknown) {
    const dto = AdjustInventorySchema.parse(body);
    return { productId, adjusted: true, ...dto };
  }
}
