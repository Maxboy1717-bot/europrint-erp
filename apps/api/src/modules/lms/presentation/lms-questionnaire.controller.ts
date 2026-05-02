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
import { Err } from '@common/result';
import { assertOk, unwrapOrInternal } from '@common/http-result';
import { Throttle } from '@nestjs/throttler';
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

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('questionnaire')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class LmsQuestionnaireController {
  constructor(private readonly svc: LmsQuestionnaireService) {}

  @Get('questions')
  @Roles('EMPLOYEE', 'HR_SPECIALIST', 'HR_MANAGER', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR')
  async listQuestions() {
    const result = await this.svc.listQuestions();
    return unwrapOrInternal(result);
  }

  @Post('questions')
  @Roles('HR_MANAGER', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR')
  @UsePipes(new ZodValidationPipe(CreateQQuestionSchema))
  async createQuestion(@Body() dto: CreateQQuestionDto) {
    const result = await this.svc.createQuestion(dto);
    const data = unwrapOrInternal(result);
    return { message: 'Savol yaratildi', data };
  }

  @Put('questions/:id')
  @Roles('HR_MANAGER', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR')
  @UsePipes(new ZodValidationPipe(UpdateQQuestionSchema))
  async updateQuestion(@Param('id') id: string, @Body() dto: UpdateQQuestionDto) {
    const result = await this.svc.updateQuestion(id, dto);
    const data = unwrapOrInternal(result);
    return { message: 'Savol yangilandi', data };
  }

  @Delete('questions/:id')
  @Roles('HR_MANAGER', 'SUPER_ADMIN', 'DIRECTOR')
  async deleteQuestion(@Param('id') id: string) {
    const result = await this.svc.deleteQuestion(id);
    unwrapOrInternal(result);
    return { message: "Savol o'chirildi" };
  }

  @Get('responses')
  @Roles('HR_MANAGER', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR')
  async listResponses(@Query('questionId') questionId?: string) {
    const result = await this.svc.listResponses(questionId);
    return unwrapOrInternal(result);
  }

  @Post('responses')
  @Roles('EMPLOYEE', 'HR_SPECIALIST', 'HR_MANAGER', 'SUPER_ADMIN')
  @UsePipes(new ZodValidationPipe(CreateQResponseSchema))
  async createResponse(@Body() dto: CreateQResponseDto, @CurrentUser() user: AuthenticatedUser) {
    const result = await this.svc.createResponse(dto, String(user?.id ?? 0));
    const data = unwrapOrInternal(result);
    return { message: 'Javob saqlandi', data };
  }

  @Get('responses/:id')
  @Roles('HR_MANAGER', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR')
  async getResponse(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    const result = await this.svc.getResponse(id, { id: user.id, role: user.role });
    return unwrapOrInternal(result);
  }

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

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('questionnaire-templates')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class LmsQuestionnaireTemplatesController {
  constructor(private readonly svc: LmsQuestionnaireService) {}

  @Get()
  @Roles('EMPLOYEE', 'HR_SPECIALIST', 'HR_MANAGER', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR')
  async listTemplates() {
    const result = await this.svc.listTemplates();
    return unwrapOrInternal(result);
  }

  @Post()
  @Roles('HR_MANAGER', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR')
  @UsePipes(new ZodValidationPipe(CreateQTemplateSchema))
  async createTemplate(@Body() dto: CreateQTemplateDto, @CurrentUser() user: AuthenticatedUser) {
    const result = await this.svc.createTemplate(dto, String(user?.id ?? 0));
    const data = unwrapOrInternal(result);
    return { message: 'Shablon yaratildi', data };
  }

  @Get(':id')
  @Roles('EMPLOYEE', 'HR_SPECIALIST', 'HR_MANAGER', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR')
  async getTemplate(@Param('id') id: string) {
    const result = await this.svc.getTemplate(id);
    return unwrapOrInternal(result);
  }

  @Put(':id')
  @Roles('HR_MANAGER', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR')
  @UsePipes(new ZodValidationPipe(UpdateQTemplateSchema))
  async updateTemplate(@Param('id') id: string, @Body() dto: UpdateQTemplateDto) {
    const result = await this.svc.updateTemplate(id, dto);
    const data = unwrapOrInternal(result);
    return { message: 'Shablon yangilandi', data };
  }

  @Delete(':id')
  @Roles('HR_MANAGER', 'SUPER_ADMIN', 'DIRECTOR')
  async deleteTemplate(@Param('id') id: string) {
    const result = await this.svc.deleteTemplate(id);
    unwrapOrInternal(result);
    return { message: "Shablon o'chirildi" };
  }
}

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('questionnaire-questions')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class LmsQuestionnaireQuestionsController {
  constructor(private readonly svc: LmsQuestionnaireService) {}

  @Get()
  @Roles('EMPLOYEE', 'HR_SPECIALIST', 'HR_MANAGER', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR')
  async listQuestions(@Query('templateId') templateId?: string) {
    const result = await this.svc.listQuestionnaireQuestions(templateId);
    return unwrapOrInternal(result);
  }

  @Post()
  @Roles('HR_MANAGER', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR')
  @UsePipes(new ZodValidationPipe(CreateQQuestionSchema))
  async createQuestion(@Body() dto: CreateQQuestionDto) {
    const result = await this.svc.createQuestionnaireQuestion(dto);
    const data = unwrapOrInternal(result);
    return { message: 'Savol yaratildi', data };
  }

  @Delete(':id')
  @Roles('HR_MANAGER', 'SUPER_ADMIN', 'DIRECTOR')
  async deleteQuestion(@Param('id') id: string) {
    const result = await this.svc.deleteQuestionnaireQuestion(id);
    unwrapOrInternal(result);
    return { message: "Savol o'chirildi" };
  }
}
