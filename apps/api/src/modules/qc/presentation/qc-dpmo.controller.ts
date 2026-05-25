/**
 * @module qc-dpmo.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Controller, Get, Post, Body, Param, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { PermissionGuard } from '@common/guards/permission.guard';
import { RequirePermission } from '@common/decorators/require-permission.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { unwrapOrBadRequest } from '@common/http-result';
import { z } from 'zod';
import { DpmoService } from '../domain/services/dpmo.service';

const DpmoBodyDto = z.object({
  defects:       z.number().min(0),
  opportunities: z.number().positive(),
  units:         z.number().positive(),
  usl:           z.number().optional(),
  lsl:           z.number().optional(),
  processMean:   z.number().optional(),
  processSigma:  z.number().positive().optional(),
});

@ApiTags('QC DPMO')
@ApiBearerAuth()
@ApiThrottle()
@Controller('qc')
@UseGuards(JwtAuthGuard, PermissionGuard)
@UseInterceptors(AuditInterceptor)
export class QcDpmoController {
  constructor(private readonly dpmoSvc: DpmoService) {}

  @Get('dpmo/:processId')
  @RequirePermission('qc.dpmo:READ')
  @ApiOperation({ summary: 'TZ-38: DPMO + Six Sigma level — production order bo\'yicha' })
  async getDpmoByProcess(@Param('processId') processId: string) {
    const { defects, itemsChecked } = await this.dpmoSvc.getProcessDpmoData(processId);
    const result = await this.dpmoSvc.calculate({
      defects,
      opportunities: 1,
      units: itemsChecked,
    });
    return { processId, inspectionCount: itemsChecked, ...unwrapOrBadRequest(result) };
  }

  @Post('dpmo')
  @RequirePermission('qc.dpmo:CALCULATE')
  @ApiOperation({ summary: 'TZ-38: DPMO + Cp/Cpk hisoblash (custom kirish)' })
  async calculateDpmo(@Body() body: unknown) {
    const dto = DpmoBodyDto.parse(body);
    return unwrapOrBadRequest(await this.dpmoSvc.calculate(dto));
  }
}
