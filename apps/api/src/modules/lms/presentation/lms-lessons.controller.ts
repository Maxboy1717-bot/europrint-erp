/**
 * @module lms-lessons.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UsePipes,
  UseGuards,
  UseInterceptors
} from '@nestjs/common';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';
type Rows = { rows?: unknown[] };

import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { unwrapOrInternal } from '@common/http-result';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { LmsCoursesExtendedService } from '../application/services/lms-courses-extended.service';
import { LmsMiscService } from '../application/services/lms-misc.service';
import { notImplemented } from '@common/exceptions/not-implemented';
import {
  CreateLessonSchema, CreateLessonDto,
  UpdateLessonSchema, UpdateLessonDto,
  CreateModuleSchema, CreateModuleDto
} from './dto/courses.dto';

@ApiThrottle()
@ApiTags('Lms Lessons')
@ApiBearerAuth()
@Controller('lessons')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class LmsLessonsController {
  constructor(private readonly svc: LmsCoursesExtendedService) {}

  @ApiOperation({ summary: 'List lessons' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get()
  @Roles('EMPLOYEE', 'HR_SPECIALIST', 'HR_MANAGER', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR')
  async listLessons(@Query('courseId') courseId?: string) {
    const result = await this.svc.listLessons(courseId);
    return unwrapOrInternal(result);
  }

  @ApiOperation({ summary: 'Create lesson' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post()
  @Roles('TRAINING_OFFICER', 'HR_MANAGER', 'SUPER_ADMIN', 'DIRECTOR')
  @UsePipes(new ZodValidationPipe(CreateLessonSchema))
  async createLesson(@Body() dto: CreateLessonDto) {
    const result = await this.svc.createLesson(dto);
    const data = unwrapOrInternal(result);
    return { message: 'Dars yaratildi', data };
  }

  @ApiOperation({ summary: 'Get lesson' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get(':id')
  @Roles('EMPLOYEE', 'HR_SPECIALIST', 'HR_MANAGER', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR')
  async getLesson(@Param('id') id: string) {
    const result = await this.svc.getLessonById(id);
    return unwrapOrInternal(result);
  }

  @ApiOperation({ summary: 'Update lesson' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Put(':id')
  @Roles('TRAINING_OFFICER', 'HR_MANAGER', 'SUPER_ADMIN', 'DIRECTOR')
  @UsePipes(new ZodValidationPipe(UpdateLessonSchema))
  async updateLesson(@Param('id') id: string, @Body() dto: UpdateLessonDto) {
    const result = await this.svc.updateLesson(id, dto);
    const data = unwrapOrInternal(result);
    return { message: 'Dars yangilandi', data };
  }

  @ApiOperation({ summary: 'Patch lesson' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch(':id')
  @Roles('TRAINING_OFFICER', 'HR_MANAGER', 'SUPER_ADMIN', 'DIRECTOR')
  @UsePipes(new ZodValidationPipe(UpdateLessonSchema))
  async patchLesson(@Param('id') id: string, @Body() dto: UpdateLessonDto) {
    const result = await this.svc.updateLesson(id, dto);
    const data = unwrapOrInternal(result);
    return { message: 'Dars yangilandi', data };
  }

  @ApiOperation({ summary: 'Delete lesson' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Delete(':id')
  @Roles('TRAINING_OFFICER', 'HR_MANAGER', 'SUPER_ADMIN', 'DIRECTOR')
  async deleteLesson(@Param('id') id: string) {
    const result = await this.svc.deleteLesson(id);
    unwrapOrInternal(result);
    return { message: "Dars o'chirildi" };
  }
}

@ApiThrottle()
@Controller('modules')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class LmsModulesController {
  constructor(
    private readonly svc: LmsCoursesExtendedService,
    private readonly lmsMiscService: LmsMiscService,
  ) {}

  @ApiOperation({ summary: 'List modules' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 501, description: 'Not implemented' })
  @Get()
  @Roles('EMPLOYEE', 'HR_SPECIALIST', 'HR_MANAGER', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR')
  async listModules(@Query('courseId') courseId?: string) {
    return unwrapOrInternal(await this.lmsMiscService.listModules(courseId));
  }

  @ApiOperation({ summary: 'Create module' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post()
  @Roles('TRAINING_OFFICER', 'HR_MANAGER', 'SUPER_ADMIN', 'DIRECTOR')
  @UsePipes(new ZodValidationPipe(CreateModuleSchema))
  async createModule(@Body() dto: CreateModuleDto) {
    const result = await this.svc.createModule(dto);
    const data = unwrapOrInternal(result);
    return { message: 'Modul yaratildi', data };
  }

  @ApiOperation({ summary: 'Get module' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get(':id')
  @Roles('EMPLOYEE', 'HR_SPECIALIST', 'HR_MANAGER', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR')
  async getModule(@Param('id') id: string) {
    const result = await this.svc.getModule(id);
    return unwrapOrInternal(result);
  }

  @ApiOperation({ summary: 'Delete module (soft)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles('TRAINING_OFFICER', 'HR_MANAGER', 'SUPER_ADMIN', 'DIRECTOR')
  async deleteModule(@Param('id') id: string) {
    await db.execute(sql`UPDATE modules SET deleted_at = NOW() WHERE id = ${parseInt(id, 10)} AND deleted_at IS NULL`);
    return { deleted: true, id };
  }
}
