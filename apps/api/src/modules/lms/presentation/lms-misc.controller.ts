import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
  UsePipes
} from '@nestjs/common';
import { unwrapOrInternal } from '@common/http-result';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { AuthenticatedUser } from '@common/types/user.types';
import { LmsMiscService } from '../application/services/lms-misc.service';
import { VideoProgressSchema, VideoProgressDto } from './dto/courses.dto';

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('micro-modules')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class LmsMicroModulesController {
  constructor(private readonly svc: LmsMiscService) {}

  @Get()
  @Roles('EMPLOYEE', 'HR_SPECIALIST', 'HR_MANAGER', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR')
  async listMicroModules() {
    const result = await this.svc.listMicroModules();
    return unwrapOrInternal(result);
  }

  @Post(':id/view')
  @Roles('EMPLOYEE', 'HR_SPECIALIST', 'HR_MANAGER', 'SUPER_ADMIN')
  async recordView(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    const userId = String(user?.id ?? 0);
    const result = await this.svc.recordMicroModuleView(id, userId);
    const data = unwrapOrInternal(result);
    return { message: "Ko'rildi", data };
  }
}

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('lms-knowledge')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class LmsKnowledgeController {
  constructor(private readonly svc: LmsMiscService) {}

  @Get()
  @Roles('EMPLOYEE', 'HR_SPECIALIST', 'HR_MANAGER', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR')
  async listKnowledge(@Query('q') query?: string) {
    const result = await this.svc.listKnowledge(query);
    return unwrapOrInternal(result);
  }
}

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('video-progress')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class LmsVideoProgressController {
  constructor(private readonly svc: LmsMiscService) {}

  @Get()
  @Roles('EMPLOYEE', 'HR_SPECIALIST', 'HR_MANAGER', 'SUPER_ADMIN', 'DIRECTOR')
  async listVideoProgress() { return { data: [], total: 0 }; }

  @Post()
  @Roles('EMPLOYEE', 'HR_SPECIALIST', 'HR_MANAGER', 'SUPER_ADMIN')
  @UsePipes(new ZodValidationPipe(VideoProgressSchema))
  async saveVideoProgress(
    @Body() dto: VideoProgressDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const payload = { ...dto, employeeId: String(user?.id ?? 0) } as Record<string, unknown>;
    const result = await this.svc.saveVideoProgress(payload);
    const data = unwrapOrInternal(result);
    return { message: 'Video progressi saqlandi', data };
  }
}

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('achievements')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class LmsAchievementsController {
  constructor(private readonly svc: LmsMiscService) {}

  @Get()
  @Roles('EMPLOYEE', 'HR_SPECIALIST', 'HR_MANAGER', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR')
  async listAchievements(@CurrentUser() user: AuthenticatedUser) {
    const userId = String(user?.id ?? '');
    const result = await this.svc.listAchievements(userId || undefined);
    return unwrapOrInternal(result);
  }
}

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('mentors')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class LmsMentorsController {
  constructor(private readonly svc: LmsMiscService) {}

  @Get()
  @Roles('EMPLOYEE', 'HR_SPECIALIST', 'HR_MANAGER', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR')
  async listMentors(@Query('specialization') specialization?: string) {
    const result = await this.svc.listMentors(specialization);
    return unwrapOrInternal(result);
  }
}

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('progress')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class LmsProgressCompatController {
  @Get()
  @Roles('EMPLOYEE', 'HR_SPECIALIST', 'HR_MANAGER', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR')
  async listProgress() { return { data: [], total: 0 }; }

  @Get('user/:id')
  @Roles('EMPLOYEE', 'HR_SPECIALIST', 'HR_MANAGER', 'TRAINING_OFFICER', 'SUPER_ADMIN', 'DIRECTOR')
  async getUserProgress(@Param('id') _id: string) { return { data: [], total: 0 }; }
}
