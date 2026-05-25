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
import {
  WeeklyPlanAclTranslator,
  type LegacyWeeklyPlanRow,
  type WeeklyPlanDto,
} from './acl/weekly-plan-acl';

@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@UseGuards(RolesGuard)
@Controller('weekly-plans')
@Roles('admin', 'super_admin', 'director', 'manager', 'department_head', 'employee', 'operator')
export class WeeklyPlanController {
  /** PA2-14 ACL demonstrator. Stateless — direct instantiation is fine. */
  private readonly planAcl = new WeeklyPlanAclTranslator();

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
  ) {
    return unwrapOrThrow(await this.svc.getAll(user, week, employeeId));
  }

  /**
   * PA2-14 ACL-translated variant. New BC-3 / BC-9 consumers should
   * target `/v2`; the legacy `/` endpoint stays for backwards-compat.
   *
   * The legacy service returns `{ plans, weekStart }`; this endpoint
   * preserves the envelope while translating only the `plans` array.
   */
  @Get('v2')
  async getAllV2(
    @CurrentUser() user: { id: number; role: string },
    @Query('week') week?: string,
    @Query('employeeId') employeeId?: string,
  ): Promise<{ plans: WeeklyPlanDto[]; weekStart: string }> {
    const wrapped = unwrapOrThrow(await this.svc.getAll(user, week, employeeId)) as unknown as {
      plans: LegacyWeeklyPlanRow[]; weekStart: string;
    };
    const list = Array.isArray(wrapped?.plans) ? wrapped.plans : [];
    const plans = list
      .map((row) => this.planAcl.toDomain(row))
      .filter((r): r is { ok: true; data: WeeklyPlanDto } => r.ok)
      .map((r) => r.data);
    return { plans, weekStart: wrapped?.weekStart ?? '' };
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
