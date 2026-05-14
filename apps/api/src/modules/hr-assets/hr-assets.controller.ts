/**
 * @module hr-assets.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Controller, Get, Post, Put, Patch, Delete, Param, Query, Body, HttpCode, UseGuards, UseInterceptors, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { Roles } from '@common/decorators/roles.decorator';
import { Role } from '@common/constants/roles.constants';
import { unwrapOrInternal, unwrapOrNotFound } from '@common/http-result';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@common/types/user.types';
import { HrAssetsService } from './hr-assets.service';
import { z } from 'zod';

const CreateDto = z.object({ name: z.string().min(1), serial_number: z.string().optional(), category: z.string().default('other'), status: z.string().default('available'), purchase_date: z.string().nullable().optional(), value: z.number().optional().default(0), notes: z.string().optional() });
const UpdateDto = CreateDto.partial();
const AssignDto = z.object({ employee_id: z.string().min(1), assigned_date: z.string(), condition_on_assign: z.string().default('good'), notes: z.string().optional() });
const ReturnDto = z.object({ return_date: z.string(), condition_on_return: z.string().default('good'), notes: z.string().optional() });
const ReportDto = z.object({ report_type: z.enum(['lost', 'broken', 'damaged']), description: z.string().min(1) });

const HR_ROLES = [Role.SUPER_ADMIN, Role.DIRECTOR, Role.HR_MANAGER, Role.HR_SPECIALIST, Role.WAREHOUSE_KEEPER];

@ApiTags('HR Assets')
@ApiBearerAuth()
@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('assets')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class HrAssetsController {
  constructor(private readonly svc: HrAssetsService) {}

  @Get()
  @Roles(...HR_ROLES)
  @ApiOperation({ summary: 'List company assets with optional filters' })
  async getAll(
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('status') status?: string,
    @Query('department_id') department_id?: string,
  ) {
    return unwrapOrInternal(await this.svc.getAll({ search, category, status, department_id }));
  }

  @Get('employee')
  @Roles(...HR_ROLES, Role.EMPLOYEE)
  @ApiOperation({ summary: "Get current user's assigned assets" })
  async getMyAssets(@CurrentUser() user: AuthenticatedUser) {
    return unwrapOrInternal(await this.svc.getByEmployee(String(user.id)));
  }

  @Get('employee/:employeeId')
  @Roles(...HR_ROLES)
  @ApiOperation({ summary: "Get a specific employee's assigned assets" })
  async getEmployeeAssets(@Param('employeeId') employeeId: string) {
    return unwrapOrInternal(await this.svc.getByEmployee(employeeId));
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(...HR_ROLES)
  @ApiOperation({ summary: 'Add a new asset to inventory' })
  async create(@Body() body: unknown) {
    const dto = CreateDto.parse(body);
    return unwrapOrInternal(await this.svc.create(dto));
  }

  @Get(':id')
  @Roles(...HR_ROLES)
  @ApiOperation({ summary: 'Get asset by ID with assignment history' })
  async getById(@Param('id') id: string) {
    return unwrapOrNotFound(await this.svc.getById(id));
  }

  @Put(':id')
  @Roles(...HR_ROLES)
  @ApiOperation({ summary: 'Update asset details' })
  async update(@Param('id') id: string, @Body() body: unknown) {
    const dto = UpdateDto.parse(body);
    unwrapOrInternal(await this.svc.update(id, dto));
    return { id, updated: true };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.HR_MANAGER)
  @ApiOperation({ summary: 'Remove an asset from inventory' })
  async remove(@Param('id') id: string) {
    unwrapOrInternal(await this.svc.remove(id));
    return { id, deleted: true };
  }

  @Post(':id/assign')
  @Roles(...HR_ROLES)
  @ApiOperation({ summary: 'Assign asset to an employee' })
  async assign(@Param('id') id: string, @Body() body: unknown) {
    const dto = AssignDto.parse(body);
    unwrapOrInternal(await this.svc.assign(id, dto));
    return { assetId: id, employeeId: dto.employee_id, assignedAt: _time.now().toISOString() };
  }

  @Patch(':id/return')
  @Roles(...HR_ROLES)
  @ApiOperation({ summary: 'Return an asset from employee' })
  async returnAsset(@Param('id') id: string, @Body() body: unknown) {
    const dto = ReturnDto.parse(body);
    unwrapOrInternal(await this.svc.returnAsset(id, dto));
    return { assetId: id, returnedAt: dto.return_date };
  }

  @Patch(':id/report')
  @Roles(...HR_ROLES)
  @ApiOperation({ summary: 'Report asset as lost, broken, or damaged' })
  async reportIssue(@Param('id') id: string, @Body() body: unknown) {
    const dto = ReportDto.parse(body);
    unwrapOrInternal(await this.svc.reportIssue(id, dto));
    return { assetId: id, reportType: dto.report_type, reportedAt: _time.now().toISOString() };
  }
}
