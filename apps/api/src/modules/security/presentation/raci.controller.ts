/**
 * @module raci.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { assertRequired } from '@common/assertions';
import {
BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Post,
  Query,
  UseGuards,
  UseInterceptors, UsePipes,
} from '@nestjs/common';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import {
  RaciCreateTaskSchema, RaciCreateTaskDto,
  RaciCreateAssignmentSchema, RaciCreateAssignmentDto,
  RaciCreateAssessmentSchema, RaciCreateAssessmentDto,
} from './dto/raci.dto';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { RaciService } from '../application/raci.service';
import { unwrapOrInternal } from '@common/http-result';


const MANAGER_ROLES = ['admin', 'super_admin', 'director', 'department_head', 'manager', 'security_manager'];

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('raci-crisis')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...MANAGER_ROLES)
export class RaciController {
  private readonly logger = new Logger(RaciController.name);

  constructor(private readonly svc: RaciService) {}

  @Get('tasks')
  async listTasks(@Query('status') status?: string) {
    return unwrapOrInternal(await this.svc.listTasks(status ?? null));
  }

  @Post('tasks')
  @UsePipes(new ZodValidationPipe(RaciCreateTaskSchema))
  async createTask(
    @Body() body: RaciCreateTaskDto,
    @CurrentUser() user: { id: number; role: string },
  ) {
    const { title, description, responsible_id, accountable_id, deadline } = body;
    assertRequired(title, 'title majburiy');
    return unwrapOrInternal(await this.svc.createTask(
      title as string,
      (description as string) ?? null,
      responsible_id ? Number(responsible_id) : null,
      accountable_id ? Number(accountable_id) : null,
      user.id,
      (deadline as string) ?? null,
    ));
  }

  @Get('tasks/:id/assignments')
  async getTaskAssignments(@Param('id') id: string) {
    return unwrapOrInternal(await this.svc.getTaskAssignments(parseInt(id, 10)));
  }

  @Post('assignments')
  @UsePipes(new ZodValidationPipe(RaciCreateAssignmentSchema))
  async createAssignment(@Body() body: RaciCreateAssignmentDto) {
    const { task_id, employee_id, role } = body;
    assertRequired(task_id, 'task_id majburiy');
    assertRequired(employee_id, 'employee_id majburiy');
    assertRequired(role, 'role majburiy');
    return unwrapOrInternal(await this.svc.createAssignment(Number(task_id), Number(employee_id), role as string));
  }

  @Delete('assignments/:id')
  async deleteAssignment(@Param('id') id: string) {
    await this.svc.deleteAssignment(parseInt(id, 10));
    return { message: "O'chirildi" };
  }

  @Get('stages')
  async getStages() {
    return unwrapOrInternal(await this.svc.getStages());
  }

  @Get('crises')
  async listCrises(@Query('status') status?: string) {
    return unwrapOrInternal(await this.svc.listCrises(status ?? null));
  }

  @Get('assessments')
  async listAssessments() {
    return unwrapOrInternal(await this.svc.listAssessments());
  }

  @Post('assessments')
  @UsePipes(new ZodValidationPipe(RaciCreateAssessmentSchema))
  async createAssessment(
    @Body() body: RaciCreateAssessmentDto,
    @CurrentUser() user: { id: number; role: string },
  ) {
    const { title, risk_level, description, likelihood, impact } = body;
    assertRequired(title, 'title majburiy');
    return unwrapOrInternal(await this.svc.createAssessment(
      title as string,
      (risk_level as string) ?? 'medium',
      (description as string) ?? null,
      likelihood ? Number(likelihood) : 3,
      impact ? Number(impact) : 3,
      user.id,
    ));
  }
}
