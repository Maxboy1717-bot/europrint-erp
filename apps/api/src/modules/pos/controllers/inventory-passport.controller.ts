/**
 * @module inventory-passport.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Controller, Get, Post, Body, Param, ParseIntPipe, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { PermissionGuard } from '@common/guards/permission.guard';
import { RequirePermission } from '@common/decorators/require-permission.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@common/types/user.types';
import { unwrapOrInternal } from '@common/http-result';
import { PosInventoryPassportService } from '../pos-inventory-passport.service';
import { CreatePassportDto } from '../pos-inventory-passport.repository';

@ApiTags('POS — Inventar Pasporti')
@ApiBearerAuth()
@UseGuards(PermissionGuard)
@Throttle({ default: { limit: 60, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@Controller('pos/inventory-passport')
export class InventoryPassportController {
  constructor(private readonly svc: PosInventoryPassportService) {}

  @Post()
  @RequirePermission('pos.movements.create')
  @ApiOperation({ summary: 'Inventar pasporti yaratish (EXTERNAL_IN uchun)' })
  async create(@Body() dto: CreatePassportDto, @CurrentUser() user: AuthenticatedUser) {
    return unwrapOrInternal(await this.svc.createPassport(dto, user.id));
  }

  @Get('quarantine')
  @RequirePermission('pos.qc.read')
  @ApiOperation({ summary: 'Karantindagi materiallar ro\'yxati' })
  async getQuarantine() {
    return unwrapOrInternal(await this.svc.getQuarantineList());
  }

  @Get(':movementId')
  @RequirePermission('pos.movements.read')
  @ApiOperation({ summary: 'Harakat bo\'yicha inventar pasporti' })
  async getByMovement(@Param('movementId', ParseIntPipe) movementId: number) {
    return unwrapOrInternal(await this.svc.getPassport(movementId));
  }

  @Get()
  @RequirePermission('pos.movements.read')
  @ApiOperation({ summary: 'Inventar pasportlari ro\'yxati (filtrlash)' })
  async list(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('qcResult') qcResult?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return unwrapOrInternal(await this.svc.listPassports({
      fromDate, toDate, qcResult,
      limit: limit ? Number(limit) : 50,
      offset: offset ? Number(offset) : 0,
    }));
  }

  @Post(':movementId/qc-decision')
  @RequirePermission('pos.qc.decide')
  @ApiOperation({ summary: 'QC qarori: QABUL, REWORK, CHIQARISH' })
  async qcDecision(
    @Param('movementId', ParseIntPipe) movementId: number,
    @Body() body: { qcResult: 'QABUL' | 'REWORK' | 'CHIQARISH'; qcNote?: string },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return unwrapOrInternal(await this.svc.recordQcDecision(movementId, body.qcResult, body.qcNote, user.id));
  }
}
