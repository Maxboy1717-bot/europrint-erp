/**
 * @module lms-tests.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UsePipes,
  UseGuards,
  UseInterceptors
} from '@nestjs/common';
import { unwrapOrInternal } from '@common/http-result';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard } from '@common/guards/roles.guard';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { LmsTestsService } from '../application/services/lms-tests.service';
import {
  CreateTestSchema, CreateTestDto, UpdateTestSchema, UpdateTestDto,
  CreateQuestionSchema, CreateQuestionDto, UpdateQuestionSchema, UpdateQuestionDto,
  CreateAssignmentSchema, CreateAssignmentDto
} from './dto/lms-tests.dto';

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('tests')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class LmsTestsController {
  constructor(private readonly svc: LmsTestsService) {}

  @Get()
  @Roles('EMPLOYEE', 'HR_SPECIALIST', 'HR_MANAGER', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR')
  async listTests(@Query('courseId') courseId?: string) {
    const result = await this.svc.listTests(courseId);
    return unwrapOrInternal(result);
  }

  @Post()
  @Roles('TRAINING_OFFICER', 'HR_MANAGER', 'SUPER_ADMIN', 'DIRECTOR')
  @UsePipes(new ZodValidationPipe(CreateTestSchema))
  async createTest(@Body() dto: CreateTestDto) {
    const result = await this.svc.createTest(dto);
    const data = unwrapOrInternal(result);
    return { message: 'Test yaratildi', data };
  }

  @Get(':id')
  @Roles('EMPLOYEE', 'HR_SPECIALIST', 'HR_MANAGER', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR')
  async getTest(@Param('id') id: string) {
    const result = await this.svc.getTest(id);
    return unwrapOrInternal(result);
  }

  @Put(':id')
  @Roles('TRAINING_OFFICER', 'HR_MANAGER', 'SUPER_ADMIN', 'DIRECTOR')
  @UsePipes(new ZodValidationPipe(UpdateTestSchema))
  async updateTest(@Param('id') id: string, @Body() dto: UpdateTestDto) {
    const result = await this.svc.updateTest(id, dto);
    const data = unwrapOrInternal(result);
    return { message: 'Test yangilandi', data };
  }

  @Delete(':id')
  @Roles('TRAINING_OFFICER', 'HR_MANAGER', 'SUPER_ADMIN', 'DIRECTOR')
  async deleteTest(@Param('id') id: string) {
    const result = await this.svc.deleteTest(id);
    unwrapOrInternal(result);
    return { message: "Test o'chirildi" };
  }
}

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('questions')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class LmsQuestionsController {
  constructor(private readonly svc: LmsTestsService) {}

  @Get()
  @Roles('EMPLOYEE', 'HR_SPECIALIST', 'HR_MANAGER', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR')
  async listQuestions(@Query('testId') testId?: string) {
    const result = await this.svc.listQuestions(testId);
    return unwrapOrInternal(result);
  }

  @Post()
  @Roles('TRAINING_OFFICER', 'HR_MANAGER', 'SUPER_ADMIN', 'DIRECTOR')
  @UsePipes(new ZodValidationPipe(CreateQuestionSchema))
  async createQuestion(@Body() dto: CreateQuestionDto) {
    const result = await this.svc.createQuestion(dto);
    const data = unwrapOrInternal(result);
    return { message: 'Savol yaratildi', data };
  }

  @Get(':questionId')
  @Roles('EMPLOYEE', 'HR_SPECIALIST', 'HR_MANAGER', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR')
  async getQuestion(@Param('questionId') questionId: string) {
    const result = await this.svc.getQuestion(questionId);
    return unwrapOrInternal(result);
  }

  @Put(':questionId')
  @Roles('TRAINING_OFFICER', 'HR_MANAGER', 'SUPER_ADMIN', 'DIRECTOR')
  @UsePipes(new ZodValidationPipe(UpdateQuestionSchema))
  async updateQuestion(@Param('questionId') questionId: string, @Body() dto: UpdateQuestionDto) {
    const result = await this.svc.updateQuestion(questionId, dto);
    const data = unwrapOrInternal(result);
    return { message: 'Savol yangilandi', data };
  }

  @Delete(':questionId')
  @Roles('TRAINING_OFFICER', 'HR_MANAGER', 'SUPER_ADMIN', 'DIRECTOR')
  async deleteQuestion(@Param('questionId') questionId: string) {
    const result = await this.svc.deleteQuestion(questionId);
    unwrapOrInternal(result);
    return { message: "Savol o'chirildi" };
  }
}

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('assignments')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class LmsAssignmentsController {
  constructor(private readonly svc: LmsTestsService) {}

  @Post()
  @Roles('TRAINING_OFFICER', 'HR_MANAGER', 'SUPER_ADMIN', 'DIRECTOR')
  @UsePipes(new ZodValidationPipe(CreateAssignmentSchema))
  async createAssignment(@Body() dto: CreateAssignmentDto, @CurrentUser() user: AuthenticatedUser) {
    const result = await this.svc.createAssignment(dto, String(user?.id ?? 0));
    const data = unwrapOrInternal(result);
    return { message: 'Topshiriq yaratildi', data };
  }
}
