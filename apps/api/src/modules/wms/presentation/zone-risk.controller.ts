/**
 * @module zone-risk.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 *   Vision 10-warehouse #6 — IoT-signal zone at-risk flag. POST /wms/zone-risk/signal is the entry point an
 *   IoT anomaly integration calls to mark a zone (and ALL stock in it) at-risk; /clear resolves it; the GETs
 *   expose the current at-risk stock + the QC review queue.
 */
import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@common/types/user.types';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { unwrapOrThrow } from '@common/http-result';
import { safeInt } from '../../hr/common/db-rows';
import { ZoneRiskService } from '../application/zone-risk.service';
import {
  ZoneRiskSignalSchema,
  ZoneRiskSignalDto,
  ZoneRiskClearSchema,
  ZoneRiskClearDto,
} from './dto/zone-risk.dto';

// IoT / QC / warehouse roles that may raise or clear a zone risk signal.
// RolesGuard is case-insensitive + fail-closed (matches sibling WMS controllers).
const ZONE_RISK_ROLES = [
  'director', 'super_admin', 'warehouse_manager', 'mm_manager', 'qc_manager', 'warehouse_keeper',
];

@ApiThrottle()
@ApiTags('Wms Zone Risk')
@Controller('wms/zone-risk')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...ZONE_RISK_ROLES)
export class ZoneRiskController {
  constructor(private readonly svc: ZoneRiskService) {}

  @ApiOperation({ summary: 'IoT signal: flag ALL stock in a zone as at-risk + enqueue QC review' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Post('signal')
  @UsePipes(new ZodValidationPipe(ZoneRiskSignalSchema))
  async signal(@Body() body: ZoneRiskSignalDto) {
    return unwrapOrThrow(await this.svc.flagZone(body.zoneId, body.reason ?? ''));
  }

  @ApiOperation({ summary: 'Clear the at-risk flag for a zone + resolve its pending QC reviews' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Post('clear')
  @UsePipes(new ZodValidationPipe(ZoneRiskClearSchema))
  async clear(@Body() body: ZoneRiskClearDto, @CurrentUser() user: AuthenticatedUser) {
    return unwrapOrThrow(await this.svc.clearZone(body.zoneId, user?.id ?? null));
  }

  @ApiOperation({ summary: 'Pending QC review-queue rows (optionally filtered by zone)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('queue')
  async queue(@Query('zoneId') zoneId?: string, @Query('limit') limit?: string) {
    const r = await this.svc.getReviewQueue(zoneId ? safeInt(zoneId, 0) : null, safeInt(limit, 100));
    const items = r.ok && Array.isArray(r.data) ? r.data : [];
    return { items, total: items.length };
  }

  @ApiOperation({ summary: 'Current at-risk stock rows (material + zone context)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('at-risk')
  async atRisk(@Query('limit') limit?: string) {
    const r = await this.svc.getAtRiskStock(safeInt(limit, 100));
    const items = r.ok && Array.isArray(r.data) ? r.data : [];
    return { items, total: items.length };
  }
}
