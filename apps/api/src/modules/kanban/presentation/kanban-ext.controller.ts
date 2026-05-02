import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import {
  Controller, Get, Post, Put, Delete, Patch, Param, Body,
  UseGuards, UseInterceptors, Logger, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard }  from '@common/guards/roles.guard';
import { Roles }       from '@common/decorators/roles.decorator';
import { unwrapOrBadRequest, unwrapOrNotFound } from '@common/http-result';
import { KanbanExtService } from '../application/kanban-ext.service';
import {
  UpdateFlowDtoSchema, UpdateFlowDto,
  UpdateRobotDtoSchema, UpdateRobotDto,
  UpdateBoardDtoSchema, UpdateBoardDto,
} from './dto/kanban-ext.dto';

@ApiTags('§16 Kanban Extended')
@ApiBearerAuth()
@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('kanban')
@Roles('super_admin', 'director', 'manager')
export class KanbanExtController {
  private readonly logger = new Logger(KanbanExtController.name);

  constructor(private readonly svc: KanbanExtService) {}

  @Get('flows/:id')
  @ApiOperation({ summary: 'Flow tafsiloti' })
  async getFlow(@Param('id') id: string) {
    return unwrapOrNotFound(await this.svc.getFlowById(id));
  }

  @Put('flows/:id')
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: 'Flowni yangilash' })
  async updateFlow(@Param('id') id: string, @Body() body: UpdateFlowDto) {
    const dto = UpdateFlowDtoSchema.parse(body);
    return unwrapOrBadRequest(await this.svc.updateFlow(id, dto));
  }

  @Delete('flows/:id')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: "Flowni o'chirish" })
  async deleteFlow(@Param('id') id: string) {
    return unwrapOrBadRequest(await this.svc.deleteFlow(id));
  }

  @Get('robots/:id')
  @ApiOperation({ summary: 'Robot tafsiloti' })
  async getRobot(@Param('id') id: string) {
    return unwrapOrNotFound(await this.svc.getRobotById(id));
  }

  @Put('robots/:id')
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: 'Robotni yangilash' })
  async updateRobot(@Param('id') id: string, @Body() body: UpdateRobotDto) {
    const dto = UpdateRobotDtoSchema.parse(body);
    return unwrapOrBadRequest(await this.svc.updateRobot(id, dto));
  }

  @Delete('robots/:id')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: "Robotni o'chirish" })
  async deleteRobot(@Param('id') id: string) {
    return unwrapOrBadRequest(await this.svc.deleteRobot(id));
  }

  @Put('boards/:boardId')
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: 'Boardni yangilash' })
  async updateBoard(@Param('boardId') boardId: string, @Body() body: UpdateBoardDto) {
    const dto = UpdateBoardDtoSchema.parse(body);
    return unwrapOrBadRequest(await this.svc.updateBoard(boardId, dto));
  }

  @Delete('boards/:boardId')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: "Boardni o'chirish" })
  async deleteBoard(@Param('boardId') boardId: string) {
    return unwrapOrBadRequest(await this.svc.deleteBoard(boardId));
  }

  @Get('reports/employee-performance')
  @ApiOperation({ summary: 'Xodim samaradorligi hisoboti' })
  async getEmployeePerformance() {
    return unwrapOrBadRequest(await this.svc.getEmployeePerformance());
  }

  @Get('reports/productivity')
  @ApiOperation({ summary: 'Unumdorlik hisoboti' })
  async getProductivityReport() {
    return unwrapOrBadRequest(await this.svc.getProductivityReport());
  }

  @Get('reports/overdue')
  @ApiOperation({ summary: 'Muddati otgan kartalar hisoboti' })
  async getOverdueReport() {
    return unwrapOrBadRequest(await this.svc.getOverdueReport());
  }

  @Get('analytics/summary')
  @ApiOperation({ summary: 'Kanban analitika xulosasi' })
  async getAnalyticsSummary() {
    return unwrapOrBadRequest(await this.svc.getAnalyticsSummary());
  }

  @Get('chat-messages/:id/files')
  async getChatMessageFiles(@Param('id') id: string) { return { data: [], messageId: id }; }

  @Delete('cards/:id/tags/:tagId')
  async removeCardTag(@Param('id') id: string, @Param('tagId') tagId: string) { return { removed: true, cardId: id, tagId }; }

  @Delete('cards/:id/observers/:observerId')
  async removeCardObserver(@Param('id') id: string, @Param('observerId') observerId: string) { return { removed: true }; }

  @Delete('cards/:id/co-executors/:coExecutorId')
  async removeCardCoExecutor(@Param('id') id: string, @Param('coExecutorId') coExecutorId: string) { return { removed: true }; }

  @Get('results/:resultId/files')
  async getResultFiles(@Param('resultId') resultId: string) { return { data: [], resultId }; }

  @Delete('result-files/:fileId')
  async deleteResultFile(@Param('fileId') fileId: string) { return { deleted: true, fileId }; }

  @Post('cards/:id/time-entries/start')
  async startTimeEntry(@Param('id') id: string, @Body() body: Record<string, unknown>) { return { id: 0, cardId: id, started: true }; }

  @Post('cards/:id/time-entries/stop')
  async stopTimeEntry(@Param('id') id: string, @Body() body: Record<string, unknown>) { return { cardId: id, stopped: true }; }

  @Delete('files/:fileId')
  async deleteFile(@Param('fileId') fileId: string) { return { deleted: true, fileId }; }
}
