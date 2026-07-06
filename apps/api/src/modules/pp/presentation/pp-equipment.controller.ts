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
  InternalServerErrorException, NotFoundException, UsePipes,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { throwFromError, unwrapOrThrow } from '@common/http-result';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { PpEquipmentService } from '../application/pp-equipment.service';
import { safeInt } from '../../hr/common/db-rows';
import { PpCreateEquipmentSchema, PpCreateEquipmentDto, PpUpdateEquipmentSchema, PpUpdateEquipmentDto } from '../dto/pp.dto';

const EQ_ROLES = ['super_admin', 'director', 'production_manager', 'technologist', 'maintenance'];

@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@ApiTags('Pp Equipment')
@Controller('equipment')
@UseGuards(RolesGuard)
@Roles(...EQ_ROLES)
export class PpEquipmentController {
  private readonly logger = new Logger(PpEquipmentController.name);

  constructor(
    private readonly svc: PpEquipmentService,
    private readonly i18n: I18nService,
  ) {}

  @ApiOperation({ summary: 'List' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get()
  async list(
    @Query('status') status?: string,
    @Query('limit') limit?: string,
  ) {
    return unwrapOrThrow(await this.svc.listEquipment(status ?? null, safeInt(limit, 100)));
  }

  @ApiOperation({ summary: 'Equipment 360 — status, OEE, sessions, downtime, maintenance, operator' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get(':id/360')
  async getEquipment360(@Param('id') id: string) {
    const result = await this.svc.getEquipment360(safeInt(id, 0));
    if (!result.ok) throwFromError(result.error);
    if (result.data === null) {
      throw new NotFoundException(await this.i18n.t('errors.equipmentNotFound'));
    }
    return result.data;
  }

  @ApiOperation({ summary: 'Get by id' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get(':id')
  async getById(@Param('id') id: string) {
    return unwrapOrThrow(await this.svc.getEquipment(safeInt(id, 0)));
  }

  @ApiOperation({ summary: 'Create' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post()
  @UsePipes(new ZodValidationPipe(PpCreateEquipmentSchema))
  async create(@Body() body: PpCreateEquipmentDto) {
    return unwrapOrThrow(await this.svc.createEquipment(body));
  }

  @ApiOperation({ summary: 'Update' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch(':id')
  @UsePipes(new ZodValidationPipe(PpUpdateEquipmentSchema))
  async update(@Param('id') id: string, @Body() body: PpUpdateEquipmentDto) {
    return unwrapOrThrow(await this.svc.updateEquipment(safeInt(id, 0), body));
  }
}
