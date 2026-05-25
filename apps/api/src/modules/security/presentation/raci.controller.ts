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
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import {
  RaciCreateTaskSchema, RaciCreateTaskDto,
  RaciCreateAssignmentSchema, RaciCreateAssignmentDto,
  RaciCreateAssessmentSchema, RaciCreateAssessmentDto,
} from './dto/raci.dto';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { RaciService } from '../application/raci.service';
import { unwrapOrInternal } from '@common/http-result';


const MANAGER_ROLES = ['admin', 'super_admin', 'director', 'department_head', 'manager', 'security_manager'];

@ApiThrottle()
@ApiTags('Raci')
@Controller('raci-crisis')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...MANAGER_ROLES)
export class RaciController {
  private readonly logger = new Logger(RaciController.name);

  constructor(private readonly svc: RaciService) {}

  @ApiOperation({ summary: 'List tasks' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('tasks')
  async listTasks(@Query('status') status?: string) {
    return unwrapOrInternal(await this.svc.listTasks(status ?? null));
  }

  @ApiOperation({ summary: 'Create task' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
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

  @ApiOperation({ summary: 'Get task assignments' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('tasks/:id/assignments')
  async getTaskAssignments(@Param('id') id: string) {
    return unwrapOrInternal(await this.svc.getTaskAssignments(parseInt(id, 10)));
  }

  @ApiOperation({ summary: 'Create assignment' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('assignments')
  @UsePipes(new ZodValidationPipe(RaciCreateAssignmentSchema))
  async createAssignment(@Body() body: RaciCreateAssignmentDto) {
    const { task_id, employee_id, role } = body;
    assertRequired(task_id, 'task_id majburiy');
    assertRequired(employee_id, 'employee_id majburiy');
    assertRequired(role, 'role majburiy');
    return unwrapOrInternal(await this.svc.createAssignment(Number(task_id), Number(employee_id), role as string));
  }

  @ApiOperation({ summary: 'Delete assignment' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Delete('assignments/:id')
  async deleteAssignment(@Param('id') id: string) {
    await this.svc.deleteAssignment(parseInt(id, 10));
    return { message: "O'chirildi" };
  }

  @ApiOperation({ summary: 'Get stages' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('stages')
  async getStages() {
    return unwrapOrInternal(await this.svc.getStages());
  }

  @ApiOperation({ summary: 'List crises' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('crises')
  async listCrises(@Query('status') status?: string) {
    return unwrapOrInternal(await this.svc.listCrises(status ?? null));
  }

  @ApiOperation({ summary: 'List assessments' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('assessments')
  async listAssessments() {
    return unwrapOrInternal(await this.svc.listAssessments());
  }

  @ApiOperation({ summary: 'Create assessment' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
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
