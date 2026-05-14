/**
 * @module barcode-warehouse.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Controller, Get, Post, Patch, Body, Query, Param, HttpCode, HttpStatus, Delete, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { BarcodeWarehouseCompatService } from './barcode-warehouse.service';
import { BarcodeWarehouseDebtService } from './barcode-warehouse-debt.service';
import { BoolBodyDto, CompatBodyDto } from './dto/compat-body.dto';
import { CycleCountSubmitDto, PickTaskDto, ProductionCompleteDto, ProductionReceiveDto, ReceiveBodyDto, ResolveBalanceDto } from './dto/warehouse.dto';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { unwrapOrInternal } from '@common/http-result';

@ApiTags('Barcode Warehouse (Compat)')
@ApiBearerAuth()
@Roles('admin', 'manager', 'hr_manager', 'director', 'warehouse_keeper', 'warehouse_manager')
@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Controller('barcode-warehouse')
export class BarcodeWarehouseCompatController {
  constructor(
    private readonly svc: BarcodeWarehouseCompatService,
    private readonly debtSvc: BarcodeWarehouseDebtService,
  ) {}

  @Get('dashboard')
  async getDashboard() {
    return unwrapOrInternal(await this.svc.getDashboard());
  }

  @Get('barcodes')
  async getBarcodes(@Query('status') status?: string) {
    return unwrapOrInternal(await this.svc.getBarcodes(status));
  }

  @Post('barcodes/:id/qc-decision')
  @HttpCode(HttpStatus.OK)
  async qcDecision(@Param('id') id: string, @Body() body: BoolBodyDto) {
    return unwrapOrInternal(await this.svc.qcDecision(id, body.passed));
  }

  @Post('barcodes/:id/qc')
  @HttpCode(HttpStatus.OK)
  async qcDecisionAlias(@Param('id') id: string, @Body() body: BoolBodyDto) {
    return unwrapOrInternal(await this.svc.qcDecision(id, body.passed));
  }

  @Get('picking-tasks')
  async getPickingTasks() {
    return unwrapOrInternal(await this.svc.getPickingTasks());
  }

  @Get('print-queue')
  async getPrintQueue() {
    return unwrapOrInternal(await this.svc.getPrintQueue());
  }

  @Get('exit-logs')
  async getExitLogs() {
    return unwrapOrInternal(await this.svc.getExitLogs());
  }

  @Get('operator-balance')
  async getOperatorBalance() {
    return unwrapOrInternal(await this.svc.getOperatorBalance());
  }

  @Get('cycle-counts')
  async getCycleCounts() {
    return unwrapOrInternal(await this.svc.getCycleCounts());
  }

  @Post('cycle-counts/submit')
  @HttpCode(HttpStatus.OK)
  async submitCycleCount(@Body() body: CycleCountSubmitDto) {
    return unwrapOrInternal(await this.svc.submitCycleCount(body));
  }

  @Delete('barcodes/:id')
  async deleteBarcode(@Param('id') id: string) {
    return unwrapOrInternal(await this.svc.deleteBarcode(id));
  }

  @Patch('barcodes/:id')
  async updateBarcode(@Param('id') id: string, @Body() body: CompatBodyDto) {
    return unwrapOrInternal(await this.svc.updateBarcode(id, body));
  }

  @Get('cycle-count')
  async getCycleCountAlias() {
    return unwrapOrInternal(await this.svc.getCycleCounts());
  }

  @Post('cycle-count/submit')
  @HttpCode(HttpStatus.OK)
  async submitCycleCountAlias(@Body() body: CycleCountSubmitDto) {
    return unwrapOrInternal(await this.svc.submitCycleCount(body));
  }

  @Post('receive')
  @HttpCode(HttpStatus.CREATED)
  async receive(@Body() body: ReceiveBodyDto) {
    return unwrapOrInternal(await this.svc.receive(body));
  }

  @Post('production-receive')
  @HttpCode(HttpStatus.CREATED)
  async productionReceive(@Body() body: ProductionReceiveDto) {
    return unwrapOrInternal(await this.svc.productionReceive(body));
  }

  @Post('production-complete')
  @HttpCode(HttpStatus.OK)
  async productionComplete(@Body() body: ProductionCompleteDto) {
    return unwrapOrInternal(await this.svc.productionComplete(body));
  }

  @Post('pick/:taskId')
  @HttpCode(HttpStatus.OK)
  async pickTask(@Param('taskId') taskId: string, @Body() body: PickTaskDto) {
    return unwrapOrInternal(await this.svc.pickTask(taskId, body));
  }

  @Post('picking/:taskId/complete')
  @HttpCode(HttpStatus.OK)
  async completePickingTask(@Param('taskId') taskId: string, @Body() body: PickTaskDto) {
    return unwrapOrInternal(await this.svc.pickTask(taskId, body));
  }

  @Patch('operator-balance/:id/resolve')
  async resolveOperatorBalance(@Param('id') id: string, @Body() body: ResolveBalanceDto) {
    return unwrapOrInternal(await this.svc.resolveOperatorBalance(id, body));
  }

  @Patch('qc/:id')
  @HttpCode(HttpStatus.OK)
  async qcPatch(@Param('id') id: string, @Body() body: BoolBodyDto) {
    return unwrapOrInternal(await this.svc.qcDecision(id, body.passed));
  }

  @Get('barcodes/scan/:id')
  async scanBarcodeById(@Param('id') id: string) {
    return unwrapOrInternal(await this.svc.scanBarcodeById(id));
  }

  @Post('exit/:id/notify-security')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(AuditInterceptor)
  async notifySecurityExit(@Param('id') id: string, @Body() body: CompatBodyDto) {
    return unwrapOrInternal(await this.svc.notifySecurityExit(id, String(body['notes'] ?? '')));
  }

  @Post('issue')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(AuditInterceptor)
  async issueGoods(@Body() body: CompatBodyDto) {
    return unwrapOrInternal(await this.svc.issueGoods(body as Record<string, unknown>, null));
  }

  @Get('operator-debts')
  async getOperatorDebts() {
    return unwrapOrInternal(await this.debtSvc.getOperatorDebts());
  }

  @Get('debts/:id')
  async getDebtById(@Param('id') id: string) {
    return unwrapOrInternal(await this.debtSvc.getDebtById(id));
  }

  @Post('cycle-count')
  @HttpCode(HttpStatus.CREATED)
  async createCycleCount(@Body() body: CompatBodyDto) {
    return unwrapOrInternal(await this.svc.submitCycleCount(body as unknown as import('./dto/warehouse.dto').CycleCountSubmitDto));
  }

  @Patch('debts/:id')
  async patchDebt(@Param('id') id: string, @Body() body: CompatBodyDto) {
    return { id, ...body, updated: true };
  }
}
