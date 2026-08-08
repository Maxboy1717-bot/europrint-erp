/**
 * @module warehouse-exit-guard.controller
 * @description NestJS controller — FAZA Q (Ombor AI-kamera nazorati). HTTP route
 *   handlers; delegates to WarehouseExitGuardService and returns unwrapped Result data.
 */

import { Body, Controller, Get, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { unwrapOrThrow } from '@common/http-result';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { WarehouseExitGuardService } from '../application/warehouse-exit-guard.service';
import { VerifyExitBodySchema, CrossCheckListQuerySchema } from './dto/warehouse-exit-guard.dto';

const GUARD_ROLES = ['super_admin', 'director', 'security_manager', 'warehouse_manager'];

@ApiThrottle()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Warehouse Exit Guard')
@ApiBearerAuth()
@Controller('iot/warehouse-guard')
export class WarehouseExitGuardController {
  constructor(private readonly svc: WarehouseExitGuardService) {}

  @ApiOperation({ summary: 'Verify a warehouse-exit camera snapshot against the claimed employee (HR face-recognition reuse)' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Camera or goods-issue not found' })
  @Post('verify-exit')
  @Roles(...GUARD_ROLES)
  @UseInterceptors(AuditInterceptor)
  async verifyExit(@Body() body: unknown) {
    const dto = VerifyExitBodySchema.parse(body);
    return unwrapOrThrow(await this.svc.verifyExit(dto));
  }

  @ApiOperation({ summary: 'List ai_camera_cross_check rows (warehouse identity/location cross-checks)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('cross-checks')
  @Roles(...GUARD_ROLES)
  async listCrossChecks(@Query() raw: Record<string, unknown>) {
    const q = CrossCheckListQuerySchema.parse(raw);
    return unwrapOrThrow(await this.svc.listCrossChecks(q.anomalyOnly, q.limit));
  }
}
