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
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { unwrapOrNotFoundDefined } from '@common/http-result';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { GetInspectionsQuery } from '../application/queries/get-inspections.query';
import { GetInspectionStatsQuery } from '../application/queries/get-inspection-stats.query';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { SubmitInspectionCommand, CreateInspectionCommand } from '../application/commands';
import { QcNewService } from '../application/qc-new.service';

const QC_INSPECTION_ROLES = ['qc_specialist', 'super_admin', 'director', 'qc_manager', 'qc_inspector'];

@ApiThrottle()
@ApiTags('Qc Inspections')
@ApiBearerAuth()
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

  @ApiOperation({ summary: 'List inspections' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get()
  async listInspections(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return await this.queryBus.execute(new GetInspectionsQuery(status, undefined, undefined, Number(page), Number(limit)));
  }

  @ApiOperation({ summary: 'QC quality KPI panel — brak% / pass-rate / FTQ (EP-QC-077)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('stats')
  async getInspectionStats(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const fromDate = from ? new Date(from) : undefined;
    const toDate = to ? new Date(to) : undefined;
    const result = await this.queryBus.execute(
      new GetInspectionStatsQuery(
        fromDate && !Number.isNaN(fromDate.getTime()) ? fromDate : undefined,
        toDate && !Number.isNaN(toDate.getTime()) ? toDate : undefined,
      ),
    );
    return result;
  }

  @ApiOperation({ summary: 'Get inspection' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get(':id')
  async getInspection(@Param('id') inspectionId: string) {
    this.logger.log(`Get inspection ${inspectionId}`);
    const result = await this.qcNewService.getInspectionById(inspectionId);
    return { statusCode: HttpStatus.OK, data: unwrapOrNotFoundDefined(result, `Inspection ${inspectionId} not found`) };
  }

  @ApiOperation({ summary: 'Create inspection' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post()
  async createInspection(@Body() dto: { orderId: number; batchId: string; inspectorId: number; sampleSize: number }) {
    const cmd = new CreateInspectionCommand(dto.orderId, dto.batchId, dto.inspectorId, dto.sampleSize);
    const result = await this.commandBus.execute(cmd);
    this.logger.log('Inspection created');
    return { statusCode: HttpStatus.CREATED, data: result };
  }

  @ApiOperation({ summary: 'Submit inspection' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
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

  @ApiOperation({ summary: 'Update inspection' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
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
    const updated = await this.qcNewService.updateInspection(inspectionId, dto);
    return { statusCode: HttpStatus.OK, data: unwrapOrNotFoundDefined(updated, `Inspection ${inspectionId} not found`) };
  }

  @ApiOperation({ summary: 'Delete inspection' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteInspection(@Param('id') inspectionId: string) {
    this.logger.log(`Deleting inspection ${inspectionId}`);
    const existing = await this.qcNewService.getInspectionById(inspectionId);
    if (!existing.ok || existing.data == null) {
      throw new NotFoundException(`Tekshiruv #${inspectionId} topilmadi`);
    }
    const deleted = await this.qcNewService.deleteInspection(inspectionId);
    if (!deleted.ok) throw new NotFoundException(`Inspection ${inspectionId} o'chirib bo'lmadi`);
    return { statusCode: HttpStatus.OK, data: { id: inspectionId, deleted: deleted.data } };
  }
}
