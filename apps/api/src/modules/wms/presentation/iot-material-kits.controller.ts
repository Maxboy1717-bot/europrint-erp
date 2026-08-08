/**
 * @module iot-material-kits.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import {
Body, Controller, Get, HttpCode, HttpStatus,
  Param, Patch, Post, Query,
  UseGuards, UseInterceptors, UsePipes,
} from '@nestjs/common';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { WmsCreateMaterialKitSchema, WmsCreateMaterialKitDto, WmsGenerateMaterialKitSchema, WmsGenerateMaterialKitDto } from '../dto/wms.dto';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { unwrapOrThrow } from '@common/http-result';
import { IotEnhancedService } from '../application/iot-enhanced.service';
import { safeInt } from '../../hr/common/db-rows';
import { AuthenticatedUser } from '@common/types/user.types';

const IOT_READ  = ['super_admin', 'warehouse_manager', 'warehouse_keeper', 'production_manager'];
const IOT_WRITE = ['super_admin', 'warehouse_manager', 'production_manager'];

@ApiTags('IoT Material Kits')
@ApiBearerAuth()
@ApiThrottle()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('iot')
export class IotMaterialKitsController {
  constructor(private readonly svc: IotEnhancedService) {}

  @ApiOperation({ summary: 'Get material kits' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('material-kits')
  @Roles(...IOT_READ)
  async getMaterialKits(@Query('status') status?: string) {
    const r = await this.svc.getMaterialKits(status);
    const items = r.ok && Array.isArray(r.data) ? r.data : [];
    return { items, total: items.length };
  }

  @ApiOperation({ summary: 'Create material kit' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('material-kits')
  @UsePipes(new ZodValidationPipe(WmsCreateMaterialKitSchema))
  @UseInterceptors(AuditInterceptor)
  @Roles(...IOT_WRITE)
  async createMaterialKit(
    @Body() body: WmsCreateMaterialKitDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return unwrapOrThrow(await this.svc.createMaterialKit(body, user?.id ?? null));
  }

  @ApiOperation({ summary: 'Generate material kit' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('material-kits/generate')
  @UsePipes(new ZodValidationPipe(WmsGenerateMaterialKitSchema))
  @UseInterceptors(AuditInterceptor)
  @Roles(...IOT_WRITE)
  async generateMaterialKit(
    @Body() body: WmsGenerateMaterialKitDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const kit = await this.svc.generateMaterialKit(body, user?.id ?? null);
    return { kit: unwrapOrThrow(kit) };
  }

  @ApiOperation({ summary: 'Get material kit by id' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('material-kits/:id')
  @Roles(...IOT_READ)
  async getMaterialKitById(@Param('id') id: string) {
    return unwrapOrThrow(await this.svc.getMaterialKitById(safeInt(id, 0)));
  }

  @ApiOperation({ summary: 'Prepare material kit' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch('material-kits/:id/prepare')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(AuditInterceptor)
  @Roles(...IOT_WRITE)
  async prepareMaterialKit(@Param('id') id: string) {
    return unwrapOrThrow(await this.svc.prepareMaterialKit(safeInt(id, 0)));
  }

  @ApiOperation({ summary: 'Ready material kit' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch('material-kits/:id/ready')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(AuditInterceptor)
  @Roles(...IOT_WRITE)
  async readyMaterialKit(@Param('id') id: string) {
    return unwrapOrThrow(await this.svc.readyMaterialKit(safeInt(id, 0)));
  }

  @ApiOperation({ summary: 'Get kit items' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('material-kits/:id/items')
  @Roles(...IOT_READ)
  async getKitItems(@Param('id') id: string) {
    return unwrapOrThrow(await this.svc.getKitItems(safeInt(id, 0)));
  }
}
