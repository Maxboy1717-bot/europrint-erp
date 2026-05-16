/**
 * @module feedback-360.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 *
 * Merged into hr module (PA3-17 Wave 3): originally lived in `modules/feedback-360/`.
 * Route prefix `@Controller('360')` is preserved for frontend backwards compatibility.
 */

import { Controller, Get, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { Role } from '@common/constants/roles.constants';
import { Feedback360Service } from './feedback-360.service';

import { parsePagination } from '@common/pipes/parse-pagination.pipe';
import { unwrapOrInternal } from '@common/http-result';
@ApiThrottle()
@ApiTags('Feedback 360')
@ApiBearerAuth()
@Controller('360')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.HR_MANAGER, Role.HR_SPECIALIST)
@UseInterceptors(AuditInterceptor)
export class Feedback360Controller {
  constructor(private readonly svc: Feedback360Service) {}

  @ApiOperation({ summary: 'Get dashboard' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('dashboard')
  async getDashboard() {
    return unwrapOrInternal(await this.svc.getDashboard());
  }

  @ApiOperation({ summary: 'Get assessments' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('feedback')
  async getAssessments(
    @Query('employeeId') employeeIdParam?: string,
    @Query('year') yearParam?: string,
    @Query('limit') limitParam?: string,
    @Query('offset') offsetParam?: string,
  ) {
    const employeeId = employeeIdParam ? parseInt(employeeIdParam, 10) || undefined : undefined;
    const year = yearParam ? parseInt(yearParam, 10) || undefined : undefined;
    const { limit, offset } = parsePagination(limitParam, offsetParam);
    return unwrapOrInternal(await this.svc.getAssessments(employeeId, year, limit, offset));
  }

  @ApiOperation({ summary: 'Get assessment list' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('assessments')
  async getAssessmentList(
    @Query('employeeId') employeeIdParam?: string,
    @Query('year') yearParam?: string,
    @Query('limit') limitParam?: string,
    @Query('offset') offsetParam?: string,
  ) {
    const employeeId = employeeIdParam ? parseInt(employeeIdParam, 10) || undefined : undefined;
    const year = yearParam ? parseInt(yearParam, 10) || undefined : undefined;
    const { limit, offset } = parsePagination(limitParam, offsetParam);
    return unwrapOrInternal(await this.svc.getAssessments(employeeId, year, limit, offset));
  }

  @ApiOperation({ summary: 'Get responses' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('responses')
  async getResponses(
    @Query('assessmentId') assessmentIdParam?: string,
    @Query('limit') limitParam?: string,
    @Query('offset') offsetParam?: string,
  ) {
    const assessmentId = assessmentIdParam ? parseInt(assessmentIdParam, 10) || undefined : undefined;
    const { limit, offset } = parsePagination(limitParam, offsetParam);
    return unwrapOrInternal(await this.svc.getResponses(assessmentId, limit, offset));
  }
}
