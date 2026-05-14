/**
 * @module enps.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { Controller, UseGuards, Get, Post, Patch, Body, Param, ParseIntPipe, Logger, UseInterceptors } from '@nestjs/common';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { Throttle } from '@nestjs/throttler';
import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';
import { EnpsService } from './enps.service';
import { Roles } from '../../../common/decorators/roles.decorator';
import { unwrapOrInternal } from '@common/http-result';

const CreateSurveySchema = z.object({
  title:       z.string().min(1),
  description: z.string().optional(),
  period:      z.string().min(1),
  start_date:  z.string().optional(),
  end_date:    z.string().min(1),
  created_by:  z.number().int().optional(),
});
class CreateSurveyDto extends createZodDto(CreateSurveySchema) {}

const SubmitResponseSchema = z.object({
  survey_id:   z.number().int(),
  employee_id: z.number().int(),
  score:       z.number().int().min(0).max(10),
  comment:     z.string().optional(),
  answers:     z.record(z.unknown()).optional(),
});
class SubmitResponseDto extends createZodDto(SubmitResponseSchema) {}

@Roles('admin', 'manager', 'supervisor', 'employee', 'hr_manager')
@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard)
@Controller('hr-v2/enps')
export class EnpsController {
  private readonly logger = new Logger(EnpsController.name);
  constructor(private readonly svc: EnpsService) {}

  @Get()
  async list() {
    return unwrapOrInternal(await this.svc.listSurveys());
  }

  @Post()
  async create(@Body() body: CreateSurveyDto) {
    return unwrapOrInternal(await this.svc.createSurvey({
      title: body.title,
      description: body.description,
      period: body.period,
      startDate: body.start_date,
      endDate: body.end_date,
      createdBy: body.created_by,
    }));
  }

  @Patch(':id/launch')
  async launch(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrInternal(await this.svc.launchSurvey(id));
  }

  @Patch(':id/close')
  async close(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrInternal(await this.svc.closeSurvey(id));
  }

  @Get(':id/results')
  async results(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrInternal(await this.svc.getSurveyResults(id));
  }

  @Post('respond')
  async respond(@Body() body: SubmitResponseDto) {
    return unwrapOrInternal(await this.svc.submitResponse({
      surveyId: body.survey_id,
      employeeId: body.employee_id,
      score: body.score,
      comment: body.comment,
      answers: body.answers,
    }));
  }

  @Get('results')
  async getEnpsResults() { return { data: [], score: 0 }; }
}
