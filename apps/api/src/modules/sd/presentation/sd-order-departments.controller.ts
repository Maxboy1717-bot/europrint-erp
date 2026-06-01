/**
 * @module sd-order-departments.controller
 * @description NestJS controller. The manager sets which departments an order needs (the
 *   Phase 4 advance-paid fan-out reads this). Mounted on the existing order detail page —
 *   no new FE page. Thin: validate + delegate.
 */

import { Body, Controller, Get, Param, ParseIntPipe, Patch, UseGuards, UseInterceptors, UsePipes } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { unwrapOrThrow } from '@common/http-result';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../auth/enums/role.enum';
import { AuditInterceptor } from '../../shared/interceptors/audit.interceptor';
import { SdOrderDepartmentsService } from '../application/sd-order-departments.service';
import { SetOrderDepartmentsSchema, SetOrderDepartmentsDto } from './dto/sd-order-departments.dto';

@ApiTags('SD Order Departments')
@ApiBearerAuth()
@Controller('sd/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class SdOrderDepartmentsController {
  constructor(private readonly svc: SdOrderDepartmentsService) {}

  @ApiOperation({ summary: 'List the order\'s selected departments' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get(':id/departments')
  @Roles(Role.SALES_MANAGER, Role.DIRECTOR, Role.SUPER_ADMIN)
  async list(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrThrow(await this.svc.listForOrder(id));
  }

  @ApiOperation({ summary: 'Set the departments an order needs (fan-out selection)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Patch(':id/departments')
  @Roles(Role.SALES_MANAGER, Role.DIRECTOR, Role.SUPER_ADMIN)
  @UsePipes(new ZodValidationPipe(SetOrderDepartmentsSchema))
  async set(@Param('id', ParseIntPipe) id: number, @Body() dto: SetOrderDepartmentsDto) {
    return unwrapOrThrow(await this.svc.setForOrder(id, dto.departments));
  }

  @ApiOperation({ summary: 'Order fan-out saga: selected departments + dept-track progress' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get(':id/saga')
  @Roles(Role.SALES_MANAGER, Role.DIRECTOR, Role.SUPER_ADMIN)
  async saga(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrThrow(await this.svc.getSaga(id));
  }
}
