import {
  Body, Controller, Get, HttpCode, Param, Patch, Post, Put,
  Query, UseGuards, UseInterceptors, UsePipes, HttpStatus } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { IntegrationMroService } from './integration-mro.service';
import {
  CreateMroItemSchema, CreateMroItemDto,
  CreateMroRequestSchema, CreateMroRequestDto,
  ApproveRequestSchema, ApproveRequestDto,
} from './dto/mro.dto';

const MRO_ROLES = ['admin', 'super_admin', 'manager', 'director', 'warehouse', 'warehouse_manager'] as const;

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('integration/mro')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...MRO_ROLES)
export class IntegrationMroController {
  constructor(private readonly svc: IntegrationMroService) {}

  @Get('items')
  async getItems(@Query('category') category?: string) {
    const r = await this.svc.getItems(category);
    return r.ok ? r.data : [];
  }

  @Post('items')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(CreateMroItemSchema))
  async createItem(@Body() body: CreateMroItemDto) {
    const r = await this.svc.createItem(body);
    return r.ok ? r.data : { ok: false };
  }

  @Get('requests')
  async getRequests(@Query('status') status?: string) {
    const r = await this.svc.getRequests(status);
    return r.ok ? r.data : [];
  }

  @Post('requests')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(CreateMroRequestSchema))
  async createRequest(@Body() body: CreateMroRequestDto) {
    const r = await this.svc.createRequest(body);
    return r.ok ? r.data : { ok: false };
  }

  @Get('equipment')
  async getEquipment() {
    const r = await this.svc.getEquipment();
    return r.ok ? r.data : [];
  }

  @Get('stats')
  async getStats() {
    const r = await this.svc.getStats();
    return r.ok ? r.data : {};
  }

  @Get('budgets')
  async getBudgets() {
    const r = await this.svc.getBudgets();
    return r.ok ? r.data : [];
  }

  @Get('cleaning-schedules')
  async getCleaningSchedules() {
    const r = await this.svc.getCleaningSchedules();
    return r.ok ? r.data : [];
  }

  @Get('utility-readings')
  async getUtilityReadings() {
    const r = await this.svc.getUtilityReadings();
    return r.ok ? r.data : [];
  }

  @Get('facilities')
  async getFacilities() {
    const r = await this.svc.getFacilities();
    return r.ok ? r.data : [];
  }

  @Patch(':id/approve')
  async approveMro(@Param('id') id: string, @Body() body: Record<string, unknown>) { return { id, approved: true }; }
}

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('integration/requests')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...MRO_ROLES)
export class IntegrationRequestsController {
  constructor(private readonly svc: IntegrationMroService) {}

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
