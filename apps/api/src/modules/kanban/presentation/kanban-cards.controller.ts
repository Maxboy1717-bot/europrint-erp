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
import { I18nService } from 'nestjs-i18n';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { unwrapOrBadRequest } from '@common/http-result';
import { db, runQuery } from '@shared/db';
import { sql, SQL } from 'drizzle-orm';
import { z } from 'zod';
import { KanbanExtService } from '../application/kanban-ext.service';
import { AuthenticatedUser } from '@common/types/user.types';
import { hasFullKanbanVisibility, kanbanCardVisibilityPredicate, kanbanConfidentialClause } from '../infrastructure/kanban-visibility.helper';

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

const BulkAssignCardsSchema = z.object({
  ids: z.array(z.union([z.string(), z.number()])).min(1).max(500),
  assignedTo: z.union([z.string(), z.number()]).nullish(),
  userId: z.union([z.string(), z.number()]).nullish(),
}).passthrough();

const CompleteCardSchema = z.object({
  completionReport: z.string().max(5000).optional(),
}).passthrough();

const RejectCardSchema = z.object({
  reason: z.string().min(1).max(5000),
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

  constructor(
    private readonly svc: KanbanExtService,
    private readonly i18n: I18nService,
  ) {}

  // --- Cards extended -------------------------------------------------------

  // Org-sxema bo'yicha karta ko'rinishi (M0) — super_admin/director butun
  // tizimni ko'radi; qolganlar faqat "o'zi + boshqargan bo'lim + hamkasb
  // bo'limi" doirasida (kanbanCardVisibilityPredicate, EP-KAN-084).
  private cardVisibilityClause(user: AuthenticatedUser): SQL {
    if (hasFullKanbanVisibility(user?.role)) return sql`TRUE`;
    // Confidential-card gate (owner decision 2026-07-13): AND the org-visibility
    // predicate with kanbanConfidentialClause so an is_confidential=true card stays
    // hidden from the general board unless the viewer is its owner/assigner (the
    // privileged-role bypass above already covers super_admin/director).
    const viewerId = Number(user?.id ?? 0);
    return sql`(${kanbanCardVisibilityPredicate(viewerId)}) AND (${kanbanConfidentialClause(viewerId, user?.role)})`;
  }

  @Get('boards/:boardId/cards')
  @ApiOperation({ summary: 'Board kartalarini qaytarish (allCards uchun, org-sxema bo\'yicha ko\'rinish)' })
  async getBoardCards(
    @Param('boardId') boardId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    try {
      const visible = this.cardVisibilityClause(user);
      // qoldiq_tolov (owner 4-field request 2026-07-13): computed on read, NOT a stored
      // column — LEFT JOIN sales_orders via kc.related_id when related_type='sales_order';
      // prefers the maintained balance_due_amount, falls back to total-paid.
      const { rows } = await runQuery<Record<string, unknown>>(sql`
        SELECT kc.*,
               COALESCE(so.balance_due_amount, so.total_amount - so.paid_amount) AS qoldiq_tolov
        FROM kanban_cards kc
        LEFT JOIN sales_orders so ON kc.related_type = 'sales_order' AND so.id = kc.related_id AND so.deleted_at IS NULL
        WHERE kc.board_id = ${boardId} AND kc.deleted_at IS NULL AND ${visible}
        ORDER BY kc.sort_order ASC
      `);
      return { items: rows, total: rows.length };
    } catch {
      return { items: [], total: 0 };
    }
  }

  @Get('cards')
  @ApiOperation({ summary: 'Barcha kartalar (filtrlangan, org-sxema bo\'yicha ko\'rinish)' })
  async getAllCards(
    @Query('boardId') boardId: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const visible = this.cardVisibilityClause(user);
    if (boardId) {
      try {
        // qoldiq_tolov (owner 4-field request 2026-07-13): computed on read, see getBoardCards.
        const { rows } = await runQuery<Record<string, unknown>>(sql`
          SELECT kc.*,
                 COALESCE(so.balance_due_amount, so.total_amount - so.paid_amount) AS qoldiq_tolov
          FROM kanban_cards kc
          LEFT JOIN sales_orders so ON kc.related_type = 'sales_order' AND so.id = kc.related_id AND so.deleted_at IS NULL
          WHERE kc.board_id = ${boardId} AND kc.deleted_at IS NULL AND ${visible}
          ORDER BY kc.sort_order ASC
        `);
        return { items: rows, total: rows.length };
      } catch {
        return { items: [], total: 0 };
      }
    }
    try {
      const { rows } = await runQuery<Record<string, unknown>>(sql`
        SELECT kc.*, kb.name AS board_name, kcol.name AS column_name,
               COALESCE(so.balance_due_amount, so.total_amount - so.paid_amount) AS qoldiq_tolov
        FROM kanban_cards kc
        LEFT JOIN kanban_boards kb ON kb.id = kc.board_id
        LEFT JOIN kanban_columns kcol ON kcol.id = kc.column_id
        LEFT JOIN sales_orders so ON kc.related_type = 'sales_order' AND so.id = kc.related_id AND so.deleted_at IS NULL
        WHERE kc.deleted_at IS NULL AND ${visible}
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
    if (!rows[0]) throw new HttpException(await this.i18n.t('errors.cardNotFound'), HttpStatus.NOT_FOUND);
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

  @Patch('cards/bulk-assign')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: "Kartalarni ommaviy tayinlash (ta'til / 50+ vazifa — EP-KAN A24)" })
  async bulkAssignCards(@Body() body: unknown) {
    const dto = BulkAssignCardsSchema.parse(body);
    const raw = dto.assignedTo ?? dto.userId ?? null;
    const ownerUserId = raw != null && raw !== '' ? Number(raw) : null;
    const ids = dto.ids.map((v) => Number(v));
    return unwrapOrBadRequest(await this.svc.bulkAssignCards(ids, ownerUserId));
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
    if (!rows[0]) throw new HttpException(await this.i18n.t('errors.cardNotFound'), HttpStatus.NOT_FOUND);
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

  @Put('cards/:id/reject')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: 'Vazifani sabab bilan topshiruvchiga qaytarish (EP-KAN-118)' })
  async rejectCard(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() user: { id: number },
  ) {
    const dto = RejectCardSchema.parse(body ?? {});
    return unwrapOrBadRequest(
      await this.svc.rejectCard(id, user?.id ?? 0, dto.reason),
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
