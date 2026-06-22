/**
 * @module kanban-cards.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 *
 * Rule 16: File/result/time-tracking endpoints live in kanban-card-files.controller.ts.
 * Both controllers must be registered in kanban.module.ts.
 */

import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import {
  Controller, Get, Post, Put, Delete, Patch, Param, Body, Query,
  UseGuards, UseInterceptors, Logger, HttpCode, HttpException, HttpStatus,
} from '@nestjs/common';

import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { unwrapOrBadRequest } from '@common/http-result';
import { db, runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { z } from 'zod';
import { KanbanExtService } from '../application/kanban-ext.service';
import { notImplemented } from '@common/exceptions/not-implemented';

type Rows = { rows?: unknown[] };
const ChatFileSchema = z.object({
  fileName: z.string().max(500).default('file'),
  fileUrl: z.string().max(2000).default(''),
  fileSize: z.coerce.number().int().optional(),
  mimeType: z.string().max(100).optional(),
}).passthrough();

const KanbanCardCreateSchema = z.object({
  boardId: z.string().optional(),
  columnId: z.string().optional(),
  title: z.string().max(500).optional(),
  description: z.string().max(5000).optional(),
  priority: z.string().max(50).optional(),
  assignedTo: z.union([z.string(), z.number()]).optional(),
  dueDate: z.string().optional(),
}).passthrough();

const AssignCardSchema = z.object({
  assignedTo: z.union([z.string(), z.number()]).optional(),
}).passthrough();

const CompleteCardSchema = z.object({
  completionReport: z.string().max(5000).optional(),
}).passthrough();

const PostChatSchema = z.object({
  message: z.string().max(5000).optional(),
  content: z.string().max(5000).optional(),
}).passthrough();

const AddTagSchema = z.object({
  name: z.string().max(100).optional(),
  tag: z.string().max(100).optional(),
  color: z.string().max(20).optional(),
  boardId: z.union([z.string(), z.number()]).optional(),
}).passthrough();

const AddObserverSchema = z.object({
  userId: z.union([z.string(), z.number()]),
}).passthrough();

const RateCardSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
}).passthrough();

export { KanbanCardFilesController } from './kanban-card-files.controller';

@ApiTags('§16 Kanban Extended')
@ApiBearerAuth()
@ApiThrottle()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('kanban')
@Roles('super_admin', 'director', 'manager', 'employee')
export class KanbanCardsController {
  private readonly logger = new Logger(KanbanCardsController.name);

  constructor(private readonly svc: KanbanExtService) {}

  // --- Cards extended -------------------------------------------------------

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
    try {
      const { rows } = await runQuery<Record<string, unknown>>(sql`
        SELECT kc.*, kb.name AS board_name, kcol.name AS column_name
        FROM kanban_cards kc
        LEFT JOIN kanban_boards kb ON kb.id = kc.board_id
        LEFT JOIN kanban_columns kcol ON kcol.id = kc.column_id
        WHERE kc.deleted_at IS NULL
        ORDER BY kc.sort_order ASC, kc.created_at DESC
        LIMIT 500
      `);
      return { items: rows, total: rows.length };
    } catch {
      return { items: [], total: 0 };
    }
  }

  @Put('cards/:id/rating')
  @ApiOperation({ summary: 'Kartani 1-5 yulduz baholash' })
  async rateCard(@Param('id') id: string, @Body() body: unknown) {
    const { rating } = RateCardSchema.parse(body);
    const { rows } = await runQuery<Record<string, unknown>>(sql`
      UPDATE kanban_cards SET rating = ${rating}, updated_at = NOW()
      WHERE id = ${Number(id)} AND deleted_at IS NULL
      RETURNING id, rating
    `);
    if (!rows[0]) throw new HttpException('Karta topilmadi', HttpStatus.NOT_FOUND);
    return rows[0];
  }

  @Post('cards')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: 'Yangi karta yaratish (xabardan vazifa)' })
  async createCardFlat(
    @Body() body: unknown,
    @CurrentUser() user: { id: number },
  ) {
    const dto = KanbanCardCreateSchema.parse(body);
    // EP-KAN-027: yaratuvchi = topshiruvchi (assigner), agar body da berilmagan bo'lsa.
    const payload: Record<string, unknown> = { ...(dto as Record<string, unknown>) };
    if (payload.assignerUserId == null && payload.assigner_user_id == null && user?.id) {
      payload.assigner_user_id = String(user.id);
    }
    return unwrapOrBadRequest(await this.svc.createCardFlat(payload, user?.id ?? 0));
  }

  @Patch(':id/assign')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: 'Karta tayinlash' })
  async assignCard(@Param('id') id: string, @Body() body: unknown) {
    const dto = AssignCardSchema.parse(body);
    const { rows } = await runQuery<Record<string, unknown>>(sql`
      UPDATE kanban_cards
      SET owner_user_id = ${dto.assignedTo ? Number(dto.assignedTo) : null},
          updated_at = NOW()
      WHERE id = ${Number(id)} AND deleted_at IS NULL
      RETURNING id, owner_user_id, updated_at
    `);
    if (!rows[0]) throw new HttpException('Karta topilmadi', HttpStatus.NOT_FOUND);
    return rows[0];
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
    @Body() body: unknown,
    @CurrentUser() user: { id: number },
  ) {
    const dto = CompleteCardSchema.parse(body ?? {});
    return unwrapOrBadRequest(
      await this.svc.completeCard(id, user?.id ?? 0, dto.completionReport),
    );
  }

  // --- Chat -----------------------------------------------------------------

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
    @Body() body: unknown,
    @CurrentUser() user: { id: number },
  ) {
    const dto = PostChatSchema.parse(body);
    return unwrapOrBadRequest(
      await this.svc.addComment(id, user?.id ?? 0, String(dto.message ?? dto.content ?? '')),
    );
  }

  @Get('chat-messages/:id/files')
  @ApiOperation({ summary: 'Chat xabari fayllari (task_chat_message_files)' })
  async getChatMessageFiles(@Param('id') id: string) {
    const messageId = parseInt(id, 10);
    const r = await db.execute(sql`
      SELECT * FROM task_chat_message_files
      WHERE message_id = ${messageId}
      ORDER BY id ASC
    `);
    const items = ((r as Rows).rows) ?? [];
    return { items, total: items.length };
  }

  @Post('chat-messages/:id/files')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Chat xabariga fayl biriktirish (task_chat_message_files)' })
  async attachChatMessageFile(@Param('id') id: string, @Body() body: unknown) {
    const dto = ChatFileSchema.parse(body ?? {});
    const messageId = parseInt(id, 10);
    const r = await db.execute(sql`
      INSERT INTO task_chat_message_files (message_id, file_name, file_url, file_size, mime_type, created_at)
      VALUES (
        ${messageId},
        ${dto.fileName},
        ${dto.fileUrl},
        ${dto.fileSize ?? null},
        ${dto.mimeType ?? null},
        NOW()
      ) RETURNING *
    `);
    const row = ((r as Rows).rows ?? [])[0] ?? {};
    return { data: row };
  }

  // --- Tags -----------------------------------------------------------------

  @Get('cards/:id/tags')
  @ApiOperation({ summary: 'Karta teglari' })
  async getCardTags(@Param('id') id: string) {
    return unwrapOrBadRequest(await this.svc.getCardTags(id));
  }

  @Post('cards/:id/tags')
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: 'Kartaga teg qo\'shish' })
  async addCardTag(@Param('id') id: string, @Body() body: unknown) {
    const dto = AddTagSchema.parse(body);
    return unwrapOrBadRequest(await this.svc.addTagToCard(id, {
      name: String(dto.name ?? dto.tag ?? ''),
      color: dto.color ? String(dto.color) : undefined,
      boardId: dto.boardId ? String(dto.boardId) : undefined,
    }));
  }

  @Delete('cards/:id/tags/:tagId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Kartadan teg o\'chirish' })
  async removeCardTag(@Param('id') id: string, @Param('tagId') tagId: string) {
    await this.svc.removeTagFromCard(id, tagId);
    return { removed: true, cardId: id, tagId };
  }

  // --- Observers ------------------------------------------------------------

  @Get('cards/:id/observers')
  @ApiOperation({ summary: 'Karta kuzatuvchilari' })
  async getObservers(@Param('id') id: string) {
    return unwrapOrBadRequest(await this.svc.getObservers(id));
  }

  @Post('cards/:id/observers')
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: 'Kartaga kuzatuvchi qo\'shish' })
  async addCardObserver(@Param('id') id: string, @Body() body: unknown) {
    const dto = AddObserverSchema.parse(body);
    return unwrapOrBadRequest(await this.svc.addObserver(id, Number(dto.userId ?? 0)));
  }

  @Delete('cards/:id/observers/:observerId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Kuzatuvchini o\'chirish' })
  async removeCardObserver(@Param('id') id: string, @Param('observerId') observerId: string) {
    await this.svc.removeObserver(id, observerId);
    return { removed: true };
  }

  // --- Co-Executors ---------------------------------------------------------

  @Get('cards/:id/co-executors')
  @ApiOperation({ summary: 'Karta hamijrochilari' })
  async getCoExecutors(@Param('id') id: string) {
    return unwrapOrBadRequest(await this.svc.getCoExecutors(id));
  }

  @Post('cards/:id/co-executors')
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: 'Kartaga hamijrochi qo\'shish' })
  async addCardCoExecutor(@Param('id') id: string, @Body() body: unknown) {
    const dto = AddObserverSchema.parse(body);
    return unwrapOrBadRequest(await this.svc.addCoExecutor(id, Number(dto.userId ?? 0)));
  }

  @Delete('cards/:id/co-executors/:coExecutorId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Hamijrochini o\'chirish' })
  async removeCardCoExecutor(@Param('id') id: string, @Param('coExecutorId') coExecutorId: string) {
    await this.svc.removeCoExecutor(id, coExecutorId);
    return { removed: true };
  }
}
