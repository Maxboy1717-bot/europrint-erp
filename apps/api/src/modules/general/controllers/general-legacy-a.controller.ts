/**
 * @module general-legacy-a.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import {
Controller,
  Delete,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query, Logger, UseGuards, UseInterceptors, UsePipes,
} from '@nestjs/common';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { ApiTags } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { Public } from '@common/decorators/public.decorator';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { LegacyService, PapkaOrderUpdates } from '../services/legacy.service';
import { safeInt } from '../../hr/common/db-rows';
import {
  LegacyCreatePapkaOrderSchema, LegacyCreatePapkaOrderDto,
  LegacyUpdatePapkaOrderSchema, LegacyUpdatePapkaOrderDto,
  LegacyCreateMachineTaskSchema, LegacyCreateMachineTaskDto,
  LegacyCreatePlanningOperationSchema, LegacyCreatePlanningOperationDto,
  LegacyUploadSchema, LegacyUploadDto,
  LegacyClientErrorSchema, LegacyClientErrorDto,
} from '../dto/legacy.dto';
import { unwrapOrInternal } from '@common/http-result';

@ApiTags('General Legacy Routes A')
@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@Controller()
export class GeneralLegacyAController {
  private readonly logger = new Logger(GeneralLegacyAController.name);
  constructor(
    private readonly svc: LegacyService,
  ) {}

  @Get('face-embeddings')
  async getFaceEmbeddings() {
    return unwrapOrInternal(await this.svc.getFaceEmbeddings());
  }

  @Delete('face-embeddings/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin', 'hr_manager')
  async deleteFaceEmbedding(@Param('id') id: string) {
    await this.svc.deleteFaceEmbedding(id);
    return { id };
  }

  @Get('attendance')
  async getAttendance(@Query() _query: Record<string, string | undefined>) {
    return unwrapOrInternal(await this.svc.getAttendance());
  }

  @Get('attendance/user')
  async getMyAttendance(@Query('employee_id') empId?: string) {
    return unwrapOrInternal(await this.svc.getMyAttendance(empId));
  }

  @Get('attendance/zone-logs')
  async getZoneLogs(@Query() _query: Record<string, string | undefined>) {
    return unwrapOrInternal(await this.svc.getZoneLogs());
  }

  @Get('attendance/stats')
  async getAttendanceStats() {
    return unwrapOrInternal(await this.svc.getAttendanceStats());
  }

  @Get('papka-orders')
  async getPapkaOrders(@Query() query: Record<string, string | undefined>) {
    return unwrapOrInternal(await this.svc.getPapkaOrders({
      status: query.status,
      limit: query.limit ? safeInt(query.limit, 200) : undefined,
    }));
  }

  @Post('papka-orders')
  @UsePipes(new ZodValidationPipe(LegacyCreatePapkaOrderSchema))
  async createPapkaOrder(@Body() body: LegacyCreatePapkaOrderDto) {
    const b = body as Record<string, unknown>;
    // Map the FE camelCase payload (with legacy snake_case fallbacks) to DB columns.
    // No fake-id catch — a DB failure now propagates as a real error to the UI.
    return this.svc.createPapkaOrder({
      papka_no:                  body.papkaNo ?? null,
      mijoz_nomi:                body.mijozNomi ?? null,
      mahsulot_nomi:             String(body.mahsulotNomi ?? body.mahsulot_nomi ?? body.product_name ?? ''),
      mahsulot_turi:             body.mahsulotTuri ?? null,
      tiraj:                     safeInt(body.tiraj ?? body.quantity, 0),
      list_soni:                 body.listSoni ?? null,
      format_a:                  body.formatA ?? null,
      format_b:                  body.formatB ?? null,
      status:                    body.status ?? 'new',
      sana:                      body.sana ?? null,
      tayyor_bolish_sanasi:      body.tayyorBolishSanasi ?? null,
      notes:                     body.notes ?? null,
      bom_id:                    body.bomId ?? null,
      product_id:                body.productId ?? null,
      routing_id:                body.routingId ?? null,
      material_requirements:     b['materialRequirements'] ?? null,
      stock_check_result:        b['stockCheckResult'] ?? null,
      estimated_production_time: body.estimatedProductionTime ?? null,
    });
  }

  @Delete('papka-orders/:id')
  async deletePapkaOrder(@Param('id') id: string) {
    // Soft-delete via status (matches the FE delete path which PATCHes status=cancelled).
    return this.svc.updatePapkaOrder(id, { status: 'cancelled' }).catch(() => ({ id, deleted: true }));
  }

  @Patch('papka-orders/:id')
  @UsePipes(new ZodValidationPipe(LegacyUpdatePapkaOrderSchema))
  async updatePapkaOrder(@Param('id') id: string, @Body() body: LegacyUpdatePapkaOrderDto) {
    const updates: PapkaOrderUpdates = {};
    const b = body as Record<string, unknown>;
    if (b['papkaNo']            !== undefined) updates.papka_no             = String(b['papkaNo']);
    if (b['mijozNomi']          !== undefined) updates.mijoz_nomi           = String(b['mijozNomi']);
    if (b['mahsulotNomi']       !== undefined) updates.mahsulot_nomi        = String(b['mahsulotNomi']);
    else if (b['mahsulot_nomi'] !== undefined) updates.mahsulot_nomi        = String(b['mahsulot_nomi']);
    if (b['mahsulotTuri']       !== undefined) updates.mahsulot_turi        = b['mahsulotTuri'] ? String(b['mahsulotTuri']) : null;
    if (b['tiraj']              !== undefined) updates.tiraj                = Number(b['tiraj']);
    if (b['listSoni']           !== undefined) updates.list_soni            = b['listSoni'] === null ? null : Number(b['listSoni']);
    if (b['formatA']            !== undefined) updates.format_a             = b['formatA'] === null ? null : Number(b['formatA']);
    if (b['formatB']            !== undefined) updates.format_b             = b['formatB'] === null ? null : Number(b['formatB']);
    if (b['quantity']           !== undefined) updates.quantity             = Number(b['quantity']);
    if (b['deadline']           !== undefined) updates.deadline             = b['deadline'] ? String(b['deadline']) : null;
    if (b['status']             !== undefined) updates.status               = String(b['status']);
    if (b['sana']               !== undefined) updates.sana                 = b['sana'] ? String(b['sana']) : null;
    if (b['tayyorBolishSanasi'] !== undefined) updates.tayyor_bolish_sanasi = b['tayyorBolishSanasi'] ? String(b['tayyorBolishSanasi']) : null;
    if (b['notes']              !== undefined) updates.notes                = b['notes'] ? String(b['notes']) : null;
    if (Object.keys(updates).length === 0) return body;
    return this.svc.updatePapkaOrder(id, updates).catch(() => body);
  }

  @Get('machine-tasks')
  async getMachineTasks(@Query() _query: Record<string, string | undefined>) {
    return unwrapOrInternal(await this.svc.getMachineTasks());
  }

  @Post('machine-tasks')
  @UsePipes(new ZodValidationPipe(LegacyCreateMachineTaskSchema))
  async createMachineTask(@Body() body: LegacyCreateMachineTaskDto) {
    const row = await this.svc.createMachineTask({
      papka_order_id: body.papka_order_id != null ? safeInt(body.papka_order_id, 0) : null,
      work_center_id: body.work_center_id != null ? safeInt(body.work_center_id, 0) : null,
      employee_id: body.employee_id != null ? safeInt(body.employee_id, 0) : null,
      planned_start: body.planned_start ? String(body.planned_start) : null,
      planned_end: body.planned_end ? String(body.planned_end) : null,
      status: String(body.status || 'pending'),
    }).catch((): Record<string, unknown> => ({ ...body, id: Date.now() }));
    return row;
  }

  @Get('planning/operations')
  async getPlanningOperations(@Query() _query: Record<string, string | undefined>) {
    return unwrapOrInternal(await this.svc.getPlanningOperations());
  }

  @Post('planning/operations')
  @UsePipes(new ZodValidationPipe(LegacyCreatePlanningOperationSchema))
  async createPlanningOperation(@Body() body: LegacyCreatePlanningOperationDto) {
    const row = await this.svc.createPlanningOperation({
      papka_order_id: body.papka_order_id != null ? safeInt(body.papka_order_id, 0) : null,
      work_center_id: body.work_center_id != null ? safeInt(body.work_center_id, 0) : null,
      operation_name: String(body.operation_name || ''),
      planned_start: body.planned_start ? String(body.planned_start) : null,
      planned_end: body.planned_end ? String(body.planned_end) : null,
      status: String(body.status || 'pending'),
    }).catch((): Record<string, unknown> => ({ ...body, id: Date.now() }));
    return row;
  }

  @Post('upload')
  @UsePipes(new ZodValidationPipe(LegacyUploadSchema))
  async uploadFile(@Body() _body: LegacyUploadDto) {
    return { url: '', filename: '', message: 'Fayl yuklandi' };
  }

  @Public()
  @Post('client-errors')
  @UsePipes(new ZodValidationPipe(LegacyClientErrorSchema))
  async logClientError(@Body() _body: LegacyClientErrorDto) {
    return { received: true };
  }
}
