/**
 * @module weekly-plan.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { unwrapOrThrow, assertOk } from '@common/http-result';
import { ApiThrottle } from '@common/decorators/throttle-profiles';

import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { WeeklyPlanService } from './weekly-plan.service';
import { CompatBodyDto } from '../compatibility/dto/compat-body.dto';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';

@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@UseGuards(RolesGuard)
@Controller('weekly-plans')
@Roles('admin', 'super_admin', 'director', 'manager', 'department_head', 'employee', 'operator')
export class WeeklyPlanController {
  constructor(private readonly svc: WeeklyPlanService) {}

  @Get('stats/summary')
  async getStatsSummary(@Query('week') week?: string) {
    return unwrapOrThrow(await this.svc.getStatsSummary(week));
  }

  @Get()
  async getAll(
    @CurrentUser() user: { id: number; role: string },
    @Query('week') week?: string,
    @Query('employeeId') employeeId?: string,
    // P1.28.1: FE sends snake_case employee_id — accept both
    @Query('employee_id') employee_id?: string,
  ) {
    return unwrapOrThrow(await this.svc.getAll(user, week, employeeId ?? employee_id));
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: { id: number; role: string },
    @Body() body: CompatBodyDto,
  ) {
    const r = await this.svc.create(user, body);
    assertOk(r);
    return r.data;
  }

  @Get(':id')
  async getOne(@Param('id') id: string, @CurrentUser() user: { id: number; role: string }) {
    const r = await this.svc.getOne(id, user);
    assertOk(r);
    return r.data;
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @CurrentUser() user: { id: number; role: string },
    @Body() body: CompatBodyDto,
  ) {
    const r = await this.svc.update(id, user, body);
    assertOk(r);
    return r.data;
  }

  @Patch(':id/approve')
  // Manager-tier gate at the guard layer too (matches deletePlan's override below) — closes
  // the self-approval gap: this class's default @Roles(...) includes 'employee'/'operator',
  // which let any authenticated user approve their own plan before this override + the
  // service-level MANAGER_ROLES check (WeeklyPlanService#approve) were added.
  @Roles('admin', 'super_admin', 'director', 'manager', 'department_head')
  async approve(@Param('id') id: string, @CurrentUser() user: { id: number; role: string }) {
    const r = await this.svc.approve(id, user);
    assertOk(r);
    return r.data;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles('admin', 'super_admin', 'director', 'manager', 'department_head')
  async deletePlan(@Param('id') id: string, @CurrentUser() user: { id: number; role: string }) {
    const r = await this.svc.deletePlan(id, user);
    assertOk(r);
    return r.data;
  }
}
