/**
 * @module kanban-checklist.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import {
  Controller, Get, Post, Put, Delete, Param, Body,
  UseGuards, UseInterceptors, Logger, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard }  from '@common/guards/roles.guard';
import { Roles }       from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { unwrapOrBadRequest } from '@common/http-result';
import { KanbanExtService } from '../application/kanban-ext.service';
import {
  CreateChecklistDtoSchema, CreateChecklistDto,
  UpdateChecklistDtoSchema, UpdateChecklistDto,
  CreateChecklistItemDtoSchema, CreateChecklistItemDto,
  UpdateChecklistItemDtoSchema, UpdateChecklistItemDto,
  AddCommentDtoSchema, AddCommentDto,
} from './dto/kanban-ext.dto';

@ApiTags('§16 Kanban Checklists')
@ApiBearerAuth()
@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('kanban')
@Roles('super_admin', 'director', 'manager', 'employee')
export class KanbanChecklistController {
  private readonly logger = new Logger(KanbanChecklistController.name);

  constructor(private readonly svc: KanbanExtService) {}

  @Get('cards/:id/checklists')
  @ApiOperation({ summary: 'Karta cheklistlari' })
  async getChecklists(@Param('id') id: string) {
    return unwrapOrBadRequest(await this.svc.getCardChecklists(id));
  }

  @Post('cards/:id/checklists')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: 'Yangi checklist yaratish' })
  async createChecklist(@Param('id') id: string, @Body() body: CreateChecklistDto) {
    const dto = CreateChecklistDtoSchema.parse(body);
    return unwrapOrBadRequest(await this.svc.createChecklist(id, dto.title));
  }

  @Put('checklists/:checklistId')
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: 'Checklistni yangilash' })
  async updateChecklist(@Param('checklistId') id: string, @Body() body: UpdateChecklistDto) {
    const dto = UpdateChecklistDtoSchema.parse(body);
    return unwrapOrBadRequest(await this.svc.updateChecklist(id, dto));
  }

  @Delete('checklists/:checklistId')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: "Checklistni o'chirish" })
  async deleteChecklist(@Param('checklistId') id: string) {
    return unwrapOrBadRequest(await this.svc.deleteChecklist(id));
  }

  @Get('checklists/:id/items')
  @ApiOperation({ summary: 'Checklist elementlari' })
  async getChecklistItems(@Param('id') id: string) {
    return unwrapOrBadRequest(await this.svc.getChecklistItems(id));
  }

  @Post('checklists/:id/items')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: "Checklist elementi qo'shish" })
  async createChecklistItem(@Param('id') id: string, @Body() body: CreateChecklistItemDto) {
    const dto = CreateChecklistItemDtoSchema.parse(body);
    return unwrapOrBadRequest(await this.svc.createChecklistItem(id, dto.title));
  }

  @Put('checklists/:checklistId/items/:itemId')
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: 'Checklist elementini yangilash' })
  async updateChecklistItem(@Param('checklistId') checklistId: string, @Param('itemId') itemId: string, @Body() body: UpdateChecklistItemDto) {
    const dto = UpdateChecklistItemDtoSchema.parse(body);
    return unwrapOrBadRequest(await this.svc.updateChecklistItem(checklistId, itemId, dto));
  }

  @Delete('checklists/:checklistId/items/:itemId')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: "Checklist elementini o'chirish" })
  async deleteChecklistItem(@Param('checklistId') checklistId: string, @Param('itemId') itemId: string) {
    return unwrapOrBadRequest(await this.svc.deleteChecklistItem(checklistId, itemId));
  }

  @Put('checklist-items/:itemId/toggle')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: "Checklist elementini bajarildi/bajarilmadi qilish" })
  async toggleChecklistItem(@Param('itemId') itemId: string) {
    return unwrapOrBadRequest(await this.svc.toggleChecklistItem(itemId));
  }

  @Get('cards/:id/comments')
  @ApiOperation({ summary: 'Karta izohlari' })
  async getComments(@Param('id') id: string) {
    return unwrapOrBadRequest(await this.svc.getCardComments(id));
  }

  @Post('cards/:id/comments')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: "Izoh qo'shish" })
  async addComment(@Param('id') id: string, @Body() body: AddCommentDto, @CurrentUser() user: { id: number }) {
    const dto = AddCommentDtoSchema.parse(body);
    return unwrapOrBadRequest(await this.svc.addComment(id, user.id, dto.content));
  }

  @Get('cards/:id/watchers')
  @ApiOperation({ summary: 'Karta kuzatuvchilari' })
  async getWatchers(@Param('id') id: string) {
    return unwrapOrBadRequest(await this.svc.getCardWatchers(id));
  }

  @Post('cards/:id/watchers')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: "Kuzatuvchi qo'shish" })
  async addWatcher(@Param('id') id: string, @CurrentUser() user: { id: number }) {
    return unwrapOrBadRequest(await this.svc.addWatcher(id, user.id));
  }

  @Get('sprint')
  @ApiOperation({ summary: "Sprint ma'lumotlari" })
  async getSprintInfo() {
    return unwrapOrBadRequest(await this.svc.getSprintInfo());
  }

  @Get('cards/overdue')
  @ApiOperation({ summary: "Muddati o'tgan kartalar" })
  async getOverdueCards() {
    return unwrapOrBadRequest(await this.svc.getOverdueCards());
  }

  @Get('cards/by-employee/:employeeId')
  @ApiOperation({ summary: "Xodim bo'yicha kartalar" })
  async getCardsByEmployee(@Param('employeeId') id: string) {
    return unwrapOrBadRequest(await this.svc.getCardsByEmployee(id));
  }

  @Get('members')
  @ApiOperation({ summary: "Kanban a'zolari" })
  async getMembers() {
    return unwrapOrBadRequest(await this.svc.getMembers());
  }
}
