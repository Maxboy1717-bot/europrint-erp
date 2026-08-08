/**
 * /api/cc/baskets/*  —  Communication Center 3-savat REST endpointlari
 *
 * Endpoints:
 *   GET    /api/cc/baskets/inbox       — kiruvchi savat
 *   GET    /api/cc/baskets/pending     — kutish savati
 *   GET    /api/cc/baskets/outbox      — chiquvchi savat (yuborilganlar)
 *   GET    /api/cc/baskets/summary     — uchchala savat badge raqamlari
 *   GET    /api/cc/baskets/:id         — bitta hujjat tafsilotlari
 *   POST   /api/cc/baskets/:id/move    — savatni o'zgartirish (body: { to, note? })
 */

import {
  Body, Controller, ForbiddenException, Get, NotFoundException, Param, Post, Query, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { I18nService } from 'nestjs-i18n';
import { z } from 'zod';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Roles } from '@common/decorators/roles.decorator';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { CcBasketsService } from '../application/cc-baskets.service';
import { CcStatsService } from '../application/cc-stats.service';
import { BasketState } from '../domain/types';

// ── DTO ───────────────────────────────────────────────────────────────
const MoveBasketSchema = z.object({
  to:   z.enum(['inbox', 'pending', 'outbox', 'archived']),
  note: z.string().max(2000).optional(),
});
type MoveBasketDto = z.infer<typeof MoveBasketSchema>;

@ApiThrottle()
@ApiTags('Cc Baskets')
@ApiBearerAuth()
@Controller('cc/baskets')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles('admin', 'manager', 'supervisor', 'director', 'ceo', 'employee', 'accountant')
export class CcBasketsController {
  constructor(
    private readonly svc:   CcBasketsService,
    private readonly stats: CcStatsService,
    private readonly i18n:  I18nService,
  ) {}

  /** KPI/statistika — javob vaqti, 24h overdue %, kechikkan %, bo'limlar, xodim yuklamasi */
  @ApiOperation({ summary: 'Kpi' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('stats/kpi')
  kpi(@CurrentUser() user: { id: number; role: string }) {
    return this.stats.getKpi(user.id, user.role ?? 'employee');
  }

  // CC #19: 100+ hujjatli savat sahifalanadi. page (1-based) + limit (default 50,
  // maks 100) → offset. Noto'g'ri/bo'sh qiymatlar xavfsiz standartga tushadi.
  private _page(page?: string, limit?: string): { limit: number; offset: number } {
    const p = Math.max(1, Number.isFinite(Number(page)) ? Math.trunc(Number(page)) : 1);
    const l = Math.min(100, Math.max(1, Number.isFinite(Number(limit)) ? Math.trunc(Number(limit)) : 50));
    return { limit: l, offset: (p - 1) * l };
  }

  @ApiOperation({ summary: 'Inbox' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('inbox')
  inbox(@CurrentUser() user: { id: number }, @Query('page') page?: string, @Query('limit') limit?: string) {
    const { limit: l, offset } = this._page(page, limit);
    return this.svc.listBasket(user.id, 'inbox', l, offset);
  }

  @ApiOperation({ summary: 'Pending' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('pending')
  pending(@CurrentUser() user: { id: number }, @Query('page') page?: string, @Query('limit') limit?: string) {
    const { limit: l, offset } = this._page(page, limit);
    return this.svc.listBasket(user.id, 'pending', l, offset);
  }

  @ApiOperation({ summary: 'Outbox' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('outbox')
  outbox(@CurrentUser() user: { id: number }, @Query('page') page?: string, @Query('limit') limit?: string) {
    const { limit: l, offset } = this._page(page, limit);
    return this.svc.listBasket(user.id, 'outbox', l, offset);
  }

  @ApiOperation({ summary: 'Summary' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('summary')
  summary(@CurrentUser() user: { id: number }) {
    return this.svc.summary(user.id);
  }

  @ApiOperation({ summary: 'Get one' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get(':id')
  async getOne(@Param('id') id: string, @CurrentUser() user: { id: number; role: string }) {
    const basket = await this.svc.getOne(id);
    if (!basket) {
      throw new NotFoundException(await this.i18n.t('errors.documentNotFound'));
    }
    const isPrivileged = ['admin', 'super_admin', 'director', 'ceo'].includes(user.role);
    if (!isPrivileged && basket.basketOwnerUserId !== user.id) {
      throw new ForbiddenException(await this.i18n.t('errors.permissionDenied'));
    }
    return basket;
  }

  @ApiOperation({ summary: 'Move' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post(':id/move')
  async move(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(MoveBasketSchema)) body: MoveBasketDto,
    @CurrentUser() user: { id: number; role: string },
  ) {
    // Archive uchun super-admin/director cheklovi
    if (body.to === 'archived' && !['admin', 'director', 'ceo'].includes(user.role)) {
      throw new ForbiddenException(await this.i18n.t('errors.permissionDenied'));
    }
    return this.svc.move(id, user.id, body.to as BasketState, body.note);
  }
}
