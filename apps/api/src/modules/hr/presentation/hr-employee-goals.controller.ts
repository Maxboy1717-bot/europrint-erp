/**
 * NOTE: Raw SQL retained intentionally — Drizzle ORM cannot express:
 *   COALESCE-based partial UPDATE pattern (`field = COALESCE(${dto.field ?? null},
 *   field)`) that preserves existing column values when the DTO key is omitted —
 *   used here to avoid building a dynamic SET clause for 7 optional goal fields in
 *   a single round-trip; plus inline `::date`/`::timestamptz` casts on parameters.
 *   See ARCHITECTURE_RULES.md Rule 4: complex SQL is permitted with documentation.
 */

/**
 * @module hr-employee-goals.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import {
  Body, Controller, Get, InternalServerErrorException,
  Param, ParseIntPipe, Patch, Post, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { I18nService } from 'nestjs-i18n';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { z } from 'zod';

interface AuthenticatedUser { id: number; role: string; }

// ── DTOs (inline schemas, no extra files needed) ──────────────────────────────

const CreateGoalSchema = z.object({
  title:         z.string().min(1),
  description:   z.string().optional(),
  target_date:   z.string().optional(),
  target_value:  z.number().optional(),
  status:        z.string().optional(),
});

const UpdateGoalSchema = z.object({
  current_value: z.number().optional(),
  progress_pct:  z.number().min(0).max(100).optional(),
  status:        z.string().optional(),
  title:         z.string().min(1).optional(),
  description:   z.string().optional(),
  target_date:   z.string().optional(),
  target_value:  z.number().optional(),
});

const CreateOneOnOneSchema = z.object({
  manager_id:   z.number().int().optional(),
  meeting_date: z.string().optional(),
  topics:       z.string().optional(),
  action_items: z.string().optional(),
  mood:         z.number().int().min(1).max(5).optional(),
  notes:        z.string().optional(),
});

// ── Controller ────────────────────────────────────────────────────────────────

@ApiThrottle()
@ApiTags('Hr Employee Goals')
@Controller('hr/employees')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles('HR_MANAGER', 'HR_SPECIALIST', 'SUPER_ADMIN', 'DIRECTOR', 'MANAGER')
export class HrEmployeeGoalsController {
  constructor(private readonly i18n: I18nService) {}

  // ── Goals ─────────────────────────────────────────────────────────────────

  @ApiOperation({ summary: 'List goals' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get(':id/goals')
  @Roles('HR_MANAGER', 'HR_SPECIALIST', 'SUPER_ADMIN', 'DIRECTOR', 'MANAGER', 'EMPLOYEE')
  async listGoals(@Param('id', ParseIntPipe) id: number) {
    try {
      const result = await runQuery(sql`
        SELECT * FROM hr_employee_goals
        WHERE employee_id = ${id}
        ORDER BY created_at DESC
      `);
      return { data: result.rows };
    } catch (e: unknown) {
      throw new InternalServerErrorException((e as Error).message);
    }
  }

  @ApiOperation({ summary: 'Create goal' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post(':id/goals')
  @Roles('HR_MANAGER', 'HR_SPECIALIST', 'SUPER_ADMIN', 'DIRECTOR', 'MANAGER')
  async createGoal(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const dto = CreateGoalSchema.parse(body);
    try {
      const result = await runQuery(sql`
        INSERT INTO hr_employee_goals
          (employee_id, title, description, target_date, target_value, status, created_by)
        VALUES (
          ${id},
          ${dto.title},
          ${dto.description ?? null},
          ${dto.target_date ?? null},
          ${dto.target_value ?? null},
          ${dto.status ?? 'active'},
          ${user?.id ?? null}
        )
        RETURNING *
      `);
      return { data: result.rows[0] };
    } catch (e: unknown) {
      throw new InternalServerErrorException((e as Error).message);
    }
  }

  @ApiOperation({ summary: 'Update goal' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Patch(':id/goals/:goalId')
  @Roles('HR_MANAGER', 'HR_SPECIALIST', 'SUPER_ADMIN', 'DIRECTOR', 'MANAGER')
  async updateGoal(
    @Param('id', ParseIntPipe) id: number,
    @Param('goalId', ParseIntPipe) goalId: number,
    @Body() body: unknown,
  ) {
    const dto = UpdateGoalSchema.parse(body);

    // Build a single UPDATE using COALESCE so omitted fields keep their current values
    try {
      const result = await runQuery(sql`
        UPDATE hr_employee_goals SET
          title         = COALESCE(${dto.title         ?? null}, title),
          description   = COALESCE(${dto.description   ?? null}, description),
          target_date   = COALESCE(${dto.target_date   ?? null}::date, target_date),
          target_value  = COALESCE(${dto.target_value  ?? null}, target_value),
          current_value = COALESCE(${dto.current_value ?? null}, current_value),
          progress_pct  = COALESCE(${dto.progress_pct  ?? null}, progress_pct),
          status        = COALESCE(${dto.status        ?? null}, status),
          updated_at    = NOW()
        WHERE id = ${goalId} AND employee_id = ${id}
        RETURNING *
      `);
      if (!result.rows.length) {
        throw new InternalServerErrorException(await this.i18n.t('errors.goalNotFoundForEmployee', { args: { goalId, id } }));
      }
      return { data: result.rows[0] };
    } catch (e: unknown) {
      if (e instanceof InternalServerErrorException) throw e;
      throw new InternalServerErrorException((e as Error).message);
    }
  }

  // ── 1-on-1 Meetings ───────────────────────────────────────────────────────

  @ApiOperation({ summary: 'List one on ones' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get(':id/one-on-ones')
  @Roles('HR_MANAGER', 'HR_SPECIALIST', 'SUPER_ADMIN', 'DIRECTOR', 'MANAGER', 'EMPLOYEE')
  async listOneOnOnes(@Param('id', ParseIntPipe) id: number) {
    try {
      const result = await runQuery(sql`
        SELECT o.*,
               COALESCE(e.first_name,'') || ' ' || COALESCE(e.last_name,'') AS manager_name
        FROM hr_employee_one_on_ones o
        LEFT JOIN employees e ON e.id = o.manager_id
        WHERE o.employee_id = ${id}
        ORDER BY o.meeting_date DESC
      `);
      return { data: result.rows };
    } catch (e: unknown) {
      throw new InternalServerErrorException((e as Error).message);
    }
  }

  @ApiOperation({ summary: 'Create one on one' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post(':id/one-on-ones')
  @Roles('HR_MANAGER', 'HR_SPECIALIST', 'SUPER_ADMIN', 'DIRECTOR', 'MANAGER')
  async createOneOnOne(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const dto = CreateOneOnOneSchema.parse(body);
    try {
      const meetingDate = dto.meeting_date ?? new Date().toISOString();
      const result = await runQuery(sql`
        INSERT INTO hr_employee_one_on_ones
          (employee_id, manager_id, meeting_date, topics, action_items, mood, notes, created_by)
        VALUES (
          ${id},
          ${dto.manager_id ?? null},
          ${meetingDate}::timestamptz,
          ${dto.topics ?? null},
          ${dto.action_items ?? null},
          ${dto.mood ?? 3},
          ${dto.notes ?? null},
          ${user?.id ?? null}
        )
        RETURNING *
      `);
      return { data: result.rows[0] ?? null };
    } catch (e: unknown) {
      throw new InternalServerErrorException((e as Error).message);
    }
  }
}
