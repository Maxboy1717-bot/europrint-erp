/**
 * @module pp-equipment.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import {
Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  Logger,
  InternalServerErrorException, UsePipes,
} from '@nestjs/common';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { throwFromError, unwrapOrThrow } from '@common/http-result';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { PpEquipmentService } from '../application/pp-equipment.service';
import { safeInt } from '../../hr/common/db-rows';
import { PpCreateEquipmentSchema, PpCreateEquipmentDto, PpUpdateEquipmentSchema, PpUpdateEquipmentDto } from '../dto/pp.dto';

const EQ_ROLES = ['super_admin', 'director', 'production_manager', 'technologist', 'maintenance'];

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@Controller('equipment')
@UseGuards(RolesGuard)
@Roles(...EQ_ROLES)
export class PpEquipmentController {
  private readonly logger = new Logger(PpEquipmentController.name);

  constructor(private readonly svc: PpEquipmentService) {}

  @Get()
  async list(
    @Query('status') status?: string,
    @Query('limit') limit?: string,
  ) {
    return unwrapOrThrow(await this.svc.listEquipment(status ?? null, safeInt(limit, 100)));
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return unwrapOrThrow(await this.svc.getEquipment(safeInt(id, 0)));
  }

  @Post()
  @UsePipes(new ZodValidationPipe(PpCreateEquipmentSchema))
  async create(@Body() body: PpCreateEquipmentDto) {
    return unwrapOrThrow(await this.svc.createEquipment(body));
  }

  @Patch(':id')
  @UsePipes(new ZodValidationPipe(PpUpdateEquipmentSchema))
  async update(@Param('id') id: string, @Body() body: PpUpdateEquipmentDto) {
    return unwrapOrThrow(await this.svc.updateEquipment(safeInt(id, 0), body));
  }
}
