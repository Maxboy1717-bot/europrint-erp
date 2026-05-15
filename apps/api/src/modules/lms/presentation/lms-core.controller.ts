/**
 * @module lms-core.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import {
  Body,
  Controller,
  Get,
  HttpException,
  Param,
  Post,
  UsePipes,
  UseGuards,
  UseInterceptors,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { unwrapOrInternal } from '@common/http-result';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard } from '@common/guards/roles.guard';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { LmsCoreService } from '../application/services/lms-core.service';
import {
  CreateExamSchema, CreateExamDto,
  SubmitExamSchema, SubmitExamDto
} from './dto/lms-core.dto';
import { db } from '@shared/db';
import { lms_support_tickets } from '@shared/db';

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('lms')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class LmsCoreController {
  constructor(private readonly svc: LmsCoreService) {}

  @Get('lessons/:id')
  @Roles('EMPLOYEE', 'HR_SPECIALIST', 'HR_MANAGER', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR')
  async getLesson(@Param('id') id: string) {
    const result = await this.svc.getLesson(id);
    return unwrapOrInternal(result);
  }

  @Get('exams')
  @Roles('EMPLOYEE', 'HR_SPECIALIST', 'HR_MANAGER', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR')
  async listExams(@CurrentUser() user: AuthenticatedUser) {
    const userId = String(user?.id ?? 0);
    const result = await this.svc.listExams(userId);
    return unwrapOrInternal(result);
  }

  @Post('exams')
  @Roles('TRAINING_OFFICER', 'HR_MANAGER', 'SUPER_ADMIN', 'DIRECTOR')
  @UsePipes(new ZodValidationPipe(CreateExamSchema))
  async createExam(@Body() dto: CreateExamDto) {
    const result = await this.svc.createExam(dto);
    const data = unwrapOrInternal(result);
    return { message: 'Imtihon yaratildi', data };
  }

  @Post('exams/:id/submit')
  @Roles('EMPLOYEE', 'HR_SPECIALIST', 'SUPER_ADMIN')
  @UsePipes(new ZodValidationPipe(SubmitExamSchema))
  async submitExam(
    @Param('id') id: string,
    @Body() dto: SubmitExamDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const userId = String(user?.id ?? 0);
    const result = await this.svc.submitExam(id, userId, dto);
    const data = unwrapOrInternal(result);
    return { message: 'Imtihon topshirildi', data };
  }

  @Get('recent-activity/:lang')
  @Roles('EMPLOYEE', 'HR_SPECIALIST', 'HR_MANAGER', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR')
  async recentActivityLang(@Param('lang') _lang: string, @CurrentUser() user: AuthenticatedUser) {
    const userId = String(user?.id ?? 0);
    const result = await this.svc.getRecentActivity(userId);
    return unwrapOrInternal(result);
  }

  @Get('recent-activity')
  @Roles('EMPLOYEE', 'HR_SPECIALIST', 'HR_MANAGER', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR')
  async recentActivity(@CurrentUser() user: AuthenticatedUser) {
    const userId = String(user?.id ?? 0);
    const result = await this.svc.getRecentActivity(userId);
    return unwrapOrInternal(result);
  }

  @Get('progress/my')
  @Roles('EMPLOYEE', 'HR_SPECIALIST', 'HR_MANAGER', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR')
  async myProgress(@CurrentUser() user: AuthenticatedUser) {
    const userId = String(user?.id ?? 0);
    const result = await this.svc.getMyProgress(userId);
    return unwrapOrInternal(result);
  }

  @Post('progress/complete')
  async completeCourse(@Body() _body: Record<string, unknown>) { return { success: true }; }

  @Post('support/tickets')
  @HttpCode(HttpStatus.CREATED)
  @Roles('EMPLOYEE', 'HR_SPECIALIST', 'HR_MANAGER', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR')
  async createSupportTicket(
    @Body() body: { subject: string; message: string; priority?: string },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    try {
      const rows = await db.insert(lms_support_tickets).values({
        subject: String(body.subject ?? ''),
        message: String(body.message ?? ''),
        priority: String(body.priority ?? 'medium'),
        created_by: String(user?.id ?? 0),
      }).returning();
      return { ok: true, data: rows[0] };
    } catch (_e) {
      return { ok: false, error: 'Ticket yaratishda xatolik' };
    }
  }
}
