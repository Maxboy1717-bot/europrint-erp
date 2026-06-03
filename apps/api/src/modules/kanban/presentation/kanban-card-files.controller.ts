/**
 * @module kanban-card-files.controller
 * @description File/result/time-tracking endpoints split from kanban-cards.controller.ts (Rule 16).
 * Mounted at the same /kanban path alongside KanbanCardsController.
 */

import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import {
  Controller, Get, Post, Delete, Param, Body, Req, Res,
  UseGuards, UseInterceptors, Logger, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import type { FastifyRequest, FastifyReply } from 'fastify';
import * as path from 'path';
import * as fs from 'fs';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { unwrapOrBadRequest } from '@common/http-result';
import { z } from 'zod';
import { KanbanExtService } from '../application/kanban-ext.service';

const AddResultSchema = z.object({
  description: z.string().max(5000).optional(),
}).passthrough();

const StartTimeSchema = z.object({
  description: z.string().max(2000).optional(),
}).passthrough();

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25 MB
const ALLOWED_UPLOAD_EXT = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg',
  '.pdf', '.docx', '.xlsx', '.csv', '.txt',
  '.mp4', '.webm', '.ogg', '.mp3', '.wav',
]);

@ApiTags('§16 Kanban Extended')
@ApiBearerAuth()
@ApiThrottle()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('kanban')
@Roles('super_admin', 'director', 'manager', 'employee')
export class KanbanCardFilesController {
  private readonly logger = new Logger(KanbanCardFilesController.name);

  constructor(private readonly svc: KanbanExtService) {}

  // ─── Results ──────────────────────────────────────────────────────────────

  @Get('cards/:id/results')
  @ApiOperation({ summary: 'Karta natijalari' })
  async getCardResults(@Param('id') id: string) {
    return unwrapOrBadRequest(await this.svc.getCardResults(id));
  }

  @Post('cards/:id/results')
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: 'Kartaga natija qo\'shish' })
  async addCardResult(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() user: { id: number },
  ) {
    const dto = AddResultSchema.parse(body);
    return unwrapOrBadRequest(
      await this.svc.createResult(id, user?.id ?? 0, dto.description),
    );
  }

  @Get('results/:resultId/files')
  @ApiOperation({ summary: 'Natija fayllari' })
  async getResultFiles(@Param('resultId') resultId: string) {
    const result = await this.svc.getResultFiles(resultId);
    if (!result.ok) return { data: [], resultId };
    return { data: result.data, resultId };
  }

  @Post('results/:resultId/files')
  @UseInterceptors(AuditInterceptor)
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiOperation({ summary: 'Natijaga fayl biriktirish' })
  async uploadResultFile(
    @Param('resultId') resultId: string,
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
  ) {
    const contentType = String(req.headers['content-type'] ?? '');

    if (contentType.includes('multipart/form-data')) {
      type MultipartFile = { filename: string; mimetype: string; toBuffer(): Promise<Buffer> };
      type MultipartReq  = { file(): Promise<MultipartFile | undefined> };
      const mp = await (req as unknown as MultipartReq).file();
      if (!mp) return res.status(400).send({ error: 'Fayl topilmadi' });

      const buf      = await mp.toBuffer();
      const fileName = mp.filename;
      const mimeType = mp.mimetype;
      const fileSize = buf.length;

      const ext = path.extname(fileName).toLowerCase();
      if (!ALLOWED_UPLOAD_EXT.has(ext)) {
        return res.status(400).send({ error: `File type not allowed: ${ext || '(none)'}` });
      }
      if (buf.length > MAX_UPLOAD_BYTES) {
        return res.status(400).send({ error: 'File too large' });
      }

      const uploadsDir = path.join(process.cwd(), 'uploads', 'kanban', 'results', resultId);
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

      const safeName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      fs.writeFileSync(path.join(uploadsDir, safeName), buf);

      const fileUrl = `/uploads/kanban/results/${resultId}/${safeName}`;
      const result  = await this.svc.addResultFile(resultId, { fileName, fileUrl, fileSize, mimeType });
      return res.send(result.ok ? result.data : { error: result.error });
    }

    const body     = req.body as Record<string, unknown> ?? {};
    const fileName = String(body.fileName ?? body.file_name ?? 'file');
    const fileUrl  = String(body.fileUrl  ?? body.file_url  ?? `/uploads/kanban/results/${resultId}/${fileName}`);
    const fileSize = body.fileSize ? Number(body.fileSize) : undefined;
    const mimeType = body.mimeType ? String(body.mimeType) : undefined;
    const result   = await this.svc.addResultFile(resultId, { fileName, fileUrl, fileSize, mimeType });
    return res.send(result.ok ? result.data : { error: result.error });
  }

  @Delete('result-files/:fileId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Natija faylini o\'chirish' })
  async deleteResultFile(@Param('fileId') fileId: string) {
    await this.svc.deleteResultFile(fileId);
    return { deleted: true, fileId };
  }

  // ─── Files ────────────────────────────────────────────────────────────────

  @Get('cards/:id/files')
  @ApiOperation({ summary: 'Karta fayllari' })
  async getCardFiles(@Param('id') id: string) {
    return unwrapOrBadRequest(await this.svc.getCardFiles(id));
  }

  @Post('cards/:id/files')
  @UseInterceptors(AuditInterceptor)
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiOperation({ summary: 'Kartaga fayl yuklash (multipart yoki JSON metadata)' })
  async uploadCardFile(
    @Param('id') id: string,
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
    @CurrentUser() user: { id: number },
  ) {
    const contentType = String(req.headers['content-type'] ?? '');

    if (contentType.includes('multipart/form-data')) {
      type MultipartFile = { filename: string; mimetype: string; toBuffer(): Promise<Buffer> };
      type MultipartReq  = { file(): Promise<MultipartFile | undefined> };
      const mp = await (req as unknown as MultipartReq).file();
      if (!mp) return res.status(400).send({ error: 'Fayl topilmadi' });

      const buf      = await mp.toBuffer();
      const fileName = mp.filename;
      const mimeType = mp.mimetype;
      const fileSize = buf.length;

      const ext = path.extname(fileName).toLowerCase();
      if (!ALLOWED_UPLOAD_EXT.has(ext)) {
        return res.status(400).send({ error: `File type not allowed: ${ext || '(none)'}` });
      }
      if (buf.length > MAX_UPLOAD_BYTES) {
        return res.status(400).send({ error: 'File too large' });
      }

      const uploadsDir = path.join(process.cwd(), 'uploads', 'kanban', id);
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

      const safeName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      fs.writeFileSync(path.join(uploadsDir, safeName), buf);

      const fileUrl = `/uploads/kanban/${id}/${safeName}`;
      const result  = await this.svc.createFile({ cardId: id, fileName, fileUrl, fileSize, mimeType, uploadedById: user?.id });
      return res.send(result.ok ? result.data : { error: result.error });
    }

    const body     = req.body as Record<string, unknown> ?? {};
    const fileName = String(body.fileName ?? body.file_name ?? 'file');
    const fileUrl  = String(body.fileUrl  ?? body.file_url  ?? `/uploads/kanban/${id}/${fileName}`);
    const fileSize = body.fileSize ? Number(body.fileSize) : undefined;
    const mimeType = body.mimeType ? String(body.mimeType) : undefined;
    const result   = await this.svc.createFile({ cardId: id, fileName, fileUrl, fileSize, mimeType, uploadedById: user?.id });
    return res.send(result.ok ? result.data : { error: result.error });
  }

  @Delete('files/:fileId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Faylni o\'chirish (soft delete)' })
  async deleteFile(@Param('fileId') fileId: string) {
    await this.svc.deleteFile(fileId);
    return { deleted: true, fileId };
  }

  // ─── Time Tracking ────────────────────────────────────────────────────────

  @Get('cards/:id/time-entries')
  @ApiOperation({ summary: 'Vaqt yozuvlari' })
  async getTimeEntries(@Param('id') id: string) {
    return unwrapOrBadRequest(await this.svc.getTimeEntries(id));
  }

  @Post('cards/:id/time-entries/start')
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: 'Vaqt kuzatuvini boshlash' })
  async startTimeEntry(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() user: { id: number },
  ) {
    const dto = StartTimeSchema.parse(body ?? {});
    return unwrapOrBadRequest(
      await this.svc.startTimeTracking(id, user?.id ?? 0, dto.description),
    );
  }

  @Post('cards/:id/time-entries/stop')
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: 'Vaqt kuzatuvini to\'xtatish' })
  async stopTimeEntry(
    @Param('id') id: string,
    @CurrentUser() user: { id: number },
  ) {
    return unwrapOrBadRequest(await this.svc.stopTimeTracking(id, user?.id ?? 0));
  }
}
