/**
 * @module mes-wms-param-compare.controller
 * @description 08-mes #24 — Format/gramm ↔ WMS partiya parametrlari taqqoslash endpointlari.
 * POST compare (mutation) + GET history. Transport qatlami; hamma mantiq servisda (Qoida 6).
 */

import {
  Controller, Get, Post, Query, Body, Req, UseGuards, UseInterceptors, UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { unwrapOrThrow } from '@common/http-result';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { MesWmsParamCompareService } from '../application/mes-wms-param-compare.service';
import { safeInt } from '../../hr/common/db-rows';

const MES_ROLES = ['super_admin', 'director', 'production_manager', 'operator', 'technologist'];

const CompareSchema = z.object({
  sessionId: z.coerce.number().int().positive(),
  batchLotId: z.coerce.number().int().positive(),
});
type CompareDto = z.infer<typeof CompareSchema>;

@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@ApiTags('Mes WMS Param Checks')
@Controller('mes/wms-param-checks')
@UseGuards(RolesGuard)
@Roles(...MES_ROLES)
export class MesWmsParamCompareController {
  constructor(private readonly svc: MesWmsParamCompareService) {}

  @ApiOperation({ summary: 'Compare session Format/gramm against a WMS batch (batch_lots) material params' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Session or batch not found' })
  @Post('compare')
  @UsePipes(new ZodValidationPipe(CompareSchema))
  async compare(@Body() body: CompareDto, @Req() req: { user?: { id?: number } }) {
    const checkedBy = req?.user?.id != null ? Number(req.user.id) : null;
    return unwrapOrThrow(await this.svc.compare(body.sessionId, body.batchLotId, checkedBy));
  }

  @ApiOperation({ summary: 'List WMS param-comparison history for a session' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get()
  async list(@Query('sessionId') sessionId?: string) {
    return unwrapOrThrow(await this.svc.listForSession(safeInt(sessionId, 0)));
  }
}
