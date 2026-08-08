/**
 * @module warehouse-rental.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Body, Controller, Get, HttpException, HttpStatus, InternalServerErrorException, Logger, Param, Patch, Post, Put, Query, UseGuards, UseInterceptors, UsePipes } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { throwFromError, unwrapOrThrow } from '@common/http-result';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { WarehouseRentalService } from '../application/warehouse-rental.service';
import { safeInt } from '../../hr/common/db-rows';
import { AuthenticatedUser } from '@common/types/user.types';
import {
  WmsCreateWarehouseRentalSchema, WmsCreateWarehouseRentalDto,
  WmsUpdateRentalSettingsSchema, WmsUpdateRentalSettingsDto,
  WmsMarkRentalPaidSchema, WmsMarkRentalPaidDto,
} from '../dto/wms.dto';

const WR_READ = ['super_admin', 'warehouse_manager', 'director', 'finance_manager'];
const WR_WRITE = ['super_admin', 'warehouse_manager', 'director'];

@ApiThrottle()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Warehouse Rental')
@ApiBearerAuth()
@Controller('warehouse-rental')
export class WarehouseRentalController {
  private readonly logger = new Logger(WarehouseRentalController.name);

  constructor(private readonly svc: WarehouseRentalService) {}

  @ApiOperation({ summary: 'Get records' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('records')
  @Roles(...WR_READ)
  async getRecords(@Query('status') status?: string) {
    this.logger.log('GET warehouse rental records');
    const r = await this.svc.getRecords(status);
    const items = r.ok && Array.isArray(r.data) ? r.data : [];
    return { items, total: items.length };
  }

  @ApiOperation({ summary: 'Create record' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('records')
  @UsePipes(new ZodValidationPipe(WmsCreateWarehouseRentalSchema))
  @Roles(...WR_WRITE)
  async createRecord(@Body() body: WmsCreateWarehouseRentalDto, @CurrentUser() user: AuthenticatedUser) {
    this.logger.log('POST warehouse rental record');
    return unwrapOrThrow(await this.svc.createRecord(body, user?.id ?? null));
  }

  @ApiOperation({ summary: 'Get summary' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('summary')
  @Roles(...WR_READ)
  async getSummary() {
    this.logger.log('GET warehouse rental summary');
    return unwrapOrThrow(await this.svc.getSummary());
  }

  @ApiOperation({ summary: 'Get settings' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('settings')
  @Roles(...WR_READ)
  async getSettings() {
    this.logger.log('GET warehouse rental settings');
    return unwrapOrThrow(await this.svc.getSettings());
  }

  @ApiOperation({ summary: 'Update settings' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Patch('settings')
  @UsePipes(new ZodValidationPipe(WmsUpdateRentalSettingsSchema))
  @Roles(...WR_WRITE)
  async updateSettings(@Body() body: WmsUpdateRentalSettingsDto) {
    this.logger.log('PATCH warehouse rental settings');
    return unwrapOrThrow(await this.svc.updateSettings(body));
  }

  @ApiOperation({ summary: 'Close record' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Post('records/:id/close')
  @Roles(...WR_WRITE)
  async closeRecord(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    this.logger.log(`POST close rental record ${id}`);
    return unwrapOrThrow(await this.svc.closeRecord(safeInt(id, 0), user?.id ?? null));
  }

  @ApiOperation({ summary: 'Mark paid' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('records/:id/mark-paid')
  @UsePipes(new ZodValidationPipe(WmsMarkRentalPaidSchema))
  @Roles(...WR_WRITE)
  async markPaid(
    @Param('id') id: string,
    @Body() body: WmsMarkRentalPaidDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    this.logger.log(`POST mark-paid rental record ${id}`);
    return unwrapOrThrow(await this.svc.markPaid(safeInt(id, 0), user?.id ?? null, body.notes ? String(body.notes) : undefined));
  }

  // A8/green-lie retire (2026-06-05): `POST /api/warehouse-rental/recalculate` returned
  // {success:true} and recomputed NOTHING (no service method, no defined formula). No FE
  // caller (WarehouseRental page has no recalculate call). Removed rather than ship an
  // unspecified/guessed recompute (Q-40). See docs/yashil-yolgon-reja-2026-06-05.md A8.

  @ApiOperation({ summary: 'Patch close record' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch('records/:id/close')
  @Roles(...WR_WRITE)
  async patchCloseRecord(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return unwrapOrThrow(await this.svc.closeRecord(safeInt(id, 0), user?.id ?? null));
  }

  @ApiOperation({ summary: 'Patch mark paid' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Patch('records/:id/mark-paid')
  @UsePipes(new ZodValidationPipe(WmsMarkRentalPaidSchema))
  @Roles(...WR_WRITE)
  async patchMarkPaid(
    @Param('id') id: string,
    @Body() body: WmsMarkRentalPaidDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return unwrapOrThrow(await this.svc.markPaid(safeInt(id, 0), user?.id ?? null, body.notes ? String(body.notes) : undefined));
  }

  @ApiOperation({ summary: 'Put settings' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Put('settings')
  @UsePipes(new ZodValidationPipe(WmsUpdateRentalSettingsSchema))
  @Roles(...WR_WRITE)
  async putSettings(@Body() body: WmsUpdateRentalSettingsDto) {
    return unwrapOrThrow(await this.svc.updateSettings(body));
  }
}
