import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Controller, Get, Post, Param, Query, Body, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { Roles } from '@common/decorators/roles.decorator';
import { Role } from '@common/constants/roles.constants';
import { unwrapOrInternal } from '@common/http-result';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { TechnologyService } from './technology.service';
import { z } from 'zod';

const ApproveDto = z.object({ bomApproved: z.boolean().default(false), routingApproved: z.boolean().default(false), techCardApproved: z.boolean().default(false), notes: z.string().optional() });
const RejectDto = z.object({ reason: z.string().min(1), returnTo: z.enum(['manager', 'designer']).default('manager') });

@ApiTags('Technology')
@ApiBearerAuth()
@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('technology')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class TechnologyController {
  constructor(private readonly svc: TechnologyService) {}

  @Get('dashboard')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.TECHNOLOGIST)
  @ApiOperation({ summary: 'Technology department dashboard stats' })
  async getDashboard() {
    return unwrapOrInternal(await this.svc.getDashboard());
  }

  @Get('orders')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.TECHNOLOGIST)
  @ApiOperation({ summary: 'List pending_tech orders for technologist approval' })
  async getOrders(@Query('status') status?: string) {
    return unwrapOrInternal(await this.svc.getOrders(status ?? 'pending_tech'));
  }

  @Get('orders/:id/approval-log')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.TECHNOLOGIST)
  @ApiOperation({ summary: 'Get approval log for a papka order' })
  async getApprovalLog(@Param('id') id: string) {
    return unwrapOrInternal(await this.svc.getApprovalLog(id));
  }

  @Get('orders/:id/tech-card')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.TECHNOLOGIST)
  @ApiOperation({ summary: 'Get tech card for an order' })
  async getOrderTechCard(@Param('id') id: string) {
    return unwrapOrInternal(await this.svc.getOrderTechCard(id));
  }

  @Get('tech-cards')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.TECHNOLOGIST)
  @ApiOperation({ summary: 'List all tech cards' })
  async getTechCards() {
    return unwrapOrInternal(await this.svc.getTechCards());
  }

  @Get('materials/alternatives')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.TECHNOLOGIST)
  @ApiOperation({ summary: 'Find material alternatives for cost optimization' })
  async getMaterialAlternatives(@Query('material') material: string) {
    return unwrapOrInternal(await this.svc.getMaterialAlternatives(material ?? 'gofrokarton'));
  }

  @Post('orders/:id/ai-check')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.TECHNOLOGIST)
  @ApiOperation({ summary: 'Run AI quality check on a papka order' })
  async runAiCheck(@Param('id') id: string) {
    return unwrapOrInternal(await this.svc.runAiCheck(id));
  }

  @Post('orders/:id/approve')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.TECHNOLOGIST)
  @ApiOperation({ summary: 'Technologist approves an order (3-checkpoint)' })
  async approveOrder(@Param('id') id: string, @Body() body: unknown, @CurrentUser() user: AuthenticatedUser) {
    const dto = ApproveDto.parse(body);
    unwrapOrInternal(await this.svc.approveOrder(id, { ...dto, approvedById: String(user.id) }));
    return { orderId: id, approvedAt: _time.now().toISOString() };
  }

  @Post('orders/:id/reject')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.TECHNOLOGIST)
  @ApiOperation({ summary: 'Technologist rejects an order' })
  async rejectOrder(@Param('id') id: string, @Body() body: unknown, @CurrentUser() user: AuthenticatedUser) {
    const dto = RejectDto.parse(body);
    unwrapOrInternal(await this.svc.rejectOrder(id, { ...dto, rejectedById: String(user.id) }));
    return { orderId: id, rejectedAt: _time.now().toISOString() };
  }

  @Get('cards')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.TECHNOLOGIST)
  @ApiOperation({ summary: 'List technology cards' })
  async getCards(@Query('status') _status?: string) {
    return { items: [], total: 0 };
  }

  @Post('cards/generate')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.TECHNOLOGIST)
  @ApiOperation({ summary: 'Generate technology card' })
  async generateCard(@Body() _body: unknown) {
    return { generated: true };
  }

  @Get('cards/:id')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.TECHNOLOGIST)
  @ApiOperation({ summary: 'Get technology card by ID' })
  async getCardById(@Param('id') _id: string) {
    return { card: null };
  }

  @Post('cards/:id/optimize')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.TECHNOLOGIST)
  @ApiOperation({ summary: 'Optimize technology card' })
  async optimizeCard(@Param('id') _id: string, @Body() _body: unknown) {
    return { optimized: true };
  }
}
