import {
  Body, Controller, Delete, Get, HttpCode, Param, Post, Put, Query,
  UseGuards, UseInterceptors, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { unwrapOrBadRequest, unwrapOrNotFound } from '@common/http-result';
import { z } from 'zod';
import { CalendarEventsService } from './calendar-events.service';

const EventSchema = z.object({
  title:       z.string().min(1),
  description: z.string().optional(),
  startDate:   z.string().datetime(),
  endDate:     z.string().datetime().optional(),
  allDay:      z.boolean().default(false),
  eventType:   z.string().default('general'),
  location:    z.string().optional(),
  attendees:   z.array(z.unknown()).default([]),
  createdBy:   z.string().optional(),
});

@ApiTags('Calendar Events')
@ApiBearerAuth()
@Roles('super_admin', 'admin', 'director', 'manager', 'hr_manager')
@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Controller('calendar-events')
export class CalendarEventsController {
  constructor(private readonly svc: CalendarEventsService) {}

  @Get()
  async getAll(@Query('type') type?: string) {
    return unwrapOrBadRequest(await this.svc.getAll(type));
  }

  @Get('upcoming')
  async getUpcoming() {
    return unwrapOrBadRequest(await this.svc.getUpcoming());
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: unknown) {
    const dto = EventSchema.parse(body);
    return unwrapOrBadRequest(await this.svc.create(dto));
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return unwrapOrNotFound(await this.svc.getById(id));
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: unknown) {
    const dto = EventSchema.partial().parse(body);
    return unwrapOrNotFound(await this.svc.update(id, dto));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string) {
    return unwrapOrNotFound(await this.svc.delete(id));
  }
}
