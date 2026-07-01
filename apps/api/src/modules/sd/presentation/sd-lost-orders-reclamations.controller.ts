/**
 * @module sd-lost-orders-reclamations.controller
 * @description Transport-only. SD lost-orders (GET/POST) + reklamatsiya (GET/POST/PATCH).
 */

import {
  Body, Controller, Get, NotFoundException, Param, Patch, Post, Query,
  UseGuards, UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { z } from 'zod';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@common/types/user.types';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { unwrapOrThrow } from '@common/http-result';
import { SdLostOrdersReclamationsService } from '../application/sd-lost-orders-reclamations.service';

const SD_ROLES = ['sales_manager', 'SALES', 'director', 'super_admin'];

const CreateLostOrderSchema = z.object({
  salesOrderId: z.number().int().positive().optional(),
  customerId: z.number().int().positive().optional(),
  reasonCode: z.string().min(1).max(40),
  reasonText: z.string().max(2000).optional(),
  lostAmount: z.number().nonnegative().optional(),
  competitorName: z.string().max(200).optional(),
  lostDate: z.string().optional(),
});

const CreateReclamationSchema = z.object({
  salesOrderId: z.number().int().positive().optional(),
  customerId: z.number().int().positive().optional(),
  category: z.string().max(40).optional(),
  description: z.string().min(1).max(4000),
  slaDeadline: z.string().optional(),
});

const ResolveReclamationSchema = z.object({
  status: z.enum(['investigating', 'resolved', 'rejected']),
  resolutionText: z.string().max(4000).optional(),
});

@ApiThrottle()
@ApiTags('Sd Lost Orders And Reclamations')
@ApiBearerAuth()
@Controller('sd')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...SD_ROLES)
export class SdLostOrdersReclamationsController {
  constructor(private readonly svc: SdLostOrdersReclamationsService) {}

  @ApiOperation({ summary: 'List lost orders' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('lost-orders')
  async listLostOrders(@Query('reasonCode') reasonCode?: string, @Query('customerId') customerId?: string) {
    return unwrapOrThrow(await this.svc.listLostOrders({
      reasonCode,
      customerId: customerId ? parseInt(customerId, 10) : undefined,
    }));
  }

  @ApiOperation({ summary: 'Record a lost order (sabab-katalogi)' })
  @ApiResponse({ status: 201, description: 'Created' })
  @Post('lost-orders')
  async createLostOrder(
    @Body(new ZodValidationPipe(CreateLostOrderSchema)) body: z.infer<typeof CreateLostOrderSchema>,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return unwrapOrThrow(await this.svc.createLostOrder({ ...body, createdBy: user.id }));
  }

  @ApiOperation({ summary: 'List reclamations' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('reclamations')
  async listReclamations(@Query('status') status?: string, @Query('customerId') customerId?: string) {
    return unwrapOrThrow(await this.svc.listReclamations({
      status,
      customerId: customerId ? parseInt(customerId, 10) : undefined,
    }));
  }

  @ApiOperation({ summary: 'Get one reclamation' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('reclamations/:id')
  async getReclamation(@Param('id') id: string) {
    const result = await this.svc.getReclamation(parseInt(id, 10));
    if (!result.ok) throw new NotFoundException(result.error.message);
    return result.data;
  }

  @ApiOperation({ summary: 'Create reclamation (SLA-timer boshlanadi)' })
  @ApiResponse({ status: 201, description: 'Created' })
  @Post('reclamations')
  async createReclamation(
    @Body(new ZodValidationPipe(CreateReclamationSchema)) body: z.infer<typeof CreateReclamationSchema>,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return unwrapOrThrow(await this.svc.createReclamation({ ...body, createdBy: user.id }));
  }

  @ApiOperation({ summary: 'Resolve/reject reclamation' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Patch('reclamations/:id/resolve')
  @Roles('sales_manager', 'director', 'super_admin')
  async resolveReclamation(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(ResolveReclamationSchema)) body: z.infer<typeof ResolveReclamationSchema>,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return unwrapOrThrow(await this.svc.resolveReclamation(parseInt(id, 10), { ...body, resolvedBy: user.id }));
  }
}
