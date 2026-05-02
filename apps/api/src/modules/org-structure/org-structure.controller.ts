import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import {
Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseIntPipe, Res, Logger, UseGuards, UseInterceptors, UsePipes, InternalServerErrorException,
} from '@nestjs/common';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { Throttle } from '@nestjs/throttler';
import { OrgStructureService } from './org-structure.service';
import { OrgExportService } from './org-export.service';
import { PositionFolderService } from './position-folder.service';
import type { FastifyReply } from 'fastify';
import { Roles } from '../../common/decorators/roles.decorator';
import { assertOk, unwrapOrInternal } from '@common/http-result';

@Roles('admin', 'manager', 'supervisor', 'viewer', 'director')
@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard)
@Controller('org-structure')
export class OrgStructureController {
  private readonly logger = new Logger(OrgStructureController.name);
  constructor(
    private readonly service: OrgStructureService,
    private readonly exportService: OrgExportService,
    private readonly folderService: PositionFolderService,
  ) {}

  @Get('hierarchy')
  async getHierarchy() {
    return unwrapOrInternal(await this.service.getHierarchy());
  }

  @Get('stats')
  async getStats() {
    return unwrapOrInternal(await this.service.getStats());
  }

  @Get('nodes/flat')
  async getFlat(@Query() query: Record<string, unknown>) {
    return unwrapOrInternal(await this.service.getFlat(query));
  }

  @Get('nodes/:id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrInternal(await this.service.findOne(id));
  }

  @Post('nodes')
  async create(@Body() dto: Record<string, unknown>) {
    return unwrapOrInternal(await this.service.create(dto));
  }

  @Patch('nodes/:id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: Record<string, unknown>) {
    return unwrapOrInternal(await this.service.update(id, dto));
  }

  @Delete('nodes/:id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrInternal(await this.service.remove(id));
  }

  @Patch('nodes/:id/move')
  async move(@Param('id', ParseIntPipe) id: number, @Body() dto: Record<string, unknown>) {
    return unwrapOrInternal(await this.service.move(id, dto.newParentId !== undefined ? Number(dto.newParentId) : null));
  }

  @Patch('users/:userId/node')
  async assignUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Body('nodeId') nodeId: number,
  ) {
    return unwrapOrInternal(await this.service.assignUserToNode(userId, nodeId));
  }

  // ─── Export ───────────────────────────────────────────────────────────────

  @Get('export/excel')
  async exportExcel(@Res() reply: FastifyReply) {
    const r = await this.exportService.exportExcel();
    assertOk(r);
    const filename = `org-structure-${_time.now().toISOString().slice(0, 10)}.xlsx`;
    reply
      .header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      .header('Content-Disposition', `attachment; filename="${filename}"`)
      .send(r.data);
  }

  @Get('export/pdf')
  async exportPdf(@Res() reply: FastifyReply) {
    const r = await this.exportService.exportPdf();
    assertOk(r);
    const filename = `org-structure-${_time.now().toISOString().slice(0, 10)}.pdf`;
    reply
      .header('Content-Type', 'application/pdf')
      .header('Content-Disposition', `attachment; filename="${filename}"`)
      .send(r.data);
  }

  // ─── Position Folder ──────────────────────────────────────────────────────

  @Get('nodes/:id/folder')
  async getFolderItems(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrInternal(await this.folderService.getFolderItems(id));
  }

  @Post('nodes/:id/folder')
  async addFolderItem(@Param('id', ParseIntPipe) id: number, @Body() dto: Record<string, unknown>) {
    return unwrapOrInternal(await this.folderService.addFolderItem(id, dto as { itemType: 'document' | 'video' | 'test'; title: string; url?: string; description?: string; lmsCourseId?: number }));
  }

  @Delete('nodes/:nodeId/folder/:itemId')
  async removeFolderItem(
    @Param('nodeId', ParseIntPipe) _nodeId: number,
    @Param('itemId', ParseIntPipe) itemId: number,
  ) {
    return unwrapOrInternal(await this.folderService.removeFolderItem(itemId));
  }

  @Get('employees/:userId/folder')
  async getEmployeeFolderItems(@Param('userId', ParseIntPipe) userId: number) {
    return unwrapOrInternal(await this.folderService.getEmployeeFolderItems(userId));
  }

  @Get('nodes/:nodeId/history')
  async getNodeHistory(@Param('nodeId') nodeId: string) { return { data: [], nodeId }; }

  @Get('nodes/:nodeId/hr-requests')
  async getNodeHrRequests(@Param('nodeId') nodeId: string) { return { data: [], nodeId }; }

  @Get('nodes/:nodeId/portret')
  async getNodePortret(@Param('nodeId') nodeId: string) { return { nodeId, portret: null }; }
}
