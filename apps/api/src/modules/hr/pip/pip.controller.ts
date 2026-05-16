/**
 * @module pip.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { Controller, UseGuards, Get, Post, Patch, Body, Param, ParseIntPipe, Logger, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';
import { PipService } from './pip.service';
import { Roles } from '../../../common/decorators/roles.decorator';
import { unwrapOrInternal } from '@common/http-result';

const CreatePipSchema = z.object({
  employee_id:      z.number().int(),
  created_by:       z.number().int().optional(),
  supervisor_id:    z.number().int().optional(),
  duration_days:    z.number().int().optional(),
  start_date:       z.string().optional(),
  end_date:         z.string().optional(),
  goals:            z.string().optional(),
  success_criteria: z.string().optional(),
});
class CreatePipDto extends createZodDto(CreatePipSchema) {}

const AddProgressSchema = z.object({
  updated_by:     z.number().int().optional(),
  notes:          z.string().optional(),
  progress_notes: z.string().optional(),
  status:         z.string().optional(),
});
class AddProgressDto extends createZodDto(AddProgressSchema) {}

@Roles('admin', 'manager', 'supervisor', 'hr_manager')
@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard)
@ApiTags('Pip')
@ApiBearerAuth()
@Controller('hr-v2/pip')
export class PipController {
  private readonly logger = new Logger(PipController.name);
  constructor(private readonly svc: PipService) {}

  @ApiOperation({ summary: 'List all' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get()
  async listAll() {
    return unwrapOrInternal(await this.svc.listAll());
  }

  @ApiOperation({ summary: 'Get active' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('active')
  async getActive() {
    return unwrapOrInternal(await this.svc.getActivePips());
  }

  @ApiOperation({ summary: 'Create' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post()
  async create(@Body() body: CreatePipDto) {
    return unwrapOrInternal(await this.svc.createPip({
      employeeId: body.employee_id,
      createdBy: body.created_by || 1,
      supervisorId: body.supervisor_id,
      durationDays: body.duration_days || 30,
      startDate: body.start_date,
      endDate: body.end_date,
      goals: body.goals,
      successCriteria: body.success_criteria,
    }));
  }

  @ApiOperation({ summary: 'Get by id' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get(':id')
  async getById(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrInternal(await this.svc.getById(id));
  }

  @ApiOperation({ summary: 'Get by employee' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('employee/:id')
  async getByEmployee(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrInternal(await this.svc.getByEmployee(id));
  }

  @ApiOperation({ summary: 'Add progress' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Post(':id/progress')
  async addProgress(@Param('id', ParseIntPipe) id: number, @Body() body: AddProgressDto) {
    return unwrapOrInternal(await this.svc.addProgressUpdate(id, {
      updatedBy: body.updated_by || 1,
      notes: body.notes || body.progress_notes || '',
      status: body.status,
    }));
  }

  @ApiOperation({ summary: 'Acknowledge' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch(':id/acknowledge')
  async acknowledge(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrInternal(await this.svc.acknowledge(id));
  }

  @ApiOperation({ summary: 'Complete' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch(':id/complete')
  async complete(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    const schema = z.object({ result: z.enum(['PASSED', 'FAILED']).optional() });
    const dto = schema.parse(body ?? {});
    return unwrapOrInternal(await this.svc.complete(id, dto.result ?? 'PASSED'));
  }
}
