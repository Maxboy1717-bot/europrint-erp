import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { Controller, UseGuards, Get, Post, Patch, Body, Param, ParseIntPipe, Query, Logger, UseInterceptors } from '@nestjs/common';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { Throttle } from '@nestjs/throttler';
import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';
import { ReceptionService } from './reception.service';
import { Roles } from '../../../common/decorators/roles.decorator';
import { unwrapOrInternal } from '@common/http-result';

const CheckInSchema = z.object({
  visitor_name:     z.string().min(1),
  visitor_phone:    z.string().optional(),
  visitor_company:  z.string().optional(),
  purpose:          z.string().optional(),
  purpose_of_visit: z.string().optional(),
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
@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard)
@Controller('hr-v2/reception')
export class ReceptionController {
  private readonly logger = new Logger(ReceptionController.name);
  constructor(private readonly svc: ReceptionService) {}

  @Get('active')
  async getActive() {
    return unwrapOrInternal(await this.svc.getActiveVisitors());
  }

  @Get('stats')
  async getStats() {
    return unwrapOrInternal(await this.svc.getStats());
  }

  @Get('log')
  async getLog(@Query('limit') limit: string) {
    return unwrapOrInternal(await this.svc.getVisitorLog({ limit: parseInt(limit || '50') }));
  }

  @Post('check-in')
  async checkIn(@Body() body: CheckInDto) {
    return unwrapOrInternal(await this.svc.checkInVisitor({
      visitorName: body.visitor_name,
      visitorPhone: body.visitor_phone,
      visitorCompany: body.visitor_company,
      purpose: body.purpose || body.purpose_of_visit || '',
      hostEmployeeId: body.host_employee_id,
      registeredBy: body.registered_by,
      idDocument: body.id_document,
      idDocumentType: body.id_document_type,
    }));
  }

  @Patch(':id/check-out')
  async checkOut(@Param('id', ParseIntPipe) id: number, @Body() body: CheckOutDto) {
    return unwrapOrInternal(await this.svc.checkOutVisitor(id, body.notes));
  }

  @Get('badge/:badge_number')
  async validateBadge(@Param('badge_number') badgeNumber: string) {
    return unwrapOrInternal(await this.svc.validateBadge(badgeNumber));
  }
}
