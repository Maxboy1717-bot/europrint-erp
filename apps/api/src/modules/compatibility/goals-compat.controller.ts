/**
 * @module goals-compat.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 * @deprecated Legacy compatibility shim. New consumers should target the canonical
 *   goals module endpoints (see docs/B5-compat-endpoints.md). Existing routes
 *   remain functional but receive no new features. Removal target: post-PA3 cutover.
 */
import { Controller, Get, Post, Put, Patch, Delete, Param, Query, Body, HttpCode, UseGuards, UseInterceptors, HttpStatus } from '@nestjs/common';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { GoalsCompatService } from './goals-compat.service';
import { unwrapOrInternal } from '@common/http-result';
import { z } from 'zod';
import {
  GoalAclTranslator,
  type LegacyGoalRow,
  type GoalDto,
} from './acl/goal-acl';

// P1.8.2: proper Zod DTOs for goal mutations (replaces passthrough CompatBodyDto)
const CreateGoalSchema = z.object({
  title:       z.string().min(1).max(200),
  description: z.string().optional(),
  targetValue: z.number().positive().optional(),
  // P1.8.3: dates required so goals always have a valid time window
  startDate:   z.string().min(1, 'Boshlanish sanasi kerak'),
  endDate:     z.string().min(1, 'Tugash sanasi kerak'),
  category:    z.string().optional(),
  status:      z.string().optional(),
  assigneeId:  z.number().int().positive().optional(),
}).passthrough();

const UpdateGoalSchema = z.object({
  title:       z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  targetValue: z.number().positive().optional(),
  startDate:   z.string().min(1).optional(),
  endDate:     z.string().min(1).optional(),
  category:    z.string().optional(),
  status:      z.string().optional(),
}).passthrough();

const HR_ROLES = ['HR_MANAGER', 'HR_SPECIALIST', 'SUPER_ADMIN', 'DIRECTOR', 'ADMIN', 'MANAGER'] as const;

@ApiThrottle()
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...HR_ROLES, 'OPERATOR')
@Controller('goals')
export class GoalsCompatController {
  /** PA2-14 ACL demonstrator. Stateless — direct instantiation is fine. */
  private readonly acl = new GoalAclTranslator();

  constructor(private readonly svc: GoalsCompatService) {}

  @Get()
  async getGoals(
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('targetType') targetType?: string,
    @Query('limit') limit?: string,
  ) {
    return unwrapOrInternal(await this.svc.getGoals(status, category, targetType, limit));
  }

  /**
   * PA2-14 ACL-translated variant. New BC-3 (HR / Performance) consumers
   * should target this endpoint; the legacy `GET /goals` stays for
   * backwards-compat.
   */
  @Get('v2')
  async getGoalsV2(
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('targetType') targetType?: string,
    @Query('limit') limit?: string,
  ): Promise<GoalDto[]> {
    const rows = unwrapOrInternal(
      await this.svc.getGoals(status, category, targetType, limit),
    ) as unknown as LegacyGoalRow[];
    const list = Array.isArray(rows) ? rows : [];
    return list
      .map((row) => this.acl.toDomain(row))
      .filter((r): r is { ok: true; data: GoalDto } => r.ok)
      .map((r) => r.data);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  // P1.8.2: validate goal fields; P1.8.3: startDate/endDate required
  async createGoal(@Body() body: unknown) {
    const dto = CreateGoalSchema.parse(body);
    return unwrapOrInternal(await this.svc.createGoal(dto));
  }

  @Get(':id')
  async getGoal(@Param('id') id: string) {
    return unwrapOrInternal(await this.svc.getGoal(id));
  }

  @Put(':id')
  // P1.8.2: validate update fields
  async updateGoal(@Param('id') id: string, @Body() body: unknown) {
    const dto = UpdateGoalSchema.parse(body);
    return unwrapOrInternal(await this.svc.updateGoal(id, dto));
  }

  // P1.8.1: FE uses PATCH not PUT — add PATCH alias that delegates to same handler
  @Patch(':id')
  async patchGoal(@Param('id') id: string, @Body() body: unknown) {
    const dto = UpdateGoalSchema.parse(body);
    return unwrapOrInternal(await this.svc.updateGoal(id, dto));
  }

  @Delete(':id')
  async deleteGoal(@Param('id') id: string) {
    return unwrapOrInternal(await this.svc.deleteGoal(id));
  }
}
