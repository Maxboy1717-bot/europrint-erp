/**
 * @module qc-material-scan.controller
 * @description Vision 09-qc#11 — "Har rulon tabletda scan → qc_material_scan_log".
 *   The write route is tablet-facing (floor-operator PWA) and carries the SAME guard
 *   surface as IotTabletController (@Public + TabletTokenGuard); the read route is for
 *   QC staff (JwtAuthGuard + RolesGuard) to walk the scan log FIFO to a guilty lot.
 *   Transport-only (Qoida 6): parse -> delegate -> unwrap.
 */

import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { TabletTokenGuard } from '@common/guards/tablet-token.guard';
import { Public } from '@common/decorators/public.decorator';
import { Roles } from '@common/decorators/roles.decorator';
import { Role } from '@common/constants/roles.constants';
import { unwrapOrInternal } from '@common/http-result';
import { z } from 'zod';
import { QcMaterialScanService } from '../application/qc-material-scan.service';

const QC_ROLES = [Role.SUPER_ADMIN, Role.DIRECTOR, Role.QC_SPECIALIST, Role.PRODUCTION_MANAGER, 'qc_manager', 'qc_inspector'];

/** POST body: one roll scan from the tablet (order/lot/stanok/smena + idempotency keys). */
const MaterialScanSchema = z.object({
  orderId: z.coerce.number().int().positive().optional(),
  sessionId: z.coerce.number().int().positive().optional(),
  lot: z.string().min(1).max(100).optional(),
  materialId: z.coerce.number().int().positive().optional(),
  workCenterId: z.coerce.number().int().positive().optional(),
  shiftId: z.coerce.number().int().positive().optional(),
  scannedBy: z.coerce.number().int().positive().optional(),
  tabletId: z.string().min(1).max(120).optional(),
  localSeqNo: z.coerce.number().int().nonnegative().optional(),
  notes: z.string().max(2000).optional(),
});

/** GET query: FIFO / filtered scan-log lookup for guilty-lot tracing. */
const MaterialScanQuerySchema = z.object({
  orderId: z.coerce.number().int().positive().optional(),
  sessionId: z.coerce.number().int().positive().optional(),
  lot: z.string().min(1).max(100).optional(),
  workCenterId: z.coerce.number().int().positive().optional(),
  fifo: z.union([z.literal('true'), z.literal('false'), z.boolean()]).optional().transform((v) => v === true || v === 'true'),
  limit: z.coerce.number().int().positive().max(500).optional(),
});

@ApiTags('QC Material Scan')
@ApiBearerAuth()
@ApiThrottle()
@Controller('qc')
@UseGuards(JwtAuthGuard, RolesGuard)
export class QcMaterialScanController {
  constructor(private readonly svc: QcMaterialScanService) {}

  @ApiOperation({ summary: 'Vision 09-qc#11: record a per-roll tablet scan (order/lot/stanok/smena/ts)' })
  @ApiResponse({ status: 201, description: 'OK — { row, idempotent }' })
  @Post('material-scans')
  @Public()
  @UseGuards(TabletTokenGuard)
  async recordScan(@Body() body: unknown) {
    const dto = MaterialScanSchema.parse(body ?? {});
    return unwrapOrInternal(await this.svc.recordScan(dto));
  }

  @ApiOperation({ summary: 'List / FIFO roll-scan log for guilty-lot tracing' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('material-scans')
  @Roles(...QC_ROLES)
  async listScans(@Query() query: unknown) {
    const q = MaterialScanQuerySchema.parse(query ?? {});
    return unwrapOrInternal(await this.svc.listScans(q));
  }
}
