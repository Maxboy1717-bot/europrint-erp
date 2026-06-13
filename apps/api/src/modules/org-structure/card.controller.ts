/**
 * @module card.controller
 * @description HTTP routes for the canonical ORG CARD (`org_functions`) CRUD lifecycle.
 *   Extends the org-structure module (does not rewrite it). Zod-validated, Result-unwrapped.
 *   EP-ORG-001 (create) · 004 (read) · 005 (soft-delete) · 002 (atomic can-assign).
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
import { CardService } from './card.service';
import type { CardInput } from './card.repository';

const CardCreateSchema = z.object({
  positionName:        z.string().min(1).max(500),
  positionNameRu:      z.string().max(500).optional(),
  departmentId:        z.number().int().optional(),
  code:                z.string().max(50).optional(),
  level:               z.number().int().optional(),
  razryadLevelId:      z.number().int().optional(),
  salaryType:          z.enum(['ishbay', 'soatbay', 'oylik']).optional(),
  minSalary:           z.number().optional(),
  maxSalary:           z.number().optional(),
  rbacTier:            z.string().max(50).optional(),
  status:              z.enum(['active', 'frozen', 'vacant', 'archived', 'io']).optional(),
  tskp:                z.string().max(2000).optional(),
  tskpTarget:          z.string().max(500).optional(),
  tskpMeasurementUnit: z.enum(['SON', 'FOIZ', 'VAQT']).optional(),
  statisticsType:      z.string().max(50).optional(),
  aiExamEnabled:       z.boolean().optional(),
}).strict();

const CardUpdateSchema = CardCreateSchema.partial();

const AssignSchema = z.object({
  employeeId: z.number().int().positive(),
  isPrimary:  z.boolean().optional(),
}).strict();

@Roles('admin', 'manager', 'hr_manager', 'director', 'super_admin')
@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard)
@ApiTags('Org Cards')
@ApiBearerAuth()
@Controller('org-structure/cards')
export class CardController {
  private readonly logger = new Logger(CardController.name);
  constructor(private readonly service: CardService) {}

  @ApiOperation({ summary: 'List cards' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get()
  async list(
    @Query('departmentId') departmentId?: string,
    @Query('status') status?: string,
  ) {
    const dep = departmentId ? parseInt(departmentId, 10) : null;
    const data = unwrapOrInternal(
      await this.service.list(dep !== null && Number.isFinite(dep) ? dep : null, status ?? null),
    );
    const items = Array.isArray(data) ? data : [];
    return { items, total: items.length };
  }

  @ApiOperation({ summary: 'Get card by id' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrThrow(await this.service.findById(id));
  }

  @ApiOperation({ summary: 'Check if a card can take another active employee (EP-ORG-002)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get(':id/can-assign')
  async canAssign(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrThrow(await this.service.canAssignEmployee(id));
  }

  // ─── Phase 5 card-detail tabs (read-only) ──────────────────────────────────

  @ApiOperation({ summary: 'Card employees (Xodimlar tab)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get(':id/employees')
  async employees(@Param('id', ParseIntPipe) id: number) {
    const data = unwrapOrInternal(await this.service.listEmployees(id));
    const items = Array.isArray(data) ? data : [];
    return { items, total: items.length };
  }

  @ApiOperation({ summary: 'Child cards (Farzandlar tab)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get(':id/children')
  async children(@Param('id', ParseIntPipe) id: number) {
    const data = unwrapOrInternal(await this.service.listChildren(id));
    const items = Array.isArray(data) ? data : [];
    return { items, total: items.length };
  }

  @ApiOperation({ summary: 'Card vacancies (Vakant tab)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get(':id/vacancies')
  async vacancies(@Param('id', ParseIntPipe) id: number) {
    const data = unwrapOrInternal(await this.service.listVacancies(id));
    const items = Array.isArray(data) ? data : [];
    return { items, total: items.length };
  }

  @ApiOperation({ summary: 'Card change history (Tarix tab)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get(':id/history')
  async history(@Param('id', ParseIntPipe) id: number) {
    const data = unwrapOrInternal(await this.service.listHistory(id));
    const items = Array.isArray(data) ? data : [];
    return { items, total: items.length };
  }

  // ─── Phase 6 employee↔card M:N + FORMULA A salary ──────────────────────────

  @ApiOperation({ summary: "An employee's cards + FORMULA-A total salary (EP-ORG-142)" })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('by-employee/:employeeId')
  async byEmployee(@Param('employeeId', ParseIntPipe) employeeId: number) {
    return unwrapOrThrow(await this.service.listEmployeeCards(employeeId));
  }

  @ApiOperation({ summary: 'Assign an employee to a card (atomic guard EP-ORG-002)' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 409, description: 'Card already occupied' })
  @Post(':id/assign')
  async assign(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    const dto = AssignSchema.parse(body);
    return unwrapOrThrow(await this.service.assignEmployeeToCard(id, dto.employeeId, dto.isPrimary ?? false));
  }

  @ApiOperation({ summary: 'Unassign an employee from a card (soft)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Link not found' })
  @Delete(':id/assign/:employeeId')
  async unassign(
    @Param('id', ParseIntPipe) id: number,
    @Param('employeeId', ParseIntPipe) employeeId: number,
  ) {
    return unwrapOrThrow(await this.service.unassignEmployeeFromCard(id, employeeId));
  }

  @ApiOperation({ summary: "Card occupants' certificates + 30-day expiry (EP-ORG-047)" })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get(':id/certificates')
  async certificates(@Param('id', ParseIntPipe) id: number) {
    const data = unwrapOrInternal(await this.service.listCertificates(id));
    const items = Array.isArray(data) ? data : [];
    return { items, total: items.length };
  }

  @ApiOperation({ summary: 'Create card' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post()
  async create(@Body() body: unknown) {
    const dto = CardCreateSchema.parse(body) as CardInput;
    this.logger.log('Creating org card');
    return unwrapOrThrow(await this.service.create(dto));
  }

  @ApiOperation({ summary: 'Update card' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    const dto = CardUpdateSchema.parse(body) as CardInput;
    return unwrapOrThrow(await this.service.update(id, dto));
  }

  @ApiOperation({ summary: 'Soft-delete (archive) card' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrThrow(await this.service.softDelete(id));
  }
}
