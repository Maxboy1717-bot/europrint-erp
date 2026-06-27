/**
 * @module material-life.controller
 * @description Material hayot-tsikli (W4-MATERIAL-LIFE) HTTP route handl'lari.
 *   Material-karta atributlari (egalik/xavf/saqlash/yosh/vtorichka/poddon/namuna)
 *   va analog (substitute, EP-WMS-101) + xavf-zona/yosh-ogohlantirish ko'rinishlari.
 *
 *   Transport-only (Qoida 6): biznes logika MaterialLifeService'da. Zod validatsiya
 *   (Qoida 3), JWT+Roles guard (Qoida 8). Q-46: faqat ADDITIVE endpointlar.
 * @layer Presentation (WMS)
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { z } from 'zod';
import { unwrapOrThrow } from '@common/http-result';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@common/types/user.types';
import { safeInt } from '../../hr/common/db-rows';
import { MaterialLifeService } from '../application/material-life.service';
import { MATERIAL_OWNER_TYPES } from '../domain/constants/material-life.constants';

const ML_READ = ['super_admin', 'warehouse_manager', 'warehouse_keeper', 'director', 'ERP_MANAGER'];
const ML_WRITE = ['super_admin', 'warehouse_manager', 'director', 'ERP_MANAGER'];

// Atribut yangilash — barcha maydonlar ixtiyoriy (faqat berilgani yangilanadi).
const UpdateLifeSchema = z
  .object({
    ownerType: z.enum(MATERIAL_OWNER_TYPES).optional(),
    hazardClass: z.string().max(32).nullable().optional(),
    storageCondition: z.string().max(64).nullable().optional(),
    ageAlertDays: z.number().int().positive().nullable().optional(),
    isRecyclable: z.boolean().optional(),
    palletUnitQty: z.number().positive().nullable().optional(),
    isSample: z.boolean().optional(),
  })
  .strict();

const AddSubstituteSchema = z
  .object({
    substituteId: z.number().int().positive(),
    priority: z.number().int().min(0).optional(),
    isApproved: z.boolean().optional(),
    notes: z.string().max(2000).nullable().optional(),
  })
  .strict();

@ApiThrottle()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('WMS Material Life')
@ApiBearerAuth()
@Controller('wms/material-life')
export class MaterialLifeController {
  private readonly logger = new Logger(MaterialLifeController.name);

  constructor(private readonly svc: MaterialLifeService) {}

  @ApiOperation({ summary: 'Yosh/eskirish ogohlantirishidagi partiyalar (EP-WMS-126)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('aging-alerts')
  @Roles(...ML_READ)
  async getAgingAlerts() {
    const r = await this.svc.getAgingAlerts();
    const items = r.ok && Array.isArray(r.data) ? r.data : [];
    return { items, total: items.length };
  }

  @ApiOperation({ summary: 'Xavfli materiallar qoldig\'i (xavf-zona, EP-WMS-128)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('hazard-stock')
  @Roles(...ML_READ)
  async getHazardStock() {
    const r = await this.svc.getHazardStock();
    const items = r.ok && Array.isArray(r.data) ? r.data : [];
    return { items, total: items.length };
  }

  @ApiOperation({ summary: 'Material hayot-tsikli atributlari' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get(':id')
  @Roles(...ML_READ)
  async getLife(@Param('id') id: string) {
    return unwrapOrThrow(await this.svc.getLife(safeInt(id, 0)));
  }

  @ApiOperation({ summary: 'Material hayot-tsikli atributlarini yangilash' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch(':id')
  @Roles(...ML_WRITE)
  async updateLife(@Param('id') id: string, @Body() body: unknown) {
    const dto = UpdateLifeSchema.parse(body);
    return unwrapOrThrow(await this.svc.updateLife(safeInt(id, 0), dto));
  }

  @ApiOperation({ summary: 'Material analoglari (substitute) ro\'yxati (EP-WMS-101)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get(':id/substitutes')
  @Roles(...ML_READ)
  async listSubstitutes(@Param('id') id: string) {
    const r = await this.svc.listSubstitutes(safeInt(id, 0));
    const items = r.ok && Array.isArray(r.data) ? r.data : [];
    return { items, total: items.length };
  }

  @ApiOperation({ summary: 'Material uchun analog qo\'shish (EP-WMS-101)' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Post(':id/substitutes')
  @HttpCode(HttpStatus.CREATED)
  @Roles(...ML_WRITE)
  async addSubstitute(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const dto = AddSubstituteSchema.parse(body);
    return unwrapOrThrow(await this.svc.addSubstitute(safeInt(id, 0), dto, user?.id ?? null));
  }

  @ApiOperation({ summary: 'Analog juftlikni o\'chirish (EP-WMS-101)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Delete('substitutes/:subId')
  @Roles(...ML_WRITE)
  async removeSubstitute(@Param('subId') subId: string, @CurrentUser() user: AuthenticatedUser) {
    return unwrapOrThrow(await this.svc.removeSubstitute(safeInt(subId, 0), user?.id ?? null));
  }
}
