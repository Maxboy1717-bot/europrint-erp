/**
 * @module pp-plan-fact.controller
 * @description Vision 07-pp#20 (EP-PP-106) surface for the PP plan-fact store.
 *
 *   POST /api/pp/plan-fact                 — log a plan-vs-actual snapshot row
 *   GET  /api/pp/plan-fact/recommendation  — last-year-fact recommendation for a product
 *                                            (median primary + best-20% + last-5)
 *
 *   Auth mirrors the sibling pp/reason-codes surface: JwtAuthGuard + RolesGuard.
 *   Transport-only (Rule 6): validate with Zod, delegate to the service, unwrap Result.
 */

import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { z } from 'zod';
import { unwrapOrThrow } from '@common/http-result';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { Role } from '@common/constants/roles.constants';
import { PpPlanFactService } from './pp-plan-fact.service';

// Any planner/production role may read the recommendation and log facts (the technologist
// is the vision actor; the shift/daily-close job runs as production_manager/director).
const PP_PLAN_FACT_READ = [Role.SUPER_ADMIN, Role.DIRECTOR, Role.PRODUCTION_MANAGER, Role.TECHNOLOGIST];
const PP_PLAN_FACT_WRITE = [Role.SUPER_ADMIN, Role.DIRECTOR, Role.PRODUCTION_MANAGER, Role.TECHNOLOGIST];

const LogSchema = z
  .object({
    productionOrderId: z.number().int().positive().optional(),
    productId: z.number().int().positive().optional(),
    entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "entryDate 'YYYY-MM-DD' formatda bo'lishi kerak").optional(),
    plannedQty: z.number().nonnegative().optional(),
    actualQty: z.number().nonnegative().optional(),
  })
  .refine((d) => d.productionOrderId != null || d.productId != null, {
    message: 'productionOrderId yoki productId kerak',
  });

const RecommendQuerySchema = z.object({
  productId: z.coerce.number().int().positive(),
});

@ApiTags('PP Plan-Fact')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('pp/plan-fact')
export class PpPlanFactController {
  constructor(private readonly svc: PpPlanFactService) {}

  @ApiOperation({ summary: 'Log a plan-vs-actual snapshot row (vision 07-pp#20)' })
  @ApiResponse({ status: 201, description: 'Created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post()
  @Roles(...PP_PLAN_FACT_WRITE)
  async log(@Body() body: unknown) {
    const dto = LogSchema.parse(body);
    return unwrapOrThrow(await this.svc.log(dto));
  }

  @ApiOperation({ summary: 'Last-year-fact recommendation: median + best-20% + last-5' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Get('recommendation')
  @Roles(...PP_PLAN_FACT_READ)
  async recommend(@Query() query: unknown) {
    const { productId } = RecommendQuerySchema.parse(query);
    return unwrapOrThrow(await this.svc.recommend(productId));
  }
}
