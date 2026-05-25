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
import { runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { z } from 'zod';
import { KanbanExtService } from '../application/kanban-ext.service';
import { notImplemented } from '@common/exceptions/not-implemented';

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
    return { items: [], total: 0 };
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
    return unwrapOrBadRequest(await this.svc.createCardFlat(dto as Record<string, unknown>, user?.id ?? 0));
  }

  @Patch(':id/assign')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: 'Karta tayinlash' })
  assignCard(@Param('id') id: string, @Body() body: unknown) {
    const dto = AssignCardSchema.parse(body);
    return { id, assignedTo: dto.assignedTo, updated: true };
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
  @ApiOperation({ summary: 'Chat xabari fayllari' })
  async getChatMessageFiles(@Param('id') _id: string) {
    return notImplemented('GET /kanban/chat-messages/:id/files');
  }

  @Post('chat-messages/:id/files')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Chat xabariga fayl biriktirish (stub)' })
  async attachChatMessageFile(@Param('id') _id: string) {
    return notImplemented('POST /kanban/chat-messages/:id/files');
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
