/**
 * @module document-workflow.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { Controller, Delete, HttpCode, HttpStatus, NotFoundException, UseGuards, Post, Get, Patch, Body, Param, ParseIntPipe, Query, Logger, UseInterceptors } from '@nestjs/common';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { Throttle } from '@nestjs/throttler';
import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';
import { Public } from '@common/decorators/public.decorator';
import { DocumentWorkflowService } from './document-workflow.service';
import { Roles } from '../../../common/decorators/roles.decorator';
import { unwrapOrInternal } from '@common/http-result';

const CreateDocumentSchema = z.object({
  employee_id:   z.number().int(),
  document_type: z.string().min(1),
  title:         z.string().min(1),
  content:       z.record(z.unknown()).optional(),
  pdf_url:       z.string().optional(),
  file_url:      z.string().optional(),
  initiated_by:  z.number().int().optional(),
});
class CreateDocumentDto extends createZodDto(CreateDocumentSchema) {}

const SubmitDocumentSchema = z.object({
  submitted_by: z.number().int().optional(),
});
class SubmitDocumentDto extends createZodDto(SubmitDocumentSchema) {}

const ApproveStepSchema = z.object({
  approver_id: z.number().int().optional(),
  notes:       z.string().optional(),
});
class ApproveStepDto extends createZodDto(ApproveStepSchema) {}

const RejectStepSchema = z.object({
  rejected_by:       z.number().int().optional(),
  rejection_reason:  z.string().min(1),
});
class RejectStepDto extends createZodDto(RejectStepSchema) {}

const ListQuerySchema = z.object({
  limit: z.string().optional(),
});
class ListQueryDto extends createZodDto(ListQuerySchema) {}

@Roles('admin', 'manager', 'supervisor', 'employee', 'hr_manager')
@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard)
@Controller('hr-v2/documents')
export class DocumentWorkflowController {
  private readonly logger = new Logger(DocumentWorkflowController.name);
  constructor(private readonly svc: DocumentWorkflowService) {}

  @Post()
  async create(@Body() body: CreateDocumentDto) {
    return unwrapOrInternal(await this.svc.createDocument({
      employeeId: body.employee_id,
      documentType: body.document_type,
      title: body.title,
      content: body.content,
      pdfUrl: body.pdf_url || body.file_url,
      initiatedBy: body.initiated_by || 1,
    }));
  }

  @Patch(':id/submit')
  async submit(@Param('id', ParseIntPipe) id: number, @Body() body: SubmitDocumentDto) {
    return unwrapOrInternal(await this.svc.submitDocument(id, body.submitted_by || 1));
  }

  @Patch('steps/:stepId/approve')
  async approveStep(@Param('stepId', ParseIntPipe) stepId: number, @Body() body: ApproveStepDto) {
    return unwrapOrInternal(await this.svc.approveStep(stepId, body.approver_id || 1, body.notes));
  }

  @Patch('steps/:stepId/reject')
  async rejectStep(@Param('stepId', ParseIntPipe) stepId: number, @Body() body: RejectStepDto) {
    return unwrapOrInternal(await this.svc.rejectStep(stepId, body.rejected_by || 1, body.rejection_reason));
  }

  @Get('employee/:employeeId')
  async getByEmployee(@Param('employeeId', ParseIntPipe) employeeId: number) {
    return unwrapOrInternal(await this.svc.getDocumentsByEmployee(employeeId));
  }

  @Get()
  async list(@Query() query: ListQueryDto) {
    return unwrapOrInternal(await this.svc.listDocuments(Number(query?.limit ?? 50) || 50));
  }

  @Get('employee')
  async getEmployeeDocuments() { return { data: [], total: 0 }; }

  @Get('pending')
  async getPendingDocuments() { return { data: [], total: 0 }; }

  @Get('admin/workflow-routes')
  async getAdminWorkflowRoutes() { return { data: [], total: 0 }; }

  @Get('admin/workflow-routes/:id')
  async getAdminWorkflowRouteById(@Param('id') id: string) { return { id, steps: [] }; }

  @Patch('admin/workflow-routes/:id/toggle')
  async toggleAdminWorkflowRoute(@Param('id') id: string) { return { id, active: true }; }

  @Post('admin/workflow-routes')
  @HttpCode(HttpStatus.CREATED)
  async createAdminWorkflowRoute(@Body() body: Record<string, unknown>) { return { id: Date.now(), ...body, created: true }; }

  @Delete('admin/workflow-routes/:id')
  @HttpCode(HttpStatus.OK)
  async deleteAdminWorkflowRoute(@Param('id') id: string) { return { id, deleted: true }; }

  @Get(':id')
  async getDocumentById(@Param('id', ParseIntPipe) id: number) {
    const result = await this.svc.getDocumentById(id);
    if (!result.ok || !result.data) throw new NotFoundException(`Hujjat #${id} topilmadi`);
    return result.data;
  }
}
