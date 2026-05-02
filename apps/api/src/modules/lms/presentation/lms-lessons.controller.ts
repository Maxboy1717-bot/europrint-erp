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
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { LmsCoursesExtendedService } from '../application/services/lms-courses-extended.service';
import {
  CreateLessonSchema, CreateLessonDto,
  UpdateLessonSchema, UpdateLessonDto,
  CreateModuleSchema, CreateModuleDto
} from './dto/courses.dto';

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('lessons')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class LmsLessonsController {
  constructor(private readonly svc: LmsCoursesExtendedService) {}

  @Get()
  @Roles('EMPLOYEE', 'HR_SPECIALIST', 'HR_MANAGER', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR')
  async listLessons(@Query('courseId') courseId?: string) {
    const result = await this.svc.listLessons(courseId);
    return unwrapOrInternal(result);
  }

  @Post()
  @Roles('TRAINING_OFFICER', 'HR_MANAGER', 'SUPER_ADMIN', 'DIRECTOR')
  @UsePipes(new ZodValidationPipe(CreateLessonSchema))
  async createLesson(@Body() dto: CreateLessonDto) {
    const result = await this.svc.createLesson(dto);
    const data = unwrapOrInternal(result);
    return { message: 'Dars yaratildi', data };
  }

  @Get(':id')
  @Roles('EMPLOYEE', 'HR_SPECIALIST', 'HR_MANAGER', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR')
  async getLesson(@Param('id') id: string) {
    const result = await this.svc.getLessonById(id);
    return unwrapOrInternal(result);
  }

  @Put(':id')
  @Roles('TRAINING_OFFICER', 'HR_MANAGER', 'SUPER_ADMIN', 'DIRECTOR')
  @UsePipes(new ZodValidationPipe(UpdateLessonSchema))
  async updateLesson(@Param('id') id: string, @Body() dto: UpdateLessonDto) {
    const result = await this.svc.updateLesson(id, dto);
    const data = unwrapOrInternal(result);
    return { message: 'Dars yangilandi', data };
  }

  @Delete(':id')
  @Roles('TRAINING_OFFICER', 'HR_MANAGER', 'SUPER_ADMIN', 'DIRECTOR')
  async deleteLesson(@Param('id') id: string) {
    const result = await this.svc.deleteLesson(id);
    unwrapOrInternal(result);
    return { message: "Dars o'chirildi" };
  }
}

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('modules')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class LmsModulesController {
  constructor(private readonly svc: LmsCoursesExtendedService) {}

  @Get()
  @Roles('EMPLOYEE', 'HR_SPECIALIST', 'HR_MANAGER', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR')
  async listModules() { return { data: [], total: 0 }; }

  @Post()
  @Roles('TRAINING_OFFICER', 'HR_MANAGER', 'SUPER_ADMIN', 'DIRECTOR')
  @UsePipes(new ZodValidationPipe(CreateModuleSchema))
  async createModule(@Body() dto: CreateModuleDto) {
    const result = await this.svc.createModule(dto);
    const data = unwrapOrInternal(result);
    return { message: 'Modul yaratildi', data };
  }

  @Get(':id')
  @Roles('EMPLOYEE', 'HR_SPECIALIST', 'HR_MANAGER', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR')
  async getModule(@Param('id') id: string) {
    const result = await this.svc.getModule(id);
    return unwrapOrInternal(result);
  }
}
