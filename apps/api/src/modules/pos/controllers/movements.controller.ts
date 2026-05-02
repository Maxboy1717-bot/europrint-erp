import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
/**
 * POS — Movements Controller
 * Barcha inventar harakatlari endpointlari
 */

import {Controller, Get, Post, Patch, Param, Body, Query,
  UseGuards, Ip, Res, ParseIntPipe, HttpCode, HttpStatus, Logger, UseInterceptors , UsePipes,} from '@nestjs/common';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';

import {
  ApiTags, ApiOperation, ApiBearerAuth, ApiResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { FastifyReply } from 'fastify';

import { CurrentUser }       from '@common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@common/types/user.types';
import { PermissionGuard }   from '@common/guards/permission.guard';
import { RequirePermission } from '@common/decorators/require-permission.decorator';

import { PosMovementService }        from '../services/pos-movement.service';
import { PosMovementStatusService }  from '../services/pos-movement-status.service';
import { PosMovementQueryService }   from '../services/pos-movement-query.service';
import { PosAuditService }           from '../services/pos-audit.service';
import { PosPdfService }             from '../services/pos-pdf.service';
import { StockLedgerService }        from '../services/stock-ledger.service';

import {
  CreateMovementDto,
  UpdateMovementStatusDto,
  QcDecisionDto,
  ThreeWayMatchDto,
  MovementFilterDto,
  CreateDamageActDto,
  CreateInventoryAdjustmentDto,
} from '../dto/movement.dto';
import { unwrapOrInternal } from '@common/http-result';

@ApiTags('POS — Harakatlar')
@ApiBearerAuth()
@UseGuards(PermissionGuard)
@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@Controller('pos/movements')
export class MovementsController {
  private readonly logger = new Logger(MovementsController.name);
  constructor(
    private readonly movementService:       PosMovementService,
    private readonly movementStatusService: PosMovementStatusService,
    private readonly movementQueryService:  PosMovementQueryService,
    private readonly auditService:          PosAuditService,
    private readonly pdfService:            PosPdfService,
    private readonly stockLedgerService:    StockLedgerService,
  ) {}

  // ─── Ro'yxat ─────────────────────────────────────────────────────────────

  @Get()
  @RequirePermission('pos.movements.read')
  @ApiOperation({ summary: 'Harakatlar ro\'yxati (filtrlash bilan)' })
  async findAll(@Query() filter: MovementFilterDto) {
    return unwrapOrInternal(await this.movementQueryService.findAll(filter));
  }

  // ─── Tafsilot ─────────────────────────────────────────────────────────────

  @Get(':id')
  @RequirePermission('pos.movements.read')
  @ApiOperation({ summary: 'Harakat tafsilotlari (satrlar bilan)' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrInternal(await this.movementQueryService.findOne(id));
  }

  // ─── Yaratish ─────────────────────────────────────────────────────────────

  @Post()
  @RequirePermission('pos.movements.create')
  @ApiOperation({ summary: 'Yangi harakat yaratish' })
  @ApiResponse({ status: 201, description: 'Harakat yaratildi' })
  async createMovement(
    @Body() dto: CreateMovementDto,
    @CurrentUser() user: AuthenticatedUser,
    @Ip() ip: string,
  ) {
    return unwrapOrInternal(await this.movementService.createMovement(dto, user.id, ip));
  }

  // ─── Status O'zgartirish ──────────────────────────────────────────────────

  @Patch(':id/status')
  @RequirePermission('pos.movements.update')
  @ApiOperation({ summary: 'Harakat statusini o\'zgartirish' })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMovementStatusDto,
    @CurrentUser() user: AuthenticatedUser,
    @Ip() ip: string,
  ) {
    return unwrapOrInternal(await this.movementStatusService.updateStatus(id, dto, user.id, ip));
  }

  // ─── QC Qarori ────────────────────────────────────────────────────────────

  @Post('qc-decision')
  @RequirePermission('pos.qc.decide')
  @ApiOperation({ summary: 'QC qarori (APPROVED / REWORK / REJECTED)' })
  async recordQcDecision(@Body() dto: QcDecisionDto, @CurrentUser() user: AuthenticatedUser, @Ip() ip: string) {
    return unwrapOrInternal(await this.movementStatusService.recordQcDecision(dto, user.id, ip));
  }

  // ─── Damage Akti ─────────────────────────────────────────────────────────

  @Post('damage')
  @RequirePermission('pos.movements.create')
  @ApiOperation({ summary: 'Zarar akti yaratish' })
  async createDamageAct(@Body() dto: CreateDamageActDto, @CurrentUser() user: AuthenticatedUser, @Ip() ip: string) {
    return unwrapOrInternal(await this.movementService.createDamageAct(dto, user.id, ip));
  }

  // ─── PDF Yuklab Olish ─────────────────────────────────────────────────────

  @Get(':id/pdf')
  @RequirePermission('pos.movements.read')
  @ApiOperation({ summary: 'Harakat akti PDF' })
  async downloadPdf(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: FastifyReply,
  ) {
    const bufferR = await this.pdfService.generateMovementAct(id);
    const buffer = bufferR.ok ? (bufferR.data as Buffer) : Buffer.alloc(0);
    res
      .header('Content-Type', 'application/pdf')
      .header('Content-Disposition', `attachment; filename="movement-${id}.pdf"`)
      .header('Content-Length', buffer.length)
      .send(buffer);
  }

  // ─── Tasdiqlash Yozuvlari ─────────────────────────────────────────────────

  @Get(':id/confirmations')
  @RequirePermission('pos.movements.read')
  @ApiOperation({ summary: 'Harakat tasdiqlash yozuvlari (imzo, qaror, IP)' })
  async getConfirmations(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrInternal(await this.stockLedgerService.getConfirmations(id));
  }

  // ─── Audit Log ────────────────────────────────────────────────────────────

  @Get(':id/history')
  @RequirePermission('pos.audit.read')
  @ApiOperation({ summary: 'Harakat o\'zgartirish tarixi' })
  async getHistory(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrInternal(await this.auditService.getEntityHistory('pos_movements', id));
  }
}
