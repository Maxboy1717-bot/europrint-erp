/**
 * @module sensor-capex.controller
 * @description NestJS controller for the sensor_devices CAPEX registry (Batch 5 Item 2).
 *   HTTP route handlers; delegates to SensorCapexService and returns unwrapped Result data.
 *   install_status = needed/planned/installed capital-expenditure axis (distinct from online/offline `status`).
 */

import {
  Controller, Get, Post, Patch, Body, Param, Query, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { z } from 'zod';
import { throwFromError, unwrapOrThrow } from '@common/http-result';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { SensorCapexService } from '../application/sensor-capex.service';

const INSTALL_STATUS = ['needed', 'planned', 'installed'] as const;
const DEVICE_TYPE = ['inductive', 'optical', 'encoder', 'plc_digital'] as const;
const CONNECTION_TYPE = ['http', 'mqtt', 'websocket'] as const;

const ListQuerySchema = z.object({
  installStatus: z.enum(INSTALL_STATUS).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

const CreateSchema = z.object({
  deviceCode: z.string().min(1).max(50),
  name: z.string().min(2).max(200),
  nameRu: z.string().max(200).optional(),
  deviceType: z.enum(DEVICE_TYPE),
  connectionType: z.enum(CONNECTION_TYPE).default('http'),
  installStatus: z.enum(INSTALL_STATUS).default('needed'),
  location: z.string().max(500).optional(),
  ipAddress: z.string().max(50).optional(),
  port: z.number().int().min(1).max(65535).optional(),
});

const UpdateSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  nameRu: z.string().max(200).optional(),
  installStatus: z.enum(INSTALL_STATUS).optional(),
  location: z.string().max(500).optional(),
  ipAddress: z.string().max(50).optional(),
  port: z.number().int().min(1).max(65535).optional(),
  isActive: z.boolean().optional(),
}).refine((v) => Object.keys(v).length > 0, { message: "O'zgartirish uchun kamida bitta maydon kerak" });

const WRITE_ROLES = ['super_admin', 'director', 'production_manager'];

@ApiThrottle()
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@ApiTags('IoT Sensor CAPEX')
@ApiBearerAuth()
@Controller('iot/sensor-devices')
export class SensorCapexController {
  constructor(private readonly svc: SensorCapexService) {}

  @Get()
  @ApiOperation({ summary: 'Sensor qurilmalar ro\'yxati (CAPEX install_status bilan)' })
  @ApiResponse({ status: 200, description: 'OK' })
  async list(@Query() query: unknown) {
    const q = ListQuerySchema.parse(query);
    return unwrapOrThrow(await this.svc.list(q.installStatus, q.limit, q.offset));
  }

  @Post()
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Yangi sensor qurilma (CAPEX yozuvi) yaratish' })
  @ApiResponse({ status: 201, description: 'Created' })
  async create(@Body() body: unknown) {
    const dto = CreateSchema.parse(body);
    const result = await this.svc.create(dto);
    if (!result.ok) throwFromError(result.error);
    return result.data;
  }

  @Patch(':id')
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Sensor qurilma / CAPEX holatini yangilash' })
  @ApiResponse({ status: 200, description: 'OK' })
  async update(@Param('id') id: string, @Body() body: unknown) {
    const dto = UpdateSchema.parse(body);
    const result = await this.svc.update(Number(id), dto);
    if (!result.ok) throwFromError(result.error);
    return result.data;
  }
}
