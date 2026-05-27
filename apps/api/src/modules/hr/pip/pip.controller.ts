/**
 * @module pip.controller
 * @description PIP (Performance Improvement Plan) controller.
 * Route prefix: hr-v2/pip
 */
import { Controller, UseGuards, Get, Post, Patch, Body, Param, ParseIntPipe, Query, Logger, UseInterceptors, NotFoundException, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';
import { PipRepository } from './pip.repository';
import { unwrapOrInternal } from '@common/http-result';

const CreatePipSchema = z.object({
  employee_id:      z.number().int().positive(),
  created_by:       z.number().int().positive().optional(),
  supervisor_id:    z.number().int().positive().optional(),
  goals:            z.string().optional(),
  success_criteria: z.string().optional(),
  start_date:       z.string().min(1),
  end_date:         z.string().min(1),
  duration_days:    z.number().int().min(1).optional(),
});
class CreatePipDto extends createZodDto(CreatePipSchema) {}

const ProgressSchema = z.object({
  notes:      z.string().min(1),
  status:     z.string().optional(),
  updated_by: z.number().int().positive().optional(),
});
class ProgressDto extends createZodDto(ProgressSchema) {}

@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard)
@ApiTags('PIP')
@ApiBearerAuth()
@Controller('hr-v2/pip')
export class PipController {
  private readonly logger = new Logger(PipController.name);
  constructor(private readonly repo: PipRepository) {}

  @ApiOperation({ summary: 'PIP rejalari ro\'yxati' })
  @Get()
  async findAll(@Query('status') status?: string) {
    return unwrapOrInternal(await this.repo.findAll(status));
  }

  @ApiOperation({ summary: 'Bitta PIP rejasi' })
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const result = await this.repo.findOne(id);
    if (!result.ok) throw new NotFoundException(result.error.message);
    return result.data;
  }

  @ApiOperation({ summary: 'Yangi PIP rejasi yaratish' })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: CreatePipDto) {
    return unwrapOrInternal(await this.repo.create({
      employeeId:    body.employee_id,
      createdBy:     body.created_by,
      supervisorId:  body.supervisor_id,
      goals:         body.goals,
      successCriteria: body.success_criteria,
      startDate:     body.start_date,
      endDate:       body.end_date,
      durationDays:  body.duration_days,
    }));
  }

  @ApiOperation({ summary: 'PIP ni qabul qilish (active holatga o\'tkazish)' })
  @Patch(':id/acknowledge')
  async acknowledge(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrInternal(await this.repo.acknowledge(id));
  }

  @ApiOperation({ summary: 'PIP progress yangilash' })
  @Post(':id/progress')
  @HttpCode(HttpStatus.CREATED)
  async addProgress(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ProgressDto,
  ) {
    return unwrapOrInternal(await this.repo.addProgress(id, {
      notes:     body.notes,
      status:    body.status,
      updatedBy: body.updated_by,
    }));
  }
}
