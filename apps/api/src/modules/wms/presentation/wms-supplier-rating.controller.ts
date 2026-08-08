/**
 * @module wms-supplier-rating.controller
 * @description Ta'minotchi ishonchlilik reytingi O'QISH endpointlari
 *   (EP-WMS-094 / EP-WMS-022) — FE jadval/karta uchun. ADDITIVE (Q-46):
 *   faqat GET; reyting hisobi/yozuv event-listener orqali boradi (tegmaymiz).
 *
 *   - GET /api/wms/suppliers/rating       — barcha ta'minotchilar reytingi (ro'yxat)
 *   - GET /api/wms/suppliers/:id/rating    — bitta ta'minotchi + oxirgi oylik breakdown
 *
 *   Q-40: data yo'q → bo'sh ro'yxat / reyting=null (soxta qiymat yo'q).
 * @layer Presentation (WMS)
 */

import {
  Controller, Get, Param, Query,
  UseGuards, UseInterceptors, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { z } from 'zod';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { PermissionGuard } from '@common/guards/permission.guard';
import { RequirePermission } from '@common/decorators/require-permission.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { unwrapOrThrow } from '@common/http-result';
import { SupplierRatingService } from '../application/supplier-rating.service';

/** Ro'yxat query — past-only filtri + pagination. */
const ListRatingQuerySchema = z.object({
  lowOnly: z
    .union([z.literal('true'), z.literal('false'), z.boolean()])
    .optional()
    .transform((v) => v === true || v === 'true'),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

@ApiThrottle()
@UseGuards(JwtAuthGuard, PermissionGuard)
@UseInterceptors(AuditInterceptor)
@ApiTags('Wms Supplier Rating')
@ApiBearerAuth()
@Controller('wms/suppliers')
export class WmsSupplierRatingController {
  constructor(private readonly svc: SupplierRatingService) {}

  @ApiOperation({ summary: 'Ta\'minotchilar ishonchlilik reytingi ro\'yxati' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('rating')
  @RequirePermission('wms:READ')
  async listRatings(@Query() query: unknown) {
    const dto = ListRatingQuerySchema.parse(query ?? {});
    return unwrapOrThrow(await this.svc.listRatings(dto.lowOnly, dto.limit, dto.offset));
  }

  @ApiOperation({ summary: 'Bitta ta\'minotchi reytingi + oxirgi oylik breakdown' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Ta\'minotchi topilmadi' })
  @Get(':id/rating')
  @RequirePermission('wms:READ')
  async getRating(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrThrow(await this.svc.getRating(id));
  }
}
