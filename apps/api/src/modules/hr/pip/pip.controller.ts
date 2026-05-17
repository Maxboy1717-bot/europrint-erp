import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { Controller, UseGuards, Get, Post, Patch, Body, Param, ParseIntPipe, Logger, UseInterceptors } from '@nestjs/common';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Throttle } from '@nestjs/throttler';
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

const CompletePipSchema = z.object({
  result: z.enum(['PASSED', 'FAILED']),
});
class CompletePipDto extends createZodDto(CompletePipSchema) {}

@Roles('admin', 'manager', 'supervisor', 'hr_manager', 'hr_specialist')
@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('hr-v2/pip')
export class PipController {
  private readonly logger = new Logger(PipController.name);
  constructor(private readonly svc: PipService) {}

  @Get()
  async listAll() {
    return unwrapOrInternal(await this.svc.listAll());
  }

  @Get('active')
  async getActive() {
    return unwrapOrInternal(await this.svc.getActivePips());
  }

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

  @Get(':id')
  async getById(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrInternal(await this.svc.getById(id));
  }

  @Get('employee/:id')
  async getByEmployee(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrInternal(await this.svc.getByEmployee(id));
  }

  @Post(':id/progress')
  async addProgress(@Param('id', ParseIntPipe) id: number, @Body() body: AddProgressDto) {
    return unwrapOrInternal(await this.svc.addProgressUpdate(id, {
      updatedBy: body.updated_by || 1,
      notes: body.notes || body.progress_notes || '',
      status: body.status,
    }));
  }

  @Patch(':id/acknowledge')
  async acknowledge(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrInternal(await this.svc.acknowledge(id));
  }

  /**
   * Finalize a PIP with explicit outcome — called from `PIPPage.tsx:68`
   *   PATCH /api/hr-v2/pip/:id/complete  { result: 'PASSED' | 'FAILED' }
   */
  @Patch(':id/complete')
  async complete(@Param('id', ParseIntPipe) id: number, @Body() body: CompletePipDto) {
    return unwrapOrInternal(await this.svc.completePip(id, body.result));
  }
}
