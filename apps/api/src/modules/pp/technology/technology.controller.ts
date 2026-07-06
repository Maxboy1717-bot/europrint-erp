/**
 * @module technology.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Controller, Get, Post, Put, Delete, Param, Query, Body, UseGuards, UseInterceptors, HttpException, HttpStatus } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { Roles } from '@common/decorators/roles.decorator';
import { Role } from '@common/constants/roles.constants';
import { unwrapOrInternal } from '@common/http-result';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { TechnologyService } from './technology.service';
import { TechnologyGrammageService } from './technology-grammage.service';
import { z } from 'zod';
import { notImplemented } from '@common/exceptions/not-implemented';

const GrammageQueryDto = z.object({ materialCardId: z.coerce.number().int().positive().optional() });
// Config-mexanizm: material layer-stack (gofra grammage manbai) — owner-editable, replace-set.
const SetMaterialLayersDto = z.object({
  layers: z.array(z.object({
    layerIndex: z.coerce.number().int().min(0),
    role: z.enum(['liner', 'flute']),
    gsm: z.coerce.number().positive(),
    fluteType: z.enum(['A', 'B', 'C', 'E', 'BC', 'EB', 'F']).optional(),
    takeUpFactor: z.coerce.number().positive().optional(),
  })).min(1).max(20),
});
const ApproveDto = z.object({ bomApproved: z.boolean().default(false), routingApproved: z.boolean().default(false), techCardApproved: z.boolean().default(false), notes: z.string().optional() });
const RejectDto = z.object({ reason: z.string().min(1), returnTo: z.enum(['manager', 'designer']).default('manager') });

const CreateCardDto = z.object({
  code: z.string().max(50).optional(),
  name: z.string().max(200).optional(),
  direction: z.string().max(20).optional(),
  materialType: z.string().max(50).optional(),
  productType: z.string().optional(),
  formatA: z.coerce.number().int().optional(),
  formatB: z.coerce.number().int().optional(),
  formatCode: z.string().max(20).optional(),
  gofraProfile: z.string().max(20).optional(),
  raskroyPerList: z.coerce.number().int().optional(),
  scrapPct: z.coerce.number().optional(),
  qolipId: z.coerce.number().int().optional(),
  printParams: z.any().optional(),
  kesim: z.any().optional(),
  postPress: z.any().optional(),
  ishTartibi: z.any().optional(),
  operations: z.string().optional(),
});
const UpdateCardDto = CreateCardDto.extend({ status: z.enum(['draft', 'approved', 'archived']).optional() });
const BomItemDto = z.object({ materialCode: z.string().min(1), quantity: z.coerce.number(), unit: z.string().max(10).optional(), layer: z.string().max(20).optional() });
const RouteDto = z.object({
  opSeq: z.coerce.number().int(), operation: z.string().min(1).max(100),
  machineId: z.coerce.number().int().optional(), altMachineId: z.coerce.number().int().optional(),
  normPerHour: z.coerce.number().optional(), setupMinutes: z.coerce.number().int().optional(),
  scrapFixed: z.coerce.number().int().optional(), scrapPct: z.coerce.number().optional(),
  minRazryad: z.coerce.number().int().optional(), isCore: z.boolean().optional(),
});



@ApiTags('Technology')
@ApiBearerAuth()
@ApiThrottle()
@Controller('technology')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class TechnologyController {
  constructor(
    private readonly svc: TechnologyService,
    private readonly grammage: TechnologyGrammageService,
    private readonly i18n: I18nService,
  ) {}

  @Get('dashboard')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.TECHNOLOGIST)
  @ApiOperation({ summary: 'Technology department dashboard stats' })
  async getDashboard() {
    return unwrapOrInternal(await this.svc.getDashboard());
  }

  @Get('orders')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.TECHNOLOGIST)
  @ApiOperation({ summary: 'List pending_tech orders for technologist approval' })
  async getOrders(@Query('status') status?: string) {
    return unwrapOrInternal(await this.svc.getOrders(status ?? 'pending_tech'));
  }

  @Get('orders/:id/approval-log')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.TECHNOLOGIST)
  @ApiOperation({ summary: 'Get approval log for a papka order' })
  async getApprovalLog(@Param('id') id: string) {
    return unwrapOrInternal(await this.svc.getApprovalLog(id));
  }

  @Get('orders/:id/tech-card')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.TECHNOLOGIST)
  @ApiOperation({ summary: 'Get tech card for an order' })
  async getOrderTechCard(@Param('id') id: string) {
    return unwrapOrInternal(await this.svc.getOrderTechCard(id));
  }

  @Get('tech-cards')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.TECHNOLOGIST)
  @ApiOperation({ summary: 'List all tech cards' })
  async getTechCards() {
    return unwrapOrInternal(await this.svc.getTechCards());
  }

  @Get('materials/alternatives')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.TECHNOLOGIST)
  @ApiOperation({ summary: 'Find material alternatives for cost optimization' })
  async getMaterialAlternatives(@Query('material') material: string) {
    return unwrapOrInternal(await this.svc.getMaterialAlternatives(material ?? 'gofrokarton'));
  }

  @Post('orders/:id/ai-check')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.TECHNOLOGIST)
  @ApiOperation({ summary: 'Run AI quality check on a papka order' })
  async runAiCheck(@Param('id') id: string) {
    return unwrapOrInternal(await this.svc.runAiCheck(id));
  }

  @Post('orders/:id/approve')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.TECHNOLOGIST)
  @ApiOperation({ summary: 'Technologist approves an order (3-checkpoint)' })
  async approveOrder(@Param('id') id: string, @Body() body: unknown, @CurrentUser() user: AuthenticatedUser) {
    const dto = ApproveDto.parse(body);
    unwrapOrInternal(await this.svc.approveOrder(id, { ...dto, approvedById: String(user.id) }));
    return { orderId: id, approvedAt: _time.now().toISOString() };
  }

  @Post('orders/:id/reject')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.TECHNOLOGIST)
  @ApiOperation({ summary: 'Technologist rejects an order' })
  async rejectOrder(@Param('id') id: string, @Body() body: unknown, @CurrentUser() user: AuthenticatedUser) {
    const dto = RejectDto.parse(body);
    unwrapOrInternal(await this.svc.rejectOrder(id, { ...dto, rejectedById: String(user.id) }));
    return { orderId: id, rejectedAt: _time.now().toISOString() };
  }

  @Get('cards')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.TECHNOLOGIST)
  @ApiOperation({ summary: 'List technology cards' })
  async getCards(@Query('status') _status?: string) {
    return unwrapOrInternal(await this.svc.getCards());
  }

  @Post('cards/generate')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.TECHNOLOGIST)
  @ApiOperation({ summary: 'Generate technology card' })
  async generateCard(@Body() _body: unknown) {
    return notImplemented('POST /technology/cards/generate');
  }

  @Get('cards/:id')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.TECHNOLOGIST)
  @ApiOperation({ summary: 'Get technology card by ID' })
  async getCardById(@Param('id') id: string) {
    const r = await this.svc.getCardById(id);
    if (!r.ok) throw new HttpException(await this.i18n.t('errors.technologyCardNotFound'), HttpStatus.NOT_FOUND);
    return r.data;
  }

  // ⭐ Gofra/Sloy 3-formula consumer: effective board grammage + kg↔sheet for a tech card.
  // Reads the card's material → material_layer_config + pp_flute_types, delegates ALL math to
  // the pure GofraConversionService. Honest `complete:false` payload when data is unfilled (Q-40).
  @Get('cards/:id/grammage')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.TECHNOLOGIST)
  @ApiOperation({ summary: 'Effective corrugated grammage (g/m²) + kg↔sheet conversions for a tech card' })
  async getCardGrammage(@Param('id') id: string, @Query() query: unknown) {
    const q = GrammageQueryDto.parse(query);
    const cardId = parseInt(id, 10);
    if (!Number.isFinite(cardId)) throw new HttpException(await this.i18n.t('validation.invalidCardId'), HttpStatus.BAD_REQUEST);
    const r = await this.svc.getCardGrammage(cardId, q.materialCardId);
    if (!r.ok) {
      const code = r.error.code === 'NOT_FOUND' ? HttpStatus.NOT_FOUND : HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException(r.error.message, code);
    }
    return r.data;
  }

  @Post('cards/:id/optimize')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.TECHNOLOGIST)
  @ApiOperation({ summary: 'Optimize technology card' })
  async optimizeCard(@Param('id') _id: string, @Body() _body: unknown) {
    return notImplemented('POST /technology/cards/:id/optimize');
  }

  // ⭐ Config-mexanizm: material layer-stack sozlash (gofra grammage manbai). Owner-editable —
  // layer'lar to'ldirilgach GET cards/:id/grammage real grammage hisoblaydi (complete:false o'rniga).
  @Put('materials/:materialCardId/layers')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.TECHNOLOGIST)
  @ApiOperation({ summary: 'Configure (set/replace) a material layer stack — gofra grammage source' })
  async setMaterialLayers(@Param('materialCardId') materialCardId: string, @Body() body: unknown) {
    const { layers } = SetMaterialLayersDto.parse(body);
    const id = parseInt(materialCardId, 10);
    if (!Number.isFinite(id)) throw new HttpException(await this.i18n.t('validation.invalidMaterialId'), HttpStatus.BAD_REQUEST);
    return unwrapOrInternal(await this.grammage.setMaterialLayers(id, layers));
  }

  // ── Phase 1: texkarta MASTER CRUD ─────────────────────────────────────────
  @Post('cards')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.TECHNOLOGIST)
  @ApiOperation({ summary: 'Create a technology master card' })
  async createCard(@Body() body: unknown, @CurrentUser() user: AuthenticatedUser) {
    const dto = CreateCardDto.parse(body);
    return unwrapOrInternal(await this.svc.createCard({ ...dto, createdBy: Number(user.id) }));
  }

  @Put('cards/:id')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.TECHNOLOGIST)
  @ApiOperation({ summary: 'Update a technology master card (bumps version + snapshots)' })
  async updateCard(@Param('id') id: string, @Body() body: unknown, @CurrentUser() user: AuthenticatedUser) {
    const dto = UpdateCardDto.parse(body);
    const r = await this.svc.updateCard(id, dto, Number(user.id));
    if (!r.ok) throw new HttpException(String(r.error), HttpStatus.BAD_REQUEST);
    return r.data;
  }

  @Delete('cards/:id')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.TECHNOLOGIST)
  @ApiOperation({ summary: 'Soft-delete a technology master card' })
  async deleteCard(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    unwrapOrInternal(await this.svc.deleteCard(id, Number(user.id)));
    return { id, deletedAt: _time.now().toISOString() };
  }

  @Post('cards/:id/lab-approve')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.TECHNOLOGIST)
  @ApiOperation({ summary: 'Mark lab-approved gate' })
  async labApprove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    const r = await this.svc.labApprove(id, Number(user.id));
    if (!r.ok) throw new HttpException(String(r.error), HttpStatus.NOT_FOUND);
    return r.data;
  }

  @Post('cards/:id/maket-approve')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.TECHNOLOGIST)
  @ApiOperation({ summary: 'Mark maket-approved gate' })
  async maketApprove(@Param('id') id: string) {
    const r = await this.svc.maketApprove(id);
    if (!r.ok) throw new HttpException(String(r.error), HttpStatus.NOT_FOUND);
    return r.data;
  }

  @Get('cards/:id/bom')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.TECHNOLOGIST)
  @ApiOperation({ summary: 'List BOM rows of a card' })
  async getBom(@Param('id') id: string) {
    return unwrapOrInternal(await this.svc.getBom(id));
  }

  @Post('cards/:id/bom')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.TECHNOLOGIST)
  @ApiOperation({ summary: 'Add a BOM row to a card' })
  async addBom(@Param('id') id: string, @Body() body: unknown) {
    const dto = BomItemDto.parse(body);
    const r = await this.svc.addBomItem(id, dto);
    if (!r.ok) throw new HttpException(String(r.error), HttpStatus.BAD_REQUEST);
    return r.data;
  }

  @Get('cards/:id/routes')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.TECHNOLOGIST)
  @ApiOperation({ summary: 'List route operations of a card' })
  async getRoutes(@Param('id') id: string) {
    return unwrapOrInternal(await this.svc.getRoutes(id));
  }

  @Post('cards/:id/routes')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.TECHNOLOGIST)
  @ApiOperation({ summary: 'Add a route operation to a card' })
  async addRoute(@Param('id') id: string, @Body() body: unknown) {
    const dto = RouteDto.parse(body);
    const r = await this.svc.addRoute(id, dto);
    if (!r.ok) throw new HttpException(String(r.error), HttpStatus.BAD_REQUEST);
    return r.data;
  }

  @Get('cards/:id/versions')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.TECHNOLOGIST)
  @ApiOperation({ summary: 'List version history of a card' })
  async getVersions(@Param('id') id: string) {
    return unwrapOrInternal(await this.svc.getVersions(id));
  }

  // SB0741 — rollback: restore a card to a prior snapshot (additive; bumps version, re-snapshots).
  @Post('cards/:id/versions/:versionId/restore')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.TECHNOLOGIST)
  @ApiOperation({ summary: 'Restore a technology card to a prior version (rollback)' })
  async restoreVersion(
    @Param('id') id: string,
    @Param('versionId') versionId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const r = await this.svc.restoreVersion(id, versionId, Number(user.id));
    if (!r.ok) throw new HttpException(String(r.error), HttpStatus.BAD_REQUEST);
    return r.data;
  }
}
