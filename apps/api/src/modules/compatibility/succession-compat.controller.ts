/**
 * @module succession-compat.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Controller, Get, Post, Put, Param, Query, Body, HttpCode, UseGuards, UseInterceptors, HttpStatus } from '@nestjs/common';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { SuccessionCompatService } from './succession-compat.service';
import { SuccessionBodyDto } from './dto/hr.dto';
import { unwrapOrDefault, unwrapOrInternal } from '@common/http-result';
import {
  SuccessionPlanAclTranslator,
  type LegacySuccessionPlanRow,
  type SuccessionPlanDto,
} from './acl/succession-plan-acl';

const HR_ROLES = ['HR_MANAGER', 'HR_SPECIALIST', 'SUPER_ADMIN', 'DIRECTOR', 'ADMIN', 'MANAGER'] as const;

@ApiThrottle()
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...HR_ROLES)
@Controller('succession')
export class SuccessionCompatController {
  /** PA2-14 ACL translator. Stateless — direct instantiation is fine. */
  private readonly planAcl = new SuccessionPlanAclTranslator();

  constructor(private readonly svc: SuccessionCompatService) {}

  @Get('career-plans')
  async getCareerPlans(@Query('employeeId') employeeId?: string) {
    return unwrapOrInternal(await this.svc.getCareerPlans(employeeId));
  }

  /**
   * PA2-14 ACL-translated variant of career plans. New BC-3 (Talent)
   * consumers should target this route; `/career-plans` stays for
   * backwards-compat.
   */
  @Get('career-plans/v2')
  async getCareerPlansV2(@Query('employeeId') employeeId?: string): Promise<SuccessionPlanDto[]> {
    const rows = unwrapOrInternal(await this.svc.getCareerPlans(employeeId)) as unknown as LegacySuccessionPlanRow[];
    const list = Array.isArray(rows) ? rows : [];
    return list
      .map((row) => this.planAcl.toDomain(row))
      .filter((r): r is { ok: true; data: SuccessionPlanDto } => r.ok)
      .map((r) => r.data);
  }

  @Post('career-plans')
  @HttpCode(HttpStatus.CREATED)
  async createCareerPlan(@Body() body: SuccessionBodyDto) {
    return unwrapOrInternal(await this.svc.createCareerPlan(body));
  }

  @Put('career-plans/:id')
  async updateCareerPlan(@Param('id') id: string, @Body() body: SuccessionBodyDto) {
    return unwrapOrInternal(await this.svc.updateCareerPlan(id, body));
  }

  @Get('talent-pool')
  async getTalentPool(@Query('readiness') readiness?: string) {
    return unwrapOrInternal(await this.svc.getTalentPool(readiness));
  }

  @Post('talent-pool')
  @HttpCode(HttpStatus.CREATED)
  async createTalentPoolEntry(@Body() body: SuccessionBodyDto) {
    return unwrapOrInternal(await this.svc.createTalentPoolEntry(body));
  }

  @Get('candidates')
  async getCandidates(@Query('positionId') _positionId?: string) {
    return unwrapOrInternal(await this.svc.getTalentPool());
  }

  @Get('key-positions')
  async getKeyPositions() {
    const r = await this.svc.getKeyPositions();
    const rows = r.ok && Array.isArray(r.data) ? r.data : [];
    return { items: rows, total: rows.length };
  }

  @Get('risks')
  async getSuccessionRisks() {
    const r = await this.svc.getSuccessionRisks();
    const rows = r.ok && Array.isArray(r.data) ? r.data : [];
    return { items: rows, total: rows.length };
  }

  @Get('readiness-stats')
  async getReadinessStats() {
    const r = await this.svc.getReadinessStats();
    return unwrapOrDefault(r, { ready: 0, nearReady: 0, notReady: 0 });
    return r.data;
  }
}
