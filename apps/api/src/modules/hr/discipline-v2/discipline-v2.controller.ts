/**
 * @module discipline-v2.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { Controller, UseGuards, Get, Post, Put, Patch, Delete, Body, Param, ParseIntPipe, Logger, UseInterceptors } from '@nestjs/common';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { Throttle } from '@nestjs/throttler';
import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';
import { DisciplineV2Service } from './discipline-v2.service';
import { DisciplineV2AbsenceService } from './discipline-v2-absence.service';
import { Roles } from '../../../common/decorators/roles.decorator';
import { unwrapOrInternal } from '@common/http-result';

const AddViolationSchema = z.object({
  employee_id:    z.number().int(),
  catalog_code:   z.string().min(1),
  violation_date: z.string().min(1),
  description:    z.string().min(1),
  issued_by:      z.number().int().optional(),
  fine_amount:    z.number().optional(),
});
class AddViolationDto extends createZodDto(AddViolationSchema) {}

const BlockEmployeeSchema = z.object({
  reason:     z.string().min(1),
  blocked_by: z.number().int().optional(),
});
class BlockEmployeeDto extends createZodDto(BlockEmployeeSchema) {}

const UnblockEmployeeSchema = z.object({
  unblocked_by: z.number().int().optional(),
  reason:       z.string().optional(),
});
class UnblockEmployeeDto extends createZodDto(UnblockEmployeeSchema) {}

const RecordAbsenceSchema = z.object({
  absence_date: z.string().min(1),
});
class RecordAbsenceDto extends createZodDto(RecordAbsenceSchema) {}

const ApproveViolationSchema = z.object({
  approved_by: z.number().int().optional(),
});
class ApproveViolationDto extends createZodDto(ApproveViolationSchema) {}

const ExcuseAbsenceSchema = z.object({
  excuse_reason:       z.string().min(1),
  excuse_document_url: z.string().url().optional(),
  excused_by:          z.number().int().optional(),
});
class ExcuseAbsenceDto extends createZodDto(ExcuseAbsenceSchema) {}

const CreateCatalogEntrySchema = z.object({
  code:                z.string().min(1),
  name:                z.string().min(1),
  category:            z.string().min(1),
  severity:            z.string().min(1),
  points_deducted:     z.number().optional(),
  default_fine_amount: z.number().optional(),
  description:         z.string().optional(),
});
class CreateCatalogEntryDto extends createZodDto(CreateCatalogEntrySchema) {}

const UpdateCatalogEntrySchema = z.object({
  name:                z.string().optional(),
  category:            z.string().optional(),
  severity:            z.string().optional(),
  points_deducted:     z.number().optional(),
  default_fine_amount: z.number().optional(),
  description:         z.string().optional(),
  is_active:           z.boolean().optional(),
});
class UpdateCatalogEntryDto extends createZodDto(UpdateCatalogEntrySchema) {}

@Roles('admin', 'manager', 'supervisor', 'hr_manager')
@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard)
@Controller('hr/discipline')
export class DisciplineV2Controller {
  private readonly logger = new Logger(DisciplineV2Controller.name);
  constructor(
    private readonly svc: DisciplineV2Service,
    private readonly absence: DisciplineV2AbsenceService,
  ) {}

  @Get('catalog')
  async getCatalog() {
    return unwrapOrInternal(await this.svc.getViolationCatalog());
  }

  @Post('catalog')
  async createCatalogEntry(@Body() body: CreateCatalogEntryDto) {
    return unwrapOrInternal(await this.svc.createCatalogEntry({
      code: body.code,
      name: body.name,
      category: body.category,
      severity: body.severity,
      pointsDeducted: body.points_deducted,
      defaultFineAmount: body.default_fine_amount,
      description: body.description,
    }));
  }

  @Put('catalog/:code')
  async updateCatalogEntry(@Param('code') code: string, @Body() body: UpdateCatalogEntryDto) {
    return unwrapOrInternal(await this.svc.updateCatalogEntry(code, {
      name: body.name,
      category: body.category,
      severity: body.severity,
      pointsDeducted: body.points_deducted,
      defaultFineAmount: body.default_fine_amount,
      description: body.description,
      isActive: body.is_active,
    }));
  }

  @Delete('catalog/:code')
  async deleteCatalogEntry(@Param('code') code: string) {
    return unwrapOrInternal(await this.svc.deleteCatalogEntry(code));
  }

  @Post()
  async addViolation(@Body() body: AddViolationDto) {
    return unwrapOrInternal(await this.svc.addViolation({
      employeeId: body.employee_id,
      catalogCode: body.catalog_code,
      violationDate: body.violation_date,
      description: body.description,
      issuedBy: body.issued_by || 1,
      fineAmount: body.fine_amount,
    }));
  }

  @Post('block/:employeeId')
  async blockEmployee(@Param('employeeId', ParseIntPipe) employeeId: number, @Body() body: BlockEmployeeDto) {
    return unwrapOrInternal(await this.svc.blockEmployee(employeeId, body.reason, body.blocked_by || 1));
  }

  @Patch('unblock/:employeeId')
  async unblockEmployee(@Param('employeeId', ParseIntPipe) employeeId: number, @Body() body: UnblockEmployeeDto) {
    return unwrapOrInternal(await this.svc.unblockEmployee(employeeId, body.unblocked_by || 1, body.reason ?? ''));
  }

  @Post('absence/:employeeId')
  async recordAbsence(@Param('employeeId', ParseIntPipe) employeeId: number, @Body() body: RecordAbsenceDto) {
    return unwrapOrInternal(await this.absence.recordAbsence(employeeId, body.absence_date));
  }

  @Get('blocked')
  async getBlocked() {
    return unwrapOrInternal(await this.absence.getBlockedEmployees());
  }

  @Get('check/:employeeId')
  async checkDisciplineStatus(@Param('employeeId', ParseIntPipe) employeeId: number) {
    return unwrapOrInternal(await this.absence.checkDisciplineStatus(employeeId));
  }

  @Get('employee/:id')
  async getEmployeeViolations(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrInternal(await this.absence.getEmployeeViolations(id));
  }

  @Patch(':id/acknowledge')
  async acknowledgeViolation(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrInternal(await this.absence.acknowledgeViolation(id));
  }

  @Patch(':id/approve')
  async approveViolation(@Param('id', ParseIntPipe) id: number, @Body() body: ApproveViolationDto) {
    return unwrapOrInternal(await this.absence.approveViolation(id, body.approved_by));
  }

  @Patch('absence/:id/excuse')
  async excuseAbsence(@Param('id', ParseIntPipe) id: number, @Body() body: ExcuseAbsenceDto) {
    return unwrapOrInternal(await this.absence.excuseAbsence(id, {
      excuseReason: body.excuse_reason,
      excuseDocumentUrl: body.excuse_document_url,
      excusedBy: body.excused_by,
    }));
  }
}
