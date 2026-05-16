/**
 * @module ai-interview-v2.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { assertValidated } from '@common/assertions';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, Query, Logger, UseInterceptors, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { throwFromError, unwrapOrThrow, assertOk, unwrapOrInternal } from '@common/http-result';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';
import { AiInterviewV2Service } from './ai-interview-v2.service';
import { Roles } from '@common/decorators/roles.decorator';
import { Public } from '@common/decorators/public.decorator';

const CreateSessionSchema = z.object({
  candidate_id:       z.number().int().nullable().optional(),
  vacancy_id:         z.number().int().nullable().optional(),
  pipeline_entry_id:  z.number().int().nullable().optional(),
  candidate_name:     z.string().min(1),
  candidate_language: z.string().optional(),
  scheduled_at:       z.string().optional(),
  created_by:         z.number().int().optional(),
});
class CreateSessionDto extends createZodDto(CreateSessionSchema) {}

const SaveResultsSchema = z.object({
  communication_score:           z.number().optional(),
  confidence_score:              z.number().optional(),
  problem_solving_score:         z.number().optional(),
  body_language_score:           z.number().optional(),
  emotional_state_score:         z.number().optional(),
  professional_appearance_score: z.number().optional(),
  overall_score:                 z.number().optional(),
  recommendation:                z.string().optional(),
  ai_summary:                    z.string().optional(),
  transcript:                    z.string().optional(),
});
class SaveResultsDto extends createZodDto(SaveResultsSchema) {}

const CreateQuestionSchema = z.object({
  job_title:         z.string().optional(),
  question:          z.string().min(1),
  question_uz:       z.string().optional(),
  question_ru:       z.string().optional(),
  question_en:       z.string().optional(),
  category:          z.string().optional(),
  difficulty:        z.string().optional(),
  expected_keywords: z.string().optional(),
  max_score:         z.number().optional(),
  created_by:        z.number().int().optional(),
});
class CreateQuestionDto extends createZodDto(CreateQuestionSchema) {}

@Roles('admin', 'manager', 'supervisor', 'hr_manager')
@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@ApiTags('Ai Interview V2')
@Controller('hr-v2/ai-interview')
export class AiInterviewV2Controller {
  private readonly logger = new Logger(AiInterviewV2Controller.name);
  constructor(private readonly svc: AiInterviewV2Service) {}

  @ApiOperation({ summary: 'List' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('sessions')
  async list(@Query('status') status: string) {
    return unwrapOrInternal(await this.svc.listSessions(status));
  }

  @ApiOperation({ summary: 'Stats' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('stats')
  async stats() {
    return unwrapOrInternal(await this.svc.getPipelineStats());
  }

  @ApiOperation({ summary: 'Create' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('sessions')
  async create(@Body() body: CreateSessionDto) {
    return unwrapOrInternal(await this.svc.createSession({
      candidateId: body.candidate_id ?? undefined,
      vacancyId: body.vacancy_id ?? undefined,
      candidateName: body.candidate_name,
      candidateLanguage: body.candidate_language,
      scheduledAt: body.scheduled_at,
      createdBy: body.created_by || 1,
    }));
  }

  @ApiOperation({ summary: 'Get by id' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('sessions/:id')
  async getById(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrInternal(await this.svc.getSession(id));
  }

  @Public()
  @ApiOperation({ summary: 'Validate' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('session/:token/validate')
  async validate(@Param('token') token: string) {
    return unwrapOrInternal(await this.svc.validateToken(token));
  }

  @Public()
  @ApiOperation({ summary: 'Report camera rejection' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Post('session/:token/camera-rejected')
  async reportCameraRejection(@Param('token') token: string) {
    return unwrapOrThrow(await this.svc.reportCameraRejection(token));
  }

  @Public()
  @ApiOperation({ summary: 'Public submit' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('session/:token/submit')
  async publicSubmit(
    @Param('token') token: string,
    @Body() body: { answers: string[] },
  ) {
    const _rValidation = await this.svc.validateToken(token);
    const validation = unwrapOrThrow(_rValidation);
    assertValidated(validation.valid, 'Validation failed');
    await this.svc.completeSession(validation.session_id ?? 0, {
      aiSummary: `Submitted ${body.answers?.length || 0} answers`,
      transcript: (body.answers || []).map((a, i) => `Q${i + 1}: ${a}`).join('\n'),
      recommendation: 'CONSIDER',
    });
    return {};
  }

  @ApiOperation({ summary: 'Save results' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch('sessions/:id/results')
  async saveResults(@Param('id', ParseIntPipe) id: number, @Body() body: SaveResultsDto) {
    return unwrapOrInternal(await this.svc.completeSession(id, {
      communicationScore: body.communication_score,
      confidenceScore: body.confidence_score,
      problemSolvingScore: body.problem_solving_score,
      bodyLanguageScore: body.body_language_score,
      emotionalStateScore: body.emotional_state_score,
      professionalAppearanceScore: body.professional_appearance_score,
      overallScore: body.overall_score,
      recommendation: body.recommendation,
      aiSummary: body.ai_summary,
      transcript: body.transcript,
    }));
  }

  @ApiOperation({ summary: 'List questions' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('questions')
  async listQuestions(@Query('job_title') jobTitle?: string) {
    return unwrapOrInternal(await this.svc.listQuestions(jobTitle));
  }

  @ApiOperation({ summary: 'Get questions for job' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('questions/for-job')
  async getQuestionsForJob(
    @Query('job_title') jobTitle?: string,
    @Query('language') language: string = 'uz',
  ) {
    return unwrapOrInternal(await this.svc.getQuestionsForJob(jobTitle, language));
  }

  @ApiOperation({ summary: 'Create question' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('questions')
  async createQuestion(@Body() body: CreateQuestionDto) {
    return unwrapOrInternal(await this.svc.createQuestion({
      jobTitle: body.job_title,
      question: body.question,
      questionUz: body.question_uz,
      questionRu: body.question_ru,
      questionEn: body.question_en,
      category: body.category,
      difficulty: body.difficulty,
      expectedKeywords: body.expected_keywords,
      maxScore: body.max_score,
      createdBy: body.created_by,
    }));
  }

  @ApiOperation({ summary: 'Delete question' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Delete('questions/:id')
  async deleteQuestion(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrInternal(await this.svc.deleteQuestion(id));
  }
}
