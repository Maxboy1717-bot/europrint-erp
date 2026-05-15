/**
 * @module wms-inventory.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */import { BadRequestException, Body, Delete, Get, HttpException, HttpStatus, Logger, NotFoundException, Param, Patch, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';


import { assertRequired } from '@common/assertions';
import { MAX_EXPORT_LIMIT } from '@common/constants/app.constants';
import { Controller, ParseIntPipe } from '@nestjs/common';
import { assertOk, throwFromError, unwrapOrNotFound, unwrapOrThrow } from '@common/http-result';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@common/types/user.types';
import { GetStockInventoryQuery } from '../application/queries/get-stock-inventory.query';
import { GetLowStockQuery } from '../application/queries/get-low-stock.query';
import { GetInventoryDtoSchema, GetLowStockDtoSchema } from './dto/wms-extended.dto';
import { WmsCrudService } from '../application/wms-crud.service';
import { PatchInventoryDto } from './dto/wms-crud.dto';

enum Role {
  SUPER_ADMIN = 'super_admin',
  WAREHOUSE_MANAGER = 'warehouse_manager',
  WAREHOUSE_KEEPER = 'warehouse_keeper',
}

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('wms/inventory')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
export class WmsInventoryController {
  private readonly logger = new Logger(WmsInventoryController.name);

  constructor(
    private commandBus: CommandBus,
    private queryBus: QueryBus,
    private readonly crudSvc: WmsCrudService,
  ) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.WAREHOUSE_MANAGER)
  async createInventoryAdjustment() {
    return { success: true };
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.WAREHOUSE_MANAGER, Role.WAREHOUSE_KEEPER)
  async getAll(@Query() query?: Record<string, unknown>) {
    const validatedQuery = GetInventoryDtoSchema.parse(query || {});
    this.logger.log('Getting stock inventory');
    const result = await this.queryBus.execute(new GetStockInventoryQuery(validatedQuery));
    const rows = result?.data?.items;
    const items = Array.isArray(rows) ? rows : [];
    return { items, total: items.length };
  }

  @Get('low-stock')
  @Roles(Role.SUPER_ADMIN, Role.WAREHOUSE_MANAGER)
  async getLowStock(@Query() query?: Record<string, unknown>) {
    const validatedQuery = GetLowStockDtoSchema.parse(query || {});
    this.logger.log('Getting low stock items');
    return unwrapOrThrow(await this.queryBus.execute(new GetLowStockQuery(validatedQuery.threshold)));
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.WAREHOUSE_MANAGER, Role.WAREHOUSE_KEEPER)
  async getById(@Param('id') id: string) {
    this.logger.log('Getting stock item by ID');
    const result = await this.queryBus.execute(new GetStockInventoryQuery({ page: 1, limit: MAX_EXPORT_LIMIT }));
    assertOk(result);
    const item = result.data?.items?.find((i: Record<string, unknown>) => i.id === id);
    assertRequired(item, 'Stok elementi topilmadi');
    return item;
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.WAREHOUSE_MANAGER)
  async patchInventory(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: PatchInventoryDto,
  ) {
    const r = await this.crudSvc.patchInventory(id, dto as Record<string, unknown>);
    return { data: unwrapOrNotFound(r) };
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.WAREHOUSE_MANAGER)
  async deleteInventory(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const r = await this.crudSvc.softDeleteInventory(id, user?.id ?? null);
    return unwrapOrNotFound(r);
  }
}
