/**
 * @module pp-reason-codes.controller
 * @description Management surface for the PP reason-code catalog (pp_reason_codes) — the
 *   structured, reusable reason vocabulary the order-flags path references via
 *   production_orders.reason_code_id (VISION-3340 #23). Until this endpoint existed the FE
 *   had no way to list/manage codes, so reasonCodeId could not be populated.
 *
 *   GET   /api/pp/reason-codes       — list active codes (sort_order, id)
 *   POST  /api/pp/reason-codes       — create a code
 *   PATCH /api/pp/reason-codes/:id   — patch a code (incl. deactivate via is_active=false)
 *
 *   Auth mirrors the sibling downtime-reason-codes surface (iot-main.controller.ts):
 *   JwtAuthGuard + RolesGuard on the controller. Reads open to the PP read tier
 *   (IOT_READ mirror); writes gated to the master-data write tier (IOT_WRITE mirror).
 *   Transport-only (Rule 6): validate with Zod, delegate to the service, unwrap Result.
 */

import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { z } from 'zod';
import { unwrapOrThrow, unwrapOrNotFoundDefined } from '@common/http-result';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { Role } from '@common/constants/roles.constants';
import { PpReasonCodesService } from './pp-reason-codes.service';

// Read tier = downtime-reason-codes read set (iot-main.controller IOT_READ):
// any planner/production role can read the catalog to populate reasonCodeId.
const PP_REASON_READ = [Role.SUPER_ADMIN, Role.DIRECTOR, Role.PRODUCTION_MANAGER, Role.TECHNOLOGIST];
// Write tier = the sibling controller's master-data write set (IOT_WRITE):
// only super_admin / director / production_manager may define the vocabulary.
const PP_REASON_WRITE = [Role.SUPER_ADMIN, Role.DIRECTOR, Role.PRODUCTION_MANAGER];

const CreateReasonCodeSchema = z.object({
  code: z.string().min(1).max(30),
  name: z.string().min(1).max(500),
  category: z.string().min(1).max(30),
  name_ru: z.string().max(500).optional(),
  color: z.string().max(10).optional(),
  sort_order: z.number().int().optional(),
});

// EP-PP-136: the Pareto report is scoped to one calendar month ('YYYY-MM').
const MonthSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "month 'YYYY-MM' formatda bo'lishi kerak");

const UpdateReasonCodeSchema = z
  .object({
    name: z.string().min(1).max(500).optional(),
    name_ru: z.string().max(500).optional(),
    category: z.string().min(1).max(30).optional(),
    color: z.string().max(10).optional(),
    sort_order: z.number().int().optional(),
    is_active: z.boolean().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'Kamida bitta maydon kerak' });

@ApiTags('PP Reason Codes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('pp/reason-codes')
export class PpReasonCodesController {
  constructor(private readonly svc: PpReasonCodesService) {}

  @ApiOperation({ summary: 'List active PP reason codes' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get()
  @Roles(...PP_REASON_READ)
  async list(@Query('includeInactive') includeInactive?: string) {
    // Batch 5 Item 5: the management screen passes includeInactive=1 to also see (and reactivate)
    // deactivated codes; the reasonCodeId-populating flow keeps the default active-only list.
    const wantAll = includeInactive === '1' || includeInactive === 'true';
    const items = unwrapOrThrow(await (wantAll ? this.svc.findAll() : this.svc.findActive()));
    return { items, total: items.length };
  }

  @ApiOperation({ summary: 'Monthly reason-code Pareto report (EP-PP-136)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad month format' })
  @Get('pareto')
  @Roles(...PP_REASON_READ)
  async pareto(@Query('month') month?: string) {
    // Default to the current calendar month (UTC) when ?month=YYYY-MM is omitted.
    const now = new Date();
    const fallback = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
    const m = MonthSchema.parse(month ?? fallback);
    return unwrapOrThrow(await this.svc.monthlyPareto(m));
  }

  @ApiOperation({ summary: 'Create a PP reason code' })
  @ApiResponse({ status: 201, description: 'Created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post()
  @Roles(...PP_REASON_WRITE)
  async create(@Body() body: unknown) {
    const dto = CreateReasonCodeSchema.parse(body);
    return unwrapOrThrow(await this.svc.create(dto));
  }

  @ApiOperation({ summary: 'Update a PP reason code (incl. deactivate)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch(':id')
  @Roles(...PP_REASON_WRITE)
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    const patch = UpdateReasonCodeSchema.parse(body);
    return unwrapOrNotFoundDefined(await this.svc.update(id, patch), 'Sabab kodi topilmadi');
  }
}
