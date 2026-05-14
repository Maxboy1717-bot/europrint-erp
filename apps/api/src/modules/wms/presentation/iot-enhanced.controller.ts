/**
 * @module iot-enhanced.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import {
Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
  Logger,
  InternalServerErrorException, UsePipes,
} from '@nestjs/common';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { WmsCreateMaterialKitSchema, WmsCreateMaterialKitDto, WmsAddKitItemSchema, WmsAddKitItemDto } from '../dto/wms.dto';
import { throwFromError, unwrapOrThrow } from '@common/http-result';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { IotEnhancedService } from '../application/iot-enhanced.service';
import { safeInt } from '../../hr/common/db-rows';
import { AuthenticatedUser } from '@common/types/user.types';

const IOT_READ = ['super_admin', 'warehouse_manager', 'warehouse_keeper', 'production_manager', 'ERP_MANAGER'];
const IOT_WRITE = ['super_admin', 'warehouse_manager', 'production_manager', 'ERP_MANAGER'];

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('iot-enhanced')
export class IotEnhancedController {
  private readonly logger = new Logger(IotEnhancedController.name);

  constructor(private readonly svc: IotEnhancedService) {}

  @Get('orders-for-kits')
  @Roles(...IOT_READ)
  async getOrdersForKits(@Query('status') status?: string) {
    this.logger.log('GET orders for kits');
    const r = await this.svc.getOrdersForKits(status);
    const items = r.ok && Array.isArray(r.data) ? r.data : [];
    return { items, total: items.length };
  }

  @Get('material-kits')
  @Roles(...IOT_READ)
  async getMaterialKits(@Query('status') status?: string) {
    this.logger.log('GET material kits');
    return unwrapOrThrow(await this.svc.getMaterialKits(status));
  }

  @Post('material-kits')
  @UsePipes(new ZodValidationPipe(WmsCreateMaterialKitSchema))
  @Roles(...IOT_WRITE)
  async createMaterialKit(@Body() body: WmsCreateMaterialKitDto, @CurrentUser() user: AuthenticatedUser) {
    this.logger.log('POST create material kit');
    return unwrapOrThrow(await this.svc.createMaterialKit(body, user?.id ?? null));
  }

  @Get('orders/:id/calculate-bom')
  @Roles(...IOT_READ)
  async calculateBom(@Param('id') id: string) {
    this.logger.log(`GET calculate BOM for order ${id}`);
    return unwrapOrThrow(await this.svc.calculateBom(safeInt(id, 0)));
  }

  @Get('material-kits/:id/items')
  @Roles(...IOT_READ)
  async getKitItems(@Param('id') id: string) {
    this.logger.log(`GET kit items for kit ${id}`);
    return unwrapOrThrow(await this.svc.getKitItems(safeInt(id, 0)));
  }

  @Post('material-kits/:id/items')
  @UsePipes(new ZodValidationPipe(WmsAddKitItemSchema))
  @Roles(...IOT_WRITE)
  async addKitItem(@Param('id') id: string, @Body() body: WmsAddKitItemDto) {
    this.logger.log(`POST kit item for kit ${id}`);
    return unwrapOrThrow(await this.svc.addKitItem(safeInt(id, 0), body));
  }

  @Post('orders/:id/calculate-bom')
  @HttpCode(HttpStatus.OK)
  @Roles(...IOT_READ)
  async postCalculateBom(@Param('id') id: string) {
    this.logger.log(`POST calculate BOM for order ${id}`);
    return unwrapOrThrow(await this.svc.calculateBom(safeInt(id, 0)));
  }

  @Get('orders')
  async getOrders() { return { data: [], total: 0 }; }
}
