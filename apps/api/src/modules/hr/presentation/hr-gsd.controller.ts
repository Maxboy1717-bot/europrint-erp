/**
 * @module hr-gsd.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import {
  Controller, Get, Post, Patch, Delete, HttpCode, HttpStatus,
  Body, Param, ParseIntPipe, Query,
  UseGuards, UseInterceptors, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { I18nService } from 'nestjs-i18n';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { z } from 'zod';
import { HrGsdService } from './hr-gsd.service';

const UpdateGsdEmployeeSchema = z.object({
  positionId: z.union([z.string(), z.number()]).optional(),
  departmentId: z.union([z.string(), z.number()]).optional(),
  status: z.string().max(50).optional(),
  notes: z.string().max(2000).optional(),
}).passthrough();

// SB0300 fix: GsdGraph.tsx's weekly-actual submission ({ week_date, actual, note })
// POSTs to this same /gsd/employees/:id route (not a distinct sub-path) — it was
// previously silently rejected (NO_FIELDS_TO_UPDATE) because none of positionId/
// departmentId/status/notes were present in that payload. Discriminated below.
const RecordGsdActualSchema = z.object({
  week_date: z.string().min(1),
  actual: z.number(),
  note: z.string().max(2000).optional(),
});

// 2026-07-13 fix: FE (ReferralPage.tsx) sends `referrer_id` (snake_case) while this
// schema only recognized `referrerId` (camelCase) — every referral submitted from
// the real UI silently lost its referrer, which then hit the `referrer_id` FK
// (-> employees(id)) with a fabricated fallback (see hr-gsd.repository.ts
// createReferral() 2026-07-13 fix note) and failed. Same for candidate name/
// email/phone/position — FE sends snake_case field names throughout. Both
// casings are now accepted (contract fix, not a FE rewrite — Q-18 FE-BE URL/
// payload contract).
const CreateReferralSchema = z.object({
  referrerId:           z.union([z.string(), z.number()]).optional(),
  referrer_id:          z.union([z.string(), z.number()]).optional(),
  candidateName:        z.string().max(200).optional(),
  candidate_full_name:  z.string().max(200).optional(),
  email:                z.string().email().optional(),
  candidate_email:      z.string().email().optional().or(z.literal('')),
  phone:                z.string().max(50).optional(),
  candidate_phone:      z.string().max(50).optional(),
  positionTitle:        z.string().max(200).optional(),
  position_title:       z.string().max(200).optional(),
  hrNotes:              z.string().max(2000).optional(),
  hr_notes:             z.string().max(2000).optional(),
  candidateId:          z.union([z.string(), z.number()]).optional(),
  candidate_id:         z.union([z.string(), z.number()]).optional(),
}).passthrough().transform((d) => ({
  referrerId:    d.referrerId    ?? d.referrer_id,
  candidateName: d.candidateName ?? d.candidate_full_name,
  email:         d.email         ?? (d.candidate_email || undefined),
  phone:         d.phone         ?? d.candidate_phone,
  positionTitle: d.positionTitle ?? d.position_title,
  hrNotes:       d.hrNotes       ?? d.hr_notes,
  candidateId:   d.candidateId   ?? d.candidate_id,
}));

const HR_ROLES = ['SUPER_ADMIN', 'DIRECTOR', 'HR_MANAGER', 'HR_SPECIALIST', 'admin'] as const;

@ApiThrottle()
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...HR_ROLES)
@ApiTags('Hr Gsd')
@ApiBearerAuth()
@Controller('hr')
export class HrGsdController {
  constructor(
    private readonly svc: HrGsdService,
    private readonly i18n: I18nService,
  ) {}

  @ApiOperation({ summary: 'Get gsd employee' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('gsd/employees/:id')
  async getGsdEmployee(@Param('id', ParseIntPipe) id: number) {
    const r = await this.svc.getEmployee(id);
    const data = r.ok && r.data ? r.data : {};
    return { data };
  }

  @ApiOperation({ summary: 'Get gsd employee history' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('gsd/employees/:id/history')
  async getGsdEmployeeHistory(@Param('id', ParseIntPipe) id: number) {
    const r = await this.svc.getEmployeeHistory(id);
    const items = r.ok && Array.isArray(r.data) ? r.data : [];
    return { items, total: items.length };
  }

  // SB0300 fix: GsdGraph.tsx (component) reads THIS route (card-GSD weekly
  // definition + fact history), distinct from the payroll-period history above.
  // Was previously unserved by any card-aware query — the repo had no card_id
  // read path at all (audit evidence: "no card_id/INSERT write path confirmed").
  @ApiOperation({ summary: 'Get card GSD weekly definition + fact history' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('gsd/employees/:id/gsd-history')
  async getCardGsdHistory(
    @Param('id', ParseIntPipe) id: number,
    @Query('months') monthsRaw?: string,
  ) {
    const months = Math.min(24, Math.max(1, Number(monthsRaw) || 12));
    const [defRes, histRes] = await Promise.all([
      this.svc.getGsdDefinition(id),
      this.svc.getGsdFactHistory(id, months),
    ]);
    const definition = defRes.ok ? defRes.data : null;
    const history = histRes.ok && Array.isArray(histRes.data) ? histRes.data : [];
    const last = history[0] as { actual?: number; target?: number; variance?: number } | undefined;
    const prev = history[1] as { actual?: number } | undefined;
    const actualValues = history
      .map(h => Number((h as { actual?: number }).actual))
      .filter(v => Number.isFinite(v));
    const avgActual = actualValues.length > 0
      ? Math.round((actualValues.reduce((s, v) => s + v, 0) / actualValues.length) * 100) / 100
      : null;
    return {
      definition,
      history,
      stats: {
        lastWeekActual:   last?.actual ?? null,
        lastWeekTarget:   last?.target ?? null,
        lastWeekVariance: last?.variance ?? null,
        prevWeekActual:   prev?.actual ?? null,
        avgActual,
        totalWeeks: history.length,
      },
    };
  }

  @ApiOperation({ summary: 'Get referrals' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('referrals')
  async getReferrals() {
    const r = await this.svc.getReferrals();
    const referrals = r.ok && Array.isArray(r.data) ? r.data : [];
    // ReferralPage.tsx / StatsGrid expects { referrals, stats } envelope.
    // 2026-07-13 fix: was `{ total: referrals.length }` only — StatsGrid also
    // reads stats.hired / stats.pending / stats.bonus_paid_count, which were
    // always 0 regardless of real data (dead stat cards).
    const stats = {
      total: referrals.length,
      hired: referrals.filter(x => (x as { status?: string }).status === 'hired').length,
      pending: referrals.filter(x => (x as { status?: string }).status === 'pending').length,
      bonus_paid_count: referrals.filter(x => (x as { bonus_paid?: boolean }).bonus_paid === true).length,
    };
    return { referrals, stats };
  }

  @ApiOperation({ summary: 'Get boomerang referrals' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('referrals/boomerang')
  // 2026-07-13 fix: FE (ReferralPage.tsx) reads `boomerang?.alumni` but this
  // endpoint only ever returned `{ items, total }` — the boomerang tab was
  // always empty regardless of DB content (key-name drift). `alumni` added
  // alongside `items` (back-compat) rather than renamed.
  async getBoomerangReferrals() {
    const r = await this.svc.getBoomerangs();
    const items = r.ok && Array.isArray(r.data) ? r.data : [];
    return { items, alumni: items, total: items.length };
  }

  // NOTE: GET /hr/skills, GET /hr/skills/:id, POST /hr/skills, PATCH /hr/skills/:id,
  // DELETE /hr/skills/:id — moved to HrCompatAController (real DB implementation).
  // Stub declarations removed to avoid Fastify duplicate-route collision.

  @ApiOperation({ summary: 'Get milestone complete' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('milestones/:id/complete')
  async getMilestoneComplete(@Param('id', ParseIntPipe) id: number) {
    const r = await this.svc.getMilestone(id);
    const data = r.ok && r.data ? r.data : {};
    return { data };
  }

  @ApiOperation({ summary: 'Complete milestone' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Post('milestones/:id/complete')
  async completeMilestone(@Param('id', ParseIntPipe) id: number) {
    const r = await this.svc.completeMilestone(id);
    const data = r.ok && r.data ? r.data : {};
    return { data };
  }

  @ApiOperation({ summary: 'Patch milestone complete' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch('milestones/:id/complete')
  async patchMilestoneComplete(@Param('id', ParseIntPipe) id: number) {
    const r = await this.svc.completeMilestone(id);
    const data = r.ok && r.data ? r.data : {};
    return { data };
  }

  @ApiOperation({ summary: 'Update gsd employee' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Post('gsd/employees/:id')
  // Q9: was validate-only stub (no DB write) — now real UPDATE via HrGsdService/Repository.
  // SB0300 fix: this route is shared with GsdGraph.tsx's weekly-actual submission
  // ({ week_date, actual, note }) — detect that shape first and delegate to the
  // real ckp_fact_values write (recordGsdActual), otherwise fall through to the
  // position/department/status editor below (unchanged behaviour).
  async updateGsdEmployee(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    const gsdActualParse = RecordGsdActualSchema.safeParse(body);
    if (gsdActualParse.success) {
      const r = await this.svc.recordGsdActual(id, {
        weekDate: gsdActualParse.data.week_date,
        actual:   gsdActualParse.data.actual,
        note:     gsdActualParse.data.note,
      });
      if (!r.ok) {
        const err = (r as { ok: false; error: { code?: string; message?: string } }).error;
        if (err?.message === 'EMPLOYEE_HAS_NO_CARD') {
          throw new BadRequestException(await this.i18n.t('errors.employeeHasNoAssignedCard'));
        }
        throw new BadRequestException(err?.message ?? 'Xatolik');
      }
      return { data: { id, updated: true, ...r.data } };
    }

    const dto = UpdateGsdEmployeeSchema.parse(body ?? {});
    const r = await this.svc.updateEmployee(id, {
      positionId:   dto.positionId,
      departmentId: dto.departmentId,
      status:       dto.status,
      notes:        dto.notes,
    });
    if (!r.ok) {
      const err = (r as { ok: false; error: { code?: string; message?: string } }).error;
      if (err?.message === 'NOT_FOUND') throw new NotFoundException(await this.i18n.t('errors.employeeNotFound'));
      throw new BadRequestException(err?.message ?? 'Xatolik');
    }
    return { data: { id, updated: true, ...r.data } };
  }

  @ApiOperation({ summary: 'Create referral' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('referrals')
  // P1.26.1: real insert into hr_referrals (was a stub)
  async createReferral(@Body() body: unknown) {
    const dto = CreateReferralSchema.parse(body);
    const r = await this.svc.createReferral({
      referrerId:    dto.referrerId,
      candidateName: dto.candidateName,
      candidateEmail: dto.email,
      candidatePhone: dto.phone,
      positionTitle: dto.positionTitle,
      hrNotes:       dto.hrNotes,
      candidateId:   dto.candidateId != null ? Number(dto.candidateId) : null,
    });
    if (!r.ok) {
      const err = (r as { ok: false; error: { code?: string; message?: string } | string }).error;
      const msg = typeof err === 'string' ? err : (err?.message ?? err?.code ?? 'Xatolik');
      if (msg === 'REFERRER_ID_REQUIRED') {
        throw new BadRequestException(await this.i18n.t('errors.referrerIdRequired'));
      }
      throw new BadRequestException(msg);
    }
    return { data: r.data };
  }

  // P1.26.1: update referral status/bonus (HR_MANAGER only)
  // 2026-07-13 fix: enum was `['submitted','reviewing','hired','rejected','pending']`
  // but the LIVE `hr_referrals_status_check` CHECK constraint only allows
  // `pending|contacted|interviewing|hired|rejected|bonus_paid` — 'submitted' and
  // 'reviewing' always violated the constraint and the PATCH failed (Q-40:
  // "ishlaydi" endpoint that was never actually reachable for those 2 values).
  // + optional candidateId/hiredEmployeeId manual-link fields (Referral Tizimi
  // completion item #3 — links to the real recruiting-pipeline candidate row and,
  // once hired, to the real employees row used by the probation-bonus listener).
  @ApiOperation({ summary: 'Update referral' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Roles('HR_MANAGER', 'SUPER_ADMIN', 'DIRECTOR')
  @Patch('referrals/:id')
  async updateReferral(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    const UpdateReferralSchema = z.object({
      status:          z.enum(['pending', 'contacted', 'interviewing', 'hired', 'rejected', 'bonus_paid']).optional(),
      bonusAmount:     z.number().min(0).optional(),
      bonusPaid:       z.boolean().optional(),
      hrNotes:         z.string().max(2000).optional(),
      candidateId:     z.union([z.string(), z.number()]).nullish(),
      hiredEmployeeId: z.union([z.string(), z.number()]).nullish(),
    }).passthrough();
    const dto = UpdateReferralSchema.parse(body ?? {});
    const r = await this.svc.updateReferral(id, {
      status:          dto.status,
      bonusAmount:     dto.bonusAmount,
      bonusPaid:       dto.bonusPaid,
      hrNotes:         dto.hrNotes,
      candidateId:     dto.candidateId     != null ? Number(dto.candidateId)     : undefined,
      hiredEmployeeId: dto.hiredEmployeeId != null ? Number(dto.hiredEmployeeId) : undefined,
    });
    if (!r.ok) {
      const err = (r as { ok: false; error: { code?: string; message?: string } | string }).error;
      const msg = typeof err === 'string' ? err : (err?.message ?? err?.code ?? 'Xatolik');
      if (msg === 'NOT_FOUND') throw new NotFoundException(await this.i18n.t('errors.referralNotFound'));
      throw new BadRequestException(msg);
    }
    return { data: r.data };
  }

  // ── P1.15.1: hr_mentorship_pairings CRUD ─────────────────────────────────────

  @ApiOperation({ summary: 'List mentorship pairings' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('mentorship-pairings')
  async getMentorshipPairings(
    @Query('mentorId') mentorId?: string,
    @Query('status')   status?: string,
  ) {
    const id = mentorId ? Number(mentorId) : undefined;
    const r = await this.svc.getMentorshipPairings(id, status);
    const items = r.ok && Array.isArray(r.data) ? r.data : [];
    return { items, total: items.length };
  }

  @ApiOperation({ summary: 'Create mentorship pairing' })
  @ApiResponse({ status: 201, description: 'Created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @HttpCode(HttpStatus.CREATED)
  @Post('mentorship-pairings')
  async createMentorshipPairing(@Body() body: unknown) {
    const CreatePairingSchema = z.object({
      mentorId: z.number().int().positive(),
      menteeId: z.number().int().positive(),
      courseId: z.number().int().positive().optional(),
      notes:    z.string().max(2000).optional(),
    });
    const dto = CreatePairingSchema.parse(body);
    const r = await this.svc.createMentorshipPairing(dto);
    const data = r.ok ? r.data : { error: (r as { ok: false; error: unknown }).error };
    return { data };
  }

  @ApiOperation({ summary: 'Update mentorship pairing' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch('mentorship-pairings/:id')
  async updateMentorshipPairing(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    const UpdatePairingSchema = z.object({
      status:    z.enum(['pending', 'active', 'completed', 'cancelled']).optional(),
      notes:     z.string().max(2000).optional(),
      completed: z.boolean().optional(),
    }).passthrough();
    const dto = UpdatePairingSchema.parse(body ?? {});
    const r = await this.svc.updateMentorshipPairing(id, {
      status:      dto.status,
      notes:       dto.notes,
      completedAt: dto.completed ? new Date() : undefined,
    });
    const data = r.ok ? r.data : { error: (r as { ok: false; error: unknown }).error };
    return { data };
  }

  // NOTE: DELETE /api/hr/employee-skills/:id is served by HrCompatAController —
  // duplicate declaration removed here (Fastify boot collision).
}
