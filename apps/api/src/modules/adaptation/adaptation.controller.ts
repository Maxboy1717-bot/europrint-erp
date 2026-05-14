/**
 * @module adaptation.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Put, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { Role } from '@common/constants/roles.constants';
import { AdaptationService } from './adaptation.service';

import { parsePagination } from '@common/pipes/parse-pagination.pipe';
import { unwrapOrInternal } from '@common/http-result';
@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('adaptation')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.HR_MANAGER, Role.HR_SPECIALIST)
@UseInterceptors(AuditInterceptor)
export class AdaptationController {
  constructor(private readonly svc: AdaptationService) {}

  @Get('dashboard')
  async getDashboard() {
    return unwrapOrInternal(await this.svc.getDashboard());
  }

  @Get('programs')
  async getPrograms(
    @Query('limit') limitParam?: string,
    @Query('offset') offsetParam?: string,
  ) {
    const { limit, offset } = parsePagination(limitParam, offsetParam);
    return unwrapOrInternal(await this.svc.getPrograms(limit, offset));
  }

  @Get('records')
  async getRecords(
    @Query('status') status?: string,
    @Query('limit') limitParam?: string,
    @Query('offset') offsetParam?: string,
  ) {
    const { limit, offset } = parsePagination(limitParam, offsetParam);
    return unwrapOrInternal(await this.svc.getRecords(status, limit, offset));
  }

  @Get('cases')
  async getCases(
    @Query('limit') limitParam?: string,
    @Query('offset') offsetParam?: string,
  ) {
    const { limit, offset } = parsePagination(limitParam, offsetParam);
    return unwrapOrInternal(await this.svc.getCases(limit, offset));
  }

  @Get('new-employees')
  async listNewEmployees(
    @Query('limit') limitParam?: string,
    @Query('offset') offsetParam?: string,
  ) {
    const { limit, offset } = parsePagination(limitParam, offsetParam);
    return this.svc.getNewEmployees(limit, offset);
  }

  @Get('new-employees/:id')
  async getNewEmployeeRecord(@Param('id') id: string) {
    const result = await this.svc.findRecordById(Number(id));
    return { data: (result.ok && result.data != null) ? result.data : null };
  }

  @Post('new-employees')
  @HttpCode(HttpStatus.CREATED)
  async createNewEmployee(@Body() body: Record<string, unknown>) {
    return this.svc.createNewEmployee(body);
  }

  @Patch('new-employees/:id')
  async patchNewEmployee(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.svc.updateNewEmployee(id, body);
  }

  @Patch('programs/:id')
  async patchProgram(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return { id, ...body, updated: true };
  }

  @Get('feedback')
  async listFeedback(
    @Query('limit') limitParam?: string,
    @Query('offset') offsetParam?: string,
  ) {
    const { limit, offset } = parsePagination(limitParam, offsetParam);
    return this.svc.getFeedback(limit, offset);
  }

  @Post('feedback')
  @HttpCode(HttpStatus.CREATED)
  async createFeedback(@Body() body: Record<string, unknown>) {
    return this.svc.createFeedback(body);
  }

  @Patch('feedback/:id')
  async patchFeedback(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.svc.updateFeedback(id, body);
  }

  @Put('feedback/:id')
  async putFeedback(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.svc.updateFeedback(id, body);
  }

  @Get('welcome-events')
  async listWelcomeEvents(
    @Query('limit') limitParam?: string,
    @Query('offset') offsetParam?: string,
  ) {
    const { limit, offset } = parsePagination(limitParam, offsetParam);
    return this.svc.getWelcomeEvents(limit, offset);
  }

  @Post('welcome-events')
  @HttpCode(HttpStatus.CREATED)
  async createWelcomeEvent(@Body() body: Record<string, unknown>) {
    return this.svc.createWelcomeEvent(body);
  }

  @Patch('welcome-events/:id')
  async patchWelcomeEvent(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.svc.updateWelcomeEvent(id, body);
  }
}
