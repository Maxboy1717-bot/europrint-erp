import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { Err } from '@common/types/result.type';
import { Controller, UseGuards, Get, Post, Patch, Body, Param, ParseIntPipe, Logger, NotFoundException, UseInterceptors } from '@nestjs/common';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { throwFromError, unwrapOrThrow, assertOk } from '@common/http-result';
import { Throttle } from '@nestjs/throttler';
import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';
import { CareerPathService } from './career-path.service';
import { Roles } from '../../../common/decorators/roles.decorator';
import { isErr } from '@common/result';

const CreatePathSchema = z.object({
  employee_id:         z.number().int(),
  current_position_id: z.number().int(),
  target_position_id:  z.number().int(),
  created_by:          z.number().int().optional(),
  estimated_months:    z.number().int().optional(),
});
class CreatePathDto extends createZodDto(CreatePathSchema) {}

const AddStepSchema = z.object({
  step_order:          z.number().int(),
  title:               z.string().min(1),
  description:         z.string().optional(),
  required_skill_code: z.string().optional(),
  estimated_days:      z.number().int().optional(),
});
class AddStepDto extends createZodDto(AddStepSchema) {}

const UpdateProgressSchema = z.object({
  is_completed: z.boolean(),
  completed_by: z.number().int().optional(),
});
class UpdateProgressDto extends createZodDto(UpdateProgressSchema) {}

@Roles('admin', 'manager', 'supervisor', 'hr_manager', 'employee')
@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard)
@Controller('hr-v2/career-path')
export class CareerPathController {
  private readonly logger = new Logger(CareerPathController.name);
  constructor(private readonly svc: CareerPathService) {}

  @Get()
  async getAll() {
    return unwrapOrThrow(await this.svc.getAll());
  }

  @Post()
  async create(@Body() body: CreatePathDto) {
    const result = await this.svc.createPath({
      employeeId: body.employee_id,
      currentPositionId: body.current_position_id,
      targetPositionId: body.target_position_id,
      createdBy: body.created_by || 1,
      estimatedMonths: body.estimated_months,
    });
    assertOk(result);
    return result.data;
  }

  @Get('department/:id/ladder')
  async getDepartmentLadder(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrThrow(await this.svc.getDepartmentLadder(id));
  }

  @Get('employee/:id')
  async getByEmployee(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrThrow(await this.svc.getByEmployee(id));
  }

  @Post(':id/steps')
  async addStep(@Param('id', ParseIntPipe) id: number, @Body() body: AddStepDto) {
    const result = await this.svc.addStep(id, {
      stepOrder: body.step_order,
      title: body.title,
      description: body.description,
      requiredSkillCode: body.required_skill_code,
      estimatedDays: body.estimated_days,
    });
    assertOk(result);
    return result.data;
  }

  @Patch(':id/steps/:stepId')
  async updateProgress(
    @Param('id', ParseIntPipe) id: number,
    @Param('stepId', ParseIntPipe) stepId: number,
    @Body() body: UpdateProgressDto,
  ) {
    return unwrapOrThrow(await this.svc.updateProgress(id, stepId, body.is_completed, body.completed_by || 1));
  }
}
