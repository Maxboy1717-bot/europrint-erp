/**
 * @module warehouse-rental.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Body, Controller, Get, HttpException, HttpStatus, InternalServerErrorException, Logger, Param, Patch, Post, Put, Query, UseGuards, UseInterceptors, UsePipes } from '@nestjs/common';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { throwFromError, unwrapOrThrow } from '@common/http-result';
import { Throttle } from '@nestjs/throttler';
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

const WR_READ = ['super_admin', 'warehouse_manager', 'director', 'ERP_MANAGER', 'finance_manager'];
const WR_WRITE = ['super_admin', 'warehouse_manager', 'director', 'ERP_MANAGER'];

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('warehouse-rental')
export class WarehouseRentalController {
  private readonly logger = new Logger(WarehouseRentalController.name);

  constructor(private readonly svc: WarehouseRentalService) {}

  @Get('records')
  @Roles(...WR_READ)
  async getRecords(@Query('status') status?: string) {
    this.logger.log('GET warehouse rental records');
    const r = await this.svc.getRecords(status);
    const items = r.ok && Array.isArray(r.data) ? r.data : [];
    return { items, total: items.length };
  }

  @Post('records')
  @UsePipes(new ZodValidationPipe(WmsCreateWarehouseRentalSchema))
  @Roles(...WR_WRITE)
  async createRecord(@Body() body: WmsCreateWarehouseRentalDto, @CurrentUser() user: AuthenticatedUser) {
    this.logger.log('POST warehouse rental record');
    return unwrapOrThrow(await this.svc.createRecord(body, user?.id ?? null));
  }

  @Get('summary')
  @Roles(...WR_READ)
  async getSummary() {
    this.logger.log('GET warehouse rental summary');
    return unwrapOrThrow(await this.svc.getSummary());
  }

  @Get('settings')
  @Roles(...WR_READ)
  async getSettings() {
    this.logger.log('GET warehouse rental settings');
    return unwrapOrThrow(await this.svc.getSettings());
  }

  @Patch('settings')
  @UsePipes(new ZodValidationPipe(WmsUpdateRentalSettingsSchema))
  @Roles(...WR_WRITE)
  async updateSettings(@Body() body: WmsUpdateRentalSettingsDto) {
    this.logger.log('PATCH warehouse rental settings');
    return unwrapOrThrow(await this.svc.updateSettings(body));
  }

  @Post('records/:id/close')
  @Roles(...WR_WRITE)
  async closeRecord(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    this.logger.log(`POST close rental record ${id}`);
    return unwrapOrThrow(await this.svc.closeRecord(safeInt(id, 0), user?.id ?? null));
  }

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

  @Post('recalculate')
  async recalculate(@Body() _body: Record<string, unknown>) { return { success: true }; }

  @Patch('records/:id/close')
  @Roles(...WR_WRITE)
  async patchCloseRecord(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return unwrapOrThrow(await this.svc.closeRecord(safeInt(id, 0), user?.id ?? null));
  }

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

  @Put('settings')
  @UsePipes(new ZodValidationPipe(WmsUpdateRentalSettingsSchema))
  @Roles(...WR_WRITE)
  async putSettings(@Body() body: WmsUpdateRentalSettingsDto) {
    return unwrapOrThrow(await this.svc.updateSettings(body));
  }
}
