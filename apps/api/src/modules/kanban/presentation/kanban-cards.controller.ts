/**
 * @module kanban-cards.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import {
  Controller, Get, Post, Put, Delete, Patch, Param, Body, Query,
  UseGuards, UseInterceptors, Logger, HttpCode, HttpStatus, Req, Res,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import type { FastifyRequest, FastifyReply } from 'fastify';
import * as path from 'path';
import * as fs from 'fs';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard }  from '@common/guards/roles.guard';
import { Roles }       from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { unwrapOrBadRequest } from '@common/http-result';
import { runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { KanbanExtService } from '../application/kanban-ext.service';

@ApiTags('§16 Kanban Extended')
@ApiBearerAuth()
@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('kanban')
@Roles('super_admin', 'director', 'manager', 'employee')
export class KanbanCardsController {
  private readonly logger = new Logger(KanbanCardsController.name);

  constructor(private readonly svc: KanbanExtService) {}

  // ─── Cards extended ───────────────────────────────────────────────────────

  @Get('boards/:boardId/cards')
  @ApiOperation({ summary: 'Board kartalarini qaytarish (allCards uchun)' })
  async getBoardCards(@Param('boardId') boardId: string) {
    try {
      const { rows } = await runQuery<Record<string, unknown>>(sql`
        SELECT * FROM kanban_cards
        WHERE board_id = ${boardId} AND deleted_at IS NULL
        ORDER BY sort_order ASC
      `);
      return { items: rows, total: rows.length };
    } catch {
      return { items: [], total: 0 };
    }
  }

  @Get('cards')
  @ApiOperation({ summary: 'Barcha kartalar (filtrlangan)' })
  async getAllCards(@Query('boardId') boardId?: string) {
    if (boardId) {
      try {
        const { rows } = await runQuery<Record<string, unknown>>(sql`
          SELECT * FROM kanban_cards
          WHERE board_id = ${boardId} AND deleted_at IS NULL
          ORDER BY sort_order ASC
        `);
        return { items: rows, total: rows.length };
      } catch {
        return { items: [], total: 0 };
      }
    }
    return { items: [], total: 0 };
  }

  @Post('cards')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: 'Yangi karta yaratish (xabardan vazifa)' })
  async createCardFlat(
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: { id: number },
  ) {
    return unwrapOrBadRequest(await this.svc.createCardFlat(body, user?.id ?? 0));
  }

  @Patch(':id/assign')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: 'Karta tayinlash' })
  assignCard(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return { id, assignedTo: body.assignedTo, updated: true };
  }

  @Put('cards/:id/accept')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: 'Kartani qabul qilish' })
  async acceptCard(
    @Param('id') id: string,
    @CurrentUser() user: { id: number },
  ) {
    return unwrapOrBadRequest(await this.svc.acceptCard(id, user?.id ?? 0));
  }

  @Put('cards/:id/complete')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: 'Kartani yakunlash' })
  async completeCard(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: { id: number },
  ) {
    return unwrapOrBadRequest(
      await this.svc.completeCard(id, user?.id ?? 0, body.completionReport as string | undefined),
    );
  }

  // ─── Chat ─────────────────────────────────────────────────────────────────

  @Get('cards/:id/chat')
  @ApiOperation({ summary: 'Karta chat xabarlari ro\'yxati' })
  async getCardChat(@Param('id') id: string) {
    return unwrapOrBadRequest(await this.svc.getCardComments(id));
  }

  @Post('cards/:id/chat')
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: 'Karta chatiga xabar yuborish' })
  async postCardChat(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: { id: number },
  ) {
    return unwrapOrBadRequest(
      await this.svc.addComment(id, user?.id ?? 0, String(body.message ?? body.content ?? '')),
    );
  }

  @Get('chat-messages/:id/files')
  @ApiOperation({ summary: 'Chat xabari fayllari' })
  async getChatMessageFiles(@Param('id') id: string) {
    return { data: [], messageId: id };
  }

  @Post('chat-messages/:id/files')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Chat xabariga fayl biriktirish (stub)' })
  async attachChatMessageFile(@Param('id') id: string) {
    // Chat message file attachments are stored as inline references.
    // This stub prevents 404 from the upload attempt in the UI.
    return { ok: true, messageId: id };
  }

  // ─── Tags ─────────────────────────────────────────────────────────────────

  @Get('cards/:id/tags')
  @ApiOperation({ summary: 'Karta teglari' })
  async getCardTags(@Param('id') id: string) {
    return unwrapOrBadRequest(await this.svc.getCardTags(id));
  }

  @Post('cards/:id/tags')
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: 'Kartaga teg qo\'shish' })
  async addCardTag(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return unwrapOrBadRequest(await this.svc.addTagToCard(id, {
      name: String(body.name ?? body.tag ?? ''),
      color: body.color ? String(body.color) : undefined,
      boardId: body.boardId ? String(body.boardId) : undefined,
    }));
  }

  @Delete('cards/:id/tags/:tagId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Kartadan teg o\'chirish' })
  async removeCardTag(@Param('id') id: string, @Param('tagId') tagId: string) {
    await this.svc.removeTagFromCard(id, tagId);
    return { removed: true, cardId: id, tagId };
  }

  // ─── Observers ────────────────────────────────────────────────────────────

  @Get('cards/:id/observers')
  @ApiOperation({ summary: 'Karta kuzatuvchilari' })
  async getObservers(@Param('id') id: string) {
    return unwrapOrBadRequest(await this.svc.getObservers(id));
  }

  @Post('cards/:id/observers')
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: 'Kartaga kuzatuvchi qo\'shish' })
  async addCardObserver(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return unwrapOrBadRequest(await this.svc.addObserver(id, Number(body.userId ?? 0)));
  }

  @Delete('cards/:id/observers/:observerId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Kuzatuvchini o\'chirish' })
  async removeCardObserver(@Param('id') id: string, @Param('observerId') observerId: string) {
    await this.svc.removeObserver(id, observerId);
    return { removed: true };
  }

  // ─── Co-Executors ─────────────────────────────────────────────────────────

  @Get('cards/:id/co-executors')
  @ApiOperation({ summary: 'Karta hamijrochilari' })
  async getCoExecutors(@Param('id') id: string) {
    return unwrapOrBadRequest(await this.svc.getCoExecutors(id));
  }

  @Post('cards/:id/co-executors')
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: 'Kartaga hamijrochi qo\'shish' })
  async addCardCoExecutor(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return unwrapOrBadRequest(await this.svc.addCoExecutor(id, Number(body.userId ?? 0)));
  }

  @Delete('cards/:id/co-executors/:coExecutorId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Hamijrochini o\'chirish' })
  async removeCardCoExecutor(@Param('id') id: string, @Param('coExecutorId') coExecutorId: string) {
    await this.svc.removeCoExecutor(id, coExecutorId);
    return { removed: true };
  }

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
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: { id: number },
  ) {
    return unwrapOrBadRequest(
      await this.svc.createResult(id, user?.id ?? 0, body.description as string | undefined),
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
      // ── Multipart fayl yuklash ──────────────────────────────────────────
      type MultipartFile = { filename: string; mimetype: string; toBuffer(): Promise<Buffer> };
      type MultipartReq  = { file(): Promise<MultipartFile | undefined> };
      const mp = await (req as unknown as MultipartReq).file();
      if (!mp) return res.status(400).send({ error: 'Fayl topilmadi' });

      const buf      = await mp.toBuffer();
      const fileName = mp.filename;
      const mimeType = mp.mimetype;
      const fileSize = buf.length;

      const uploadsDir = path.join(process.cwd(), 'uploads', 'kanban', id);
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

      const safeName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      fs.writeFileSync(path.join(uploadsDir, safeName), buf);

      const fileUrl = `/uploads/kanban/${id}/${safeName}`;
      const result  = await this.svc.createFile({ cardId: id, fileName, fileUrl, fileSize, mimeType, uploadedById: user?.id });
      return res.send(result.ok ? result.data : { error: result.error });
    }

    // ── JSON metadata fallback ─────────────────────────────────────────────
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
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: { id: number },
  ) {
    return unwrapOrBadRequest(
      await this.svc.startTimeTracking(id, user?.id ?? 0, body.description as string | undefined),
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
