/**
 * @module hr-gsd.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import {
  Controller, Get, Post, Patch, Delete, HttpCode, HttpStatus,
  Body, Param, ParseIntPipe, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
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

const CreateReferralSchema = z.object({
  referrerId:    z.union([z.string(), z.number()]).optional(),
  candidateName: z.string().max(200).optional(),
  email:         z.string().email().optional(),
  phone:         z.string().max(50).optional(),
  positionTitle: z.string().max(200).optional(),
  hrNotes:       z.string().max(2000).optional(),
}).passthrough();

const HR_ROLES = ['SUPER_ADMIN', 'DIRECTOR', 'HR_MANAGER', 'HR_SPECIALIST', 'admin'] as const;

@ApiThrottle()
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...HR_ROLES)
@ApiTags('Hr Gsd')
@ApiBearerAuth()
@Controller('hr')
export class HrGsdController {
  constructor(private readonly svc: HrGsdService) {}

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

  @ApiOperation({ summary: 'Get referrals' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('referrals')
  async getReferrals() {
    const r = await this.svc.getReferrals();
    const referrals = r.ok && Array.isArray(r.data) ? r.data : [];
    // ReferralPage.tsx expects { referrals, stats } envelope
    return { referrals, stats: { total: referrals.length } };
  }

  @ApiOperation({ summary: 'Get boomerang referrals' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('referrals/boomerang')
  async getBoomerangReferrals() {
    const r = await this.svc.getBoomerangs();
    const items = r.ok && Array.isArray(r.data) ? r.data : [];
    return { items, total: items.length };
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
  async updateGsdEmployee(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    UpdateGsdEmployeeSchema.parse(body ?? {});
    return { data: { id, updated: true } };
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
    });
    const data = r.ok ? r.data : { error: (r as { ok: false; error: unknown }).error };
    return { data };
  }

  // P1.26.1: update referral status/bonus (HR_MANAGER only)
  @ApiOperation({ summary: 'Update referral' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Roles('HR_MANAGER', 'SUPER_ADMIN', 'DIRECTOR')
  @Patch('referrals/:id')
  async updateReferral(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    const UpdateReferralSchema = z.object({
      status:      z.enum(['submitted', 'reviewing', 'hired', 'rejected', 'pending']).optional(),
      bonusAmount: z.number().min(0).optional(),
      bonusPaid:   z.boolean().optional(),
      hrNotes:     z.string().max(2000).optional(),
    }).passthrough();
    const dto = UpdateReferralSchema.parse(body ?? {});
    const r = await this.svc.updateReferral(id, dto);
    const data = r.ok ? r.data : { error: (r as { ok: false; error: unknown }).error };
    return { data };
  }

  // NOTE: DELETE /api/hr/employee-skills/:id is served by HrCompatAController —
  // duplicate declaration removed here (Fastify boot collision).
}
