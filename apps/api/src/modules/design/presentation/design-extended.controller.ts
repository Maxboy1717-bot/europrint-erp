import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { Roles } from '@common/decorators/roles.decorator';
import { Role } from '@common/constants/roles.constants';
import { unwrapOrInternal, unwrapOrNotFound } from '@common/http-result';
import { DesignExtendedService } from '../application/design-extended.service';
import { z } from 'zod';

const GenerateDto = z.object({ orderId: z.string(), customPrompt: z.string().optional().default(''), count: z.number().int().min(1).max(5).optional().default(3) });
const VerifyDto = z.object({ checkTypes: z.array(z.string()).optional().default([]) });
const MockupDto = z.object({ productType: z.string().optional().default('quti') });
const RejectDto = z.object({ reason: z.string().optional().default('Rad etildi') });
const StatusDto = z.object({ newStatus: z.string() });

@ApiTags('Design — Extended')
@ApiBearerAuth()
@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('design')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class DesignExtendedController {
  constructor(private readonly svc: DesignExtendedService) {}

  @Get('orders')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.DESIGNER, Role.SALES_MANAGER)
  @ApiOperation({ summary: 'List design orders' })
  async getOrders() {
    return unwrapOrInternal(await this.svc.getOrdersList());
  }

  @Get('templates')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.DESIGNER, Role.SALES_MANAGER)
  @ApiOperation({ summary: 'List design templates' })
  async getTemplates() {
    return unwrapOrInternal(await this.svc.getTemplates());
  }

  @Get('dashboard/summary')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.DESIGNER)
  @ApiOperation({ summary: 'Design dashboard summary stats' })
  async getDashboardSummary() {
    return unwrapOrInternal(await this.svc.getDashboardSummary());
  }

  @Post('generate')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.DESIGNER)
  @ApiOperation({ summary: 'Generate AI designs for an order' })
  async generateDesigns(@Body() body: unknown) {
    const dto = GenerateDto.parse(body);
    return unwrapOrInternal(await this.svc.generateDesigns(dto.orderId, dto.customPrompt, dto.count));
  }

  @Patch('orders/:orderId/status')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.DESIGNER, Role.SALES_MANAGER)
  @ApiOperation({ summary: 'Update design order status' })
  async updateOrderStatus(@Param('orderId') orderId: string, @Body() body: unknown) {
    const dto = StatusDto.parse(body);
    return unwrapOrInternal(await this.svc.updateOrderStatus(orderId, dto.newStatus));
  }

  @Get('orders/:orderId/revisions')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.DESIGNER)
  @ApiOperation({ summary: 'Get revision history for a design order' })
  async getRevisions(@Param('orderId') orderId: string) {
    return unwrapOrInternal(await this.svc.getOrderRevisions(orderId));
  }

  @Patch('notifications/:id/read')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.DESIGNER, Role.SALES_MANAGER)
  @ApiOperation({ summary: 'Mark design notification as read' })
  async markNotificationRead(@Param('id') id: string) {
    unwrapOrNotFound(await this.svc.markNotificationRead(id));
    return { id, read: true };
  }

  @Post(':id/verify')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.DESIGNER)
  @ApiOperation({ summary: 'Run AI quality check on a design' })
  async verifyDesign(@Param('id') id: string, @Body() body: unknown) {
    const dto = VerifyDto.parse(body);
    return unwrapOrInternal(await this.svc.verifyDesign(id, dto.checkTypes));
  }

  @Post(':id/mockup')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.DESIGNER)
  @ApiOperation({ summary: 'Generate 3D mockup for a design' })
  async generateMockup(@Param('id') id: string, @Body() body: unknown) {
    const dto = MockupDto.parse(body);
    return unwrapOrInternal(await this.svc.generateMockup(id, dto.productType));
  }

  @Post(':id/approve')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.DESIGNER)
  @ApiOperation({ summary: 'Approve a design' })
  async approveDesign(@Param('id') id: string) {
    return unwrapOrInternal(await this.svc.approveDesign(id));
  }

  @Post(':id/reject')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.DESIGNER)
  @ApiOperation({ summary: 'Reject a design' })
  async rejectDesign(@Param('id') id: string, @Body() body: unknown) {
    const dto = RejectDto.parse(body);
    return unwrapOrInternal(await this.svc.rejectDesign(id, dto.reason));
  }
}
