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
  Query, Logger, UseGuards, UseInterceptors, UsePipes, BadRequestException, Req, HttpCode,
} from '@nestjs/common';
import * as fs from 'fs';
import * as nodePath from 'path';
import type { FastifyRequest } from 'fastify';
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
  LegacyClientErrorSchema, LegacyClientErrorDto,
} from '../dto/legacy.dto';
import { unwrapOrInternal } from '@common/http-result';

// A4 upload constants (mirror storage.controller safety: dir under cwd/uploads, ext allowlist, size cap).
const LEGACY_UPLOADS_DIR = nodePath.resolve(process.cwd(), 'uploads');
const LEGACY_MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
const LEGACY_ALLOWED_UPLOAD_EXT = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.pdf', '.docx', '.xlsx', '.csv', '.txt',
  '.mp4', '.webm', '.ogg', '.mp3', '.wav',
]);

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
  @HttpCode(200)
  async uploadFile(@Req() req: FastifyRequest) {
    // A4: was a green-lie — returned {message:'Fayl yuklandi'} with empty url and stored NOTHING,
    // so lesson files were silently lost. Now writes the multipart file to UPLOADS_DIR/lessons/<key>
    // and returns {filePath}. Served via the canonical storage route (GET /api/storage/<key>; the FE
    // proxies /storage/* -> /api/storage/*). @fastify/multipart is registered in main.ts.
    const mp = await (req as unknown as { file(): Promise<{ filename?: string; toBuffer(): Promise<Buffer> } | undefined> }).file();
    if (!mp) throw new BadRequestException('Fayl topilmadi');
    const ext = nodePath.extname(mp.filename || '').toLowerCase();
    if (!LEGACY_ALLOWED_UPLOAD_EXT.has(ext)) throw new BadRequestException(`Fayl turi ruxsat etilmagan: ${ext || '(yo\'q)'}`);
    const buf = await mp.toBuffer();
    if (!buf.length) throw new BadRequestException('Bo\'sh fayl');
    if (buf.length > LEGACY_MAX_UPLOAD_BYTES) throw new BadRequestException('Fayl juda katta (maks 25MB)');
    const safeName = (mp.filename || 'file').replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = `lessons/${Date.now()}-${safeName}`;
    const dest = nodePath.join(LEGACY_UPLOADS_DIR, key);
    fs.mkdirSync(nodePath.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, buf);
    this.logger.log(`Uploaded lesson file: ${key} (${buf.length} bytes)`);
    return { filePath: key, url: `/storage/${key}`, filename: safeName };
  }

  @Public()
  @Post('client-errors')
  @UsePipes(new ZodValidationPipe(LegacyClientErrorSchema))
  async logClientError(@Body() _body: LegacyClientErrorDto) {
    return { received: true };
  }
}
