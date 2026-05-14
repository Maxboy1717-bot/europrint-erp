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
import { unwrapOrInternal, unwrapOrThrow } from '@common/http-result';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard } from '@common/guards/roles.guard';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { LmsTestsService } from '../application/services/lms-tests.service';
import { LmsExamsService } from '../application/services/lms-exams.service';
import { AuthenticatedUser } from '@common/types/user.types';

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('attempts')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class LmsAttemptsController {
  constructor(
    private readonly svc: LmsTestsService,
    private readonly examsService: LmsExamsService,
  ) {}

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

  @Get('retakes')
  @Roles('HR_MANAGER', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR')
  async getRetakeAttempts() {
    const result = await this.svc.listRetakeAttempts();
    return unwrapOrInternal(result);
  }

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

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('lms/attempts')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class LmsAttemptsAliasController {
  constructor(
    private readonly examsService: LmsExamsService,
  ) {}

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
