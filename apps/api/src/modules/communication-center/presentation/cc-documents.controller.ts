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
 */

import {
  Body, Controller, Get, Param, Post, UseGuards, UseInterceptors, Res, Header,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { FastifyReply } from 'fastify';
import { Throttle } from '@nestjs/throttler';
import { z } from 'zod';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Roles } from '@common/decorators/roles.decorator';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { CcWorkflowService } from '../application/cc-workflow.service';
import { CcBasketsService } from '../application/cc-baskets.service';
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
});
const SendSchema     = z.object({ pin: z.string().regex(/^\d{4,8}$/) });
const ApproveSchema  = z.object({ pin: z.string().regex(/^\d{4,8}$/), comment: z.string().max(4000).optional() });
const RejectSchema   = z.object({
  pin: z.string().regex(/^\d{4,8}$/),
  rejectionReasonId: z.string().uuid().optional(),
  comment: z.string().max(4000).optional(),
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

@Throttle({ default: { limit: 100, ttl: 60_000 } })
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
  ) {}

  // ── PDF download ─────────────────────────────────────────────────
  @Get('documents/:id/pdf')
  @Header('Content-Type', 'application/pdf')
  async downloadPdf(@Param('id') id: string, @Res({ passthrough: true }) res: FastifyReply): Promise<Buffer> {
    const baseUrl = this.configService.get<string>('PUBLIC_BASE_URL') ?? 'http://localhost:3001';
    const bytes = await this.pdfSvc.generate(id, baseUrl);
    res.header('Content-Disposition', `attachment; filename="cc-${id.slice(-8)}.pdf"`);
    return Buffer.from(bytes);
  }

  // ── Templates ──────────────────────────────────────────────────────
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
  @Post('pin')
  async setPin(
    @Body(new ZodValidationPipe(SetPinSchema)) body: { pin: string },
    @CurrentUser() user: { id: number },
  ) {
    await this.pin.setPin(user.id, body.pin);
    return { ok: true };
  }

  @Get('pin/status')
  async pinStatus(@CurrentUser() user: { id: number }) {
    return { hasPin: await this.pin.hasPin(user.id) };
  }

  // ── Documents ──────────────────────────────────────────────────────
  @Post('documents/draft')
  draft(
    @Body(new ZodValidationPipe(CreateDraftSchema)) body: z.infer<typeof CreateDraftSchema>,
    @CurrentUser() user: { id: number },
  ) {
    return this.wf.createDraft(user.id, body);
  }

  @Get('documents/:id')
  getOne(@Param('id') id: string) {
    return this.baskets.getOne(id);
  }

  @Post('documents/:id/send')
  send(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(SendSchema)) body: { pin: string },
    @CurrentUser() user: { id: number },
  ) {
    return this.wf.sendDocument(id, user.id, body);
  }

  @Post('documents/:id/approve')
  approve(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(ApproveSchema)) body: { pin: string; comment?: string },
    @CurrentUser() user: { id: number },
  ) {
    return this.wf.approve(id, user.id, body);
  }

  @Post('documents/:id/reject')
  reject(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(RejectSchema)) body: { pin: string; rejectionReasonId?: string; comment?: string },
    @CurrentUser() user: { id: number },
  ) {
    return this.wf.reject(id, user.id, body);
  }

  @Post('documents/:id/resubmit')
  resubmit(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(ResubmitSchema)) body: { pin: string; aiBody: string; senderComment?: string },
    @CurrentUser() user: { id: number },
  ) {
    return this.wf.resubmit(id, user.id, body);
  }

  @Post('documents/:id/cancel')
  cancel(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(CancelSchema)) body: { pin: string; reason: string },
    @CurrentUser() user: { id: number },
  ) {
    return this.wf.cancel(id, user.id, body);
  }

  @Post('documents/:id/complaint')
  complaint(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(ComplaintSchema)) body: { reason: string },
    @CurrentUser() user: { id: number },
  ) {
    return this.wf.createComplaint(id, user.id, body.reason);
  }

  @Post('documents/:id/print')
  print(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(PrintSchema)) body: { reason: string },
    @CurrentUser() user: { id: number },
  ) {
    return this.wf.logPrint(id, user.id, body.reason);
  }
}
