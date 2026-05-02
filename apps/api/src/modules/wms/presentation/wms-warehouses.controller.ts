import { assertRequired } from '@common/assertions';
import {
  Controller, Get, Post, Patch, Delete, Body, Param,
  UseGuards, UseInterceptors, Query, Logger, BadRequestException, NotFoundException,
} from '@nestjs/common';
import { assertOk, throwFromError, unwrapOrNotFound, unwrapOrThrow } from '@common/http-result';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@common/types/user.types';
import { CreateWarehouseCommand } from '../application/commands/create-warehouse.command';
import { GetWarehousesQuery } from '../application/queries/get-warehouses.query';
import { CreateWarehouseDtoSchema, CreateWarehouseDto } from './dto/wms-extended.dto';
import { WmsCrudService } from '../application/wms-crud.service';

enum Role {
  SUPER_ADMIN = 'super_admin',
  WAREHOUSE_MANAGER = 'warehouse_manager',
}

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('wms/warehouses')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
export class WmsWarehousesController {
  private readonly logger = new Logger(WmsWarehousesController.name);

  constructor(
    private commandBus: CommandBus,
    private queryBus: QueryBus,
    private readonly crudSvc: WmsCrudService,
  ) {}

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.WAREHOUSE_MANAGER)
  async getAll(@Query() query?: Record<string, unknown>) {
    this.logger.log('Getting all warehouses');
    const result = await this.queryBus.execute(new GetWarehousesQuery(query || {}));
    const items = result?.data?.items;
    return { items: Array.isArray(items) ? items : [], total: Array.isArray(items) ? items.length : 0 };
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.WAREHOUSE_MANAGER)
  async getById(@Param('id') id: string) {
    this.logger.log('Getting warehouse by ID');
    const result = await this.queryBus.execute(new GetWarehousesQuery({}));
    assertOk(result);
    const items = Array.isArray(result.data?.items) ? result.data.items : [];
    const warehouse = (Array.isArray(items) ? items : []).find((w: Record<string, unknown>) => w.id === id);
    assertRequired(warehouse, 'Omborni topilmadi');
    return warehouse;
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.WAREHOUSE_MANAGER)
  async create(@Body() dto: CreateWarehouseDto) {
    const validatedDto = CreateWarehouseDtoSchema.parse(dto);
    this.logger.log('Creating warehouse');
    const command = new CreateWarehouseCommand(
      validatedDto.name,
      validatedDto.address,
      validatedDto.isFreeStorage,
      validatedDto.freeStorageDays,
      validatedDto.monthlyRate,
    );
    return unwrapOrThrow(await this.commandBus.execute(command));
  }

  @Patch(':id/toggle-active')
  @Roles(Role.SUPER_ADMIN)
  async toggleActive(@Param('id') id: string, @Body() dto: { isActive: boolean }) {
    this.logger.log('Toggling warehouse active status');
    throw new BadRequestException('Boshqaruvchi sifatida hozircha mavjud emas');
  }

  @Get(':id/inventory')
  @Roles(Role.SUPER_ADMIN, Role.WAREHOUSE_MANAGER)
  async getInventory(@Param('id') id: string, @Query() query?: Record<string, unknown>) {
    this.logger.log('Getting warehouse inventory');
    throw new BadRequestException('Inventory uchun boshqaruvchi hozircha mavjud emas');
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  async deleteWarehouse(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const r = await this.crudSvc.softDeleteWarehouse(id, user?.id ?? null);
    return unwrapOrNotFound(r);
  }
}
