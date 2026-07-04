/**
 * @module hr-vacancies-probation.controller
 * @description Probation-period endpoints split from hr-vacancies-pipeline.controller.ts (Rule 16).
 * Mounted under the same /hr/recruitment prefix.
 */

import {
  Controller, Get, Post, Patch, Body, Param, ParseIntPipe,
  UseGuards, UseInterceptors, Logger, UsePipes, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@common/types/user.types';
import { HrVacanciesService } from './hr-vacancies.service';
import { HrProbationReviewSchema, HrProbationReviewDto } from './dto/hr-vacancies.dto';
import { z } from 'zod';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';

const ProbationDatesSchema = z.object({
  start_date: z.string().optional(),
  end_date: z.string().optional(),
}).passthrough();

const ProbationJournalEntrySchema = z.object({
  note: z.string().max(2000).optional(),
  date: z.string().optional(),
}).passthrough();

const HR_ROLES = ['SUPER_ADMIN', 'DIRECTOR', 'HR_MANAGER', 'HR_SPECIALIST', 'hr_manager', 'hr_recruiter', 'hr', 'admin'] as const;

@ApiThrottle()
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...HR_ROLES)
@ApiTags('Hr Vacancies Probation')
@ApiBearerAuth()
@Controller('hr/recruitment')
export class HrVacanciesProbationController {
  private readonly logger = new Logger(HrVacanciesProbationController.name);

  constructor(private readonly svc: HrVacanciesService) {}

  @ApiOperation({ summary: 'Get probation journal' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('pipeline/:id/probation-journal')
  async getProbationJournal(@Param('id', ParseIntPipe) id: number) {
    const r = await this.svc.findProbationJournal(id);
    const entries = r.ok && Array.isArray(r.data) ? r.data : [];
    return { data: { pipeline_id: id, entries, total: entries.length } };
  }

  @ApiOperation({ summary: 'Get probation dates' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('pipeline/:id/probation-dates')
  async getProbationDates(@Param('id', ParseIntPipe) id: number) {
    const r = await this.svc.findProbationDates(id);
    const dates = r.ok ? (r.data ?? {}) : {};
    const dRec = dates as Record<string, unknown>;
    return { data: { pipeline_id: id, start_date: dRec['created_at'] ?? null, end_date: dRec['hired_at'] ?? null, ...dates } };
  }

  @ApiOperation({ summary: 'Submit probation review' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('pipeline/:id/probation-review')
  @UsePipes(new ZodValidationPipe(HrProbationReviewSchema))
  async submitProbationReview(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: HrProbationReviewDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const rating = body.rating ?? null;
    const notes = `probation_review rating=${rating}`;
    await this.svc.recordFunnelHistory(String(id), 'probation_reviewed', String(user.id), notes);
    return { data: { pipeline_id: id, reviewed_by: user.id, rating } };
  }

  @ApiOperation({ summary: 'Patch probation dates' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch('pipeline/:id/probation-dates')
  async patchProbationDates(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    const dto = ProbationDatesSchema.parse(body);
    // Persist probation dates to hr_vacancy_profiles using pipeline→vacancy lookup via hr_candidate_funnels.
    // pipeline_id = hr_candidate_funnels.id which has vacancy_id FK.
    await db.execute(sql`
      UPDATE hr_vacancy_profiles hvp
      SET probation_start = COALESCE(${dto.start_date ?? null}::date, hvp.probation_start),
          probation_end   = COALESCE(${dto.end_date   ?? null}::date, hvp.probation_end),
          updated_at      = NOW()
      FROM hr_candidate_funnels hcf
      WHERE hcf.id = ${id}
        AND hvp.vacancy_id = hcf.vacancy_id
    `);
    return { data: { pipeline_id: id, ...dto, updated: true } };
  }

  @ApiOperation({ summary: 'Create probation journal entry' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('pipeline/:id/probation-journal')
  @HttpCode(HttpStatus.CREATED)
  async createProbationJournalEntry(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const dto = ProbationJournalEntrySchema.parse(body);
    await this.svc.recordFunnelHistory(String(id), 'probation_journal_entry', String(user.id), String(dto.note ?? ''));
    return { data: { pipeline_id: id, created_by: user.id, ...dto } };
  }

  @ApiOperation({ summary: 'Get probation review' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('pipeline/:id/probation-review')
  async getProbationReview(@Param('id', ParseIntPipe) id: number) {
    // Q13 fix: was hardcoded { review: null } — reviews submitted via
    // POST .../probation-review (recorded as hr_funnel_history stage=
    // 'probation_reviewed') were never read back. FE (ProbationReviewBadges,
    // ProbationReviewDialog) expects { data: ProbationReview[] }.
    const r = await this.svc.findProbationReviews(id);
    const data = r.ok && Array.isArray(r.data) ? r.data : [];
    return { data };
  }
}
