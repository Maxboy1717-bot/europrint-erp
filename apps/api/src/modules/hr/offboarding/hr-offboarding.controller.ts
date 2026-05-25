import {
  Controller, Get, Patch, Post, Body, Param, Query, ParseIntPipe,
  UseGuards, UseInterceptors, UsePipes, NotFoundException,
} from '@nestjs/common';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@common/types/user.types';
import { unwrapOrInternal } from '@common/http-result';
import { HrOffboardingService } from './hr-offboarding.service';
import {
  HrOffboardingCreateSchema, HrOffboardingCreateDto,
  HrOffboardingUpdateChecklistSchema, HrOffboardingUpdateChecklistDto,
  HrOffboardingExitInterviewSchema, HrOffboardingExitInterviewDto,
  HrOffboardingFinalizeSchema, HrOffboardingFinalizeDto,
  HrOffboardingCancelSchema, HrOffboardingCancelDto,
  HrOffboardingListQuerySchema, HrOffboardingListQueryDto,
} from './dto/hr-offboarding.dto';

const HR_ROLES = ['SUPER_ADMIN', 'DIRECTOR', 'HR_MANAGER', 'HR_SPECIALIST', 'admin'] as const;

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...HR_ROLES)
@Controller('hr/offboarding')
export class HrOffboardingController {
  constructor(private readonly svc: HrOffboardingService) {}

  @Get('cases')
  @UsePipes(new ZodValidationPipe(HrOffboardingListQuerySchema))
  async listCases(@Query() q: HrOffboardingListQueryDto) {
    const r = await this.svc.listCases({ status: q.status, employeeId: q.employee_id });
    return { data: unwrapOrInternal(r) };
  }

  @Get('stats')
  async getStats() {
    const r = await this.svc.getStats();
    return { data: unwrapOrInternal(r) };
  }

  @Get('cases/:id')
  async getCase(@Param('id', ParseIntPipe) id: number) {
    const r = await this.svc.getCaseDetail(id);
    const data = unwrapOrInternal(r);
    if (data === null) throw new NotFoundException(`Offboarding case #${id} topilmadi`);
    return { data };
  }

  @Post('cases')
  @UsePipes(new ZodValidationPipe(HrOffboardingCreateSchema))
  async createCase(
    @Body() body: HrOffboardingCreateDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const r = await this.svc.createCase({
      employeeId:     body.employee_id,
      dismissalType:  body.dismissal_type,
      lastWorkingDay: body.last_working_day,
      initiatedBy:    user?.id,
    });
    return { data: unwrapOrInternal(r) };
  }

  @Patch('cases/:id/checklist/:itemId')
  @UsePipes(new ZodValidationPipe(HrOffboardingUpdateChecklistSchema))
  async updateChecklistItem(
    @Param('id', ParseIntPipe) id: number,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() body: HrOffboardingUpdateChecklistDto,
  ) {
    const done = body.completed === true;
    const r = await this.svc.updateChecklistItem(id, itemId, done);
    return { data: unwrapOrInternal(r) };
  }

  @Post('cases/:id/exit-interview')
  @UsePipes(new ZodValidationPipe(HrOffboardingExitInterviewSchema))
  async recordExitInterview(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: HrOffboardingExitInterviewDto,
  ) {
    const r = await this.svc.recordExitInterview(id, {
      rating:       body.rating,
      wouldReturn:  body.would_return,
      mainReason:   body.main_reason,
      feedback:     body.feedback,
      improvements: body.improvements,
    });
    return { data: unwrapOrInternal(r) };
  }

  @Post('cases/:id/finalize')
  @UsePipes(new ZodValidationPipe(HrOffboardingFinalizeSchema))
  async finalizeCase(
    @Param('id', ParseIntPipe) id: number,
    @Body() _body: HrOffboardingFinalizeDto,
  ) {
    const r = await this.svc.finalizeCase(id);
    return { data: unwrapOrInternal(r) };
  }

  @Post('cases/:id/cancel')
  @UsePipes(new ZodValidationPipe(HrOffboardingCancelSchema))
  async cancelCase(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: HrOffboardingCancelDto,
  ) {
    const r = await this.svc.cancelCase(id, body.reason);
    return { data: unwrapOrInternal(r) };
  }
}
