/**
 * @module nps-requests.controller
 * @description NPS avto-yig'ish so'rovlari ro'yxati (modul 14, 14.60). Pending so'rovlarni
 *   ko'rish + javob kelganda 'responded' belgilash. Result unwrap (Qoida 1) + guard.
 * @layer Controller (Marketing)
 */
import {
  Body, Controller, Get, Param, Post, Query, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { z } from 'zod';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { assertOk } from '@common/http-result';
import { NpsRequestsRepository } from '../infrastructure/repositories/nps-requests.repository';

const RespondedSchema = z.object({
  npsResponseId: z.number().int().positive().nullable().optional().transform(v => v ?? null),
});

@ApiThrottle()
@ApiTags('Marketing — NPS Requests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Roles('admin', 'super_admin', 'director', 'manager', 'marketing_manager')
@UseInterceptors(AuditInterceptor)
@Controller('marketing/nps-requests')
export class NpsRequestsController {
  constructor(private readonly repo: NpsRequestsRepository) {}

  @ApiOperation({ summary: 'List NPS requests (?pending=true)' })
  @Get()
  async list(@Query('pending') pending?: string | boolean) {
    const r = await this.repo.list(String(pending) === 'true');
    assertOk(r); return r.data;
  }

  @ApiOperation({ summary: 'Mark NPS request responded' })
  @Post(':id/responded')
  async responded(@Param('id') id: string, @Body() body: unknown) {
    const d = RespondedSchema.parse(body);
    const r = await this.repo.markResponded(Number(id), d.npsResponseId);
    assertOk(r); return { success: true };
  }
}
