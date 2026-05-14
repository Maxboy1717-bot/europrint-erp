/**
 * @module strategic.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { z } from 'zod';
import { assertFound } from '@common/assertions';
import { parseOrThrow } from '@common/utils/parse-or-throw.util';
import { Body, Controller, Delete, Get, Logger, Param, Patch, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { throwFromError, assertOk, unwrapOrInternal } from '@common/http-result';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { StrategicService } from '../application/strategic.service';
import { MAX_QUERY_LIMIT } from '@common/constants/app.constants';

const MANAGER_ROLES = ['manager', 'director', 'super_admin', 'finance'];
const DIRECTOR_ROLES = ['director', 'super_admin'];

const CreateCategorySchema = z.object({
  name: z.string().min(1, 'name majburiy'),
  description: z.string().optional().nullable(),
  color: z.string().optional().default('#3B82F6'),
});

const UpdateCategorySchema = z.object({
  name: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
});

const CreateTaskSchema = z.object({
  title: z.string().min(1, 'title majburiy'),
  category_id: z.number().optional().nullable(),
  assignee_id: z.number().optional().nullable(),
  due_date: z.string().optional().nullable(),
  priority: z.string().optional().default('medium'),
  description: z.string().optional().nullable(),
});

const UpdateTaskSchema = z.object({
  title: z.string().optional().nullable(),
  status: z.string().optional().nullable(),
  assignee_id: z.number().optional().nullable(),
  due_date: z.string().optional().nullable(),
  priority: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  progress: z.number().optional().nullable(),
});

const CreateMilestoneSchema = z.object({
  title: z.string().min(1, 'title majburiy'),
  due_date: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});

const UpdateMilestoneSchema = z.object({
  title: z.string().optional().nullable(),
  status: z.string().optional().nullable(),
  due_date: z.string().optional().nullable(),
});

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('strategic')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...MANAGER_ROLES)
export class StrategicController {
  private readonly logger = new Logger(StrategicController.name);

  constructor(private readonly svc: StrategicService) {}

  @Get('categories')
  async listCategories() {
    return unwrapOrInternal(await this.svc.listCategories());
  }

  @Post('categories')
  async createCategory(@Body() body: Record<string, unknown>) {
    const dto = CreateCategorySchema.parse(body);
    return unwrapOrInternal(await this.svc.createCategory(dto.name, dto.description ?? null, dto.color ?? '#3B82F6'));
  }

  @Patch('categories/:id')
  async updateCategory(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    const dto = UpdateCategorySchema.parse(body);
    return unwrapOrInternal(await this.svc.updateCategory(parseInt(id, 10), dto.name ?? null, dto.description ?? null, dto.color ?? null));
  }

  @Get('tasks')
  async listTasks(
    @Query('status') status?: string,
    @Query('category_id') categoryId?: string,
    @Query('assignee_id') assigneeId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const lim = Math.min(parseInt(limit ?? '50', 10) || 50, MAX_QUERY_LIMIT);
    const off = parseInt(offset ?? '0', 10) || 0;
    return unwrapOrInternal(await this.svc.listTasks(
      status ?? null,
      categoryId ? parseInt(categoryId, 10) : null,
      assigneeId ? parseInt(assigneeId, 10) : null,
      lim, off,
    ));
  }

  @Get('tasks/:id')
  async getTask(@Param('id') id: string) {
    const _rData = await this.svc.getTask(parseInt(id, 10));
    assertOk(_rData);
    const data = _rData.data;
    assertFound(data, 'Topilmadi');
    return data[0];
  }

  @Post('tasks')
  async createTask(
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: { id: number },
  ) {
    const dto = parseOrThrow(CreateTaskSchema, body);
    return unwrapOrInternal(await this.svc.createTask(
      dto.title,
      dto.category_id ?? null,
      dto.assignee_id ?? null,
      dto.due_date ?? null,
      dto.priority ?? 'medium',
      dto.description ?? null,
      user.id,
    ));
  }

  @Patch('tasks/:id')
  async updateTask(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    const dto = UpdateTaskSchema.parse(body);
    return unwrapOrInternal(await this.svc.updateTask(
      parseInt(id, 10),
      dto.title ?? null,
      dto.status ?? null,
      dto.assignee_id ?? null,
      dto.due_date ?? null,
      dto.priority ?? null,
      dto.description ?? null,
      dto.progress ?? null,
    ));
  }

  @Delete('tasks/:id')
  async deleteTask(@Param('id') id: string) {
    await this.svc.deleteTask(parseInt(id, 10));
    return { message: "O'chirildi" };
  }

  @Post('tasks/:taskId/milestones')
  async createMilestone(@Param('taskId') taskId: string, @Body() body: Record<string, unknown>) {
    const dto = CreateMilestoneSchema.parse(body);
    return unwrapOrInternal(await this.svc.createMilestone(parseInt(taskId, 10), dto.title, dto.due_date ?? null, dto.description ?? null));
  }

  @Patch('milestones/:id')
  async updateMilestone(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    const dto = UpdateMilestoneSchema.parse(body);
    return unwrapOrInternal(await this.svc.updateMilestone(parseInt(id, 10), dto.title ?? null, dto.status ?? null, dto.due_date ?? null));
  }

  @Post('seed')
  @Roles(...DIRECTOR_ROLES)
  async seedStrategicData() {
    const cats = ['Rivojlanish', 'Ishlab chiqarish', 'Xodimlar', 'Moliya', 'Mijozlar'];
    const results = await Promise.allSettled((Array.isArray(cats) ? cats : []).map((name) => this.svc.createCategory(name, null, '#3B82F6')));
    const created = (Array.isArray(results) ? results : []).filter((r) => r.status === 'fulfilled').length;
    const failed  = (Array.isArray(results) ? results : []).filter((r) => r.status === 'rejected').length;
    return { message: "Seed ma'lumotlar yuklandi", created, failed, total: cats.length };
  }

  @Get('dashboard')
  async getDashboard() {
    return unwrapOrInternal(await this.svc.getDashboard());
  }
}
