/**
 * @module kanban-boards.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { throwFromError, unwrapOrThrow, assertOk } from '@common/http-result';
import {
  Body, Controller, Delete, Get, Param, Patch, Post, Put,
  Query, UseInterceptors, UsePipes, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { KanbanBoardsService } from '../application/kanban-boards.service';
import { KanbanExtService } from '../application/kanban-ext.service';
import {
  KanbanCreateBoardSchema, KanbanCreateBoardDto,
  KanbanAddColumnSchema, KanbanAddColumnDto,
  KanbanUpdateColumnSchema, KanbanUpdateColumnDto,
  KanbanAddCardSchema, KanbanAddCardDto,
  KanbanUpdateCardSchema, KanbanUpdateCardDto,
  KanbanMoveCardSchema, KanbanMoveCardDto,
  KanbanCreateTemplateSchema, KanbanCreateTemplateDto,
  KanbanUpdateTemplateSchema, KanbanUpdateTemplateDto,
  KanbanCreateRobotSchema, KanbanCreateRobotDto,
} from '../dto/kanban.dto';

@ApiTags('Kanban Boards')
@Roles('admin', 'manager', 'supervisor', 'operator', 'employee', 'viewer', 'director')
@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard)
@Controller('kanban')
export class KanbanBoardsController {
  constructor(
    private readonly boardsSvc: KanbanBoardsService,
    private readonly extSvc: KanbanExtService,
  ) {}

  // ─── Boards ───────────────────────────────────────────────────────────────

  @Get('boards')
  @ApiOperation({ summary: 'Barcha boardlar (departmentId bo\'yicha filtrlash ixtiyoriy)' })
  async getBoards(@Query('departmentId') departmentId?: string) {
    const result = await this.boardsSvc.getBoards();
    if (!result.ok) return unwrapOrThrow(result);
    if (!departmentId) return result.data;
    // departmentId filtrini qo'llash — null departmentId ham qabul qilinadi
    return (result.data as Record<string, unknown>[]).filter(
      (b: Record<string, unknown>) => b.department_id === departmentId || b.departmentId === departmentId,
    );
  }

  @Get('boards/:boardId')
  @ApiOperation({ summary: 'Board tafsiloti (ustunlar + kartalar)' })
  async getBoardById(@Param('boardId') boardId: string) {
    return unwrapOrThrow(await this.boardsSvc.getBoardById(boardId));
  }

  @Post('boards')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(KanbanCreateBoardSchema))
  @ApiOperation({ summary: 'Yangi board yaratish' })
  async createBoard(@Body() body: KanbanCreateBoardDto) {
    return unwrapOrThrow(await this.boardsSvc.createBoard(body));
  }

  // ─── Columns ──────────────────────────────────────────────────────────────

  @Post('boards/:boardId/columns')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(KanbanAddColumnSchema))
  @ApiOperation({ summary: 'Boardga ustun qo\'shish' })
  async addColumn(@Param('boardId') boardId: string, @Body() body: KanbanAddColumnDto) {
    return unwrapOrThrow(await this.boardsSvc.addColumn(boardId, body));
  }

  @Patch('boards/:boardId/columns/:columnId')
  @UsePipes(new ZodValidationPipe(KanbanUpdateColumnSchema))
  @ApiOperation({ summary: 'Ustunni yangilash' })
  async updateColumn(
    @Param('boardId') boardId: string,
    @Param('columnId') columnId: string,
    @Body() body: KanbanUpdateColumnDto,
  ) {
    return unwrapOrThrow(await this.boardsSvc.updateColumn(boardId, columnId, body));
  }

  @Delete('boards/:boardId/columns/:columnId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ustunni o\'chirish' })
  async deleteColumn(
    @Param('boardId') boardId: string,
    @Param('columnId') columnId: string,
  ) {
    const result = await this.boardsSvc.deleteColumn(boardId, columnId);
    assertOk(result);
    return {};
  }

  // ─── Cards ────────────────────────────────────────────────────────────────

  @Post('boards/:boardId/cards')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(KanbanAddCardSchema))
  @ApiOperation({ summary: 'Boardga karta qo\'shish' })
  async addCard(@Param('boardId') boardId: string, @Body() body: KanbanAddCardDto) {
    return unwrapOrThrow(await this.boardsSvc.addCard(boardId, body));
  }

  @Put('cards/:id')
  @UsePipes(new ZodValidationPipe(KanbanUpdateCardSchema))
  @ApiOperation({ summary: 'Kartani yangilash' })
  async updateCard(@Param('id') id: string, @Body() body: KanbanUpdateCardDto) {
    return unwrapOrThrow(await this.boardsSvc.updateCard(id, body));
  }

  @Put('cards/:id/move')
  @UsePipes(new ZodValidationPipe(KanbanMoveCardSchema))
  @ApiOperation({ summary: 'Kartani ko\'chirish' })
  async moveCard(@Param('id') id: string, @Body() body: KanbanMoveCardDto) {
    return unwrapOrThrow(await this.boardsSvc.moveCard(id, body));
  }

  @Delete('cards/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Kartani o\'chirish' })
  async deleteCard(@Param('id') id: string) {
    const result = await this.boardsSvc.deleteCard(id);
    assertOk(result);
    return {};
  }

  // ─── Employees ────────────────────────────────────────────────────────────

  @Get('employees')
  @ApiOperation({ summary: 'Xodimlar ro\'yxati (karta tayinlash uchun)' })
  async getEmployees() {
    return unwrapOrThrow(await this.extSvc.getEmployees());
  }

  // ─── Notifications ────────────────────────────────────────────────────────

  @Get('notifications/unread-count')
  @ApiOperation({ summary: 'O\'qilmagan bildirishnomalar soni' })
  async getUnreadCount(@CurrentUser() user: { id: number }) {
    const result = await this.extSvc.getUnreadCount(user?.id ?? 0);
    if (!result.ok) return { unreadCount: 0 };
    return { unreadCount: result.data };
  }

  @Get('notifications')
  @ApiOperation({ summary: 'Bildirishnomalar ro\'yxati' })
  async getNotifications(
    @CurrentUser() user: { id: number },
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const result = await this.extSvc.getNotifications(
      user?.id ?? 0,
      limit ? Number(limit) : 50,
      offset ? Number(offset) : 0,
    );
    if (!result.ok) return [];
    return result.data;
  }

  @Put('notifications/read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Barcha bildirishnomalarni o\'qilgan deb belgilash' })
  async readAllNotifications(@CurrentUser() user: { id: number }) {
    await this.extSvc.markAllNotificationsRead(user?.id ?? 0);
    return { ok: true };
  }

  @Put('notifications/:id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bildirishnomani o\'qilgan deb belgilash' })
  async readNotification(
    @Param('id') id: string,
    @CurrentUser() user: { id: number },
  ) {
    await this.extSvc.markNotificationRead(id, user?.id ?? 0);
    return { id, read: true };
  }

  // ─── Templates ────────────────────────────────────────────────────────────

  @Get('templates')
  @ApiOperation({ summary: 'Shablonlar ro\'yxati' })
  async getTemplates(@Query('boardId') boardId?: string) {
    return unwrapOrThrow(await this.extSvc.getTemplates(boardId));
  }

  @Post('templates')
  @UsePipes(new ZodValidationPipe(KanbanCreateTemplateSchema))
  @ApiOperation({ summary: 'Yangi shablon yaratish' })
  async createTemplate(
    @Body() body: KanbanCreateTemplateDto,
    @CurrentUser() user: { id: number },
  ) {
    return unwrapOrThrow(await this.extSvc.createTemplate({
      name: body.name ?? 'Yangi shablon',
      description: body.description,
      priority: body.priority,
      boardId: body.boardId,
      checklistItems: body.checklistItems as unknown[],
      columnsConfig: body.columnsConfig as unknown[],
      createdById: user?.id,
    }));
  }

  @Put('templates/:id')
  @UsePipes(new ZodValidationPipe(KanbanUpdateTemplateSchema))
  @ApiOperation({ summary: 'Shablonni yangilash' })
  async updateTemplate(@Param('id') id: string, @Body() body: KanbanUpdateTemplateDto) {
    return unwrapOrThrow(await this.extSvc.updateTemplate(id, body as Record<string, unknown>));
  }

  @Delete('templates/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Shablonni o\'chirish' })
  async deleteTemplate(@Param('id') id: string) {
    await this.extSvc.deleteTemplate(id);
    return { deleted: true };
  }

  @Post('templates/:templateId/apply')
  @ApiOperation({ summary: 'Shablonni boardga qo\'llash' })
  async applyTemplate(
    @Param('templateId') templateId: string,
    @Body() body: Record<string, unknown>,
  ) {
    const boardId = String(body.boardId ?? '');
    if (!boardId) return { applied: false, error: 'boardId majburiy' };

    // Shablonni templateId bo'yicha topish
    const tplResult = await this.extSvc.getTemplates();
    if (!tplResult.ok) return { applied: false, error: 'Shablon topilmadi' };
    const template = tplResult.data.find((t) => String(t['id']) === templateId);
    if (!template) return { applied: false, error: `Shablon ${templateId} topilmadi` };

    // columnsConfig dan ustunlarni yaratish
    type ColConfig = { name?: string; color?: string; sort_order?: number };
    const columnsConfig: ColConfig[] = Array.isArray(template['columnsConfig'] ?? template['columns_config'])
      ? (template['columnsConfig'] ?? template['columns_config']) as ColConfig[]
      : [];

    const created: unknown[] = [];
    for (let i = 0; i < columnsConfig.length; i++) {
      const col = columnsConfig[i];
      const result = await this.boardsSvc.addColumn(boardId, {
        name:       String(col.name ?? `Ustun ${i + 1}`),
        color:      col.color,
        sort_order: col.sort_order ?? i,
      } as KanbanAddColumnDto);
      if (result.ok) created.push(result.data);
    }

    return { applied: true, templateId, boardId, columnsCreated: created.length };
  }

  // ─── Robots ───────────────────────────────────────────────────────────────

  @Get('boards/:boardId/robots')
  @ApiOperation({ summary: 'Board robotlari' })
  async getRobots(@Param('boardId') boardId: string) {
    return unwrapOrThrow(await this.extSvc.getRobotsByBoard(boardId));
  }

  @Post('boards/:boardId/robots')
  @UsePipes(new ZodValidationPipe(KanbanCreateRobotSchema))
  @ApiOperation({ summary: 'Yangi robot yaratish' })
  async createRobot(@Param('boardId') boardId: string, @Body() body: KanbanCreateRobotDto) {
    return unwrapOrThrow(await this.extSvc.createRobot(boardId, body as Record<string, unknown>));
  }
}
