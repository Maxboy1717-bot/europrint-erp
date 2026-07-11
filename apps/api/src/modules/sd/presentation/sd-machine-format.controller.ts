/**
 * @module sd-machine-format.controller
 * @description Transport-only. SD machine-format catalog (72/52SM/KVA) rec+price — vision 06-sd #102.
 *   GET/POST/PATCH the catalog + PATCH a quotation line's selected format. Catalog edits (price = owner
 *   master-data) restricted to director/super_admin; read + line-set open to the SD sales roles.
 */

import {
  Body, Controller, Get, Param, Patch, Post, Query,
  UseGuards, UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { z } from 'zod';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { unwrapOrThrow } from '@common/http-result';
import { SdMachineFormatService } from '../application/sd-machine-format.service';

const SD_ROLES = ['sales_manager', 'SALES', 'director', 'super_admin'];

const CreateFormatSchema = z.object({
  formatCode: z.string().min(1).max(10),
  label: z.string().max(120).optional(),
  maxSheetWidthMm: z.number().nonnegative().optional(),
  maxSheetHeightMm: z.number().nonnegative().optional(),
  pricePer1000Sheets: z.number().nonnegative().optional(),
  priceAdjustmentPercent: z.number().optional(),
  isActive: z.boolean().optional(),
});

const UpdateFormatSchema = z.object({
  label: z.string().max(120).optional(),
  maxSheetWidthMm: z.number().nonnegative().optional(),
  maxSheetHeightMm: z.number().nonnegative().optional(),
  pricePer1000Sheets: z.number().nonnegative().optional(),
  priceAdjustmentPercent: z.number().optional(),
  isActive: z.boolean().optional(),
});

const SetItemFormatSchema = z.object({
  machineFormat: z.string().min(1).max(10),
});

@ApiThrottle()
@ApiTags('Sd Machine Format')
@ApiBearerAuth()
@Controller('sd')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...SD_ROLES)
export class SdMachineFormatController {
  constructor(private readonly svc: SdMachineFormatService) {}

  @ApiOperation({ summary: 'List machine formats (72/52SM/KVA catalog)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('machine-formats')
  async listFormats(@Query('activeOnly') activeOnly?: string) {
    return unwrapOrThrow(await this.svc.listFormats(activeOnly === 'true'));
  }

  @ApiOperation({ summary: 'Create a machine format (price = owner master-data)' })
  @ApiResponse({ status: 201, description: 'Created' })
  @ApiResponse({ status: 409, description: 'Duplicate format code' })
  @Post('machine-formats')
  @Roles('director', 'super_admin')
  async createFormat(@Body(new ZodValidationPipe(CreateFormatSchema)) body: z.infer<typeof CreateFormatSchema>) {
    return unwrapOrThrow(await this.svc.createFormat(body));
  }

  @ApiOperation({ summary: 'Update a machine format (price / sheet size)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch('machine-formats/:id')
  @Roles('director', 'super_admin')
  async updateFormat(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateFormatSchema)) body: z.infer<typeof UpdateFormatSchema>,
  ) {
    return unwrapOrThrow(await this.svc.updateFormat(parseInt(id, 10), body));
  }

  @ApiOperation({ summary: 'Set a quotation line machine format' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Unknown format' })
  @ApiResponse({ status: 404, description: 'Line not found' })
  @Patch('quotation-items/:id/machine-format')
  async setItemFormat(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(SetItemFormatSchema)) body: z.infer<typeof SetItemFormatSchema>,
  ) {
    return unwrapOrThrow(await this.svc.setItemFormat(parseInt(id, 10), body.machineFormat));
  }
}
