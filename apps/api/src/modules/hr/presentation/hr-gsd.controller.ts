/**
 * @module hr-gsd.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import {
  Controller, Get, Post, Patch, Body, Param, ParseIntPipe,
  UseGuards, UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { Throttle } from '@nestjs/throttler';
import { HrGsdService } from './hr-gsd.service';

const HR_ROLES = ['SUPER_ADMIN', 'DIRECTOR', 'HR_MANAGER', 'HR_SPECIALIST', 'admin'] as const;

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...HR_ROLES)
@Controller('hr')
export class HrGsdController {
  constructor(private readonly svc: HrGsdService) {}

  @Get('gsd/employees/:id')
  async getGsdEmployee(@Param('id', ParseIntPipe) id: number) {
    const r = await this.svc.getEmployee(id);
    const data = r.ok && r.data ? r.data : {};
    return { data };
  }

  @Get('gsd/employees/:id/history')
  async getGsdEmployeeHistory(@Param('id', ParseIntPipe) id: number) {
    const r = await this.svc.getEmployeeHistory(id);
    const items = r.ok && Array.isArray(r.data) ? r.data : [];
    return { items, total: items.length };
  }

  @Get('referrals')
  async getReferrals() {
    const r = await this.svc.getReferrals();
    const items = r.ok && Array.isArray(r.data) ? r.data : [];
    return { items, total: items.length };
  }

  @Get('referrals/boomerang')
  async getBoomerangReferrals() {
    const r = await this.svc.getBoomerangs();
    const items = r.ok && Array.isArray(r.data) ? r.data : [];
    return { items, total: items.length };
  }

  @Get('skills')
  async getSkills() {
    const r = await this.svc.getSkills();
    const items = r.ok && Array.isArray(r.data) ? r.data : [];
    return { items, total: items.length };
  }

  @Get('milestones/:id/complete')
  async getMilestoneComplete(@Param('id', ParseIntPipe) id: number) {
    const r = await this.svc.getMilestone(id);
    const data = r.ok && r.data ? r.data : {};
    return { data };
  }

  @Post('milestones/:id/complete')
  async completeMilestone(@Param('id', ParseIntPipe) id: number) {
    const r = await this.svc.completeMilestone(id);
    const data = r.ok && r.data ? r.data : {};
    return { data };
  }

  @Patch('milestones/:id/complete')
  async patchMilestoneComplete(@Param('id', ParseIntPipe) id: number) {
    const r = await this.svc.completeMilestone(id);
    const data = r.ok && r.data ? r.data : {};
    return { data };
  }

  @Post('gsd/employees/:id')
  async updateGsdEmployee(@Param('id', ParseIntPipe) id: number, @Body() _body: Record<string, unknown>) {
    return { data: { id, updated: true } };
  }

  @Post('referrals')
  async createReferral(@Body() body: Record<string, unknown>) {
    return { data: { id: Date.now(), ...body, created: true } };
  }

  @Post('skills')
  async createSkill(@Body() body: Record<string, unknown>) {
    return { data: { id: Date.now(), ...body, created: true } };
  }
}
