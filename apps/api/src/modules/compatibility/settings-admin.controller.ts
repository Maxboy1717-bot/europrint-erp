/**
 * @module settings-admin.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import {
  Body, Controller, Delete, Get, HttpCode, Param, Post, Put,
  UseGuards, UseInterceptors, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { unwrapOrBadRequest, unwrapOrNotFound } from '@common/http-result';
import { z } from 'zod';
import { SettingsAdminService } from './settings-admin.service';

const GuidelineSchema = z.object({
  title:     z.string().min(1),
  content:   z.string().min(1),
  category:  z.string().default('general'),
  isActive:  z.boolean().default(true),
  createdBy: z.string().optional(),
});

const FilterSchema = z.object({
  name:       z.string().min(1),
  filterType: z.string().default('general'),
  config:     z.record(z.unknown()).default({}),
  isActive:   z.boolean().default(true),
});

@ApiTags('Settings — Admin')
@ApiBearerAuth()
@Roles('super_admin', 'admin')
@ApiThrottle()
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Controller()
export class SettingsAdminController {
  constructor(private readonly svc: SettingsAdminService) {}

  @Get('guidelines')
  @Roles('super_admin', 'admin', 'manager', 'director')
  async getGuidelines() {
    return unwrapOrBadRequest(await this.svc.getGuidelines());
  }

  @Post('guidelines')
  @HttpCode(HttpStatus.CREATED)
  async createGuideline(@Body() body: unknown) {
    const dto = GuidelineSchema.parse(body);
    return unwrapOrBadRequest(await this.svc.createGuideline(dto));
  }

  @Put('guidelines/:id')
  async updateGuideline(@Param('id') id: string, @Body() body: unknown) {
    const dto = GuidelineSchema.partial().parse(body);
    return unwrapOrNotFound(await this.svc.updateGuideline(id, dto));
  }

  @Delete('guidelines/:id')
  @HttpCode(HttpStatus.OK)
  async deleteGuideline(@Param('id') id: string) {
    return unwrapOrNotFound(await this.svc.deleteGuideline(id));
  }

  @Get('contact-settings')
  @Roles('super_admin', 'admin', 'manager', 'director')
  async getContactSettings() {
    return unwrapOrBadRequest(await this.svc.getContactSettings());
  }

  @Put('contact-settings')
  async updateContactSettings(@Body() body: unknown) {
    const dto = z.object({
      phone:        z.string().optional(),
      email:        z.string().email().optional(),
      address:      z.string().optional(),
      telegram:     z.string().optional(),
      website:      z.string().url().optional(),
      workingHours: z.string().optional(),
    }).parse(body);
    return unwrapOrBadRequest(await this.svc.updateContactSettings(dto));
  }

  @Get('system-settings')
  @Roles('super_admin', 'admin', 'manager', 'director', 'cashier', 'pos_manager')
  async getSystemSettings() {
    return unwrapOrBadRequest(await this.svc.getSystemSettings());
  }

  @Put('system-settings')
  async updateSystemSettings(@Body() body: unknown) {
    const dto = z.object({
      companyName: z.string().optional(),
      timezone:    z.string().optional(),
      language:    z.string().optional(),
      currency:    z.string().optional(),
      logoUrl:     z.string().url().optional(),
      config:      z.record(z.unknown()).optional(),
    }).parse(body);
    return unwrapOrBadRequest(await this.svc.updateSystemSettings(dto));
  }

  @Get('filters')
  @Roles('super_admin', 'admin', 'manager', 'director')
  async getFilters() {
    return unwrapOrBadRequest(await this.svc.getFilters());
  }

  @Post('filters')
  @HttpCode(HttpStatus.CREATED)
  async createFilter(@Body() body: unknown) {
    const dto = FilterSchema.parse(body);
    return unwrapOrBadRequest(await this.svc.createFilter(dto));
  }

  @Put('filters/:id')
  async updateFilter(@Param('id') id: string, @Body() body: unknown) {
    const dto = FilterSchema.partial().parse(body);
    return unwrapOrNotFound(await this.svc.updateFilter(id, dto));
  }

  @Delete('filters/:id')
  @HttpCode(HttpStatus.OK)
  async deleteFilter(@Param('id') id: string) {
    return unwrapOrNotFound(await this.svc.deleteFilter(id));
  }
}
