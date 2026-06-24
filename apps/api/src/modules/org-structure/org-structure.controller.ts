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
import { NodePortretService } from './node-portret.service';
import type { FastifyReply } from 'fastify';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@common/types/user.types';
import { assertOk, unwrapOrInternal } from '@common/http-result';
import { z } from 'zod';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';
type Rows = { rows?: unknown[] };

// P2.6: .strict() (mass-assignment guard) — the allow-list MUST match the real org_departments
// columns the FE dialogs send + the repo maps. STEP B (2026-06-05): added nodeType/tskp/tskpRu/
// color/level — they were rejected as unknown keys, so "Add bo'lim"/"Tahrirlash" silently failed
// (AddNodeDialog sends nodeType/tskp/level; EditDialog sends color/tskp/tskpRu/nodeType). Still
// .strict() — only the allowed keys grew to the columns that genuinely exist. (`type` was dead:
// read by nobody; `level` is allowed-but-ignored — service computes hierarchy level from parent.)
const OrgNodeSchema = z.object({
  name:        z.string().max(500).optional(),
  nameRu:      z.string().max(500).optional(),
  nodeType:    z.string().max(50).optional(),
  tskp:        z.string().max(500).optional(),
  tskpRu:      z.string().max(500).optional(),
  color:       z.string().max(20).optional(),
  parentId:    z.union([z.string(), z.number()]).nullable().optional(),
  positionId:  z.union([z.string(), z.number()]).optional(),
  description: z.string().max(2000).optional(),
  level:       z.union([z.string(), z.number()]).nullable().optional(),
  // STEP C: department head ("the boss") — references users.id. nullable = clear the head.
  // Repo updateFromDto maps dto.headUserId -> head_user_id (org-mutations.repo :59).
  headUserId:  z.union([z.number(), z.null()]).optional(),
  // Unit fields (org-unit-fields-2026-06-19 migration — EP-ORG Phase 1 CHAT-TARIXI
  // Bo'lim→Sex→Uskuna→Ishchi). .strict() preserved — allow-list widened, no passthrough.
  code:              z.string().max(50).optional(),
  qymUz:             z.string().max(2000).optional(),
  qymRu:             z.string().max(2000).optional(),
  cameraZoneId:      z.string().max(200).optional(),
  telegramGroupId:   z.string().max(200).optional(),
  // VISION (egasi 2026-06-24): har node (bo'lim VA lavozim) razryadga ega. null = tozalash.
  razryadLevelId:    z.union([z.number().int().positive(), z.null()]).optional(),
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

// Matches HRRequestDialog.tsx payload: { request_type, priority, comment, portret_id?, node_name }
const HrRequestSchema = z.object({
  request_type: z.string().max(40).optional(),
  priority:     z.string().max(20).optional(),
  comment:      z.string().max(2000).nullable().optional(),
  portret_id:   z.union([z.string(), z.number()]).nullable().optional(),
  node_name:    z.string().max(500).nullable().optional(),
}).passthrough();

// P51 — backfill admin op. dryRun defaults to true (preview-only) so an
// accidental empty body never triggers a write. .strict() rejects extra keys.
const BackfillManagerSchema = z.object({
  dryRun: z.boolean().default(true),
}).strict();

// Matches OrgNodePortretTab.tsx payload: { portret_data: { portret, tool_test_requirements } }
const NodePortretSchema = z.object({
  portret_data: z.object({
    portret:                z.record(z.string(), z.unknown()).optional(),
    tool_test_requirements: z.record(z.string(), z.unknown()).optional(),
  }).passthrough(),
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
    private readonly portretService: NodePortretService,
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

  /**
   * GET /org-structure/available-users
   * Returns all active users for the department-head picker in EditDialog.
   * 87% of nodes have zero members → member-based list returns headOptions=[].
   * This endpoint surfaces every active user (31 right now) unconditionally.
   */
  @ApiOperation({ summary: 'Active users for department-head picker' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('available-users')
  async getAvailableUsers() {
    return unwrapOrInternal(await this.service.getAvailableUsers());
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
  @Get('nodes/:nodeId/history')
  async getNodeHistory(@Param('nodeId') nodeId: string) {
    // Read from audit_logs WHERE table_name='orgstructure' AND record_id=nodeId::text.
    // Alias columns to match HistoryEntry interface: action, changedBy, changedAt, details.
    // id is UUID in DB — return row index as numeric id for FE HistoryEntry.id (number).
    const r = await db.execute(sql`
      SELECT
        ROW_NUMBER() OVER (ORDER BY created_at DESC) AS id,
        action,
        COALESCE(user_full_name, 'Noma''lum') AS "changedBy",
        created_at AS "changedAt",
        COALESCE(array_to_string(changed_fields, ', '), '') AS details
      FROM audit_logs
      WHERE table_name = 'orgstructure'
        AND record_id = ${nodeId}
      ORDER BY created_at DESC
    `);
    const items = ((r as Rows).rows) ?? [];
    return { items, total: items.length };
  }

  @ApiOperation({ summary: 'Get node hr requests' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('nodes/:nodeId/hr-requests')
  async getNodeHrRequests(@Param('nodeId', ParseIntPipe) nodeId: number) {
    return unwrapOrInternal(await this.portretService.getHrRequests(nodeId));
  }

  @ApiOperation({ summary: 'Create node hr request' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Post('nodes/:nodeId/hr-requests')
  async createNodeHrRequest(
    @Param('nodeId', ParseIntPipe) nodeId: number,
    @Body() body: unknown,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const dto = HrRequestSchema.parse(body);
    const requesterId = user?.id ?? user?.sub ?? null;
    return unwrapOrInternal(await this.portretService.createHrRequest(nodeId, {
      requestType: dto.request_type,
      priority:    dto.priority,
      comment:     dto.comment ?? null,
      portretId:   dto.portret_id !== undefined && dto.portret_id !== null ? Number(dto.portret_id) : null,
      nodeName:    dto.node_name ?? null,
    }, requesterId));
  }

  @ApiOperation({ summary: 'Get node portret' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('nodes/:nodeId/portret')
  async getNodePortret(@Param('nodeId', ParseIntPipe) nodeId: number) {
    return unwrapOrInternal(await this.portretService.getPortret(nodeId));
  }

  @ApiOperation({ summary: 'Create node portret' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Post('nodes/:nodeId/portret')
  async createNodePortret(
    @Param('nodeId', ParseIntPipe) nodeId: number,
    @Body() body: unknown,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const dto = NodePortretSchema.parse(body);
    const creatorId = user?.id ?? user?.sub ?? null;
    return unwrapOrInternal(await this.portretService.savePortret(nodeId, dto.portret_data as Record<string, unknown>, creatorId));
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

  // --- P51: manager_id derivation ------------------------------------------

  // Distinct from GET nodes/:nodeId/direct-manager (legacy COALESCE-self model).
  // This walks ONLY the parent chain (vizyon §2.3 Q1/Q4); null when no head up
  // the tree. Any authenticated org-structure role may read it.
  @ApiOperation({ summary: 'Derive manager up the parent chain (P51)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('manager-chain/:nodeId')
  async getDerivedManager(@Param('nodeId', ParseIntPipe) nodeId: number) {
    return unwrapOrInternal(await this.service.deriveManagerForNode(nodeId));
  }

  // Admin-only: recompute manager_id across org_functions + employees from the
  // tree. DATA-gated (refuses while any active node has NULL head_user_id).
  // dryRun defaults to true → preview only. @Roles here OVERRIDES the class
  // role list (reflector getAllAndOverride takes the method decorator first).
  @ApiOperation({ summary: 'Backfill manager_id from org tree (ADMIN/HR, P51)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Roles('super_admin', 'hr')
  @Post('admin/backfill-manager-ids')
  async backfillManagerIds(@Body() body: unknown) {
    const dto = BackfillManagerSchema.parse(body);
    return unwrapOrInternal(await this.service.triggerManagerBackfill(dto.dryRun));
  }
}
