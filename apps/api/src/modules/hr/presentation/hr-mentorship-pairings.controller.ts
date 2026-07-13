/**
 * @module hr-mentorship-pairings.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 *
 * BUG FIXED (2026-07-13): the FE "Mentorlik" sidebar page (Mentorship.tsx) POSTs
 * `{ mentorId, menteeId, courseId, deadline, bonusPercentage, status, notes }` to
 * `/api/mentorships` expecting a mentor<->mentee PAIRING to be created. But
 * `/api/mentorships` is already owned by `MentorshipsCompatController`
 * (modules/compatibility/mentorships-compat.controller.ts), which is a REAL, LIVE
 * feature backing `MentorTab.tsx` (org-card "who is a registered mentor" directory,
 * `mentors` table: name/bio/expertise/card_id) — a completely different shape.
 * MentorshipsCompatService.createMentorship() requires `name` and throws
 * BadRequestException when absent, so every create from Mentorship.tsx (which never
 * sends `name`) hit a 400. Reusing/overloading the same route for two incompatible
 * payloads would have broken the working MentorTab.tsx flow (Q-46 — don't touch
 * working code) or required a fragile shape-sniffing dispatcher.
 *
 * Fix: a new, dedicated route for the actual pairing model, `hr/mentorships`,
 * backed by the `mentorships` table (schema-misc-app-b.ts) — which already has the
 * EXACT columns Mentorship.tsx needs (mentor_id, mentee_id, course_id, status,
 * deadline, bonus_percentage, notes, start_date, end_date, goals) and already has
 * read-only consumers (integration-employee.repo.ts findMentorshipsAsMentor/
 * -Mentee/findAllMentorships, under /api/integration/employee-mentorships*) but had
 * ZERO write path before this fix. Mentorship.tsx was repointed to call this new
 * route instead of the colliding /api/mentorships.
 *
 * NOT built here (flagged for owner — see hr-mentorship-pairings.service.ts header):
 * a formal accept/reject workflow with a "3-strikes" cap. The current FE only offers
 * a status dropdown (active/paused/completed) and delete; the `status` column has no
 * CHECK constraint so 'pending'/'accepted'/'rejected'/'ended' are accepted by the DB
 * today, but no FE surface exists to drive that flow yet — building it is a distinct,
 * larger vision item, not part of fixing the create-always-400 bug.
 */
import {
  Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, Query,
  HttpCode, HttpStatus, NotFoundException, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { z } from 'zod';
import { unwrapOrDefault, unwrapOrInternal } from '@common/http-result';
import { HrMentorshipPairingsService } from '../application/hr-mentorship-pairings.service';

const HR_ROLES = ['HR_MANAGER', 'HR_SPECIALIST', 'SUPER_ADMIN', 'DIRECTOR', 'ADMIN', 'MANAGER'] as const;

const IdLike = z.union([z.string(), z.number()]);

const CreateMentorshipPairingSchema = z.object({
  mentorId: IdLike,
  menteeId: IdLike,
  courseId: IdLike,
  deadline: z.string().min(1),
  bonusPercentage: z.number().min(0).max(100).optional(),
  status: z.string().max(30).optional(),
  notes: z.string().max(2000).optional(),
});

const UpdateMentorshipPairingSchema = z.object({
  status: z.string().max(30).optional(),
  deadline: z.string().min(1).optional(),
  bonusPercentage: z.number().min(0).max(100).optional(),
  notes: z.string().max(2000).optional(),
}).refine((v) => Object.keys(v).length > 0, { message: 'At least one field required' });

@ApiThrottle()
@ApiTags('HR Mentorship Pairings')
@ApiBearerAuth()
@Controller('hr/mentorships')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...HR_ROLES)
@UseInterceptors(AuditInterceptor)
export class HrMentorshipPairingsController {
  constructor(private readonly svc: HrMentorshipPairingsService) {}

  @ApiOperation({ summary: 'List mentor-mentee pairings' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get()
  async list(
    @Query('mentorId') mentorId?: string,
    @Query('menteeId') menteeId?: string,
    @Query('status') status?: string,
  ) {
    return unwrapOrDefault(await this.svc.list({ mentorId, menteeId, status }), []);
  }

  @ApiOperation({ summary: 'Create a mentor-mentee pairing' })
  @ApiResponse({ status: 201, description: 'Created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: unknown) {
    const dto = CreateMentorshipPairingSchema.parse(body);
    return unwrapOrInternal(await this.svc.create(dto));
  }

  @ApiOperation({ summary: 'Update a mentor-mentee pairing (status, deadline, bonus, notes)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    const dto = UpdateMentorshipPairingSchema.parse(body);
    const r = await this.svc.update(id, dto);
    if (!r.ok) throw new NotFoundException(r.error.message);
    return r.data;
  }

  @ApiOperation({ summary: 'Delete a mentor-mentee pairing' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseIntPipe) id: number) {
    const r = await this.svc.remove(id);
    if (!r.ok) throw new NotFoundException(r.error.message);
    return r.data;
  }
}
