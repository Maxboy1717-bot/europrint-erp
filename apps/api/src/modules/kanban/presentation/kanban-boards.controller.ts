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
import { ApiThrottle } from '@common/decorators/throttle-profiles';
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
import { z } from 'zod';

const ApplyTemplateSchema = z.object({
  boardId: z.string().min(1),
}).passthrough();

@ApiTags('Kanban Boards')
@Roles('admin', 'manager', 'supervisor', 'operator', 'employee', 'viewer', 'director')
@ApiThrottle()
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
  @ApiOperation({ summary: 'Barcha boardlar' })
  async getBoards() {
    // NOTE (M0): `departmentId` JS-filtri bu yerda ilgari mavjud edi, lekin
    // kanban_boards jadvalida department_id ustuni umuman yo'q — filtr HAR
    // DOIM bo'sh natija qaytarardi (o'lik/buzuq kod, FE hech qachon
    // chaqirmagan — Q-46: to'g'ri ishlamaydigan kod olib tashlanadi). Board
    // ro'yxati umumiy qoladi; kartalar darajasidagi org-sxema ko'rinishi
    // getBoardById/getBoardCards/getAllCards'da haqiqiy SQL predicate bilan
    // amalga oshirilgan (kanban-visibility.helper.ts).
    return unwrapOrThrow(await this.boardsSvc.getBoards());
  }

  @Get('boards/:boardId')
  @ApiOperation({ summary: 'Board tafsiloti (ustunlar + kartalar, org-sxema bo\'yicha ko\'rinish)' })
  async getBoardById(
    @Param('boardId') boardId: string,
    @CurrentUser() user: { id: number; role?: string },
  ) {
    return unwrapOrThrow(await this.boardsSvc.getBoardById(boardId, user && { id: Number(user.id), role: user.role }));
  }

  @Post('boards')
  @HttpCode(HttpStatus.CREATED)
  // G4 governance (vizyon, egasi #16603): "doskalari standart, faqat super admin" —
  // board yaratish faqat super_admin/director. Metod-darajali @Roles klass-darajalini
  // OVERRIDE qiladi (RolesGuard getAllAndOverride); o'qish routelari keng qoladi (Q-39).
  @Roles('super_admin', 'director')
  @UsePipes(new ZodValidationPipe(KanbanCreateBoardSchema))
  @ApiOperation({ summary: 'Yangi board yaratish (faqat super_admin/director)' })
  async createBoard(@Body() body: KanbanCreateBoardDto) {
    return unwrapOrThrow(await this.boardsSvc.createBoard(body));
  }

  // ─── Columns ──────────────────────────────────────────────────────────────

  @Post('boards/:boardId/columns')
  @HttpCode(HttpStatus.CREATED)
  // G4 governance: ustun qo'shish ham standart doska tuzilmasini o'zgartiradi —
  // faqat super_admin/director (vizyon, egasi #16603).
  @Roles('super_admin', 'director')
  @UsePipes(new ZodValidationPipe(KanbanAddColumnSchema))
  @ApiOperation({ summary: 'Boardga ustun qo\'shish (faqat super_admin/director)' })
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
  @ApiOperation({ summary: 'Boardga karta qo\'shish (yaratuvchi = topshiruvchi/assigner)' })
  async addCard(
    @Param('boardId') boardId: string,
    @Body() body: KanbanAddCardDto,
    @CurrentUser() user: { id: number },
  ) {
    return unwrapOrThrow(await this.boardsSvc.addCard(boardId, body, user?.id));
  }

  @Put('cards/:id')
  @UsePipes(new ZodValidationPipe(KanbanUpdateCardSchema))
  @ApiOperation({ summary: 'Kartani yangilash' })
  async updateCard(@Param('id') id: string, @Body() body: KanbanUpdateCardDto) {
    return unwrapOrThrow(await this.boardsSvc.updateCard(id, body));
  }

  @Put('cards/:id/move')
  @UsePipes(new ZodValidationPipe(KanbanMoveCardSchema))
  @ApiOperation({ summary: 'Kartani ko\'chirish (assigner-confirm: Bajarildiga faqat topshiruvchi)' })
  async moveCard(
    @Param('id') id: string,
    @Body() body: KanbanMoveCardDto,
    @CurrentUser() user: { id: number },
  ) {
    return unwrapOrThrow(await this.boardsSvc.moveCard(id, body, user?.id));
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
  // G4 governance: shablon qo'llash boardga ustunlar YARATADI (addColumn yo'li) —
  // aks holda column-yaratish cheklovi chetlab o'tilardi. Faqat super_admin/director.
  @Roles('super_admin', 'director')
  @ApiOperation({ summary: 'Shablonni boardga qo\'llash (faqat super_admin/director)' })
  async applyTemplate(
    @Param('templateId') templateId: string,
    @Body() body: unknown,
  ) {
    const dto = ApplyTemplateSchema.parse(body);
    const boardId = String(dto.boardId ?? '');
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
