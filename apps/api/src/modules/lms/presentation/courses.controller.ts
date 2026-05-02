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
import { LmsCoursesExtendedService } from '../application/services/lms-courses-extended.service';
import { CreateCourseSchema, CreateCourseDto, UpdateCourseSchema, UpdateCourseDto } from './dto/courses.dto';

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('courses')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class CoursesController {
  constructor(private readonly svc: LmsCoursesExtendedService) {}

  @Get('completion-trend/:lang')
  @Roles('HR_MANAGER', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR')
  async completionTrendLang(@Param('lang') _lang: string, @Query('months') months?: string) {
    const result = await this.svc.completionTrend(months ? parseInt(months, 10) : 6);
    return unwrapOrInternal(result);
  }

  @Get('completion-trend')
  @Roles('HR_MANAGER', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR')
  async completionTrend(@Query('months') months?: string) {
    const result = await this.svc.completionTrend(months ? parseInt(months, 10) : 6);
    return unwrapOrInternal(result);
  }

  @Get()
  @Roles('EMPLOYEE', 'HR_SPECIALIST', 'HR_MANAGER', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR')
  async listCourses(
    @Query() query: { category?: string; isMandatory?: string; page?: string; limit?: string },
  ) {
    const result = await this.svc.listCourses({
      category: query.category,
      isMandatory: query.isMandatory !== undefined ? query.isMandatory === 'true' : undefined,
      page: parseInt(query.page ?? '1', 10),
      limit: parseInt(query.limit ?? '20', 10)
});
    return unwrapOrInternal(result);
  }

  @Post()
  @Roles('TRAINING_OFFICER', 'HR_MANAGER', 'SUPER_ADMIN', 'DIRECTOR')
  @UsePipes(new ZodValidationPipe(CreateCourseSchema))
  async createCourse(@Body() dto: CreateCourseDto, @CurrentUser() user: AuthenticatedUser) {
    const result = await this.svc.createCourse(dto, String(user?.id ?? 0));
    const data = unwrapOrInternal(result);
    return { message: 'Kurs yaratildi', data };
  }

  @Get(':id')
  @Roles('EMPLOYEE', 'HR_SPECIALIST', 'HR_MANAGER', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR')
  async getCourse(@Param('id') id: string) {
    const result = await this.svc.getCourse(id);
    return unwrapOrInternal(result);
  }

  @Put(':id')
  @Roles('TRAINING_OFFICER', 'HR_MANAGER', 'SUPER_ADMIN', 'DIRECTOR')
  @UsePipes(new ZodValidationPipe(UpdateCourseSchema))
  async updateCourse(@Param('id') id: string, @Body() dto: UpdateCourseDto) {
    const result = await this.svc.updateCourse(id, dto);
    const data = unwrapOrInternal(result);
    return { message: 'Kurs yangilandi', data };
  }

  @Delete(':id')
  @Roles('HR_MANAGER', 'SUPER_ADMIN', 'DIRECTOR')
  async deleteCourse(@Param('id') id: string) {
    const result = await this.svc.deleteCourse(id);
    unwrapOrInternal(result);
    return { message: "Kurs o'chirildi" };
  }
}
