/**
 * @module delivery-request-fulfillment.controller
 * @description Batch 3 Item B, GATE 2 — POS "zayavka bajarildi" capture (SHADOW-only).
 *   Warehouse staff mark an APPROVED DELIVERY_REQUEST zayavka as physically issued. This writes
 *   ONLY the shadow record (delivery_request_fulfillment_shadow) — it does NOT touch warehouse_stock
 *   and does NOT reuse the stock-decrementing endpoints (pos/operations/issue, pos/movements). The
 *   route stays stable across gates; Gate 4 later swaps the service body to the real decrement.
 *   Transport-only: validate with Zod, delegate to the service, unwrap Result.
 */

import { Body, Controller, Param, Post, UseGuards, UseInterceptors } from '@nestjs/common';
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
    const r = await this.svc.fulfillShadow(documentId, dto.warehouseId ?? null, dto.lines, user?.id ?? null);
    if (!r.ok) throwFromError(r.error);
    return r.data;
  }
}
