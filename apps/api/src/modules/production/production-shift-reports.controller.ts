/**
 * @module production-shift-reports.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { assertFound } from '@common/assertions';
import {
Controller,
  Get,
  Post,
  Put,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  Logger,
  NotFoundException,
  InternalServerErrorException, UsePipes,
} from '@nestjs/common';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { throwFromError, unwrapOrThrow } from '@common/http-result';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { ProductionService } from './production.service';
import { safeInt } from '../hr/common/db-rows';
import {
  ProductionCreateShiftReportSchema, ProductionCreateShiftReportDto,
  ProductionUpdateShiftReportSchema, ProductionUpdateShiftReportDto,
  ProductionCloseShiftReportSchema, ProductionCloseShiftReportDto,
  ProductionAddShiftDowntimeSchema, ProductionAddShiftDowntimeDto,
} from './dto/production.dto';

const PROD_ROLES = ['super_admin', 'director', 'production_manager', 'operator', 'technologist'];
const PROD_WRITE_ROLES = ['super_admin', 'director', 'production_manager', 'technologist'];

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@Controller('production/shift-reports')
@UseGuards(RolesGuard)
@Roles(...PROD_ROLES)
export class ProductionShiftReportsController {
  private readonly logger = new Logger(ProductionShiftReportsController.name);

  constructor(private readonly svc: ProductionService) {}

  @Get()
  async list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return unwrapOrThrow(await this.svc.listShiftReports(safeInt(page, 1), safeInt(limit, 20)));
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const r = await this.svc.getShiftReport(safeInt(id, 0));
    assertFound(r, 'Shift report not found');
    return r;
  }

  @Post()
  @UsePipes(new ZodValidationPipe(ProductionCreateShiftReportSchema))
  async create(@Body() body: ProductionCreateShiftReportDto) {
    return unwrapOrThrow(await this.svc.createShiftReport(body));
  }

  @Patch(':id')
  @UsePipes(new ZodValidationPipe(ProductionUpdateShiftReportSchema))
  async update(@Param('id') id: string, @Body() body: ProductionUpdateShiftReportDto) {
    const r = await this.svc.updateShiftReport(safeInt(id, 0), body);
    assertFound(r, 'Shift report not found');
    return r;
  }

  @Post(':id/close')
  @UsePipes(new ZodValidationPipe(ProductionCloseShiftReportSchema))
  async close(@Param('id') id: string, @Body() body: ProductionCloseShiftReportDto) {
    const r = await this.svc.closeShiftReport(safeInt(id, 0), body);
    assertFound(r, 'Shift report not found or already closed');
    return r;
  }

  @Put(':id/close')
  @UsePipes(new ZodValidationPipe(ProductionCloseShiftReportSchema))
  async putClose(@Param('id') id: string, @Body() body: ProductionCloseShiftReportDto) {
    const r = await this.svc.closeShiftReport(safeInt(id, 0), body);
    assertFound(r, 'Shift report not found or already closed');
    return r;
  }

  @Post(':id/downtime')
  @UsePipes(new ZodValidationPipe(ProductionAddShiftDowntimeSchema))
  async addDowntime(@Param('id') id: string, @Body() body: ProductionAddShiftDowntimeDto) {
    return unwrapOrThrow(await this.svc.addShiftDowntime(safeInt(id, 0), body));
  }
}
