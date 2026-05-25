/**
 * @module mm-raw-materials.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import {
  Controller,
  Get,
  Query,
  UseGuards,
  UseInterceptors,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { throwFromError, unwrapOrThrow } from '@common/http-result';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { MmMaterialsExtrasService } from '../application/mm-materials-extras.service';
import { safeInt } from '../../hr/common/db-rows';

const MM_ROLES = ['super_admin', 'director', 'warehouse_manager', 'production_manager', 'purchaser'];

@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@ApiTags('Mm Raw Materials')
@Controller('raw-materials')
@UseGuards(RolesGuard)
@Roles(...MM_ROLES)
export class MmRawMaterialsController {
  private readonly logger = new Logger(MmRawMaterialsController.name);

  constructor(private readonly svc: MmMaterialsExtrasService) {}

  @ApiOperation({ summary: 'List' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get()
  async list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return unwrapOrThrow(await this.svc.listRawMaterials(safeInt(page, 1), safeInt(limit, 50), search));
  }
}
