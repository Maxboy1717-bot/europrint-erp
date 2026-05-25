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
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
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

@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@ApiTags('Departments')
@Controller('core/departments')
@UseGuards(RolesGuard)
export class DepartmentsController {
  private readonly logger = new Logger(DepartmentsController.name);

  constructor(private commandBus: CommandBus, private queryBus: QueryBus) {}

  @ApiOperation({ summary: 'List' })
  @ApiResponse({ status: 200, description: 'OK' })
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

  @ApiOperation({ summary: 'Get org chart' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('/org-chart')
  async getOrgChart() {
    const res = await this.queryBus.execute(new GetOrgChartQuery());
    return unwrapOrThrow(res);
  }

  @ApiOperation({ summary: 'Get one' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get(':id')
  async getOne(@Param('id') id: string) {
    const res = await this.queryBus.execute(new GetDepartmentsQuery());
    return unwrapOrThrow(res);
  }

  @ApiOperation({ summary: 'Create' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post()
  @Roles('SUPER_ADMIN', 'HR_MANAGER')
  async create(@Body() dto: CreateDepartmentDto, @CurrentUser() user: AuthenticatedUser) {
    this.logger.log(`Create department requested by ${user.id}`);
    const parsed = CreateDepartmentDtoSchema.safeParse(dto);
    assertValidated(parsed.success, "Noto'g'ri ma'lumotlar");
    const res = await this.commandBus.execute(new CreateDepartmentCommand(dto));
    return unwrapOrThrow(res);
  }

  @ApiOperation({ summary: 'Update' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Put(':id')
  @Roles('SUPER_ADMIN', 'HR_MANAGER')
  async update(@Param('id') id: string, @Body() dto: UpdateDepartmentDto, @CurrentUser() user: AuthenticatedUser) {
    this.logger.log(`Update department ${id} requested by ${user.id}`);
    const parsed = UpdateDepartmentDtoSchema.safeParse(dto);
    assertValidated(parsed.success, "Noto'g'ri ma'lumotlar");
    const res = await this.commandBus.execute(new UpdateDepartmentCommand(id, dto));
    return unwrapOrThrow(res);
  }

  @ApiOperation({ summary: 'Delete' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Delete(':id')
  @Roles('SUPER_ADMIN')
  async delete(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    this.logger.log(`Delete department ${id} requested by ${user.id}`);
    const res = await this.commandBus.execute(new DeleteDepartmentCommand(id));
    return unwrapOrThrow(res);
  }
}
