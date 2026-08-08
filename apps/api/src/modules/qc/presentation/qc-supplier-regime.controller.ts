/**
 * @module qc-supplier-regime.controller
 * @description QC ISO 2859 kuchaytirilgan nazorat rejimi endpointlari (per-supplier + per-material).
 * @layer Presentation (QC)
 */

import { Controller, Get, Post, Query, Body, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { Roles } from '@common/decorators/roles.decorator';
import { Role } from '@common/constants/roles.constants';
import { unwrapOrInternal } from '@common/http-result';
import { QcSupplierRegimeService } from '../application/qc-supplier-regime.service';
import { z } from 'zod';

const QC_ROLES = [Role.SUPER_ADMIN, Role.DIRECTOR, Role.QC_SPECIALIST, Role.PRODUCTION_MANAGER, 'qc_manager', 'qc_inspector'];

const RecordDto = z.object({
  supplierId: z.number().int().positive(),
  materialId: z.number().int().positive(),
  rejected: z.boolean(),
  inspectionId: z.number().int().positive().optional(),
});

@ApiTags('QC')
@ApiBearerAuth()
@ApiThrottle()
@Controller('qc')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class QcSupplierRegimeController {
  constructor(private readonly svc: QcSupplierRegimeService) {}

  @Get('supplier-regime')
  @Roles(...QC_ROLES)
  @ApiOperation({ summary: 'ISO 2859 inspection regime for a (supplier, material) pair' })
  async getRegime(@Query('supplierId') supplierId?: string, @Query('materialId') materialId?: string) {
    return unwrapOrInternal(
      await this.svc.getRegime(parseInt(supplierId ?? '0', 10), parseInt(materialId ?? '0', 10)),
    );
  }

  @Post('supplier-regime/record')
  @Roles(...QC_ROLES)
  @ApiOperation({ summary: 'Record an incoming-lot decision; advances ISO 2859 tightened/normal regime' })
  async record(@Body() body: unknown) {
    const dto = RecordDto.parse(body);
    return unwrapOrInternal(await this.svc.recordLotResult(dto));
  }
}
