/**
 * @module courses.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UsePipes,
  UseGuards,
  UseInterceptors
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { unwrapOrInternal } from '@common/http-result';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { LmsCoursesExtendedService } from '../application/services/lms-courses-extended.service';
import { CreateCourseSchema, CreateCourseDto, UpdateCourseSchema, UpdateCourseDto } from './dto/courses.dto';

@ApiThrottle()
@ApiTags('Courses')
@ApiBearerAuth()
@Controller('courses')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class CoursesController {
  constructor(private readonly svc: LmsCoursesExtendedService) {}

  @ApiOperation({ summary: 'Completion trend lang' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('completion-trend/:lang')
  @Roles('HR_MANAGER', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR')
  async completionTrendLang(@Param('lang') _lang: string, @Query('months') months?: string) {
    const result = await this.svc.completionTrend(months ? parseInt(months, 10) : 6);
    return unwrapOrInternal(result);
  }

  @ApiOperation({ summary: 'Completion trend' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('completion-trend')
  @Roles('HR_MANAGER', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR')
  async completionTrend(@Query('months') months?: string) {
    const result = await this.svc.completionTrend(months ? parseInt(months, 10) : 6);
    return unwrapOrInternal(result);
  }

  @ApiOperation({ summary: 'List courses' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get()
  @Roles('EMPLOYEE', 'HR_SPECIALIST', 'HR_MANAGER', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR')
  async listCourses(
    @Query() query: { category?: string; isMandatory?: string; page?: string; limit?: string },
  ) {
    const pg = parseInt(query.page ?? '1', 10);
    const lim = parseInt(query.limit ?? '20', 10);
    const result = await this.svc.listCourses({
      category: query.category,
      isMandatory: query.isMandatory !== undefined ? query.isMandatory === 'true' : undefined,
      page: pg,
      limit: lim,
    });
    const inner = unwrapOrInternal(result) as { items: unknown[]; total: number };
    return {
      data: Array.isArray(inner.items) ? inner.items : [],
      pagination: {
        page: pg,
        limit: lim,
        total: inner.total ?? 0,
        totalPages: Math.ceil((inner.total ?? 0) / lim),
      },
    };
  }

  @ApiOperation({ summary: 'Create course' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post()
  @Roles('TRAINING_OFFICER', 'HR_MANAGER', 'SUPER_ADMIN', 'DIRECTOR')
  @UsePipes(new ZodValidationPipe(CreateCourseSchema))
  async createCourse(@Body() dto: CreateCourseDto, @CurrentUser() user: AuthenticatedUser) {
    const result = await this.svc.createCourse(dto, String(user?.id ?? 0));
    const data = unwrapOrInternal(result);
    return { message: 'Kurs yaratildi', data };
  }

  @ApiOperation({ summary: 'Get course' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get(':id')
  @Roles('EMPLOYEE', 'HR_SPECIALIST', 'HR_MANAGER', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR')
  async getCourse(@Param('id') id: string) {
    const result = await this.svc.getCourse(id);
    return unwrapOrInternal(result);
  }

  @ApiOperation({ summary: 'Update course' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Put(':id')
  @Roles('TRAINING_OFFICER', 'HR_MANAGER', 'SUPER_ADMIN', 'DIRECTOR')
  @UsePipes(new ZodValidationPipe(UpdateCourseSchema))
  async updateCourse(@Param('id') id: string, @Body() dto: UpdateCourseDto) {
    const result = await this.svc.updateCourse(id, dto);
    const data = unwrapOrInternal(result);
    return { message: 'Kurs yangilandi', data };
  }

  @ApiOperation({ summary: 'Delete course' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Delete(':id')
  @Roles('HR_MANAGER', 'SUPER_ADMIN', 'DIRECTOR')
  async deleteCourse(@Param('id') id: string) {
    const result = await this.svc.deleteCourse(id);
    unwrapOrInternal(result);
    return { message: "Kurs o'chirildi" };
  }

  @ApiOperation({ summary: 'Patch course' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch(':id')
  @Roles('TRAINING_OFFICER', 'HR_MANAGER', 'SUPER_ADMIN', 'DIRECTOR')
  @UsePipes(new ZodValidationPipe(UpdateCourseSchema))
  async patchCourse(@Param('id') id: string, @Body() dto: UpdateCourseDto) {
    const result = await this.svc.updateCourse(id, dto);
    const data = unwrapOrInternal(result);
    return { message: 'Kurs yangilandi', data };
  }
}
