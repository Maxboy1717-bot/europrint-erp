/**
 * @module integration-mro.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import {
  Body, Controller, Get, HttpCode, Param, Patch, Post, Put,
  Query, UseGuards, UseInterceptors, UsePipes, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { z } from 'zod';
import { IntegrationMroService } from './integration-mro.service';
import {
  CreateMroItemSchema, CreateMroItemDto,
  CreateMroRequestSchema, CreateMroRequestDto,
  ApproveRequestSchema, ApproveRequestDto,
} from './dto/mro.dto';

const ApproveMroSchema = z.object({
  notes: z.string().max(2000).optional(),
  approvedBy: z.union([z.string(), z.number()]).optional(),
}).passthrough();

const MRO_ROLES = ['admin', 'super_admin', 'manager', 'director', 'warehouse', 'warehouse_manager'] as const;

@ApiThrottle()
@ApiTags('Integration Mro')
@ApiBearerAuth()
@Controller('integration/mro')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...MRO_ROLES)
export class IntegrationMroController {
  constructor(private readonly svc: IntegrationMroService) {}

  @ApiOperation({ summary: 'Get items' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('items')
  async getItems(@Query('category') category?: string) {
    const r = await this.svc.getItems(category);
    return r.ok ? r.data : [];
  }

  @ApiOperation({ summary: 'Create item' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('items')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(CreateMroItemSchema))
  async createItem(@Body() body: CreateMroItemDto) {
    const r = await this.svc.createItem(body);
    return r.ok ? r.data : { ok: false };
  }

  @ApiOperation({ summary: 'Get requests' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('requests')
  async getRequests(@Query('status') status?: string) {
    const r = await this.svc.getRequests(status);
    return r.ok ? r.data : [];
  }

  @ApiOperation({ summary: 'Create request' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('requests')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(CreateMroRequestSchema))
  async createRequest(@Body() body: CreateMroRequestDto) {
    const r = await this.svc.createRequest(body);
    return r.ok ? r.data : { ok: false };
  }

  @ApiOperation({ summary: 'Get equipment' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('equipment')
  async getEquipment() {
    const r = await this.svc.getEquipment();
    return r.ok ? r.data : [];
  }

  @ApiOperation({ summary: 'Get stats' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('stats')
  async getStats() {
    const r = await this.svc.getStats();
    return r.ok ? r.data : {};
  }

  @ApiOperation({ summary: 'Get budgets' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('budgets')
  async getBudgets() {
    const r = await this.svc.getBudgets();
    return r.ok ? r.data : [];
  }

  @ApiOperation({ summary: 'Get cleaning schedules' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('cleaning-schedules')
  async getCleaningSchedules() {
    const r = await this.svc.getCleaningSchedules();
    return r.ok ? r.data : [];
  }

  @ApiOperation({ summary: 'Get utility readings' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('utility-readings')
  async getUtilityReadings() {
    const r = await this.svc.getUtilityReadings();
    return r.ok ? r.data : [];
  }

  @ApiOperation({ summary: 'Get facilities' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('facilities')
  async getFacilities() {
    const r = await this.svc.getFacilities();
    return r.ok ? r.data : [];
  }

  @ApiOperation({ summary: 'Approve mro' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch(':id/approve')
  async approveMro(@Param('id') id: string, @Body() body: unknown) {
    ApproveMroSchema.parse(body ?? {});
    const r = await this.svc.approveRequest(id, 'approve');
    return r.ok ? r.data : { id, approved: false, error: String(r.error) };
  }
}

@ApiThrottle()
@Controller('integration/requests')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...MRO_ROLES)
export class IntegrationRequestsController {
  constructor(private readonly svc: IntegrationMroService) {}

  @ApiOperation({ summary: 'Approve request' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Put(':id/approve')
  @UsePipes(new ZodValidationPipe(ApproveRequestSchema))
  async approveRequest(
    @Param('id') id: string,
    @Body() body: ApproveRequestDto,
  ) {
    const r = await this.svc.approveRequest(id, body.action);
    return r.ok ? r.data : { ok: false };
  }
}
