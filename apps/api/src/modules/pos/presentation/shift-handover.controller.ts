/**
 * @module shift-handover.controller
 * @description NestJS controller. POS Monitor — smena-topshirish (2-imzo) akti + foto-dalil +
 *   qaytariladigan-tara (poddon/rohler). Transport qatlami; servisga delegate qiladi.
 */

import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import {
  Controller, Get, Post, Param, Body, Query,
  UseGuards, Ip, ParseIntPipe, UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';

import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@common/types/user.types';
import { PermissionGuard } from '@common/guards/permission.guard';
import { RequirePermission } from '@common/decorators/require-permission.decorator';
import { unwrapOrInternal } from '@common/http-result';

import { PosShiftHandoverService } from '../application/services/pos-shift-handover.service';
import {
  CreateShiftHandoverSchema, CreateShiftHandoverDto,
  SignHandoverSchema, SignHandoverDto,
  CancelShiftHandoverSchema, CancelShiftHandoverDto,
  ShiftHandoverFilterSchema, ShiftHandoverFilterDto,
  ReturnablePalletSchema, ReturnablePalletDto,
  ReturnablePalletFilterSchema, ReturnablePalletFilterDto,
} from '../dto/shift-handover.dto';

@ApiTags('POS — Smena topshirish')
@ApiBearerAuth()
@UseGuards(PermissionGuard)
@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@Controller('pos/handovers')
export class ShiftHandoverController {
  constructor(private readonly service: PosShiftHandoverService) {}

  // ─── Aktlar ro'yxati ────────────────────────────────────────────────────────
  @Get()
  @RequirePermission('pos.movements.read')
  @ApiOperation({ summary: 'Smena-topshirish aktlari ro\'yxati' })
  async findAll(@Query() query: unknown) {
    const filter: ShiftHandoverFilterDto = ShiftHandoverFilterSchema.parse(query ?? {});
    return unwrapOrInternal(await this.service.findAll(filter));
  }

  // ─── Tara balansi (poddon/rohler qarzdorlik) — :id'dan OLDIN ────────────────
  @Get('pallets/balance')
  @RequirePermission('pos.movements.read')
  @ApiOperation({ summary: 'Qaytariladigan tara balansi (berilgan − qaytgan = qoldiq)' })
  async getPalletBalance(@Query() query: unknown) {
    const filter: ReturnablePalletFilterDto = ReturnablePalletFilterSchema.parse(query ?? {});
    return unwrapOrInternal(await this.service.getPalletBalance(filter));
  }

  // ─── Akt tafsiloti ──────────────────────────────────────────────────────────
  @Get(':id')
  @RequirePermission('pos.movements.read')
  @ApiOperation({ summary: 'Smena-topshirish akti tafsiloti' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrInternal(await this.service.findOne(id));
  }

  // ─── Akt yaratish ───────────────────────────────────────────────────────────
  @Post()
  @RequirePermission('pos.movements.create')
  @ApiOperation({ summary: 'Smena-topshirish akti yaratish (topshiruvchi = joriy foydalanuvchi)' })
  @ApiResponse({ status: 201, description: 'Akt yaratildi (status=draft)' })
  async create(@Body() body: unknown, @CurrentUser() user: AuthenticatedUser, @Ip() ip: string) {
    const dto: CreateShiftHandoverDto = CreateShiftHandoverSchema.parse(body);
    return unwrapOrInternal(await this.service.createHandover(dto, user.id, ip));
  }

  // ─── Imzo (2-imzo darvozasi) ────────────────────────────────────────────────
  @Post(':id/sign')
  @RequirePermission('pos.movements.update')
  @ApiOperation({ summary: 'Aktga imzo (role=from|to). Ikkala imzo bo\'lsa status=closed' })
  async sign(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
    @CurrentUser() user: AuthenticatedUser,
    @Ip() ip: string,
  ) {
    const dto: SignHandoverDto = SignHandoverSchema.parse(body);
    return unwrapOrInternal(await this.service.sign(id, dto, user.id, ip));
  }

  // ─── Bekor qilish ───────────────────────────────────────────────────────────
  @Post(':id/cancel')
  @RequirePermission('pos.movements.update')
  @ApiOperation({ summary: 'Aktni bekor qilish (yopilgan akt bekor qilinmaydi)' })
  async cancel(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
    @CurrentUser() user: AuthenticatedUser,
    @Ip() ip: string,
  ) {
    const dto: CancelShiftHandoverDto = CancelShiftHandoverSchema.parse(body);
    return unwrapOrInternal(await this.service.cancel(id, dto, user.id, ip));
  }

  // ─── Qaytariladigan-tara yozuvi (poddon/rohler berildi/qaytdi) ──────────────
  @Post('pallets')
  @RequirePermission('pos.movements.create')
  @ApiOperation({ summary: 'Qaytariladigan tara yozuvi (direction=out berildi | in qaytdi)' })
  async recordPallet(@Body() body: unknown, @CurrentUser() user: AuthenticatedUser, @Ip() ip: string) {
    const dto: ReturnablePalletDto = ReturnablePalletSchema.parse(body);
    return unwrapOrInternal(await this.service.recordPallet(dto, user.id, ip));
  }
}
