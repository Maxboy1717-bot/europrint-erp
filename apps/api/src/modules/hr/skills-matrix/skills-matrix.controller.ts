/**
 * @module skills-matrix.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { Controller, UseGuards, Get, Post, Body, Param, ParseIntPipe, Query, Logger, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
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
@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard)
@ApiTags('Skills Matrix')
@ApiBearerAuth()
@Controller('hr-v2/skills-matrix')
export class SkillsMatrixController {
  private readonly logger = new Logger(SkillsMatrixController.name);
  constructor(private readonly svc: SkillsMatrixService) {}

  @ApiOperation({ summary: 'Catalog' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('catalog')
  async catalog() {
    return unwrapOrInternal(await this.svc.getSkillCatalog());
  }

  @ApiOperation({ summary: 'Get employee' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('employee/:id')
  async getEmployee(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrInternal(await this.svc.getEmployeeSkills(id));
  }

  @ApiOperation({ summary: 'Upsert score' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('score')
  async upsertScore(@Body() body: UpsertScoreDto) {
    return unwrapOrInternal(await this.svc.upsertSkillScore({
      employeeId: body.employee_id,
      skillCode: body.skill_code,
      currentLevel: body.current_level,
      assessedBy: body.assessed_by,
    }));
  }

  @ApiOperation({ summary: 'Gap analysis' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('gap-analysis/:employeeId')
  async gapAnalysis(
    @Param('employeeId', ParseIntPipe) employeeId: number,
    @Query('positionId') positionId: string,
  ) {
    return unwrapOrInternal(await this.svc.getGapAnalysis(employeeId, positionId ? parseInt(positionId) : undefined));
  }

  @ApiOperation({ summary: 'Team matrix' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('team/:departmentId')
  async teamMatrix(@Param('departmentId', ParseIntPipe) departmentId: number) {
    return unwrapOrInternal(await this.svc.getTeamMatrix(departmentId));
  }
}
