/**
 * @module enps.controller
 * @description eNPS (Employee Net Promoter Score) surveys controller.
 * Route prefix: hr-v2/enps
 */
import { Controller, UseGuards, Get, Post, Patch, Body, Param, ParseIntPipe, Query, Logger, UseInterceptors, NotFoundException, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';
import { EnpsRepository } from './enps.repository';
import { unwrapOrInternal } from '@common/http-result';

const CreateEnpsSchema = z.object({
  title:       z.string().min(1).max(200),
  description: z.string().optional(),
  period:      z.enum(['monthly', 'quarterly', 'annual']).optional(),
  start_date:  z.string().optional(),
  end_date:    z.string().optional(),
});
class CreateEnpsDto extends createZodDto(CreateEnpsSchema) {}

const RespondSchema = z.object({
  survey_id:   z.number().int().positive(),
  employee_id: z.number().int().positive(),
  score:       z.number().int().min(0).max(10),
  comment:     z.string().optional(),
});
class RespondDto extends createZodDto(RespondSchema) {}

@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('HR_MANAGER', 'HR_SPECIALIST', 'SUPER_ADMIN', 'DIRECTOR')
@ApiTags('eNPS')
@ApiBearerAuth()
@Controller('hr-v2/enps')
export class EnpsController {
  private readonly logger = new Logger(EnpsController.name);
  constructor(private readonly repo: EnpsRepository) {}

  @ApiOperation({ summary: 'eNPS so\'rovnomalar ro\'yxati' })
  @Get()
  async findAll(@Query('status') status?: string) {
    return unwrapOrInternal(await this.repo.findAll(status));
  }

  @ApiOperation({ summary: 'Bitta eNPS so\'rovnoma' })
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const result = await this.repo.findOne(id);
    if (!result.ok) throw new NotFoundException(result.error.message);
    return result.data;
  }

  @ApiOperation({ summary: 'Yangi eNPS so\'rovnoma yaratish' })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: CreateEnpsDto) {
    return unwrapOrInternal(await this.repo.create({
      title: body.title,
      description: body.description,
      period: body.period,
      startDate: body.start_date,
      endDate: body.end_date,
    }));
  }

  @ApiOperation({ summary: 'eNPS so\'rovnomani yopish' })
  @Patch(':id/close')
  async close(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrInternal(await this.repo.updateStatus(id, 'closed'));
  }

  @ApiOperation({ summary: 'eNPS so\'rovnomani ishga tushirish' })
  @Patch(':id/launch')
  async launch(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrInternal(await this.repo.updateStatus(id, 'active'));
  }

  @ApiOperation({ summary: 'eNPS javob yuborish' })
  @Post('respond')
  @HttpCode(HttpStatus.CREATED)
  async respond(@Body() body: RespondDto) {
    return unwrapOrInternal(await this.repo.respond({
      surveyId: body.survey_id,
      employeeId: body.employee_id,
      score: body.score,
      comment: body.comment,
    }));
  }
}
