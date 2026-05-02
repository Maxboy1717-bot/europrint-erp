import {
  Controller, Get, Post, Delete, Patch, Body, Param, ParseIntPipe,
  UseGuards, UseInterceptors, Query, Logger,
InternalServerErrorException } from '@nestjs/common';
import { unwrapOrThrow } from '@common/http-result';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@common/types/user.types';
import { GetStockInventoryQuery } from '../application/queries/get-stock-inventory.query';
import { FefoStockQuery } from '../application/queries/fefo-stock.handler';
import { WmsCrudService } from '../application/wms-crud.service';
import { PatchStockDto } from './dto/wms-crud.dto';

enum Role {
  WAREHOUSE_KEEPER = 'warehouse_keeper',
  SUPER_ADMIN = 'super_admin',
  DIRECTOR = 'director',
}

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('wms/stock')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
export class WmsStockController {
  private readonly logger = new Logger(WmsStockController.name);

  constructor(
    private commandBus: CommandBus,
    private queryBus: QueryBus,
    private readonly crudSvc: WmsCrudService,
  ) {}

  @Get()
  @Roles(Role.WAREHOUSE_KEEPER, Role.SUPER_ADMIN, Role.DIRECTOR)
  async listStock(@Query('page') page?: string, @Query('limit') limit?: string) {
    const result = await this.queryBus.execute(new GetStockInventoryQuery({ page: Number(page), limit: Number(limit) }));
    const items = result?.data?.items;
    return { items: Array.isArray(items) ? items : [], total: Array.isArray(items) ? items.length : 0 };
  }

  @Get(':id')
  @Roles(Role.WAREHOUSE_KEEPER, Role.SUPER_ADMIN, Role.DIRECTOR)
  async getStock(@Param('id') id: number) {
    this.logger.log('Getting stock');
    return {};
  }

  @Get('fefo/:materialId/:warehouseId')
  @Roles(Role.WAREHOUSE_KEEPER, Role.SUPER_ADMIN, Role.DIRECTOR)
  async getFefoStock(
    @Param('materialId') materialId: number,
    @Param('warehouseId') warehouseId: number,
  ) {
    const query = new FefoStockQuery(materialId, warehouseId);
    const res = await this.queryBus.execute(query);
    return unwrapOrThrow(res);
  }

  @Post('reserve')
  @Roles(Role.WAREHOUSE_KEEPER, Role.SUPER_ADMIN, Role.DIRECTOR)
  async reserveStock(@Body() dto: Record<string, unknown>) {
    this.logger.log('Reserving stock');
    return { data: null as null | undefined };
  }

  @Patch(':id')
  @Roles(Role.WAREHOUSE_KEEPER, Role.SUPER_ADMIN, Role.DIRECTOR)
  async patchStock(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: PatchStockDto,
  ) {
    const data = unwrapOrThrow(await this.crudSvc.patchStock(id, dto as Record<string, unknown>));
    return { data };
  }

  @Delete(':id')
  @Roles(Role.WAREHOUSE_KEEPER, Role.SUPER_ADMIN, Role.DIRECTOR)
  async deleteStock(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = unwrapOrThrow(await this.crudSvc.softDeleteStock(id, user?.id ?? null));
    return data;
  }
}
