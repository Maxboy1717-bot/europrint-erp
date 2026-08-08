/**
 * @module delivery-request-fulfillment.controller
 * @description Batch 3 Item B, GATE 2 — POS "zayavka bajarildi" capture (SHADOW-only).
 *   Warehouse staff mark an APPROVED DELIVERY_REQUEST zayavka as physically issued. This writes
 *   ONLY the shadow record (delivery_request_fulfillment_shadow) — it does NOT touch warehouse_stock
 *   and does NOT reuse the stock-decrementing endpoints (pos/operations/issue, pos/movements). The
 *   route stays stable across gates; Gate 4 later swaps the service body to the real decrement.
 *   Transport-only: validate with Zod, delegate to the service, unwrap Result.
 */

import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { z } from 'zod';
import { throwFromError } from '@common/http-result';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { PermissionGuard } from '@common/guards/permission.guard';
import { RequirePermission } from '@common/decorators/require-permission.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@common/types/user.types';
import { DeliveryRequestFulfillmentService } from '../application/services/delivery-request-fulfillment.service';

const FulfillShadowSchema = z.object({
  warehouseId: z.coerce.number().int().positive().optional(),
  // GATE 3 (decision Variant A): structured sales order link. Optional — falls back to the zayavka's
  // sales_order_ref ai-answer in the service; if neither resolves, the shadow is captured with a NULL link.
  salesOrderId: z.coerce.number().int().positive().optional(),
  lines: z.array(z.object({
    // STEP B (decision #4): finished-goods shadow is keyed by product_id (same space as #51 + warehouse_stock_fg).
    productId: z.coerce.number().int().positive(),
    quantity: z.coerce.number().positive(),
  })).min(1).max(500),
});

@ApiTags('POS — Delivery-request fulfillment (Gate 2 shadow)')
@ApiBearerAuth()
@UseGuards(PermissionGuard)
@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@Controller('pos/delivery-requests')
export class DeliveryRequestFulfillmentController {
  constructor(private readonly svc: DeliveryRequestFulfillmentService) {}

  // Gate 2: records a SHADOW fulfillment for an approved zayavka. NO warehouse_stock is touched.
  @Post(':documentId/fulfill')
  @RequirePermission('pos.operations.write')
  @ApiOperation({ summary: 'Tasdiqlangan DELIVERY_REQUEST zayavkani "bajarildi" deb belgilash (Gate 2: shadow, stock-siz)' })
  @ApiResponse({ status: 201, description: 'Shadow yozildi (stock tegilmadi)' })
  @ApiResponse({ status: 400, description: 'Zayavka tasdiqlanmagan / noto\'g\'ri tur' })
  @ApiResponse({ status: 404, description: 'Zayavka topilmadi' })
  async fulfill(
    @Param('documentId') documentId: string,
    @Body() body: unknown,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const dto = FulfillShadowSchema.parse(body);
    const r = await this.svc.fulfillShadow(documentId, dto.warehouseId ?? null, dto.salesOrderId ?? null, dto.lines, user?.id ?? null);
    if (!r.ok) throwFromError(r.error);
    return r.data;
  }

  // Gate 4 (real cutover): REALLY decrements warehouse_stock_fg (guarded) + writes the FG audit ledger.
  // This is the new FG stock-out path; the #51 delivery-goods-issued listener is disabled.
  @Post(':documentId/fulfill-live')
  @RequirePermission('pos.operations.write')
  @ApiOperation({ summary: 'Gate 4: tasdiqlangan zayavkani HAQIQATAN bajarish — warehouse_stock_fg kamayadi (guarded)' })
  @ApiResponse({ status: 201, description: 'FG stok kamaytirildi (har qator uchun status)' })
  @ApiResponse({ status: 400, description: 'Zayavka tasdiqlanmagan / noto\'g\'ri tur / ombor topilmadi' })
  @ApiResponse({ status: 404, description: 'Zayavka topilmadi' })
  async fulfillLive(
    @Param('documentId') documentId: string,
    @Body() body: unknown,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const dto = FulfillShadowSchema.parse(body);
    const r = await this.svc.fulfillReal(documentId, dto.warehouseId ?? null, dto.salesOrderId ?? null, dto.lines, user?.id ?? null);
    if (!r.ok) throwFromError(r.error);
    return r.data;
  }

  // Gate 3: compares the shadow's would-decrement against #51's ACTUAL warehouse_stock_fg decrement for a
  // sales order + logs the diff. SHADOW-only diagnostic — NO warehouse_stock / warehouse_stock_fg writes.
  @Get('compare/:salesOrderId')
  @RequirePermission('pos.operations.write')
  @ApiOperation({ summary: 'Gate 3: shadow would-decrement ni #51 haqiqiy warehouse_stock_fg kamayishi bilan solishtirish (shadow-only)' })
  @ApiResponse({ status: 200, description: 'Solishtiruv natijasi (product bo\'yicha would/actual/diff + hasMismatch)' })
  async compare(@Param('salesOrderId', ParseIntPipe) salesOrderId: number) {
    const r = await this.svc.compareShadowVsActual(salesOrderId);
    if (!r.ok) throwFromError(r.error);
    return r.data;
  }
}
