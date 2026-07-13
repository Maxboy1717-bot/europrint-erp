/**
 * /api/cc/documents/*  —  Communication Center hujjat endpointlari
 *
 *   POST /api/cc/documents/draft           — qoralama yaratish
 *   GET  /api/cc/documents/:id             — bitta hujjat
 *   POST /api/cc/documents/:id/send        — rasmiy yuborish (PIN)
 *   POST /api/cc/documents/:id/approve     — tasdiqlash (PIN)
 *   POST /api/cc/documents/:id/reject      — rad etish (PIN + sabab)
 *   POST /api/cc/documents/:id/resubmit    — qayta yuborish (PIN + yangi matn)
 *   POST /api/cc/documents/:id/cancel      — bekor qilish (PIN + sabab)
 *   POST /api/cc/documents/:id/complaint   — direktorga shikoyat
 *   POST /api/cc/documents/:id/print       — chop etish jurnalga yozish (sabab majburiy)
 *
 *   POST /api/cc/pin                       — PIN o'rnatish/o'zgartirish
 *   GET  /api/cc/pin/status                — PIN o'rnatilganmi?
 *
 *   GET    /api/cc/templates               — shablonlar ro'yxati (faol)
 *   POST   /api/cc/templates               — shablon yaratish (super_admin, 2026-07-13)
 *   PATCH  /api/cc/templates/:id           — shablon tahrirlash (super_admin, 2026-07-13)
 *   DELETE /api/cc/templates/:id           — shablonni deaktivatsiya (super_admin, 2026-07-13)
 */

import {
  Body, Controller, Delete, ForbiddenException, Get, NotFoundException, Param, Patch, Post, UseGuards, UseInterceptors, Res, Header, Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { DocumentAccessLogService } from '@common/document-control/document-access-log.service';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { z } from 'zod';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Roles } from '@common/decorators/roles.decorator';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { unwrapOrThrow } from '@common/http-result';
import { CcRetentionService } from '../application/cc-retention.service';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { CcWorkflowService } from '../application/cc-workflow.service';
import { CcBasketsService } from '../application/cc-baskets.service';
import { CcDocumentsRepository } from '../infrastructure/repositories/cc-documents.repo';
import { CcPinService } from '../application/cc-pin.service';
import { CcPdfService } from '../application/cc-pdf.service';

// ── DTO schemas ───────────────────────────────────────────────────────
const CreateDraftSchema = z.object({
  templateId:    z.string().uuid(),
  subject:       z.string().min(1).max(500),
  aiBody:        z.string().min(1),
  aiAnswers:     z.record(z.unknown()).optional(),
  senderComment: z.string().max(4000).optional(),
  priority:      z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  language:      z.enum(['uz', 'ru']).optional(),
  branchId:      z.string().uuid().optional(),
  parentDocumentId: z.string().uuid().optional(),
});
const SendSchema     = z.object({ pin: z.string().regex(/^\d{4,8}$/) });
// 20-cc#89: referenceDocumentNumber majburiy — qaysi hujjatga asoslanib qaror qilinganini yozadi.
const ApproveSchema  = z.object({
  pin: z.string().regex(/^\d{4,8}$/),
  comment: z.string().max(4000).optional(),
  referenceDocumentNumber: z.string().min(1).max(100),
});
const RejectSchema   = z.object({
  pin: z.string().regex(/^\d{4,8}$/),
  rejectionReasonId: z.string().uuid().optional(),
  comment: z.string().max(4000).optional(),
  referenceDocumentNumber: z.string().min(1).max(100),
});
const ResubmitSchema = z.object({
  pin: z.string().regex(/^\d{4,8}$/),
  aiBody: z.string().min(1),
  senderComment: z.string().max(4000).optional(),
});
const CancelSchema   = z.object({
  pin: z.string().regex(/^\d{4,8}$/),
  reason: z.string().min(3).max(2000),
});
const ComplaintSchema = z.object({ reason: z.string().min(5).max(4000) });
const PrintSchema     = z.object({ reason: z.string().min(3).max(2000) });
const SetPinSchema    = z.object({ pin: z.string().regex(/^\d{4,8}$/) });

// ── Template admin schemas (owner decision 2026-07-13: super_admin only) ───
// Field shape mirrors cc_document_templates columns (verified live via \d) and
// AiQuestion (cc-ai-interview.types.ts) — no fabricated/invented fields.
const AiQuestionSchema = z.object({
  key:      z.string().min(1).max(100),
  qUz:      z.string().min(1),
  qRu:      z.string().min(1),
  required: z.boolean(),
  type:     z.enum(['text', 'choice', 'date', 'number']),
  choices:  z.array(z.string()).optional(),
});
const CreateCcTemplateSchema = z.object({
  code:                 z.string().trim().min(1).max(60),
  nameUz:               z.string().trim().min(1).max(200),
  nameRu:               z.string().trim().min(1).max(200),
  category:             z.string().trim().min(1).max(30),
  // CC gap fix (docs/audit/CC-COMPLETE-FRESH-ANALYSIS-2026-07-11.md #25): soft-reference to
  // taxonomy_entries(category='document_type'/'contact_type', code) — no FK, matched by
  // category+code (project convention, schema-kanban.ts kanban_cards.task_type comment).
  // Max 60 matches taxonomy_entries.code's live width. NULL/omitted = not yet classified.
  documentTypeCode:     z.string().trim().min(1).max(60).nullable().optional(),
  contactTypeCode:      z.string().trim().min(1).max(60).nullable().optional(),
  aiQuestions:          z.array(AiQuestionSchema).optional(),
  htmlTemplate:         z.string().optional(),
  defaultPriority:      z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  maxFileSizeMb:        z.number().int().positive().optional(),
  allowedFileTypes:     z.array(z.string()).optional(),
  printRequiresReason:  z.boolean().optional(),
  cooldownDays:         z.number().int().nonnegative().optional(),
  archiveAfterDays:     z.number().int().nonnegative().optional(),
  numberFormat:         z.string().trim().min(1).max(60).optional(),
  inboxSlaHours:        z.number().int().positive().optional(),
  reminderHours:        z.number().int().positive().optional(),
  escalationHours:      z.number().int().positive().optional(),
  isRecurring:          z.boolean().optional(),
  cronExpression:       z.string().max(60).optional(),
  testMode:             z.boolean().optional(),
  isActive:             z.boolean().optional(),
});
// version is deliberately excluded — see CreateTemplateInput doc comment
// (cc-documents/types.ts): it is a workflow-routing key owned by a separate flow.
const UpdateCcTemplateSchema = CreateCcTemplateSchema.partial();

@ApiThrottle()
@ApiTags('Cc Documents')
@ApiBearerAuth()
@Controller('cc')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles('admin', 'manager', 'supervisor', 'director', 'ceo', 'employee', 'accountant')
export class CcDocumentsController {
  constructor(
    private readonly wf:      CcWorkflowService,
    private readonly baskets: CcBasketsService,
    private readonly pin:     CcPinService,
    private readonly pdfSvc:  CcPdfService,
    private readonly configService: ConfigService,
    private readonly retention: CcRetentionService,
    private readonly docsRepo: CcDocumentsRepository,
    private readonly accessLog: DocumentAccessLogService,
  ) {}

  // ── Batch 5 Item 3 — arxiv-saqlash muddati (EP-CC-016) + imzo-hash yaxlitligi ──
  @ApiOperation({ summary: 'Get document retention (leader 10y / worker 3y)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('documents/:id/retention')
  async getRetention(@Param('id') id: string) {
    return unwrapOrThrow(await this.retention.getRetention(id));
  }

  @ApiOperation({ summary: 'Archive a document + set retention (immutable, no re-archive)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 409, description: 'Already archived' })
  @Patch('documents/:id/archive')
  @Roles('admin', 'super_admin', 'director', 'manager')
  async archive(@Param('id') id: string) {
    return unwrapOrThrow(await this.retention.archiveWithRetention(id));
  }

  @ApiOperation({ summary: 'Verify an approval signature hash (tamper-evidence)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('approvals/:id/verify')
  async verifySignature(@Param('id') id: string) {
    return unwrapOrThrow(await this.retention.verifySignature(id));
  }

  // ── PDF download ─────────────────────────────────────────────────
  @ApiOperation({ summary: 'Download pdf' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('documents/:id/pdf')
  @Header('Content-Type', 'application/pdf')
  async downloadPdf(@Param('id') id: string, @Res({ passthrough: true }) res: FastifyReply, @Req() req: FastifyRequest): Promise<Buffer> {
    const baseUrl = this.configService.get<string>('PUBLIC_BASE_URL') ?? 'http://localhost:3001';
    const bytes = await this.pdfSvc.generate(id, baseUrl);
    // NB: the download-block hook (STEP 3.2) rewrites this attachment -> inline unless the
    // route is allowlisted (CC pdf is NOT) — so this renders in-app; still logged as a view.
    res.header('Content-Disposition', `attachment; filename="cc-${id.slice(-8)}.pdf"`);
    await this.accessLog.logFromReq(req, { documentType: 'cc', documentId: id, action: 'view' });
    return Buffer.from(bytes);
  }

  // ── Templates ──────────────────────────────────────────────────────
  @ApiOperation({ summary: 'List templates' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('templates')
  async listTemplates() {
    const { runQuery } = await import('@shared/db');
    const { sql } = await import('drizzle-orm');
    const r = await runQuery<Record<string, unknown>>(sql`
      SELECT id::text         AS id,
             code,
             name_uz          AS "nameUz",
             name_ru          AS "nameRu",
             category,
             default_priority AS "defaultPriority"
      FROM cc_document_templates
      WHERE is_active = true
      ORDER BY code
    `);
    return r.rows;
  }

  // ── Template admin (owner decision 2026-07-13: super_admin only) ────────
  // Method-level @Roles('super_admin') overrides the class-level allow-list
  // (same override mechanism the 'archive' route above already relies on).
  @ApiOperation({ summary: 'Create a document template (super_admin only)' })
  @ApiResponse({ status: 201, description: 'Created' })
  @ApiResponse({ status: 409, description: 'Template code already exists' })
  @Post('templates')
  @Roles('super_admin')
  async createTemplate(
    @Body(new ZodValidationPipe(CreateCcTemplateSchema)) body: z.infer<typeof CreateCcTemplateSchema>,
  ) {
    return unwrapOrThrow(await this.docsRepo.createTemplate(body));
  }

  @ApiOperation({ summary: 'Update a document template (super_admin only)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 409, description: 'Template code already exists' })
  @Patch('templates/:id')
  @Roles('super_admin')
  async updateTemplate(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateCcTemplateSchema)) body: z.infer<typeof UpdateCcTemplateSchema>,
  ) {
    return unwrapOrThrow(await this.docsRepo.updateTemplate(id, body));
  }

  @ApiOperation({ summary: 'Delete (deactivate) a document template (super_admin only)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Delete('templates/:id')
  @Roles('super_admin')
  async deleteTemplate(@Param('id') id: string) {
    return unwrapOrThrow(await this.docsRepo.deleteTemplate(id));
  }

  @ApiOperation({ summary: 'List rejection reasons' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('documents/:id/rejection-reasons')
  async listRejectionReasons(@Param('id') docId: string) {
    const { runQuery } = await import('@shared/db');
    const { sql } = await import('drizzle-orm');
    const r = await runQuery<Record<string, unknown>>(sql`
      SELECT rr.id::text AS id,
             rr.reason_uz, rr.reason_ru
      FROM cc_rejection_reasons rr
      INNER JOIN cc_documents d ON d.template_id = rr.template_id
      WHERE d.id = ${docId} AND rr.is_active = true
      ORDER BY rr.sort_order ASC
    `);
    return r.rows;
  }

  // ── PIN ────────────────────────────────────────────────────────────
  @ApiOperation({ summary: 'Set pin' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('pin')
  async setPin(
    @Body(new ZodValidationPipe(SetPinSchema)) body: { pin: string },
    @CurrentUser() user: { id: number },
  ) {
    await this.pin.setPin(user.id, body.pin);
    return { ok: true };
  }

  @ApiOperation({ summary: 'Pin status' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('pin/status')
  async pinStatus(@CurrentUser() user: { id: number }) {
    return { hasPin: await this.pin.hasPin(user.id) };
  }

  // ── Documents ──────────────────────────────────────────────────────
  @ApiOperation({ summary: 'Draft' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('documents/draft')
  draft(
    @Body(new ZodValidationPipe(CreateDraftSchema)) body: z.infer<typeof CreateDraftSchema>,
    @CurrentUser() user: { id: number },
  ) {
    return this.wf.createDraft(user.id, body);
  }

  // 20-cc#39/76: bu route xuddi shu hujjatga cc-baskets.controller.ts:101 GET /baskets/:id
  // bilan bir xil ma'lumotni beradi, lekin ownership-tekshiruvsiz edi (istalgan autentifikatsiya
  // qilingan foydalanuvchi istalgan hujjatni o'qiy olardi) — cc-baskets.controller.ts:107-109
  // dagi bilan bir xil tekshiruvni qo'shdim (yuboruvchi/savat-egasi/imtiyozli rol).
  @ApiOperation({ summary: 'Get one' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('documents/:id')
  async getOne(@Param('id') id: string, @CurrentUser() user: { id: number; role: string }, @Req() req: FastifyRequest) {
    const doc = await this.baskets.getOne(id);
    if (!doc) throw new NotFoundException('Hujjat topilmadi');
    const isPrivileged = ['admin', 'super_admin', 'director', 'ceo'].includes(user.role);
    const isParticipant = doc.senderUserId === user.id || doc.basketOwnerUserId === user.id;
    if (!isPrivileged && !isParticipant) {
      throw new ForbiddenException('Bu hujjatni ko\'rish huquqingiz yo\'q');
    }
    // 20-cc#47: birinchi ko'rish vaqti — faqat shu ERP web yo'l orqali (Telegram bot bu yerni chaqirmaydi).
    await this.docsRepo.markViewed(id, 'erp_web');
    // Doc Control #7: every view logged (who opened which document, when) — tier resolved server-side.
    await this.accessLog.logFromReq(req, { documentType: 'cc', documentId: id, action: 'view' });
    return doc;
  }

  @ApiOperation({ summary: 'Send' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('documents/:id/send')
  send(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(SendSchema)) body: { pin: string },
    @CurrentUser() user: { id: number },
  ) {
    return this.wf.sendDocument(id, user.id, body);
  }

  @ApiOperation({ summary: 'Approve' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('documents/:id/approve')
  approve(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(ApproveSchema)) body: { pin: string; comment?: string; referenceDocumentNumber: string },
    @CurrentUser() user: { id: number },
  ) {
    return this.wf.approve(id, user.id, body);
  }

  @ApiOperation({ summary: 'Reject' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('documents/:id/reject')
  reject(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(RejectSchema)) body: { pin: string; rejectionReasonId?: string; comment?: string; referenceDocumentNumber: string },
    @CurrentUser() user: { id: number },
  ) {
    return this.wf.reject(id, user.id, body);
  }

  @ApiOperation({ summary: 'Resubmit' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('documents/:id/resubmit')
  resubmit(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(ResubmitSchema)) body: { pin: string; aiBody: string; senderComment?: string },
    @CurrentUser() user: { id: number },
  ) {
    return this.wf.resubmit(id, user.id, body);
  }

  @ApiOperation({ summary: 'Cancel' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('documents/:id/cancel')
  cancel(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(CancelSchema)) body: { pin: string; reason: string },
    @CurrentUser() user: { id: number },
  ) {
    return this.wf.cancel(id, user.id, body);
  }

  @ApiOperation({ summary: 'Complaint' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('documents/:id/complaint')
  complaint(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(ComplaintSchema)) body: { reason: string },
    @CurrentUser() user: { id: number },
  ) {
    return this.wf.createComplaint(id, user.id, body.reason);
  }

  @ApiOperation({ summary: 'Print' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('documents/:id/print')
  async print(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(PrintSchema)) body: { reason: string },
    @CurrentUser() user: { id: number },
    @Req() req: FastifyRequest,
  ) {
    const result = await this.wf.logPrint(id, user.id, body.reason);
    // Doc Control #4: print requires a reason (PrintSchema enforces it) + is logged centrally.
    await this.accessLog.logFromReq(req, { documentType: 'cc', documentId: id, action: 'print', reason: body.reason });
    return result;
  }
}
