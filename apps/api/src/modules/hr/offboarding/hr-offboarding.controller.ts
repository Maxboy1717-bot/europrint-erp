import {
Controller, Get, Patch, Post, Body, Param, Query, ParseIntPipe,
  UseGuards, UseInterceptors, UsePipes, NotFoundException,
} from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { Throttle } from '@nestjs/throttler';
import { HrOffboardingService } from './hr-offboarding.service';
import {
  HrOffboardingUpdateChecklistSchema, HrOffboardingUpdateChecklistDto,
  HrOffboardingExitInterviewSchema, HrOffboardingExitInterviewDto,
  HrOffboardingFinalizeSchema, HrOffboardingFinalizeDto,
} from './dto/hr-offboarding.dto';
import { unwrapOrInternal } from '@common/http-result';

const HR_ROLES = ['SUPER_ADMIN', 'DIRECTOR', 'HR_MANAGER', 'HR_SPECIALIST', 'admin'] as const;

const CreateCaseSchema = z.object({
  employeeId: z.number().int().positive(),
  initiatedBy: z.number().int().optional(),
  dismissalType: z.string().optional(),
  lastWorkingDay: z.string().nullable().optional(),
  totalItems: z.number().int().positive().optional(),
});

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...HR_ROLES)
@Controller('hr/offboarding')
export class HrOffboardingController {
  constructor(private readonly svc: HrOffboardingService) {}

  /**
   * `HROffboarding.tsx:588` calls
   *   GET /api/hr/offboarding/cases?status=&search=
   * Returns `[{...case}]`. Frontend uses `Array.isArray` defensively.
   */
  @Get('cases')
  async listCases(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
  ) {
    return unwrapOrInternal(
      await this.svc.listCases({
        status,
        search,
        limit: limit ? parseInt(limit, 10) : 100,
      }),
    );
  }

  /** `HROffboarding.tsx:583` — `GET /api/hr/offboarding/cases/stats` */
  @Get('cases/stats')
  async getStats() {
    return unwrapOrInternal(await this.svc.getStats());
  }

  /** `HROffboarding.tsx:111-112` — `GET /api/hr/offboarding/cases/:id` */
  @Get('cases/:id')
  async getCase(@Param('id', ParseIntPipe) id: number) {
    const r = await this.svc.getCaseById(id);
    const data = unwrapOrInternal(r);
    if (!data) throw new NotFoundException(`Offboarding case #${id} not found`);
    return data;
  }

  /** `HROffboarding.tsx:486-498` — `POST /api/hr/offboarding/cases` */
  @Post('cases')
  @UsePipes(new ZodValidationPipe(CreateCaseSchema))
  async createCase(@Body() body: z.infer<typeof CreateCaseSchema>) {
    return unwrapOrInternal(
      await this.svc.createCase({
        employeeId: body.employeeId,
        initiatedBy: body.initiatedBy,
        dismissalType: body.dismissalType,
        lastWorkingDay: body.lastWorkingDay ?? undefined,
        totalItems: body.totalItems,
      }),
    );
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
    const row = r.ok ? (r.data ?? {}) : {};
    return { data: row };
  }

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
