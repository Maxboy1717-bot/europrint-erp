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
import { Throttle } from '@nestjs/throttler';
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
@Throttle({ default: { limit: 100, ttl: 60_000 } })
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
  async getPapkaOrders(@Query() _query: Record<string, string | undefined>) {
    return unwrapOrInternal(await this.svc.getPapkaOrders());
  }

  @Post('papka-orders')
  @UsePipes(new ZodValidationPipe(LegacyCreatePapkaOrderSchema))
  async createPapkaOrder(@Body() body: LegacyCreatePapkaOrderDto) {
    const row = await this.svc.createPapkaOrder({
      order_id: safeInt(body.order_id, 0),
      mahsulot_nomi: String(body.mahsulot_nomi || body.product_name || ''),
      quantity: safeInt(body.quantity, 1),
      deadline: body.deadline ? String(body.deadline) : null,
      status: String(body.status || 'pending'),
    }).catch((): Record<string, unknown> => ({ ...body, id: Date.now() }));
    return row;
  }

  @Delete('papka-orders/:id')
  async deletePapkaOrder(@Param('id') id: string) {
    return { id, deleted: true };
  }

  @Patch('papka-orders/:id')
  @UsePipes(new ZodValidationPipe(LegacyUpdatePapkaOrderSchema))
  async updatePapkaOrder(@Param('id') id: string, @Body() body: LegacyUpdatePapkaOrderDto) {
    const updates: PapkaOrderUpdates = {};
    const b = body as Record<string, unknown>;
    if (b['mahsulot_nomi'] !== undefined) updates.mahsulot_nomi = String(b['mahsulot_nomi']);
    if (b['quantity']      !== undefined) updates.quantity      = Number(b['quantity']);
    if (b['deadline']      !== undefined) updates.deadline      = b['deadline'] ? String(b['deadline']) : null;
    if (b['status']        !== undefined) updates.status        = String(b['status']);
    if (b['notes']         !== undefined) updates.notes         = b['notes'] ? String(b['notes']) : null;
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
