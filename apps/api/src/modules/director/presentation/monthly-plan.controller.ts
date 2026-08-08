/**
 * @module monthly-plan.controller
 * @description NestJS controller for director monthly plans. Zod-validated.
 */

import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { z } from 'zod';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { unwrapOrInternal } from '@common/http-result';
import { MonthlyPlanService } from '../application/monthly-plan.service';

const MONTH_RE = /^\d{4}-\d{2}$/;

const MonthlyPlanCreateSchema = z.object({
  strategic_goal_id: z.coerce.number().int().positive().nullish(),
  month:             z.string().regex(MONTH_RE),
  objectives:        z.array(z.unknown()).default([]),
  weekly_tasks:      z.array(z.unknown()).default([]),
});

const MonthlyPlanUpdateSchema = z.object({
  strategic_goal_id: z.coerce.number().int().positive().nullish(),
  objectives:        z.array(z.unknown()).optional(),
  weekly_tasks:      z.array(z.unknown()).optional(),
  completion_pct:    z.coerce.number().min(0).max(100).optional(),
});

const ByMonthSchema = z.object({
  month:   z.string().regex(MONTH_RE),
  goal_id: z.coerce.number().int().positive().optional(),
});

const MANAGER_ROLES = ['manager', 'director', 'super_admin'];

@ApiTags('Director — Monthly Plans')
@ApiBearerAuth()
@ApiThrottle()
@Controller('director/monthly-plans')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...MANAGER_ROLES)
export class MonthlyPlanController {
  private readonly logger = new Logger(MonthlyPlanController.name);

  constructor(private readonly svc: MonthlyPlanService) {}

  @Get()
  @ApiOperation({ summary: 'List monthly plans (optional goal_id filter)' })
  @ApiResponse({ status: 200, description: 'OK' })
  async list(@Query('goal_id') goalId?: string) {
    const gid = goalId ? parseInt(goalId, 10) : undefined;
    return { data: unwrapOrInternal(await this.svc.list(gid)) };
  }

  @Get('by-month')
  @ApiOperation({ summary: 'Monthly plans for a given month' })
  @ApiResponse({ status: 200, description: 'OK' })
  async byMonth(@Query() q: unknown) {
    const dto = ByMonthSchema.parse(q);
    return { data: unwrapOrInternal(await this.svc.getByMonth(dto.month, dto.goal_id)) };
  }

  @Post()
  @ApiOperation({ summary: 'Create monthly plan' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(@Body() body: unknown) {
    const dto = MonthlyPlanCreateSchema.parse(body);
    return unwrapOrInternal(
      await this.svc.create({
        strategic_goal_id: dto.strategic_goal_id ?? null,
        month:             dto.month,
        objectives:        dto.objectives,
        weekly_tasks:      dto.weekly_tasks,
      }),
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update monthly plan' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async update(@Param('id') id: string, @Body() body: unknown) {
    const dto = MonthlyPlanUpdateSchema.parse(body);
    return unwrapOrInternal(
      await this.svc.update(parseInt(id, 10), {
        strategic_goal_id: dto.strategic_goal_id ?? undefined,
        objectives:        dto.objectives,
        weekly_tasks:      dto.weekly_tasks,
        completion_pct:    dto.completion_pct,
      }),
    );
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Recompute completion_pct from weekly_tasks' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async complete(@Param('id') id: string) {
    return unwrapOrInternal(await this.svc.completePlan(parseInt(id, 10)));
  }
}
