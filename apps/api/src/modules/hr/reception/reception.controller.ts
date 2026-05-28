/**
 * @module reception.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { Controller, UseGuards, Get, Post, Patch, Body, Param, ParseIntPipe, Query, Logger, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';
import { ReceptionService } from './reception.service';
import { Roles } from '../../../common/decorators/roles.decorator';
import { unwrapOrInternal } from '@common/http-result';

const CheckInSchema = z.object({
  visitor_name:     z.string().min(1),
  visitor_phone:    z.string().optional(),
  visitor_company:  z.string().optional(),
  // P1.25.3: FE sends visit_purpose; accept all three naming variants
  purpose:          z.string().optional(),
  purpose_of_visit: z.string().optional(),
  visit_purpose:    z.string().optional(),
  host_employee_id: z.number().int(),
  registered_by:    z.number().int().optional(),
  id_document:      z.string().optional(),
  id_document_type: z.string().optional(),
});
class CheckInDto extends createZodDto(CheckInSchema) {}

const CheckOutSchema = z.object({
  notes: z.string().optional(),
});
class CheckOutDto extends createZodDto(CheckOutSchema) {}

@Roles('admin', 'manager', 'supervisor', 'employee', 'viewer')
@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard)
@ApiTags('Reception')
@ApiBearerAuth()
@Controller('hr-v2/reception')
export class ReceptionController {
  private readonly logger = new Logger(ReceptionController.name);
  constructor(private readonly svc: ReceptionService) {}

  /**
   * GET /api/hr-v2/reception — root endpoint, frontend dashboard ko'rinishi.
   * Active visitors + stats birgalikda qaytaradi.
   */
  @ApiOperation({ summary: 'Get root' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get()
  async getRoot() {
    const [active, stats] = await Promise.all([
      this.svc.getActiveVisitors(),
      this.svc.getStats(),
    ]);
    return {
      active: active.ok ? active.data : [],
      stats: stats.ok ? stats.data : {},
    };
  }

  @ApiOperation({ summary: 'Get active' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('active')
  async getActive() {
    return unwrapOrInternal(await this.svc.getActiveVisitors());
  }

  @ApiOperation({ summary: 'Get stats' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('stats')
  async getStats() {
    // P1.25.1: normalize keys to match FE expectations
    const r = await this.svc.getStats();
    const d = r.ok && r.data ? r.data as Record<string, unknown> : {};
    return {
      currently_inside: Number(d['currently_inside'] ?? 0),
      today_visitors:   Number(d['today_visitors']   ?? 0),
      this_week:        Number(d['this_week']         ?? 0),
      total_all_time:   Number(d['total_all_time']    ?? 0),
    };
  }

  @ApiOperation({ summary: 'Get log' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('log')
  async getLog(@Query('limit') limit: string) {
    return unwrapOrInternal(await this.svc.getVisitorLog({ limit: parseInt(limit || '50') }));
  }

  @ApiOperation({ summary: 'Check in' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('check-in')
  async checkIn(@Body() body: CheckInDto) {
    return unwrapOrInternal(await this.svc.checkInVisitor({
      visitorName:   body.visitor_name,
      visitorPhone:  body.visitor_phone,
      visitorCompany: body.visitor_company,
      // P1.25.3: FE sends visit_purpose; normalise all three variants
      purpose: body.purpose || body.purpose_of_visit || body.visit_purpose || '',
      hostEmployeeId: body.host_employee_id,
      registeredBy: body.registered_by,
      idDocument:   body.id_document,
      idDocumentType: body.id_document_type,
    }));
  }

  @ApiOperation({ summary: 'Check out' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch(':id/check-out')
  async checkOut(@Param('id', ParseIntPipe) id: number, @Body() body: CheckOutDto) {
    return unwrapOrInternal(await this.svc.checkOutVisitor(id, body.notes));
  }

  @ApiOperation({ summary: 'Validate badge' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('badge/:badge_number')
  async validateBadge(@Param('badge_number') badgeNumber: string) {
    return unwrapOrInternal(await this.svc.validateBadge(badgeNumber));
  }
}
