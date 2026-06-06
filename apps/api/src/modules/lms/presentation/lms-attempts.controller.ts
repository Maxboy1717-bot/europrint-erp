/**
 * @module lms-attempts.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { unwrapOrInternal, unwrapOrThrow } from '@common/http-result';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { LmsTestsService } from '../application/services/lms-tests.service';
import { LmsExamsService } from '../application/services/lms-exams.service';
import { AuthenticatedUser } from '@common/types/user.types';

@ApiThrottle()
@ApiTags('Lms Attempts')
@ApiBearerAuth()
@Controller('attempts')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class LmsAttemptsController {
  constructor(
    private readonly svc: LmsTestsService,
    private readonly examsService: LmsExamsService,
  ) {}

  @ApiOperation({ summary: 'Get all attempts' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('all')
  @Roles('HR_MANAGER', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR')
  async getAllAttempts(
    @Query() query: { status?: string; page?: string; limit?: string },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const result = await this.svc.listAttempts(
      { status: query.status, page: parseInt(query.page ?? '1', 10), limit: parseInt(query.limit ?? '20', 10) },
      { id: user.id, role: user.role },
    );
    return unwrapOrInternal(result);
  }

  @ApiOperation({ summary: 'Get retake attempts' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('retakes')
  @Roles('HR_MANAGER', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR')
  async getRetakeAttempts() {
    const result = await this.svc.listRetakeAttempts();
    return unwrapOrInternal(result);
  }

  @ApiOperation({ summary: 'List attempts' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get()
  @Roles('EMPLOYEE', 'HR_SPECIALIST', 'HR_MANAGER', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR')
  async listAttempts(
    @Query() query: { status?: string; page?: string; limit?: string },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const result = await this.svc.listAttempts(
      { status: query.status, page: parseInt(query.page ?? '1', 10), limit: parseInt(query.limit ?? '20', 10) },
      { id: user.id, role: user.role },
    );
    return unwrapOrInternal(result);
  }

  @ApiOperation({ summary: 'Submit exam' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post(':id/submit')
  @Roles('EMPLOYEE', 'HR_SPECIALIST', 'SUPER_ADMIN')
  async submitExam(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const result = await this.examsService.submitExam(parseInt(id, 10), user.id);
    return unwrapOrThrow(result);
  }
}

// NOTE: LmsAttemptsAliasController (lms/attempts prefix) was removed — it had no routes.
// Canonical submit is LmsAttemptsController above (attempts prefix).
