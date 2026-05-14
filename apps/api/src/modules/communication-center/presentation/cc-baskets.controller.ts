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
  Body, Controller, ForbiddenException, Get, NotFoundException, Param, Post, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
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

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('cc/baskets')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles('admin', 'manager', 'supervisor', 'director', 'ceo', 'employee', 'accountant')
export class CcBasketsController {
  constructor(
    private readonly svc:   CcBasketsService,
    private readonly stats: CcStatsService,
  ) {}

  /** KPI/statistika — javob vaqti, 24h overdue %, kechikkan %, bo'limlar, xodim yuklamasi */
  @Get('stats/kpi')
  kpi(@CurrentUser() user: { id: number; role: string }) {
    return this.stats.getKpi(user.id, user.role ?? 'employee');
  }

  @Get('inbox')
  inbox(@CurrentUser() user: { id: number }) {
    return this.svc.listBasket(user.id, 'inbox');
  }

  @Get('pending')
  pending(@CurrentUser() user: { id: number }) {
    return this.svc.listBasket(user.id, 'pending');
  }

  @Get('outbox')
  outbox(@CurrentUser() user: { id: number }) {
    return this.svc.listBasket(user.id, 'outbox');
  }

  @Get('summary')
  summary(@CurrentUser() user: { id: number }) {
    return this.svc.summary(user.id);
  }

  @Get(':id')
  async getOne(@Param('id') id: string, @CurrentUser() user: { id: number; role: string }) {
    const basket = await this.svc.getOne(id);
    if (!basket) {
      throw new NotFoundException('Hujjat topilmadi');
    }
    const isPrivileged = ['admin', 'super_admin', 'director', 'ceo'].includes(user.role);
    if (!isPrivileged && basket.basketOwnerUserId !== user.id) {
      throw new ForbiddenException('Ruxsat yo\'q');
    }
    return basket;
  }

  @Post(':id/move')
  move(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(MoveBasketSchema)) body: MoveBasketDto,
    @CurrentUser() user: { id: number; role: string },
  ) {
    // Archive uchun super-admin/director cheklovi
    if (body.to === 'archived' && !['admin', 'director', 'ceo'].includes(user.role)) {
      throw new ForbiddenException('Ruxsat yo\'q');
    }
    return this.svc.move(id, user.id, body.to as BasketState, body.note);
  }
}
