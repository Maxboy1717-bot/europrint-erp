/**
 * @module onboarding.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import {Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus, Logger, UseInterceptors , UsePipes,} from '@nestjs/common';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { OnboardingService } from './onboarding.service';
import {
  CreateOnboardingPlanDto,
  StartEmployeeOnboardingDto,
  UpdateOnboardingProgressDto,
  CompleteProbationDto,
  CreateJobDescriptionDto,
  OnboardingCreateMotivationSchema,
  OnboardingCreateMotivationDto,
} from './dto/onboarding.dto';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@common/types/user.types';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { unwrapOrInternal } from '@common/http-result';


@ApiTags('HR Onboarding')
@ApiBearerAuth()

@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@Controller('hr/onboarding')
export class OnboardingController {
  private readonly logger = new Logger(OnboardingController.name);
  constructor(private readonly onboardingService: OnboardingService) {}

  // ──────────────── ONBOARDING PLANS (Rejalar) ────────────────────────────

  @Post('plans')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr_manager', 'hr')
  @ApiOperation({ summary: 'Onboarding reja yaratish ("Путь сотрудника")' })
  async createPlan(@Body() dto: CreateOnboardingPlanDto, @CurrentUser() user: AuthenticatedUser) {
    return unwrapOrInternal(await this.onboardingService.createPlan(dto, user.id));
  }

  @Post('plans/default-hr-manager')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr_manager')
  @ApiOperation({ summary: 'HR CAPITAL standart 6 haftalik HR Manager onboarding rejasini yaratish' })
  async createDefaultHrManagerPlan(@CurrentUser() user: AuthenticatedUser) {
    return unwrapOrInternal(await this.onboardingService.createDefaultHrManagerPlan(user.id));
  }

  @Get('plans')
  @ApiOperation({ summary: 'Onboarding rejalar ro\'yxati' })
  @ApiQuery({ name: 'positionId', required: false, type: Number })
  @ApiQuery({ name: 'departmentId', required: false, type: Number })
  async listPlans(
    @Query('positionId') positionId?: string,
    @Query('departmentId') departmentId?: string,
  ) {
    return unwrapOrInternal(await this.onboardingService.listPlans(
      positionId ? +positionId : undefined,
      departmentId ? +departmentId : undefined,
    ));
  }

  @Get('plans/:id')
  @ApiOperation({ summary: 'Onboarding reja tafsilotlari' })
  async getPlan(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrInternal(await this.onboardingService.getPlanById(id));
  }

  // ──────────────── EMPLOYEE ONBOARDINGS (Xodim kuzatuvi) ─────────────────

  @Post('start')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr_manager', 'hr')
  @ApiOperation({ summary: 'Xodim uchun onboarding boshlash' })
  async startOnboarding(@Body() dto: StartEmployeeOnboardingDto, @CurrentUser() user: AuthenticatedUser) {
    return unwrapOrInternal(await this.onboardingService.startOnboarding(dto, user.id));
  }

  @Patch(':id/progress')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr_manager', 'hr')
  @ApiOperation({ summary: 'Haftalik progress yangilash (1-6 hafta)' })
  async updateProgress(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOnboardingProgressDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return unwrapOrInternal(await this.onboardingService.updateProgress(id, dto, user.id));
  }

  @Patch(':id/complete-probation')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr_manager')
  @ApiOperation({ summary: 'Probation davrini yakunlash (90-kun bahosi)' })
  async completeProbation(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CompleteProbationDto,
  ) {
    return unwrapOrInternal(await this.onboardingService.completeProbation(id, dto));
  }

  @Get('employee/:employeeId')
  @ApiOperation({ summary: 'Xodimning onboarding jarayoni' })
  async getEmployeeOnboarding(@Param('employeeId', ParseIntPipe) employeeId: number) {
    return unwrapOrInternal(await this.onboardingService.getEmployeeOnboarding(employeeId));
  }

  // ──────────────── JOB DESCRIPTIONS (Lavozim tavsifi) ────────────────────

  @Post('job-descriptions')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr_manager')
  @ApiOperation({ summary: 'Lavozim tavsifi yaratish (HR CAPITAL Session 5)' })
  async createJobDescription(@Body() dto: CreateJobDescriptionDto, @CurrentUser() user: AuthenticatedUser) {
    return unwrapOrInternal(await this.onboardingService.createJobDescription(dto, user.id));
  }

  @Get('job-descriptions')
  @ApiOperation({ summary: 'Lavozim tavsiflar ro\'yxati (joriy versiyalar)' })
  @ApiQuery({ name: 'positionId', required: false, type: Number })
  async listJobDescriptions(@Query('positionId') positionId?: string) {
    return unwrapOrInternal(await this.onboardingService.listJobDescriptions(positionId ? +positionId : undefined));
  }

  @Patch('job-descriptions/:id/approve')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr_manager', 'director')
  @ApiOperation({ summary: 'Lavozim tavsifini tasdiqlash' })
  async approveJobDescription(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return unwrapOrInternal(await this.onboardingService.approveJobDescription(id, user.id));
  }

  // ──────────────── MOTIVATION PLANS (Motivatsiya rejalari) ───────────────

  @Post('motivation/:employeeId')
  @UsePipes(new ZodValidationPipe(OnboardingCreateMotivationSchema))
  @Roles('admin', 'hr_manager', 'hr')
  @ApiOperation({ summary: 'Xodim motivatsiya rejasi yaratish (HR CAPITAL Session 2: Tone Scale)' })
  async createMotivationPlan(
    @Param('employeeId', ParseIntPipe) employeeId: number,
    @Body() data: OnboardingCreateMotivationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return unwrapOrInternal(await this.onboardingService.createMotivationPlan(employeeId, data, user.id));
  }

  @Get('motivation/:employeeId')
  @ApiOperation({ summary: 'Xodimning joriy motivatsiya rejasi' })
  async getMotivationPlan(@Param('employeeId', ParseIntPipe) employeeId: number) {
    return unwrapOrInternal(await this.onboardingService.getEmployeeMotivationPlan(employeeId));
  }

  // ──────────────── BUDDY ASSIGNMENT (Buddy / mentor) ─────────────────────

  @Patch(':id/buddy')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr_manager', 'hr')
  @ApiOperation({ summary: 'Onboarding ga buddy / mentor biriktirish' })
  @ApiParam({ name: 'id', type: Number })
  async assignBuddy(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { buddyId: number },
  ) {
    const buddyId = Number(body?.buddyId);
    return unwrapOrInternal(await this.onboardingService.assignBuddy(id, buddyId));
  }

  // ──────────────── DASHBOARD STATS ───────────────────────────────────────

  @Get('dashboard/stats')
  @ApiOperation({ summary: 'Onboarding dashboard statistikasi (active / completed / atRisk / overdue)' })
  async dashboardStats() {
    return unwrapOrInternal(await this.onboardingService.getDashboardStats());
  }
}
