/**
 * @module succession-compat.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 * @deprecated Legacy compatibility shim. New consumers should target the canonical
 *   succession module endpoints (see docs/B5-compat-endpoints.md). Existing routes
 *   remain functional but receive no new features. Removal target: post-PA3 cutover.
 */
import { Controller, Get, Post, Put, Param, Query, Body, HttpCode, UseGuards, UseInterceptors, HttpStatus } from '@nestjs/common';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { SuccessionCompatService } from './succession-compat.service';
import { SuccessionBodyDto } from './dto/hr.dto';
import { unwrapOrDefault, unwrapOrInternal } from '@common/http-result';

const HR_ROLES = ['HR_MANAGER', 'HR_SPECIALIST', 'SUPER_ADMIN', 'DIRECTOR', 'ADMIN', 'MANAGER'] as const;

@ApiThrottle()
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...HR_ROLES)
@Controller('succession')
export class SuccessionCompatController {
  constructor(private readonly svc: SuccessionCompatService) {}

  @Get('career-plans')
  async getCareerPlans(@Query('employeeId') employeeId?: string) {
    return unwrapOrInternal(await this.svc.getCareerPlans(employeeId));
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
  // P1.16.1: return bare array — FE uses Array.isArray() guard, wrapped {items,total} causes empty list
  async getKeyPositions() {
    const r = await this.svc.getKeyPositions();
    return r.ok && Array.isArray(r.data) ? r.data : [];
  }

  @Get('risks')
  async getSuccessionRisks() {
    const r = await this.svc.getSuccessionRisks();
    return r.ok && Array.isArray(r.data) ? r.data : [];
  }

  @Get('readiness-stats')
  async getReadinessStats() {
    const r = await this.svc.getReadinessStats();
    return unwrapOrDefault(r, { ready: 0, nearReady: 0, notReady: 0 });
  }
}
