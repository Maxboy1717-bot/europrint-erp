/**
 * @module enps.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { Controller, UseGuards, Get, HttpException, HttpStatus, Post, Patch, Body, Param, ParseIntPipe, Logger, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
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
@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard)
@ApiTags('Enps')
@ApiBearerAuth()
@Controller('hr-v2/enps')
export class EnpsController {
  private readonly logger = new Logger(EnpsController.name);
  constructor(private readonly svc: EnpsService) {}

  @ApiOperation({ summary: 'List' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get()
  async list() {
    return unwrapOrInternal(await this.svc.listSurveys());
  }

  @ApiOperation({ summary: 'Create' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
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

  @ApiOperation({ summary: 'Launch' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch(':id/launch')
  async launch(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrInternal(await this.svc.launchSurvey(id));
  }

  @ApiOperation({ summary: 'Close' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch(':id/close')
  async close(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrInternal(await this.svc.closeSurvey(id));
  }

  @ApiOperation({ summary: 'Results' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get(':id/results')
  async results(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrInternal(await this.svc.getSurveyResults(id));
  }

  @ApiOperation({ summary: 'Respond' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
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

  // P3-26: aggregated eNPS results not yet wired; return 501 so the survey
  // dashboard shows an honest "coming soon" instead of a zero score.
  @ApiOperation({ summary: 'Get enps results' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 501, description: 'Not implemented' })
  @Get('results')
  async getEnpsResults() {
    throw new HttpException(
      { message: 'Endpoint not yet implemented: GET /enps/results', code: 'NOT_IMPLEMENTED' },
      HttpStatus.NOT_IMPLEMENTED,
    );
  }
}
