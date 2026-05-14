/**
 * @module skills-matrix.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { Controller, UseGuards, Get, Post, Body, Param, ParseIntPipe, Query, Logger, UseInterceptors } from '@nestjs/common';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { Throttle } from '@nestjs/throttler';
import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';
import { SkillsMatrixService } from './skills-matrix.service';
import { Roles } from '../../../common/decorators/roles.decorator';
import { unwrapOrInternal } from '@common/http-result';

const UpsertScoreSchema = z.object({
  employee_id:   z.number().int(),
  skill_code:    z.string().min(1),
  current_level: z.number().int().min(0).max(5),
  assessed_by:   z.number().int().optional(),
});
class UpsertScoreDto extends createZodDto(UpsertScoreSchema) {}

@Roles('admin', 'manager', 'supervisor', 'hr_manager')
@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard)
@Controller('hr-v2/skills-matrix')
export class SkillsMatrixController {
  private readonly logger = new Logger(SkillsMatrixController.name);
  constructor(private readonly svc: SkillsMatrixService) {}

  @Get('catalog')
  async catalog() {
    return unwrapOrInternal(await this.svc.getSkillCatalog());
  }

  @Get('employee/:id')
  async getEmployee(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrInternal(await this.svc.getEmployeeSkills(id));
  }

  @Post('score')
  async upsertScore(@Body() body: UpsertScoreDto) {
    return unwrapOrInternal(await this.svc.upsertSkillScore({
      employeeId: body.employee_id,
      skillCode: body.skill_code,
      currentLevel: body.current_level,
      assessedBy: body.assessed_by,
    }));
  }

  @Get('gap-analysis/:employeeId')
  async gapAnalysis(
    @Param('employeeId', ParseIntPipe) employeeId: number,
    @Query('positionId') positionId: string,
  ) {
    return unwrapOrInternal(await this.svc.getGapAnalysis(employeeId, positionId ? parseInt(positionId) : undefined));
  }

  @Get('team/:departmentId')
  async teamMatrix(@Param('departmentId', ParseIntPipe) departmentId: number) {
    return unwrapOrInternal(await this.svc.getTeamMatrix(departmentId));
  }
}
