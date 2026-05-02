import { Controller, Get, NotImplementedException, Post, Patch, Delete, Body, Query, Param, HttpCode, HttpStatus, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { ResourcesCompatService } from './resources.service';
import { CompatBodyDto } from './dto/compat-body.dto';
import { WarehouseCreateDto, WarehouseUpdateDto } from './dto/warehouse.dto';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { unwrapOrInternal } from '@common/http-result';

@ApiTags('Warehouses (Compat)')
@ApiBearerAuth()
@Roles('admin', 'manager', 'hr_manager', 'director')
@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@Controller('warehouses')
export class WarehousesCompatController {
  constructor(private readonly svc: ResourcesCompatService) {}

  @Get()
  async getAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return unwrapOrInternal(await this.svc.getWarehouses(page, limit));
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return unwrapOrInternal(await this.svc.getWarehouse(id));
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: WarehouseCreateDto) {
    return unwrapOrInternal(await this.svc.createWarehouse(body));
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: WarehouseUpdateDto) {
    return unwrapOrInternal(await this.svc.updateWarehouse(id, body));
  }
}

@ApiTags('Material Cards (Compat)')
@ApiBearerAuth()
@Roles('admin', 'manager', 'hr_manager', 'director', 'warehouse_manager', 'warehouse_keeper')
@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Controller('material-cards')
export class MaterialCardsCompatController {
  constructor(private readonly svc: ResourcesCompatService) {}

  @Get()
  async getAll(@Query('page') page?: string, @Query('limit') limit?: string, @Query('search') search?: string) {
    return unwrapOrInternal(await this.svc.getMaterialCards(page, limit, search));
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return unwrapOrInternal(await this.svc.getMaterialCard(id));
  }

  @Post()
  @UseInterceptors(AuditInterceptor)
  async create(@Body() body: CompatBodyDto) {
    return unwrapOrInternal(await this.svc.createMaterialCard(body));
  }
}

@ApiTags('Departments (Compat)')
@ApiBearerAuth()
@Roles('admin', 'manager', 'hr_manager', 'director')
@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@Controller('departments')
export class DepartmentsCompatController {
  constructor(private readonly svc: ResourcesCompatService) {}

  @Get()
  async getAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return unwrapOrInternal(await this.svc.getDepartments(page, limit));
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return unwrapOrInternal(await this.svc.getDepartment(id));
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: CompatBodyDto) {
    return unwrapOrInternal(await this.svc.createDepartment(body));
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: CompatBodyDto) {
    return unwrapOrInternal(await this.svc.updateDepartment(id, body));
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return unwrapOrInternal(await this.svc.deleteDepartment(id));
  }
}

@ApiTags('Org Departments (Compat)')
@ApiBearerAuth()
@Roles('admin', 'manager', 'hr_manager', 'director')
@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@Controller('org-departments')
export class OrgDepartmentsCompatController {
  constructor(private readonly svc: ResourcesCompatService) {}

  @Get()
  async getAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return unwrapOrInternal(await this.svc.getDepartments(page, limit));
  }

  @Post('notify-vacancies')
  notifyVacancies() { throw new NotImplementedException('Vakansiya bildirishnomasi hali ishlab chiqilmoqda'); }
}

@ApiTags('Positions (Compat)')
@ApiBearerAuth()
@Roles('admin', 'manager', 'hr_manager', 'director')
@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@Controller('positions')
export class PositionsCompatController {
  constructor(private readonly svc: ResourcesCompatService) {}

  @Get()
  async getAll(@Query('page') page?: string, @Query('limit') limit?: string, @Query('departmentId') departmentId?: string) {
    return unwrapOrInternal(await this.svc.getPositions(page, limit, departmentId));
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return unwrapOrInternal(await this.svc.getPosition(id));
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: CompatBodyDto) {
    return unwrapOrInternal(await this.svc.createPosition(body));
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: CompatBodyDto) {
    return unwrapOrInternal(await this.svc.updatePosition(id, body));
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return unwrapOrInternal(await this.svc.deletePosition(id));
  }
}
