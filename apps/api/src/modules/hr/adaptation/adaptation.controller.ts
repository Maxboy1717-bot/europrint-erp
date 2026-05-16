/**
 * @module adaptation.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 *
 * Merged into hr module (PA3-17 Wave 3): originally lived in `modules/adaptation/`.
 * Route prefix `@Controller('adaptation')` is preserved for frontend backwards compatibility.
 */

import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Put, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { z } from 'zod';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { Role } from '@common/constants/roles.constants';
import { AdaptationService } from './adaptation.service';

const NewEmployeeSchema = z.object({
  employeeId: z.union([z.string(), z.number()]).optional(),
  programId: z.union([z.string(), z.number()]).optional(),
  startDate: z.string().optional(),
  mentorId: z.union([z.string(), z.number()]).optional(),
  status: z.string().max(50).optional(),
  notes: z.string().max(2000).optional(),
}).passthrough();

const ProgramPatchSchema = z.object({
  name: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  durationDays: z.number().int().positive().optional(),
  active: z.boolean().optional(),
}).passthrough();

const FeedbackSchema = z.object({
  employeeId: z.union([z.string(), z.number()]).optional(),
  rating: z.number().int().min(1).max(5).optional(),
  comments: z.string().max(2000).optional(),
  date: z.string().optional(),
}).passthrough();

const WelcomeEventSchema = z.object({
  title: z.string().max(200).optional(),
  date: z.string().optional(),
  description: z.string().max(2000).optional(),
  participants: z.array(z.union([z.string(), z.number()])).optional(),
}).passthrough();

import { parsePagination } from '@common/pipes/parse-pagination.pipe';
import { unwrapOrInternal } from '@common/http-result';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
@ApiThrottle()
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
  async createNewEmployee(@Body() body: unknown) {
    const dto = NewEmployeeSchema.parse(body);
    return this.svc.createNewEmployee(dto as Record<string, unknown>);
  }

  @Patch('new-employees/:id')
  async patchNewEmployee(@Param('id') id: string, @Body() body: unknown) {
    const dto = NewEmployeeSchema.partial().parse(body);
    return this.svc.updateNewEmployee(id, dto as Record<string, unknown>);
  }

  @Patch('programs/:id')
  async patchProgram(@Param('id') id: string, @Body() body: unknown) {
    const dto = ProgramPatchSchema.parse(body);
    return { id, ...dto, updated: true };
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
  async createFeedback(@Body() body: unknown) {
    const dto = FeedbackSchema.parse(body);
    return this.svc.createFeedback(dto as Record<string, unknown>);
  }

  @Patch('feedback/:id')
  async patchFeedback(@Param('id') id: string, @Body() body: unknown) {
    const dto = FeedbackSchema.partial().parse(body);
    return this.svc.updateFeedback(id, dto as Record<string, unknown>);
  }

  @Put('feedback/:id')
  async putFeedback(@Param('id') id: string, @Body() body: unknown) {
    const dto = FeedbackSchema.parse(body);
    return this.svc.updateFeedback(id, dto as Record<string, unknown>);
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
  async createWelcomeEvent(@Body() body: unknown) {
    const dto = WelcomeEventSchema.parse(body);
    return this.svc.createWelcomeEvent(dto as Record<string, unknown>);
  }

  @Patch('welcome-events/:id')
  async patchWelcomeEvent(@Param('id') id: string, @Body() body: unknown) {
    const dto = WelcomeEventSchema.partial().parse(body);
    return this.svc.updateWelcomeEvent(id, dto as Record<string, unknown>);
  }
}
