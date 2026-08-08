/**
 * @module qc-brak-snapshot.controller
 * @description Vision 09-qc #48 — Director-panel QC brak statistika snapshot endpoint'lari.
 * GET = oxirgi snapshot + staleness (fallback); POST /refresh = qayta hisoblash + outbox event.
 */

import { Controller, Get, Post, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { PermissionGuard } from '@common/guards/permission.guard';
import { RequirePermission } from '@common/decorators/require-permission.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { unwrapOrThrow } from '@common/http-result';
import { QcBrakSnapshotService } from '../application/qc-brak-snapshot.service';

@ApiTags('QC Brak Snapshot')
@ApiBearerAuth()
@ApiThrottle()
@Controller('qc')
@UseGuards(JwtAuthGuard, PermissionGuard)
@UseInterceptors(AuditInterceptor)
export class QcBrakSnapshotController {
  constructor(private readonly svc: QcBrakSnapshotService) {}

  @Get('brak-snapshot')
  @RequirePermission('qc.brak-snapshot:READ')
  @ApiOperation({ summary: 'Vision #48: Director paneli — oxirgi QC brak snapshot + "N daqiqa eski" belgisi' })
  async getSnapshot() {
    return unwrapOrThrow(await this.svc.getForDirector('global'));
  }

  @Post('brak-snapshot/refresh')
  @RequirePermission('qc.brak-snapshot:REFRESH')
  @ApiOperation({ summary: 'Vision #48: brak snapshotni qayta hisoblash + outbox event (real-time stream)' })
  async refresh() {
    return unwrapOrThrow(await this.svc.refresh('global'));
  }
}
