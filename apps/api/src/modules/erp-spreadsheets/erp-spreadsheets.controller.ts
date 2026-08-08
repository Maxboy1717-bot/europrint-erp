/**
 * @module erp-spreadsheets.controller
 * @description Jadval (spreadsheets) CRUD — Phase B-2. A CONSUMER of the document-control
 * layer (mirrors erp-documents): GET logs a 'view' via DocumentAccessLogService with
 * document_type='erp_spreadsheet'; gated print (reason + leadership + logged); downloads
 * blocked by the global hook; watermark tier-gated on the FE grid. Owner-scoped.
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
import { ErpSpreadsheetsRepository } from './erp-spreadsheets.repository';

const TIER = z.enum(['oddiy', 'maxfiy', 'juda-maxfiy']);
const CreateSchema = z.object({
  title: z.string().trim().min(1).max(500),
  cells: z.record(z.string(), z.unknown()), // { "A1": {v,f}, ... }
  sensitivityTier: TIER.default('oddiy'),
});
const UpdateSchema = z.object({
  title: z.string().trim().min(1).max(500).optional(),
  cells: z.record(z.string(), z.unknown()).optional(),
  sensitivityTier: TIER.optional(),
});
const PrintSchema = z.object({ reason: z.string().trim().min(3).max(2000) });

const PRIVILEGED = new Set(['admin', 'super_admin', 'director']);
const PRINT_ROLES = ['super_admin', 'director', 'manager', 'hr_manager', 'finance_manager', 'production_manager'];

@ApiTags('Jadvallar')
@ApiBearerAuth()
@Controller('erp-spreadsheets')
@UseGuards(JwtAuthGuard)
export class ErpSpreadsheetsController {
  constructor(
    private readonly repo: ErpSpreadsheetsRepository,
    private readonly accessLog: DocumentAccessLogService,
  ) {}

  private canAccess(ownerId: number, user: { id: number; role?: string }): boolean {
    return ownerId === user.id || PRIVILEGED.has((user.role ?? '').toLowerCase());
  }

  @ApiOperation({ summary: 'Yangi jadval yaratish' })
  @Post()
  async create(
    @Body(new ZodValidationPipe(CreateSchema)) body: z.infer<typeof CreateSchema>,
    @CurrentUser() user: { id: number },
  ) {
    return this.repo.create({ title: body.title, cells: body.cells, sensitivityTier: body.sensitivityTier, ownerId: user.id });
  }

  @ApiOperation({ summary: 'Mening jadvallarim' })
  @Get()
  async listMine(@CurrentUser() user: { id: number }) {
    return this.repo.listByOwner(user.id);
  }

  @ApiOperation({ summary: "Bitta jadval (ko'rish jurnalga yoziladi)" })
  @Get(':id')
  async getOne(@Param('id') id: string, @CurrentUser() user: { id: number; role?: string }, @Req() req: FastifyRequest) {
    const doc = await this.repo.getById(id);
    if (!doc) throw new NotFoundException('Jadval topilmadi');
    if (!this.canAccess(doc.owner_id, user)) throw new ForbiddenException("Bu jadvalni ko'rish huquqingiz yo'q");
    await this.accessLog.logFromReq(req, { documentType: 'erp_spreadsheet', documentId: id, action: 'view' });
    return doc;
  }

  @ApiOperation({ summary: 'Jadvalni tahrirlash (versiya oshadi)' })
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateSchema)) body: z.infer<typeof UpdateSchema>,
    @CurrentUser() user: { id: number; role?: string },
  ) {
    const doc = await this.repo.getById(id);
    if (!doc) throw new NotFoundException('Jadval topilmadi');
    if (!this.canAccess(doc.owner_id, user)) throw new ForbiddenException("Bu jadvalni tahrirlash huquqingiz yo'q");
    const updated = await this.repo.update(id, { title: body.title, cells: body.cells, sensitivityTier: body.sensitivityTier });
    if (!updated) throw new NotFoundException('Jadval topilmadi');
    return updated;
  }

  @ApiOperation({ summary: 'Jadvalni chop etish (sabab majburiy, rahbariyat)' })
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
    if (!doc) throw new NotFoundException('Jadval topilmadi');
    if (!this.canAccess(doc.owner_id, user)) throw new ForbiddenException("Bu jadvalni chop etish huquqingiz yo'q");
    await this.accessLog.logFromReq(req, { documentType: 'erp_spreadsheet', documentId: id, action: 'print', reason: body.reason });
    return { ok: true };
  }

  @ApiOperation({ summary: "Jadvalni o'chirish (soft-delete)" })
  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: { id: number; role?: string }) {
    const doc = await this.repo.getById(id);
    if (!doc) throw new NotFoundException('Jadval topilmadi');
    if (!this.canAccess(doc.owner_id, user)) throw new ForbiddenException("Bu jadvalni o'chirish huquqingiz yo'q");
    await this.repo.softDelete(id);
    return { ok: true };
  }
}
