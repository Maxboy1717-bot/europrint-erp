/**
 * @module erp-documents.controller
 * @description Erkin hujjatlar (free-form documents) CRUD — Phase A2. A CONSUMER of the
 * document-control layer: GET logs a 'view' via DocumentAccessLogService (STEP 3.3),
 * downloads are blocked by the global onSend hook (STEP 3.2), the FE renders inline + calls
 * /api/document-access/log for copy, and the watermark (3.4) is tier-gated on the viewer.
 * Owner-scoped: only the owner (or a privileged role) may read/update/delete a document.
 */

import {
  Body, Controller, Delete, ForbiddenException, Get, HttpCode, HttpStatus, NotFoundException, Param, Patch, Post, Req, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { z } from 'zod';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Roles } from '@common/decorators/roles.decorator';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { DocumentAccessLogService } from '@common/document-control/document-access-log.service';
import { ErpDocumentsRepository } from './erp-documents.repository';

// Decision #5 — printing is leadership-only (dept heads / leadership). admin/super_admin/
// director always bypass RolesGuard; the *_manager roles are the dept-head set.
const PRINT_ROLES = ['super_admin', 'director', 'manager', 'hr_manager', 'finance_manager', 'production_manager'];
const PrintSchema = z.object({ reason: z.string().trim().min(3).max(2000) }); // #4 — reason required

const TIER = z.enum(['oddiy', 'maxfiy', 'juda-maxfiy']);

const CreateSchema = z.object({
  title: z.string().trim().min(1).max(500),
  content: z.record(z.string(), z.unknown()), // TipTap/ProseMirror JSON doc
  contentHtml: z.string().max(500_000).optional(),
  sensitivityTier: TIER.default('oddiy'),
});
const UpdateSchema = z.object({
  title: z.string().trim().min(1).max(500).optional(),
  content: z.record(z.string(), z.unknown()).optional(),
  contentHtml: z.string().max(500_000).optional(),
  sensitivityTier: TIER.optional(),
});

const PRIVILEGED = new Set(['admin', 'super_admin', 'director']);

@ApiTags('Erkin hujjatlar')
@ApiBearerAuth()
@Controller('erp-documents')
@UseGuards(JwtAuthGuard)
export class ErpDocumentsController {
  constructor(
    private readonly repo: ErpDocumentsRepository,
    private readonly accessLog: DocumentAccessLogService,
  ) {}

  private canAccess(ownerId: number, user: { id: number; role?: string }): boolean {
    return ownerId === user.id || PRIVILEGED.has((user.role ?? '').toLowerCase());
  }

  @ApiOperation({ summary: "Yangi erkin hujjat yaratish" })
  @Post()
  async create(
    @Body(new ZodValidationPipe(CreateSchema)) body: z.infer<typeof CreateSchema>,
    @CurrentUser() user: { id: number },
  ) {
    return this.repo.create({
      title: body.title,
      content: body.content,
      contentHtml: body.contentHtml ?? null,
      sensitivityTier: body.sensitivityTier,
      ownerId: user.id,
    });
  }

  @ApiOperation({ summary: "Mening hujjatlarim" })
  @Get()
  async listMine(@CurrentUser() user: { id: number }) {
    return this.repo.listByOwner(user.id);
  }

  @ApiOperation({ summary: "Bitta hujjat (ko'rish jurnalga yoziladi)" })
  @Get(':id')
  async getOne(
    @Param('id') id: string,
    @CurrentUser() user: { id: number; role?: string },
    @Req() req: FastifyRequest,
  ) {
    const doc = await this.repo.getById(id);
    if (!doc) throw new NotFoundException('Hujjat topilmadi');
    if (!this.canAccess(doc.owner_id, user)) throw new ForbiddenException("Bu hujjatni ko'rish huquqingiz yo'q");
    // Doc Control #7: every view logged; tier resolved server-side.
    await this.accessLog.logFromReq(req, { documentType: 'erp_document', documentId: id, action: 'view' });
    return doc;
  }

  @ApiOperation({ summary: "Hujjatni tahrirlash (versiya oshadi)" })
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateSchema)) body: z.infer<typeof UpdateSchema>,
    @CurrentUser() user: { id: number; role?: string },
  ) {
    const doc = await this.repo.getById(id);
    if (!doc) throw new NotFoundException('Hujjat topilmadi');
    if (!this.canAccess(doc.owner_id, user)) throw new ForbiddenException("Bu hujjatni tahrirlash huquqingiz yo'q");
    const updated = await this.repo.update(id, {
      title: body.title,
      content: body.content,
      contentHtml: body.contentHtml,
      sensitivityTier: body.sensitivityTier,
    });
    if (!updated) throw new NotFoundException('Hujjat topilmadi');
    return updated;
  }

  @ApiOperation({ summary: "Hujjatni chop etish (sabab majburiy, rahbariyat)" })
  @Post(':id/print')
  @HttpCode(HttpStatus.OK)
  @Roles(...PRINT_ROLES)
  async print(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(PrintSchema)) body: z.infer<typeof PrintSchema>,
    @CurrentUser() user: { id: number; role?: string },
    @Req() req: FastifyRequest,
  ) {
    const doc = await this.repo.getById(id);
    if (!doc) throw new NotFoundException('Hujjat topilmadi');
    if (!this.canAccess(doc.owner_id, user)) throw new ForbiddenException("Bu hujjatni chop etish huquqingiz yo'q");
    // Decision #4/#7 — every print logged with the reason + tier (server-resolved).
    await this.accessLog.logFromReq(req, { documentType: 'erp_document', documentId: id, action: 'print', reason: body.reason });
    return { ok: true };
  }

  @ApiOperation({ summary: "Hujjatni o'chirish (soft-delete)" })
  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: { id: number; role?: string }) {
    const doc = await this.repo.getById(id);
    if (!doc) throw new NotFoundException('Hujjat topilmadi');
    if (!this.canAccess(doc.owner_id, user)) throw new ForbiddenException("Bu hujjatni o'chirish huquqingiz yo'q");
    await this.repo.softDelete(id);
    return { ok: true };
  }
}
