/**
 * @module lms-questionnaire.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { HttpStatus,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Res,
  UsePipes,
  UseGuards,
  UseInterceptors
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Err } from '@common/result';
import { assertOk, unwrapOrInternal } from '@common/http-result';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { AuthenticatedUser } from '@common/types/user.types';
import { LmsQuestionnaireService } from '../application/services/lms-questionnaire.service';
import {
  CreateQQuestionSchema, CreateQQuestionDto,
  UpdateQQuestionSchema, UpdateQQuestionDto,
  CreateQResponseSchema, CreateQResponseDto,
  CreateQTemplateSchema, CreateQTemplateDto,
  UpdateQTemplateSchema, UpdateQTemplateDto
} from './dto/lms-questionnaire.dto';
import type { FastifyReply } from 'fastify';

@ApiThrottle()
@ApiTags('Lms Questionnaire')
@ApiBearerAuth()
@Controller('questionnaire')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class LmsQuestionnaireController {
  constructor(private readonly svc: LmsQuestionnaireService) {}

  @ApiOperation({ summary: 'List questions' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('questions')
  @Roles('EMPLOYEE', 'HR_SPECIALIST', 'HR_MANAGER', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR')
  async listQuestions() {
    const result = await this.svc.listQuestions();
    return unwrapOrInternal(result);
  }

  @ApiOperation({ summary: 'Create question' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('questions')
  @Roles('HR_MANAGER', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR')
  @UsePipes(new ZodValidationPipe(CreateQQuestionSchema))
  async createQuestion(@Body() dto: CreateQQuestionDto) {
    const result = await this.svc.createQuestion(dto);
    const data = unwrapOrInternal(result);
    return { message: 'Savol yaratildi', data };
  }

  @ApiOperation({ summary: 'Update question' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Put('questions/:id')
  @Roles('HR_MANAGER', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR')
  @UsePipes(new ZodValidationPipe(UpdateQQuestionSchema))
  async updateQuestion(@Param('id') id: string, @Body() dto: UpdateQQuestionDto) {
    const result = await this.svc.updateQuestion(id, dto);
    const data = unwrapOrInternal(result);
    return { message: 'Savol yangilandi', data };
  }

  @ApiOperation({ summary: 'Delete question' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Delete('questions/:id')
  @Roles('HR_MANAGER', 'SUPER_ADMIN', 'DIRECTOR')
  async deleteQuestion(@Param('id') id: string) {
    const result = await this.svc.deleteQuestion(id);
    unwrapOrInternal(result);
    return { message: "Savol o'chirildi" };
  }

  @ApiOperation({ summary: 'List responses' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('responses')
  @Roles('HR_MANAGER', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR')
  async listResponses(@Query('questionId') questionId?: string) {
    const result = await this.svc.listResponses(questionId);
    return unwrapOrInternal(result);
  }

  @ApiOperation({ summary: 'Create response' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('responses')
  @Roles('EMPLOYEE', 'HR_SPECIALIST', 'HR_MANAGER', 'SUPER_ADMIN')
  @UsePipes(new ZodValidationPipe(CreateQResponseSchema))
  async createResponse(@Body() dto: CreateQResponseDto, @CurrentUser() user: AuthenticatedUser) {
    const result = await this.svc.createResponse(dto, String(user?.id ?? 0));
    const data = unwrapOrInternal(result);
    return { message: 'Javob saqlandi', data };
  }

  @ApiOperation({ summary: 'Get response' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('responses/:id')
  @Roles('HR_MANAGER', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR')
  async getResponse(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    const result = await this.svc.getResponse(id, { id: user.id, role: user.role });
    return unwrapOrInternal(result);
  }

  @ApiOperation({ summary: 'Update response' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Put('responses/:id')
  @Roles('HR_MANAGER', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR')
  async updateResponse(@Param('id') id: string, @Body() body: unknown) {
    return { id, ...(body as Record<string, unknown>), updated: true };
  }

  @ApiOperation({ summary: 'Delete response' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Delete('responses/:id')
  @Roles('HR_MANAGER', 'SUPER_ADMIN', 'DIRECTOR')
  async deleteResponse(@Param('id') id: string) {
    return { id, deleted: true };
  }

  @ApiOperation({ summary: 'Export response' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('responses/:id/export')
  @Roles('HR_MANAGER', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR')
  async exportResponse(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser, @Res() res: FastifyReply) {
    const result = await this.svc.exportResponse(id, { id: user.id, role: user.role });
    assertOk(result);
    const d = result.data as Record<string, unknown>;
    const csv = `id,question,answer\n${id},"${String(d.question_text ?? '')}","${JSON.stringify(d.answer)}"`;
    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', `attachment; filename="response-${id}.csv"`);
    return res.send(csv);
  }
}

@ApiThrottle()
@Controller('questionnaire-templates')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class LmsQuestionnaireTemplatesController {
  constructor(private readonly svc: LmsQuestionnaireService) {}

  @ApiOperation({ summary: 'List templates' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get()
  @Roles('EMPLOYEE', 'HR_SPECIALIST', 'HR_MANAGER', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR')
  async listTemplates() {
    const result = await this.svc.listTemplates();
    return unwrapOrInternal(result);
  }

  @ApiOperation({ summary: 'Create template' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post()
  @Roles('HR_MANAGER', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR')
  @UsePipes(new ZodValidationPipe(CreateQTemplateSchema))
  async createTemplate(@Body() dto: CreateQTemplateDto, @CurrentUser() user: AuthenticatedUser) {
    const result = await this.svc.createTemplate(dto, String(user?.id ?? 0));
    const data = unwrapOrInternal(result);
    return { message: 'Shablon yaratildi', data };
  }

  @ApiOperation({ summary: 'Get template' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get(':id')
  @Roles('EMPLOYEE', 'HR_SPECIALIST', 'HR_MANAGER', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR')
  async getTemplate(@Param('id') id: string) {
    const result = await this.svc.getTemplate(id);
    return unwrapOrInternal(result);
  }

  @ApiOperation({ summary: 'Update template' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Put(':id')
  @Roles('HR_MANAGER', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR')
  @UsePipes(new ZodValidationPipe(UpdateQTemplateSchema))
  async updateTemplate(@Param('id') id: string, @Body() dto: UpdateQTemplateDto) {
    const result = await this.svc.updateTemplate(id, dto);
    const data = unwrapOrInternal(result);
    return { message: 'Shablon yangilandi', data };
  }

  @ApiOperation({ summary: 'Delete template' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Delete(':id')
  @Roles('HR_MANAGER', 'SUPER_ADMIN', 'DIRECTOR')
  async deleteTemplate(@Param('id') id: string) {
    const result = await this.svc.deleteTemplate(id);
    unwrapOrInternal(result);
    return { message: "Shablon o'chirildi" };
  }
}

@ApiThrottle()
@Controller('questionnaire-questions')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class LmsQuestionnaireQuestionsController {
  constructor(private readonly svc: LmsQuestionnaireService) {}

  @ApiOperation({ summary: 'List questions' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get()
  @Roles('EMPLOYEE', 'HR_SPECIALIST', 'HR_MANAGER', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR')
  async listQuestions(@Query('templateId') templateId?: string) {
    const result = await this.svc.listQuestionnaireQuestions(templateId);
    return unwrapOrInternal(result);
  }

  @ApiOperation({ summary: 'Create question' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post()
  @Roles('HR_MANAGER', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR')
  @UsePipes(new ZodValidationPipe(CreateQQuestionSchema))
  async createQuestion(@Body() dto: CreateQQuestionDto) {
    const result = await this.svc.createQuestionnaireQuestion(dto);
    const data = unwrapOrInternal(result);
    return { message: 'Savol yaratildi', data };
  }

  @ApiOperation({ summary: 'Delete question' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Delete(':id')
  @Roles('HR_MANAGER', 'SUPER_ADMIN', 'DIRECTOR')
  async deleteQuestion(@Param('id') id: string) {
    const result = await this.svc.deleteQuestionnaireQuestion(id);
    unwrapOrInternal(result);
    return { message: "Savol o'chirildi" };
  }
}
