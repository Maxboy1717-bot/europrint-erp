/**
 * @module strategic.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { z } from 'zod';
import { I18nService } from 'nestjs-i18n';
import { assertFound } from '@common/assertions';
import { parseOrThrow } from '@common/utils/parse-or-throw.util';
import { Body, Controller, Delete, Get, Logger, Param, Patch, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { throwFromError, assertOk, unwrapOrInternal } from '@common/http-result';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
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

@ApiThrottle()
@ApiTags('Strategic')
@ApiBearerAuth()
@Controller('strategic')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...MANAGER_ROLES)
export class StrategicController {
  private readonly logger = new Logger(StrategicController.name);

  constructor(
    private readonly svc: StrategicService,
    private readonly i18n: I18nService,
  ) {}

  @ApiOperation({ summary: 'List categories' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('categories')
  async listCategories() {
    return unwrapOrInternal(await this.svc.listCategories());
  }

  @ApiOperation({ summary: 'Create category' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('categories')
  async createCategory(@Body() body: unknown) {
    const dto = CreateCategorySchema.parse(body);
    return unwrapOrInternal(await this.svc.createCategory(dto.name, dto.description ?? null, dto.color ?? '#3B82F6'));
  }

  @ApiOperation({ summary: 'Update category' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch('categories/:id')
  async updateCategory(@Param('id') id: string, @Body() body: unknown) {
    const dto = UpdateCategorySchema.parse(body);
    return unwrapOrInternal(await this.svc.updateCategory(parseInt(id, 10), dto.name ?? null, dto.description ?? null, dto.color ?? null));
  }

  @ApiOperation({ summary: 'List tasks' })
  @ApiResponse({ status: 200, description: 'OK' })
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

  @ApiOperation({ summary: 'Get task' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('tasks/:id')
  async getTask(@Param('id') id: string) {
    const _rData = await this.svc.getTask(parseInt(id, 10));
    assertOk(_rData);
    const data = _rData.data;
    assertFound(data, 'Topilmadi');
    return data[0];
  }

  @ApiOperation({ summary: 'Create task' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('tasks')
  async createTask(
    @Body() body: unknown,
    @CurrentUser() user: { id: number },
  ) {
    const dto = parseOrThrow(CreateTaskSchema, body, await this.i18n.t('validation.validationFailed'));
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

  @ApiOperation({ summary: 'Update task' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch('tasks/:id')
  async updateTask(@Param('id') id: string, @Body() body: unknown) {
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

  @ApiOperation({ summary: 'Delete task' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Delete('tasks/:id')
  async deleteTask(@Param('id') id: string) {
    await this.svc.deleteTask(parseInt(id, 10));
    return { message: "O'chirildi" };
  }

  @ApiOperation({ summary: 'Create milestone' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Post('tasks/:taskId/milestones')
  async createMilestone(@Param('taskId') taskId: string, @Body() body: unknown) {
    const dto = CreateMilestoneSchema.parse(body);
    return unwrapOrInternal(await this.svc.createMilestone(parseInt(taskId, 10), dto.title, dto.due_date ?? null, dto.description ?? null));
  }

  @ApiOperation({ summary: 'Update milestone' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch('milestones/:id')
  async updateMilestone(@Param('id') id: string, @Body() body: unknown) {
    const dto = UpdateMilestoneSchema.parse(body);
    return unwrapOrInternal(await this.svc.updateMilestone(parseInt(id, 10), dto.title ?? null, dto.status ?? null, dto.due_date ?? null));
  }

  @ApiOperation({ summary: 'Seed strategic data' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('seed')
  @Roles(...DIRECTOR_ROLES)
  async seedStrategicData() {
    const cats = ['Rivojlanish', 'Ishlab chiqarish', 'Xodimlar', 'Moliya', 'Mijozlar'];
    const results = await Promise.allSettled((Array.isArray(cats) ? cats : []).map((name) => this.svc.createCategory(name, null, '#3B82F6')));
    const created = (Array.isArray(results) ? results : []).filter((r) => r.status === 'fulfilled').length;
    const failed  = (Array.isArray(results) ? results : []).filter((r) => r.status === 'rejected').length;
    return { message: "Seed ma'lumotlar yuklandi", created, failed, total: cats.length };
  }

  @ApiOperation({ summary: 'Get dashboard' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('dashboard')
  async getDashboard() {
    return unwrapOrInternal(await this.svc.getDashboard());
  }
}
