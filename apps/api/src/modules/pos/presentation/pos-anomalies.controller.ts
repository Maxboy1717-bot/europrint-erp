/**
 * @module pos-anomalies.controller
 * @description POS Monitor — anomaliya signallari O'QISH endpointlari (boshliq
 *   paneli). Qoida-asosli aniqlangan shubhali harakatlar (tungi katta miqdor,
 *   topshir↔qabul nomuvofiqligi, normadan ortiqcha sarf, bekor/prostoy).
 *   ADDITIVE (Q-46): faqat GET; aniqlash/yozuv movement-completed listener orqali.
 *
 *   - GET /api/pos/anomalies        — anomaliyalar ro'yxati (status/severity filtri)
 *   - GET /api/pos/anomalies/:id     — bitta anomaliya (detal)
 *
 *   Q-40: data yo'q (pos_anomaly_flags bo'sh) → bo'sh ro'yxat (soxta qiymat yo'q).
 * @layer Presentation (POS)
 */

import {
  Controller, Get, Param, Query,
  UseGuards, UseInterceptors, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { z } from 'zod';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { PermissionGuard } from '@common/guards/permission.guard';
import { RequirePermission } from '@common/decorators/require-permission.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { unwrapOrThrow } from '@common/http-result';
import { PosAnomalyService } from '../application/services/pos-anomaly.service';

/** Ro'yxat query — status/severity filtri + pagination. */
const ListAnomalyQuerySchema = z.object({
  status: z.enum(['open', 'reviewed', 'dismissed', 'resolved']).optional(),
  severity: z.enum(['info', 'warning', 'critical']).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

@ApiTags('POS — Anomaliyalar')
@ApiBearerAuth()
@UseGuards(PermissionGuard)
@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@Controller('pos/anomalies')
export class PosAnomaliesController {
  constructor(private readonly anomaly: PosAnomalyService) {}

  @Get()
  @RequirePermission('pos.movements.read')
  @ApiOperation({ summary: 'POS anomaliya signallari ro\'yxati (boshliq paneli)' })
  @ApiResponse({ status: 200, description: 'OK' })
  async list(@Query() query: unknown) {
    const dto = ListAnomalyQuerySchema.parse(query ?? {});
    return unwrapOrThrow(
      await this.anomaly.listAnomalies(dto.status ?? null, dto.severity ?? null, dto.limit, dto.offset),
    );
  }

  @Get(':id')
  @RequirePermission('pos.movements.read')
  @ApiOperation({ summary: 'Bitta POS anomaliya signali (detal)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Anomaliya topilmadi' })
  async getOne(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrThrow(await this.anomaly.getById(id));
  }
}
