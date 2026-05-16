/**
 * @module goals-compat.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Controller, Get, Post, Put, Delete, Param, Query, Body, HttpCode, UseGuards, UseInterceptors, HttpStatus } from '@nestjs/common';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { GoalsCompatService } from './goals-compat.service';
import { CompatBodyDto } from './dto/compat-body.dto';
import { unwrapOrInternal } from '@common/http-result';
import {
  GoalAclTranslator,
  type LegacyGoalRow,
  type GoalDto,
} from './acl/goal-acl';

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
  async createGoal(@Body() body: CompatBodyDto) {
    return unwrapOrInternal(await this.svc.createGoal(body));
  }

  @Get(':id')
  async getGoal(@Param('id') id: string) {
    return unwrapOrInternal(await this.svc.getGoal(id));
  }

  @Put(':id')
  async updateGoal(@Param('id') id: string, @Body() body: CompatBodyDto) {
    return unwrapOrInternal(await this.svc.updateGoal(id, body));
  }

  @Delete(':id')
  async deleteGoal(@Param('id') id: string) {
    return unwrapOrInternal(await this.svc.deleteGoal(id));
  }
}
