import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { throwFromError, unwrapOrThrow, assertOk } from '@common/http-result';
import {
Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseInterceptors, UsePipes,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Roles } from '../../../common/decorators/roles.decorator';
import { KanbanBoardsService } from '../application/kanban-boards.service';
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
  constructor(private readonly boardsSvc: KanbanBoardsService) {}

  @Get('boards')
  async getBoards() {
    return unwrapOrThrow(await this.boardsSvc.getBoards());
  }

  @Get('boards/:boardId')
  async getBoardById(@Param('boardId') boardId: string) {
    return unwrapOrThrow(await this.boardsSvc.getBoardById(boardId));
  }

  @Post('boards')
  @UsePipes(new ZodValidationPipe(KanbanCreateBoardSchema))
  async createBoard(@Body() body: KanbanCreateBoardDto) {
    return unwrapOrThrow(await this.boardsSvc.createBoard(body));
  }

  @Post('boards/:boardId/columns')
  @UsePipes(new ZodValidationPipe(KanbanAddColumnSchema))
  async addColumn(@Param('boardId') boardId: string, @Body() body: KanbanAddColumnDto) {
    return unwrapOrThrow(await this.boardsSvc.addColumn(boardId, body));
  }

  @Patch('boards/:boardId/columns/:columnId')
  @UsePipes(new ZodValidationPipe(KanbanUpdateColumnSchema))
  async updateColumn(
    @Param('boardId') boardId: string,
    @Param('columnId') columnId: string,
    @Body() body: KanbanUpdateColumnDto,
  ) {
    return unwrapOrThrow(await this.boardsSvc.updateColumn(boardId, columnId, body));
  }

  @Delete('boards/:boardId/columns/:columnId')
  async deleteColumn(
    @Param('boardId') boardId: string,
    @Param('columnId') columnId: string,
  ) {
    const result = await this.boardsSvc.deleteColumn(boardId, columnId);
    assertOk(result);
    return {};
  }

  @Post('boards/:boardId/cards')
  @UsePipes(new ZodValidationPipe(KanbanAddCardSchema))
  async addCard(@Param('boardId') boardId: string, @Body() body: KanbanAddCardDto) {
    return unwrapOrThrow(await this.boardsSvc.addCard(boardId, body));
  }

  @Put('cards/:id')
  @UsePipes(new ZodValidationPipe(KanbanUpdateCardSchema))
  async updateCard(@Param('id') id: string, @Body() body: KanbanUpdateCardDto) {
    return unwrapOrThrow(await this.boardsSvc.updateCard(id, body));
  }

  @Put('cards/:id/move')
  @UsePipes(new ZodValidationPipe(KanbanMoveCardSchema))
  async moveCard(@Param('id') id: string, @Body() body: KanbanMoveCardDto) {
    return unwrapOrThrow(await this.boardsSvc.moveCard(id, body));
  }

  @Delete('cards/:id')
  async deleteCard(@Param('id') id: string) {
    const result = await this.boardsSvc.deleteCard(id);
    assertOk(result);
    return {};
  }

  @Get('notifications/unread-count')
  getUnreadCount() {
    return { unreadCount: 0 };
  }

  @Get('notifications')
  getNotifications(@Query() _query: Record<string, unknown>): unknown[] {
    return [];
  }

  @Put('notifications/read-all')
  readAllNotifications() {
    return {};
  }

  @Put('notifications/:id/read')
  readNotification(@Param('id') id: string) {
    return { id };
  }

  @Get('templates')
  async getTemplates(): Promise<unknown[]> {
    return [];
  }

  @Post('templates')
  @UsePipes(new ZodValidationPipe(KanbanCreateTemplateSchema))
  async createTemplate(@Body() body: KanbanCreateTemplateDto) {
    return { id: Date.now(), ...body };
  }

  @Put('templates/:id')
  @UsePipes(new ZodValidationPipe(KanbanUpdateTemplateSchema))
  async updateTemplate(@Param('id') id: string, @Body() body: KanbanUpdateTemplateDto) {
    return { id, ...body };
  }

  @Delete('templates/:id')
  async deleteTemplate(@Param('id') _id: string) {
    return {};
  }

  @Post('templates/:templateId/apply')
  async applyTemplate(@Param('templateId') _templateId: string) {
    return {};
  }

  @Get('boards/:boardId/robots')
  getRobots(@Param('boardId') _boardId: string): unknown[] {
    return [];
  }

  @Post('boards/:boardId/robots')
  @UsePipes(new ZodValidationPipe(KanbanCreateRobotSchema))
  createRobot(@Param('boardId') boardId: string, @Body() body: KanbanCreateRobotDto) {
    return { id: Date.now(), boardId, ...body };
  }
}
