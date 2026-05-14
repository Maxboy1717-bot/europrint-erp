/**
 * @module departments.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { assertValidated } from '@common/assertions';
import { unwrapOrThrow } from '@common/http-result';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import {
  Body, Controller, Delete, Get, Logger, Param, Post, Put, Query,
  UseGuards, UseInterceptors, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard } from '@auth/guards/roles.guard';
import { Roles } from '@auth/decorators/roles.decorator';
import { CurrentUser } from '@auth/decorators/current-user.decorator';

import { CreateDepartmentCommand } from '../application/commands/create-department.command';
import { UpdateDepartmentCommand } from '../application/commands/update-department.command';
import { DeleteDepartmentCommand } from '../application/commands/delete-department.command';
import { GetDepartmentsQuery } from '../application/queries/get-departments.query';
import { GetOrgChartQuery } from '../application/queries/get-org-chart.query';
import {
  CreateDepartmentDto, CreateDepartmentDtoSchema,
  UpdateDepartmentDto, UpdateDepartmentDtoSchema,
} from './dto/core.dto';
import { Department } from '../domain/aggregates/department.aggregate';

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@Controller('core/departments')
@UseGuards(RolesGuard)
export class DepartmentsController {
  private readonly logger = new Logger(DepartmentsController.name);

  constructor(private commandBus: CommandBus, private queryBus: QueryBus) {}

  @Get()
  async list(@Query('isActive') isActive?: boolean, @Query('parentId') parentId?: string) {
    const res = await this.queryBus.execute(
      new GetDepartmentsQuery({
        isActive: isActive ? isActive === true || isActive === 'true' : undefined,
        parentId,
      }),
    );
    return unwrapOrThrow(res);
  }

  @Get('/org-chart')
  async getOrgChart() {
    const res = await this.queryBus.execute(new GetOrgChartQuery());
    return unwrapOrThrow(res);
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    const res = await this.queryBus.execute(new GetDepartmentsQuery());
    return unwrapOrThrow(res);
  }

  @Post()
  @Roles('SUPER_ADMIN', 'HR_MANAGER')
  async create(@Body() dto: CreateDepartmentDto, @CurrentUser() user: AuthenticatedUser) {
    this.logger.log(`Create department requested by ${user.id}`);
    const parsed = CreateDepartmentDtoSchema.safeParse(dto);
    assertValidated(parsed.success, "Noto'g'ri ma'lumotlar");
    const res = await this.commandBus.execute(new CreateDepartmentCommand(dto));
    return unwrapOrThrow(res);
  }

  @Put(':id')
  @Roles('SUPER_ADMIN', 'HR_MANAGER')
  async update(@Param('id') id: string, @Body() dto: UpdateDepartmentDto, @CurrentUser() user: AuthenticatedUser) {
    this.logger.log(`Update department ${id} requested by ${user.id}`);
    const parsed = UpdateDepartmentDtoSchema.safeParse(dto);
    assertValidated(parsed.success, "Noto'g'ri ma'lumotlar");
    const res = await this.commandBus.execute(new UpdateDepartmentCommand(id, dto));
    return unwrapOrThrow(res);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  async delete(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    this.logger.log(`Delete department ${id} requested by ${user.id}`);
    const res = await this.commandBus.execute(new DeleteDepartmentCommand(id));
    return unwrapOrThrow(res);
  }
}
