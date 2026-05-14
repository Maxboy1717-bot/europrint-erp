/**
 * @module feedback-360.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Controller, Get, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { Role } from '@common/constants/roles.constants';
import { Feedback360Service } from './feedback-360.service';

import { parsePagination } from '@common/pipes/parse-pagination.pipe';
import { unwrapOrInternal } from '@common/http-result';
@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('360')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.HR_MANAGER, Role.HR_SPECIALIST)
@UseInterceptors(AuditInterceptor)
export class Feedback360Controller {
  constructor(private readonly svc: Feedback360Service) {}

  @Get('dashboard')
  async getDashboard() {
    return unwrapOrInternal(await this.svc.getDashboard());
  }

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
