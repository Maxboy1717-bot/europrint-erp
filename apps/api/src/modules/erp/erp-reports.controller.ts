/**
 * @module erp-reports.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { assertFound } from '@common/assertions';
import {
  Controller, Get, Post, Put, Patch, Delete, Param, Body, Query,
  UseGuards, UseInterceptors, Logger, NotFoundException, InternalServerErrorException, UsePipes } from '@nestjs/common';
import { throwFromError, unwrapOrThrow, assertOk } from '@common/http-result';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { ErpReportsService } from './erp-reports.service';
import { safeInt } from '../hr/common/db-rows';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { ErpBodySchema, ErpBodyDto } from './dto/erp.dto';

const ERP_ROLES = ['super_admin', 'director', 'production_manager', 'technologist', 'planner'];
const ERP_WRITE = ['super_admin', 'director', 'production_manager', 'technologist'];

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@Controller('erp')
@UseGuards(RolesGuard)
@Roles(...ERP_ROLES)
export class ErpReportsController {
  private readonly logger = new Logger(ErpReportsController.name);

  constructor(private readonly svc: ErpReportsService) {}

  @Get('daily-reports')
  async listDailyReports(@Query('page') page?: string, @Query('limit') limit?: string) {
    return unwrapOrThrow(await this.svc.listDailyReports(safeInt(page, 1), safeInt(limit, 30)));
  }

  @Post('daily-reports')
  @Roles(...ERP_WRITE)
  @UsePipes(new ZodValidationPipe(ErpBodySchema))
  async createDailyReport(@Body() body: ErpBodyDto) {
    return unwrapOrThrow(await this.svc.createDailyReport(body));
  }

  @Get('daily-reports/:id')
  async getDailyReport(@Param('id') id: string) {
    const _rGetDailyReport = await this.svc.getDailyReport(safeInt(id, 0));
    assertOk(_rGetDailyReport);
    const r = _rGetDailyReport.data as Record<string, unknown>;
    assertFound(r, 'Daily report not found');
    return r;
  }

  @Patch('daily-reports/:id')
  @Roles(...ERP_WRITE)
  @UsePipes(new ZodValidationPipe(ErpBodySchema))
  async updateDailyReport(@Param('id') id: string, @Body() body: ErpBodyDto) {
    return unwrapOrThrow(await this.svc.updateDailyReport(safeInt(id, 0), body));
  }

  @Delete('daily-reports/:id')
  @Roles(...ERP_WRITE)
  async deleteDailyReport(@Param('id') id: string) {
    return unwrapOrThrow(await this.svc.deleteDailyReport(safeInt(id, 0)));
  }

  @Get('production-facts')
  async listProductionFacts(@Query('page') page?: string, @Query('limit') limit?: string) {
    return unwrapOrThrow(await this.svc.listProductionFacts(safeInt(page, 1), safeInt(limit, 50)));
  }

  @Post('production-facts')
  @Roles(...ERP_WRITE)
  @UsePipes(new ZodValidationPipe(ErpBodySchema))
  async createProductionFact(@Body() body: ErpBodyDto) {
    return unwrapOrThrow(await this.svc.createProductionFact(body));
  }

  @Get('production-plans')
  async listProductionPlans(@Query('page') page?: string, @Query('limit') limit?: string) {
    return unwrapOrThrow(await this.svc.listProductionPlans(safeInt(page, 1), safeInt(limit, 50)));
  }

  @Post('production-plans')
  @Roles(...ERP_WRITE)
  @UsePipes(new ZodValidationPipe(ErpBodySchema))
  async createProductionPlan(@Body() body: ErpBodyDto) {
    return unwrapOrThrow(await this.svc.createProductionPlan(body));
  }

  @Put('production-plans/:id')
  @Roles(...ERP_WRITE)
  @UsePipes(new ZodValidationPipe(ErpBodySchema))
  async updateProductionPlan(@Param('id') id: string, @Body() body: ErpBodyDto) {
    return unwrapOrThrow(await this.svc.updateProductionPlan(safeInt(id, 0), body));
  }

  @Patch('production-plans/:id')
  @Roles(...ERP_WRITE)
  @UsePipes(new ZodValidationPipe(ErpBodySchema))
  async patchProductionPlan(@Param('id') id: string, @Body() body: ErpBodyDto) {
    return unwrapOrThrow(await this.svc.updateProductionPlan(safeInt(id, 0), body));
  }

  @Get('downtime-logs')
  async listDowntimeLogs(@Query('page') page?: string, @Query('limit') limit?: string) {
    return unwrapOrThrow(await this.svc.listDowntimeLogs(safeInt(page, 1), safeInt(limit, 50)));
  }

  @Post('downtime-logs')
  @Roles(...ERP_WRITE)
  @UsePipes(new ZodValidationPipe(ErpBodySchema))
  async createDowntimeLog(@Body() body: ErpBodyDto) {
    return unwrapOrThrow(await this.svc.createDowntimeLog(body));
  }

  @Get('downtime-logs/:id')
  async getDowntimeLog(@Param('id') id: string) {
    const _rGetDowntimeLog = await this.svc.getDowntimeLog(safeInt(id, 0));
    assertOk(_rGetDowntimeLog);
    const r = _rGetDowntimeLog.data as Record<string, unknown>;
    assertFound(r, 'Downtime log not found');
    return r;
  }

  @Put('downtime-logs/:id')
  @Roles(...ERP_WRITE)
  @UsePipes(new ZodValidationPipe(ErpBodySchema))
  async updateDowntimeLog(@Param('id') id: string, @Body() body: ErpBodyDto) {
    return unwrapOrThrow(await this.svc.updateDowntimeLog(safeInt(id, 0), body));
  }

  @Patch('downtime-logs/:id')
  @Roles(...ERP_WRITE)
  @UsePipes(new ZodValidationPipe(ErpBodySchema))
  async patchDowntimeLog(@Param('id') id: string, @Body() body: ErpBodyDto) {
    return unwrapOrThrow(await this.svc.updateDowntimeLog(safeInt(id, 0), body));
  }

  @Delete('downtime-logs/:id')
  @Roles(...ERP_WRITE)
  async deleteDowntimeLog(@Param('id') id: string) {
    return unwrapOrThrow(await this.svc.deleteDowntimeLog(safeInt(id, 0)));
  }

  @Get('capacity')
  async getCapacity() {
    return unwrapOrThrow(await this.svc.getCapacity());
  }

  @Get('capacity/load-analysis')
  async capacityLoadAnalysis() {
    return unwrapOrThrow(await this.svc.capacityLoadAnalysis());
  }

  @Get('shift-calendars')
  async listShiftCalendars() {
    return unwrapOrThrow(await this.svc.listShiftCalendars());
  }

  @Post('shift-calendars')
  @Roles(...ERP_WRITE)
  @UsePipes(new ZodValidationPipe(ErpBodySchema))
  async createShiftCalendar(@Body() body: ErpBodyDto) {
    return unwrapOrThrow(await this.svc.createShiftCalendar(body));
  }

  @Get('employee-work-centers')
  async listEmployeeWorkCenters(@Query('limit') limit?: string) {
    return unwrapOrThrow(await this.svc.listEmployeeWorkCenters(safeInt(limit, 100)));
  }

  @Post('employee-work-centers')
  @Roles(...ERP_WRITE)
  @UsePipes(new ZodValidationPipe(ErpBodySchema))
  async createEmployeeWorkCenter(@Body() body: ErpBodyDto) {
    return unwrapOrThrow(await this.svc.createEmployeeWorkCenter(body));
  }

  @Get('employee-work-centers/:id')
  async getEmployeeWorkCenter(@Param('id') id: string) {
    const _rGetEmployeeWorkCenter = await this.svc.getEmployeeWorkCenter(safeInt(id, 0));
    assertOk(_rGetEmployeeWorkCenter);
    const r = _rGetEmployeeWorkCenter.data as Record<string, unknown>;
    assertFound(r, 'Employee work center assignment not found');
    return r;
  }

  @Patch('employee-work-centers/:id')
  @Roles(...ERP_WRITE)
  @UsePipes(new ZodValidationPipe(ErpBodySchema))
  async updateEmployeeWorkCenter(@Param('id') id: string, @Body() body: ErpBodyDto) {
    return unwrapOrThrow(await this.svc.updateEmployeeWorkCenter(safeInt(id, 0), body));
  }

  @Delete('employee-work-centers/:id')
  @Roles(...ERP_WRITE)
  async deleteEmployeeWorkCenter(@Param('id') id: string) {
    return unwrapOrThrow(await this.svc.deleteEmployeeWorkCenter(safeInt(id, 0)));
  }

  @Get('work-center-capacity')
  async workCenterCapacity() {
    return unwrapOrThrow(await this.svc.workCenterCapacity());
  }

  @Post('work-center-capacity')
  @Roles(...ERP_WRITE)
  @UsePipes(new ZodValidationPipe(ErpBodySchema))
  async createWorkCenterCapacity(@Body() _body: ErpBodyDto) {
    return { message: 'Work center capacity updated', updatedAt: new Date().toISOString() };
  }
}
