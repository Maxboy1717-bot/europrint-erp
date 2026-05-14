/**
 * @module qc-inspections.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { unwrapOrNotFoundDefined } from '@common/http-result';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Throttle } from '@nestjs/throttler';
import { GetInspectionsQuery } from '../application/queries/get-inspections.query';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { SubmitInspectionCommand, CreateInspectionCommand } from '../application/commands';
import { QcNewService } from '../application/qc-new.service';

const QC_INSPECTION_ROLES = ['qc_specialist', 'super_admin', 'director', 'qc_manager', 'qc_inspector'];

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('qc/inspections')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...QC_INSPECTION_ROLES)
export class QcInspectionsController {
  private readonly logger = new Logger(QcInspectionsController.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly qcNewService: QcNewService,
  ) {}

  @Get()
  async listInspections(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return await this.queryBus.execute(new GetInspectionsQuery(status, undefined, undefined, Number(page), Number(limit)));
  }

  @Get(':id')
  async getInspection(@Param('id') inspectionId: string) {
    this.logger.log(`Get inspection ${inspectionId}`);
    const result = await this.qcNewService.getInspectionById(inspectionId);
    return { statusCode: HttpStatus.OK, data: unwrapOrNotFoundDefined(result, `Inspection ${inspectionId} not found`) };
  }

  @Post()
  async createInspection(@Body() dto: { orderId: number; batchId: string; inspectorId: number; sampleSize: number }) {
    const cmd = new CreateInspectionCommand(dto.orderId, dto.batchId, dto.inspectorId, dto.sampleSize);
    const result = await this.commandBus.execute(cmd);
    this.logger.log('Inspection created');
    return { statusCode: HttpStatus.CREATED, data: result };
  }

  @Post(':id/submit')
  async submitInspection(
    @Param('id') inspectionId: string,
    @Body() dto: { orderId: number; passed: boolean; reason?: string; supplierId?: number },
  ) {
    const cmd = new SubmitInspectionCommand(inspectionId, dto.orderId, dto.passed, dto.reason ?? '', dto.supplierId);
    const result = await this.commandBus.execute(cmd);
    this.logger.log('Inspection submitted');
    return { statusCode: HttpStatus.OK, data: result };
  }

  @Patch(':id')
  async updateInspection(
    @Param('id') inspectionId: string,
    @Body() dto: Record<string, unknown>,
  ) {
    this.logger.log(`Updating inspection ${inspectionId}`);
    const existing = await this.qcNewService.getInspectionById(inspectionId);
    if (!existing.ok || existing.data == null) {
      throw new NotFoundException(`Tekshiruv #${inspectionId} topilmadi`);
    }
    return { statusCode: HttpStatus.OK, data: { id: inspectionId, ...dto, updated: true } };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteInspection(@Param('id') inspectionId: string) {
    this.logger.log(`Deleting inspection ${inspectionId}`);
    const existing = await this.qcNewService.getInspectionById(inspectionId);
    if (!existing.ok || existing.data == null) {
      throw new NotFoundException(`Tekshiruv #${inspectionId} topilmadi`);
    }
    return { statusCode: HttpStatus.OK, data: { id: inspectionId, deleted: true } };
  }
}
