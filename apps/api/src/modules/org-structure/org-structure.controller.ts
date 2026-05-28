/**
 * @module org-structure.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import {
Controller, Get, HttpException, HttpStatus, Post, Patch, Delete, Body, Param, Query, ParseIntPipe, Res, Logger, UseGuards, UseInterceptors, UsePipes, InternalServerErrorException,
} from '@nestjs/common';

import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { OrgStructureService } from './org-structure.service';
import { OrgExportService } from './org-export.service';
import { PositionFolderService } from './position-folder.service';
import type { FastifyReply } from 'fastify';
import { Roles } from '../../common/decorators/roles.decorator';
import { assertOk, unwrapOrInternal } from '@common/http-result';
import { z } from 'zod';
import { notImplemented } from '@common/exceptions/not-implemented';

// P2.6: .strict() instead of .passthrough() for mass-assignment protection
const OrgNodeSchema = z.object({
  name:        z.string().max(500).optional(),
  nameRu:      z.string().max(500).optional(),
  type:        z.string().max(50).optional(),
  parentId:    z.union([z.string(), z.number()]).nullable().optional(),
  positionId:  z.union([z.string(), z.number()]).optional(),
  description: z.string().max(2000).optional(),
}).strict();

const MoveNodeSchema = z.object({
  newParentId: z.union([z.string(), z.number()]).nullable().optional(),
}).passthrough();

const FolderItemSchema = z.object({
  itemType: z.enum(['document', 'video', 'test']),
  title: z.string().max(500),
  url: z.string().max(2000).optional(),
  description: z.string().max(2000).optional(),
  lmsCourseId: z.number().int().optional(),
}).passthrough();

const HrRequestSchema = z.object({
  type: z.string().max(50).optional(),
  description: z.string().max(2000).optional(),
}).passthrough();

const NodePortretSchema = z.object({
  skills: z.array(z.string()).optional(),
  description: z.string().max(2000).optional(),
}).passthrough();

@Roles('admin', 'manager', 'supervisor', 'viewer', 'director')
@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard)
@ApiTags('Org Structure')
@ApiBearerAuth()
@Controller('org-structure')
export class OrgStructureController {
  private readonly logger = new Logger(OrgStructureController.name);
  constructor(
    private readonly service: OrgStructureService,
    private readonly exportService: OrgExportService,
    private readonly folderService: PositionFolderService,
  ) {}

  @ApiOperation({ summary: 'Get hierarchy' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('hierarchy')
  async getHierarchy() {
    return unwrapOrInternal(await this.service.getHierarchy());
  }

  @ApiOperation({ summary: 'Get stats' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('stats')
  async getStats() {
    return unwrapOrInternal(await this.service.getStats());
  }

  @ApiOperation({ summary: 'Get flat' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('nodes/flat')
  async getFlat(@Query() query: Record<string, unknown>) {
    return unwrapOrInternal(await this.service.getFlat(query));
  }

  @ApiOperation({ summary: 'Find one' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('nodes/:id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrInternal(await this.service.findOne(id));
  }

  @ApiOperation({ summary: 'Create' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('nodes')
  async create(@Body() body: unknown) {
    const dto = OrgNodeSchema.parse(body);
    return unwrapOrInternal(await this.service.create(dto as Record<string, unknown>));
  }

  @ApiOperation({ summary: 'Update' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch('nodes/:id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    const dto = OrgNodeSchema.partial().parse(body);
    return unwrapOrInternal(await this.service.update(id, dto as Record<string, unknown>));
  }

  @ApiOperation({ summary: 'Remove' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Delete('nodes/:id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrInternal(await this.service.remove(id));
  }

  @ApiOperation({ summary: 'Move' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch('nodes/:id/move')
  async move(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    const dto = MoveNodeSchema.parse(body);
    return unwrapOrInternal(await this.service.move(id, dto.newParentId !== undefined && dto.newParentId !== null ? Number(dto.newParentId) : null));
  }

  @ApiOperation({ summary: 'Assign user' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Patch('users/:userId/node')
  async assignUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Body('nodeId') nodeId: number,
  ) {
    return unwrapOrInternal(await this.service.assignUserToNode(userId, nodeId));
  }

  // --- Export ---------------------------------------------------------------

  @ApiOperation({ summary: 'Export excel' })
  @ApiResponse({ status: 200, description: 'OK' })
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

  @ApiOperation({ summary: 'Export pdf' })
  @ApiResponse({ status: 200, description: 'OK' })
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

  // --- Position Folder ------------------------------------------------------

  @ApiOperation({ summary: 'Get folder items' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('nodes/:id/folder')
  async getFolderItems(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrInternal(await this.folderService.getFolderItems(id));
  }

  @ApiOperation({ summary: 'Add folder item' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Post('nodes/:id/folder')
  async addFolderItem(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    const dto = FolderItemSchema.parse(body);
    return unwrapOrInternal(await this.folderService.addFolderItem(id, dto as { itemType: 'document' | 'video' | 'test'; title: string; url?: string; description?: string; lmsCourseId?: number }));
  }

  @ApiOperation({ summary: 'Remove folder item' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Delete('nodes/:nodeId/folder/:itemId')
  async removeFolderItem(
    @Param('nodeId', ParseIntPipe) _nodeId: number,
    @Param('itemId', ParseIntPipe) itemId: number,
  ) {
    return unwrapOrInternal(await this.folderService.removeFolderItem(itemId));
  }

  @ApiOperation({ summary: 'Get employee folder items' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('employees/:userId/folder')
  async getEmployeeFolderItems(@Param('userId', ParseIntPipe) userId: number) {
    return unwrapOrInternal(await this.folderService.getEmployeeFolderItems(userId));
  }

  @ApiOperation({ summary: 'Get node history' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 501, description: 'Not implemented' })
  @Get('nodes/:nodeId/history')
  async getNodeHistory(@Param('nodeId') _nodeId: string) {
    return notImplemented('GET /org-structure/nodes/:nodeId/history');
  }

  @ApiOperation({ summary: 'Get node hr requests' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 501, description: 'Not implemented' })
  @Get('nodes/:nodeId/hr-requests')
  async getNodeHrRequests(@Param('nodeId') _nodeId: string) {
    return notImplemented('GET /org-structure/nodes/:nodeId/hr-requests');
  }

  @ApiOperation({ summary: 'Create node hr request' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 501, description: 'Not implemented' })
  @Post('nodes/:nodeId/hr-requests')
  async createNodeHrRequest(@Param('nodeId') _nodeId: string, @Body() body: unknown) {
    HrRequestSchema.parse(body);
    return notImplemented('POST /org-structure/nodes/:nodeId/hr-requests');
  }

  @ApiOperation({ summary: 'Get node portret' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('nodes/:nodeId/portret')
  async getNodePortret(@Param('nodeId') nodeId: string) { return { nodeId, portret: null }; }

  @ApiOperation({ summary: 'Create node portret' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Post('nodes/:nodeId/portret')
  async createNodePortret(@Param('nodeId') nodeId: string, @Body() body: unknown) {
    const dto = NodePortretSchema.parse(body);
    return { nodeId, ...dto, created: true };
  }

  @ApiOperation({ summary: 'Get approval chain' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('nodes/:nodeId/approval-chain')
  async getApprovalChain(@Param('nodeId', ParseIntPipe) nodeId: number) {
    return unwrapOrInternal(await this.service.getApprovalChain(nodeId));
  }

  @ApiOperation({ summary: 'Get direct manager' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('nodes/:nodeId/direct-manager')
  async getDirectManager(@Param('nodeId', ParseIntPipe) nodeId: number) {
    return unwrapOrInternal(await this.service.getDirectManager(nodeId));
  }

  @ApiOperation({ summary: 'Get telegram group' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('nodes/:nodeId/telegram-group')
  async getTelegramGroup(@Param('nodeId', ParseIntPipe) nodeId: number) {
    return unwrapOrInternal(await this.service.getTelegramGroupForNode(nodeId));
  }
}
