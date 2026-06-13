/**
 * @module razryad.controller
 * @description HTTP routes for razryad (grade) master-data (`razryad_levels`). Mirrors CardController.
 *   Soft-delete = is_active=false. UNIQUE(level) → 409 (clean). EP-ORG-009 (create) / 043 (master).
 */

import {
  Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query,
  UseGuards, UseInterceptors, Logger,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { unwrapOrThrow, unwrapOrInternal } from '@common/http-result';
import { z } from 'zod';
import { RazryadService } from './razryad.service';
import type { RazryadInput } from './razryad.repository';

const RazryadCreateSchema = z.object({
  level:          z.number().int(),
  name:           z.string().min(1).max(200),
  minRequirement: z.string().max(2000).optional(),
  salaryMin:      z.number().optional(),
  salaryMax:      z.number().optional(),
  examType:       z.string().max(100).optional(),
  certificate:    z.string().max(500).optional(),
  description:    z.string().max(2000).optional(),
}).strict();

const RazryadUpdateSchema = RazryadCreateSchema.partial();

@Roles('admin', 'manager', 'hr_manager', 'director', 'super_admin')
@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard)
@ApiTags('Org Razryad Levels')
@ApiBearerAuth()
@Controller('org-structure/razryad-levels')
export class RazryadController {
  private readonly logger = new Logger(RazryadController.name);
  constructor(private readonly service: RazryadService) {}

  @ApiOperation({ summary: 'List razryad levels' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get()
  async list(@Query('all') all?: string) {
    const includeArchived = all === 'true' || all === '1';
    const data = unwrapOrInternal(await this.service.list(includeArchived));
    const items = Array.isArray(data) ? data : [];
    return { items, total: items.length };
  }

  @ApiOperation({ summary: 'Get razryad by id' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrThrow(await this.service.findById(id));
  }

  @ApiOperation({ summary: 'Create razryad level' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'Level already exists' })
  @Post()
  async create(@Body() body: unknown) {
    const dto = RazryadCreateSchema.parse(body) as RazryadInput;
    this.logger.log('Creating razryad level');
    return unwrapOrThrow(await this.service.create(dto));
  }

  @ApiOperation({ summary: 'Update razryad level' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 409, description: 'Level already exists' })
  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    const dto = RazryadUpdateSchema.parse(body) as RazryadInput;
    return unwrapOrThrow(await this.service.update(id, dto));
  }

  @ApiOperation({ summary: 'Soft-delete (archive) razryad level' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrThrow(await this.service.softDelete(id));
  }
}
