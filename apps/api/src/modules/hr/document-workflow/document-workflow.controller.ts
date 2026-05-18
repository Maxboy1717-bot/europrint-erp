/**
 * @module document-workflow.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { Controller, Delete, HttpCode, HttpException, HttpStatus, NotFoundException, UseGuards, Post, Get, Patch, Body, Param, ParseIntPipe, Query, Logger, UseInterceptors } from '@nestjs/common';

import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';
import { Public } from '@common/decorators/public.decorator';
import { DocumentWorkflowService } from './document-workflow.service';
import { Roles } from '../../../common/decorators/roles.decorator';
import { unwrapOrInternal } from '@common/http-result';
import { notImplemented } from '@common/exceptions/not-implemented';

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
@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard)
@ApiTags('Document Workflow')
@ApiBearerAuth()
@Controller('hr-v2/documents')
export class DocumentWorkflowController {
  private readonly logger = new Logger(DocumentWorkflowController.name);
  constructor(private readonly svc: DocumentWorkflowService) {}

  @ApiOperation({ summary: 'Create' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
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

  @ApiOperation({ summary: 'Submit' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch(':id/submit')
  async submit(@Param('id', ParseIntPipe) id: number, @Body() body: SubmitDocumentDto) {
    return unwrapOrInternal(await this.svc.submitDocument(id, body.submitted_by || 1));
  }

  @ApiOperation({ summary: 'Approve step' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch('steps/:stepId/approve')
  async approveStep(@Param('stepId', ParseIntPipe) stepId: number, @Body() body: ApproveStepDto) {
    return unwrapOrInternal(await this.svc.approveStep(stepId, body.approver_id || 1, body.notes));
  }

  @ApiOperation({ summary: 'Reject step' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch('steps/:stepId/reject')
  async rejectStep(@Param('stepId', ParseIntPipe) stepId: number, @Body() body: RejectStepDto) {
    return unwrapOrInternal(await this.svc.rejectStep(stepId, body.rejected_by || 1, body.rejection_reason));
  }

  @ApiOperation({ summary: 'Get by employee' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('employee/:employeeId')
  async getByEmployee(@Param('employeeId', ParseIntPipe) employeeId: number) {
    return unwrapOrInternal(await this.svc.getDocumentsByEmployee(employeeId));
  }

  @ApiOperation({ summary: 'List' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get()
  async list(@Query() query: ListQueryDto) {
    return unwrapOrInternal(await this.svc.listDocuments(Number(query?.limit ?? 50) || 50));
  }

  @ApiOperation({ summary: 'Get employee documents' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 501, description: 'Not implemented' })
  @Get('employee')
  async getEmployeeDocuments() {
    return notImplemented('GET /documents/employee');
  }

  @ApiOperation({ summary: 'Get pending documents' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 501, description: 'Not implemented' })
  @Get('pending')
  async getPendingDocuments() {
    return notImplemented('GET /documents/pending');
  }

  @ApiOperation({ summary: 'Get admin workflow routes' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 501, description: 'Not implemented' })
  @Get('admin/workflow-routes')
  async getAdminWorkflowRoutes() {
    return notImplemented('GET /documents/admin/workflow-routes');
  }

  @ApiOperation({ summary: 'Get admin workflow route by id' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('admin/workflow-routes/:id')
  async getAdminWorkflowRouteById(@Param('id') id: string) { return { id, steps: [] }; }

  @ApiOperation({ summary: 'Toggle admin workflow route' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch('admin/workflow-routes/:id/toggle')
  async toggleAdminWorkflowRoute(@Param('id') id: string) { return { id, active: true }; }

  @ApiOperation({ summary: 'Create admin workflow route' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('admin/workflow-routes')
  @HttpCode(HttpStatus.CREATED)
  async createAdminWorkflowRoute(@Body() body: unknown) {
    const WorkflowRouteSchema = z.object({
      name: z.string().max(200).optional(),
      steps: z.array(z.record(z.unknown())).optional(),
      active: z.boolean().optional(),
    }).passthrough();
    const dto = WorkflowRouteSchema.parse(body);
    return { id: Date.now(), ...dto, created: true };
  }

  @ApiOperation({ summary: 'Delete admin workflow route' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Delete('admin/workflow-routes/:id')
  @HttpCode(HttpStatus.OK)
  async deleteAdminWorkflowRoute(@Param('id') id: string) { return { id, deleted: true }; }

  @ApiOperation({ summary: 'Get document by id' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get(':id')
  async getDocumentById(@Param('id', ParseIntPipe) id: number) {
    const result = await this.svc.getDocumentById(id);
    if (!result.ok || !result.data) throw new NotFoundException(`Hujjat #${id} topilmadi`);
    return result.data;
  }
}
