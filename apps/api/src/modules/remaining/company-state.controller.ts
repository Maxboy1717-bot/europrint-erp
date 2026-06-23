/**
 * @module company-state.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { BadRequestException, Body, Controller, Get, Param, ParseIntPipe, Patch, UseGuards, UseInterceptors } from '@nestjs/common';
import { throwFromError, unwrapOrThrow } from '@common/http-result';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CompanyStateService } from './company-state.service';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { rawSql } from '@shared/db';
import { sql } from 'drizzle-orm';
import { z } from 'zod';

@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@Controller('company-state')
@UseGuards(RolesGuard)
@Roles('director', 'manager', 'super_admin', 'admin', 'cfo', 'finance_manager', 'ceo')
export class CompanyStateController {
  constructor(private readonly svc: CompanyStateService) {}

  @Get('current')
  async getCurrent() {
    return unwrapOrThrow(await this.svc.getCurrent());
  }

  // ─── state_thresholds config (owner-configurable bands + weights) ────────────

  private static readonly UpdateThresholdSchema = z.object({
    min_value: z.number().optional(),
    max_value: z.number().optional(),
    weight:    z.number().positive().max(1).optional(),
  });

  @Get('thresholds')
  async getThresholds() {
    const rows = await rawSql(sql`
      SELECT id, metric_key, level_code, min_value, max_value, weight
      FROM state_thresholds
      ORDER BY metric_key, level_code
    `);
    return rows.rows;
  }

  @Patch('thresholds/:id')
  async updateThreshold(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
  ) {
    const dto = CompanyStateController.UpdateThresholdSchema.parse(body);
    const rows = await rawSql(sql`
      UPDATE state_thresholds SET
        min_value = COALESCE(${dto.min_value ?? null}::numeric, min_value),
        max_value = COALESCE(${dto.max_value ?? null}::numeric, max_value),
        weight    = COALESCE(${dto.weight    ?? null}::numeric, weight)
      WHERE id = ${id}
      RETURNING id, metric_key, level_code, min_value, max_value, weight
    `);
    const result = rows.rows[0] ?? undefined;
    if (!result) throw new BadRequestException(`state_threshold id=${id} topilmadi`);
    return result;
  }
}
