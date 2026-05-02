import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query, UseGuards, UseInterceptors, BadRequestException, NotFoundException, ForbiddenException, HttpStatus } from '@nestjs/common';
import { throwFromError, unwrapOrThrow, assertOk } from '@common/http-result';
import { Throttle } from '@nestjs/throttler';

import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { WeeklyPlanService } from './weekly-plan.service';
import { CompatBodyDto } from '../compatibility/dto/compat-body.dto';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';

@Throttle({ default: { limit: 100, ttl: 60_000 } })
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
  ) {
    return unwrapOrThrow(await this.svc.getAll(user, week, employeeId));
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

  @Patch(':id/approve')
  async approve(@Param('id') id: string, @CurrentUser() user: { id: number; role: string }) {
    const r = await this.svc.approve(id, user);
    assertOk(r);
    return r.data;
  }
}
