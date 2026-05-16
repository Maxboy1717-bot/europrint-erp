/**
 * @module hr-offboarding.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import {
Controller, Patch, Post, Body, Param, ParseIntPipe,
  UseGuards, UseInterceptors, UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { HrOffboardingService } from './hr-offboarding.service';
import {
  HrOffboardingUpdateChecklistSchema, HrOffboardingUpdateChecklistDto,
  HrOffboardingExitInterviewSchema, HrOffboardingExitInterviewDto,
  HrOffboardingFinalizeSchema, HrOffboardingFinalizeDto,
} from './dto/hr-offboarding.dto';

const HR_ROLES = ['SUPER_ADMIN', 'DIRECTOR', 'HR_MANAGER', 'HR_SPECIALIST', 'admin'] as const;

@ApiThrottle()
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...HR_ROLES)
@ApiTags('Hr Offboarding')
@ApiBearerAuth()
@Controller('hr/offboarding')
export class HrOffboardingController {
  constructor(private readonly svc: HrOffboardingService) {}

  @ApiOperation({ summary: 'Update checklist item' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Patch('cases/:id/checklist/:itemId')
  @UsePipes(new ZodValidationPipe(HrOffboardingUpdateChecklistSchema))
  async updateChecklistItem(
    @Param('id', ParseIntPipe) id: number,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() body: HrOffboardingUpdateChecklistDto,
  ) {
    const done = body.completed === true;
    const r = await this.svc.updateChecklistItem(id, itemId, done);
    const row = r.ok ? (r.data ?? {}) : {};
    return { data: row };
  }

  @ApiOperation({ summary: 'Record exit interview' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('cases/:id/exit-interview')
  @UsePipes(new ZodValidationPipe(HrOffboardingExitInterviewSchema))
  async recordExitInterview(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: HrOffboardingExitInterviewDto,
  ) {
    const notes = String(body.main_reason ?? body.feedback ?? '');
    const r = await this.svc.recordExitInterview(id, notes);
    const row = r.ok ? (r.data ?? {}) : {};
    return { data: row };
  }

  @ApiOperation({ summary: 'Finalize case' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('cases/:id/finalize')
  @UsePipes(new ZodValidationPipe(HrOffboardingFinalizeSchema))
  async finalizeCase(
    @Param('id', ParseIntPipe) id: number,
    @Body() _body: HrOffboardingFinalizeDto,
  ) {
    const r = await this.svc.finalizeCase(id);
    const row = r.ok ? (r.data ?? {}) : {};
    return { data: row };
  }
}
