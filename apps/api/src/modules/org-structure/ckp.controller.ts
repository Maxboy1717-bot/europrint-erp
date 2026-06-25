/**
 * @module ckp.controller
 * @description HTTP routes — ЦКП kunlik fakt (FAZA-05, EP-ORG-014..018). Yozish + tarix + kaskad-agregat.
 */

import {
  Body, Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@common/types/user.types';
import { unwrapOrThrow, unwrapOrInternal } from '@common/http-result';
import { z } from 'zod';
import { CkpFactService } from './ckp-fact.service';

const FactSchema = z.object({
  cardId: z.number().int().positive(),
  employeeId: z.number().int().positive().optional(),
  productId: z.number().int().positive().optional(),
  factDate: z.string().min(8).max(10),
  actualValue: z.number().optional(),
  source: z.enum(['MANUAL', 'AI_CHAT', 'MES_AUTO', 'IOT']).optional(),
  notes: z.string().max(2000).optional(),
}).strict();

@Roles('admin', 'manager', 'hr_manager', 'director', 'super_admin', 'supervisor', 'viewer')
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard)
@ApiTags('Org CKP')
@ApiBearerAuth()
@Controller('org-structure/ckp')
export class CkpController {
  constructor(private readonly service: CkpFactService) {}

  @ApiOperation({ summary: 'ЦКП kunlik fakt yozish' })
  @ApiResponse({ status: 201, description: 'OK' })
  @Post('fact')
  async record(@Body() body: unknown, @CurrentUser() user: AuthenticatedUser) {
    const dto = FactSchema.parse(body);
    const uid = user?.id ?? user?.sub ?? null;
    return unwrapOrThrow(await this.service.recordFact({
      cardId: dto.cardId,
      employeeId: dto.employeeId ?? null,
      productId: dto.productId ?? null,
      factDate: dto.factDate,
      actualValue: dto.actualValue ?? null,
      source: dto.source,
      notes: dto.notes ?? null,
      recordedBy: uid == null ? null : Number(uid),
    }));
  }

  @ApiOperation({ summary: 'Karta ЦКП fakt tarixi' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('fact')
  async list(@Query('cardId') cardId: string, @Query('from') from?: string, @Query('to') to?: string) {
    const data = unwrapOrInternal(await this.service.listByCard(Number(cardId), from ?? null, to ?? null));
    const items = Array.isArray(data) ? data : [];
    return { items, total: items.length };
  }

  @ApiOperation({ summary: "ЦКП kaskad-agregat (karta + farzandlar)" })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('aggregate/:cardId')
  async aggregate(@Param('cardId', ParseIntPipe) cardId: number, @Query('date') date: string) {
    return unwrapOrInternal(await this.service.aggregate(cardId, date));
  }
}
