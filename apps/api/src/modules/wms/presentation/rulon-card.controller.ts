/**
 * @module rulon-card.controller
 * @description NestJS controller — RULON QOG'OZ KARTA. Transport only;
 *   delegates to RulonCardService, returns unwrapped Result data.
 *
 * Routes (Roles WMS):
 *   POST  /wms/rulon-cards            — create (taxminiy uzunlik auto-calc)
 *   GET   /wms/rulon-cards            — list (filter status/rollType + paginatsiya)
 *   GET   /wms/rulon-cards/:id        — get one
 *   PATCH /wms/rulon-cards/:id/weight — joriy og'irlikni yangilash (uzunlik qayta hisob)
 *   PATCH /wms/rulon-cards/:id/status — holat o'tishi (full→opened→remnant)
 */

import {
  Body,
  Controller,
  Get,
  Logger,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { throwFromError, unwrapOrThrow } from '@common/http-result';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { RulonCardService } from '../application/rulon-card.service';
import { safeInt } from '../../hr/common/db-rows';
import {
  CreateRulonCardSchema,
  ListRulonCardSchema,
  UpdateRulonWeightSchema,
  ChangeRulonStatusSchema,
} from './dto/rulon-card.dto';

const WMS_READ = ['super_admin', 'warehouse_manager', 'director', 'warehouse_keeper'];
const WMS_WRITE = ['super_admin', 'warehouse_manager', 'director', 'warehouse_keeper'];

@ApiThrottle()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('WMS Rulon Cards')
@ApiBearerAuth()
@Controller('wms/rulon-cards')
export class RulonCardController {
  private readonly logger = new Logger(RulonCardController.name);

  constructor(private readonly svc: RulonCardService) {}

  @ApiOperation({ summary: 'Create rulon (paper-roll) card' })
  @ApiResponse({ status: 201, description: 'Created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'Roll code conflict' })
  @Post()
  @Roles(...WMS_WRITE)
  async create(@Body() body: unknown) {
    const dto = CreateRulonCardSchema.parse(body);
    this.logger.log(`POST /wms/rulon-cards type=${dto.rollType} gsm=${dto.grammageGsm}`);
    return unwrapOrThrow(await this.svc.create(dto));
  }

  @ApiOperation({ summary: 'List rulon cards (filter + pagination)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get()
  @Roles(...WMS_READ)
  async list(@Query() query: unknown) {
    const q = ListRulonCardSchema.parse(query);
    const res = await this.svc.list({
      status: q.status,
      rollType: q.rollType,
      limit: q.limit,
      offset: (q.page - 1) * q.limit,
    });
    if (!res.ok) throwFromError(res.error);
    const data = res.ok ? res.data : { items: [], total: 0 };
    return { items: data.items, total: data.total, page: q.page, limit: q.limit };
  }

  @ApiOperation({ summary: 'Get one rulon card' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get(':id')
  @Roles(...WMS_READ)
  async getOne(@Param('id') id: string) {
    const res = await this.svc.getById(safeInt(id, 0));
    if (!res.ok) throw new NotFoundException(res.error.message);
    return res.data;
  }

  @ApiOperation({ summary: 'Update current weight (recompute remaining length)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch(':id/weight')
  @Roles(...WMS_WRITE)
  async updateWeight(@Param('id') id: string, @Body() body: unknown) {
    const dto = UpdateRulonWeightSchema.parse(body);
    this.logger.log(`PATCH /wms/rulon-cards/${id}/weight → ${dto.currentWeightKg}kg`);
    return unwrapOrThrow(await this.svc.updateCurrentWeight(safeInt(id, 0), dto.currentWeightKg));
  }

  @ApiOperation({ summary: 'Change rulon status (full→opened→remnant)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Invalid transition' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch(':id/status')
  @Roles(...WMS_WRITE)
  async changeStatus(@Param('id') id: string, @Body() body: unknown) {
    const dto = ChangeRulonStatusSchema.parse(body);
    this.logger.log(`PATCH /wms/rulon-cards/${id}/status → ${dto.status}`);
    return unwrapOrThrow(await this.svc.changeStatus(safeInt(id, 0), dto.status));
  }
}
