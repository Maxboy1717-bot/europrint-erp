/**
 * @module iot-tablet.controller
 * @description NestJS controller for IoT tablet/PWA + production-session passthrough endpoints.
 *   Wave 11 P1 (2026-05-18): five endpoints are now implemented against IotTabletService —
 *   login, sos-alert, equipment, orders, worker-schedule.
 *   Category-C Phase-1 (2026-06-06): production-sessions CRUD, inline-qc, defect report,
 *   shift-handover, material-kit scan — all wired to real DB tables.
 *
 *   DDL-GATE (needs new table): crew, evaluation, material-return.
 *   Zod schemas + role constants live in `iot-tablet.schemas.ts` (Rule 16).
 */

import {
  Body,
  Controller,
  Get,
  Headers,
  Logger,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UnauthorizedException,
  UnprocessableEntityException,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { I18nService } from 'nestjs-i18n';
import { EventBus, CommandBus } from '@nestjs/cqrs';
import { TashkentTimeService } from '@common/time';
import { MesCompletedEvent } from '@modules/mes/domain/events/mes-completed.event';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { TabletTokenGuard } from '@common/guards/tablet-token.guard';
import { Public } from '@common/decorators/public.decorator';
import { unwrapOrThrow } from '@common/http-result';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';
import { IotTabletService } from '../application/iot-tablet.service';
import { OeeCalculatorService } from '../oee/oee-calculator.service';
import { MesBrakLimitRepository } from '@modules/mes/infrastructure/repositories/mes-brak-limit.repo';
import { notImplemented } from '@common/exceptions/not-implemented';
import { ReportDefectCommand } from '@modules/qc/application/commands/report-defect.command';
import { DefectSeverity } from '@modules/qc/domain/aggregates/defect.aggregate';
import { IOT_INLINE_QC_MAJOR_DEFECT_THRESHOLD_PCT } from '@common/constants/business.constants';
import {
  IotPassthroughSchema,
  StopSessionSchema,
  TabletLoginSchema,
  TabletSessionSchema,
  ProductionSessionSchema,
  TabletSosAlertSchema,
  TabletEquipmentQuerySchema,
  TabletOrdersQuerySchema,
  WorkerScheduleQuerySchema,
  DefectReportSchema,
  InlineQcSchema,
  HandoverSchema,
  MaterialKitScanSchema,
  EvaluationSchema,
  MaterialReturnSchema,
  DowntimeEventSchema,
  CrewSchema,
  AcceptHandoverSchema,
  ChecklistItemCompleteSchema,
  SETUP_CHECKLIST_DEFAULT_ITEMS,
  coerceWorkerId,
} from './iot-tablet.schemas';

type Rows = { rows?: unknown[] };

@ApiThrottle()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Iot Tablet')
@ApiBearerAuth()
@Controller('iot')
export class IotTabletController {
  private readonly time = new TashkentTimeService();
  private readonly logger = new Logger(IotTabletController.name);

  constructor(
    private readonly tabletSvc: IotTabletService,
    private readonly oeeSvc: OeeCalculatorService,
    private readonly eventBus: EventBus,
    private readonly commandBus: CommandBus,
    private readonly brakLimitRepo: MesBrakLimitRepository,
    private readonly i18n: I18nService,
  ) {}

  // -- Tablet PWA endpoints ----------------------------------------------------

  @ApiOperation({ summary: 'Get tablet orders' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('tablet/orders')
  @Public()
  @UseGuards(TabletTokenGuard)
  async getTabletOrders(@Query() raw: Record<string, unknown>) {
    const q = TabletOrdersQuerySchema.parse(raw);
    return unwrapOrThrow(
      await this.tabletSvc.getTabletOrders(q.workerId, q.equipmentId, q.status),
    );
  }

  @ApiOperation({ summary: 'Get tablet worker schedule' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('tablet/worker-schedule')
  @Public()
  @UseGuards(TabletTokenGuard)
  async getTabletWorkerSchedule(@Query() raw: Record<string, unknown>) {
    const q = WorkerScheduleQuerySchema.parse(raw);
    return unwrapOrThrow(
      await this.tabletSvc.getWorkerSchedule(q.workerId, q.from, q.to),
    );
  }

  @ApiOperation({ summary: 'Get tablet equipment' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('tablet/equipment')
  @Public()
  @UseGuards(TabletTokenGuard)
  async getTabletEquipment(@Query() raw: Record<string, unknown>) {
    const q = TabletEquipmentQuerySchema.parse(raw);
    return unwrapOrThrow(
      await this.tabletSvc.getTabletEquipment(q.workerId, q.shopFloor),
    );
  }

  @ApiOperation({ summary: 'Get today shift handovers for tablet' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('tablet/shift')
  @Public()
  @UseGuards(TabletTokenGuard)
  async getTabletShift() {
    const r = await db.execute(sql`
      SELECT * FROM shift_handovers
      WHERE handover_date >= to_char(NOW(), 'YYYY-MM-DD')
      ORDER BY created_at DESC LIMIT 20
    `);
    const items = (r as Rows).rows ?? [];
    return { items, total: items.length };
  }

  @ApiOperation({ summary: 'Get tablet sessions (production_sessions)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('tablet/sessions')
  @Public()
  @UseGuards(TabletTokenGuard)
  async getTabletSessions() {
    const r = await db.execute(sql`
      SELECT * FROM production_sessions WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 50
    `);
    const items = (r as Rows).rows ?? [];
    return { items, total: items.length };
  }

  @ApiOperation({ summary: 'Create tablet session (production_sessions)' })
  @ApiResponse({ status: 201, description: 'OK' })
  @Post('tablet/sessions')
  @Public()
  @UseGuards(TabletTokenGuard)
  async createTabletSession(@Body() body: unknown) {
    const dto = TabletSessionSchema.parse(body ?? {});
    const workerId = dto.workerId ? Number(dto.workerId) : 0;
    const r = await db.execute(sql`
      INSERT INTO production_sessions (
        session_number, production_order_id, equipment_id, worker_id, status,
        target_quantity, actual_quantity, defect_quantity,
        running_time_seconds, stopped_time_seconds,
        started_at, created_at, updated_at
      ) VALUES (
        'SES-' || extract(epoch from now())::bigint,
        0, 0, ${workerId}, 'pending',
        0, 0, 0, 0, 0,
        ${dto.startedAt ?? null}, NOW(), NOW()
      ) RETURNING *
    `);
    const row = ((r as Rows).rows ?? [])[0] ?? {};
    await this.autoSeedChecklist(row);
    return { data: row };
  }

  @ApiOperation({ summary: 'Tablet login' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Post('tablet/login')
  @Public()
  async tabletLogin(@Body() body: unknown) {
    const dto = TabletLoginSchema.parse(body);
    return unwrapOrThrow(
      await this.tabletSvc.login(dto.tabelNumber, dto.password),
    );
  }

  /**
   * C2 (CRITICAL-CORRECTNESS-AUDIT-2026-07-06): reissues a tablet token, including one that has
   * ALREADY expired — the PWA calls this reactively after a 401 on any other tablet endpoint, by
   * which point the token is by definition no longer valid under a normal `verify()`. Deliberately
   * NOT behind `TabletTokenGuard` (that guard rejects expired tokens outright) — IotTabletService
   * .refresh() does its own `ignoreExpiration` verify + grace-window + re-checked card-gate.
   */
  @ApiOperation({ summary: 'Refresh tablet token' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Post('tablet/refresh')
  @Public()
  async tabletRefresh(@Headers('x-tablet-token') tabletToken: string | undefined) {
    if (!tabletToken) {
      throw new UnauthorizedException(await this.i18n.t('errors.tabletTokenRequired'));
    }
    return unwrapOrThrow(await this.tabletSvc.refresh(tabletToken));
  }

  @ApiOperation({ summary: 'Tablet sos alert (safety-critical)' })
  @ApiResponse({ status: 201, description: 'OK' })
  @Post('tablet/sos-alert')
  @Public()
  async tabletSosAlert(@Body() body: unknown) {
    const dto = TabletSosAlertSchema.parse(body ?? {});
    // workerId=0 means "anonymous panic press"; we still log + insert so the
    // safety button cannot fail closed.
    return unwrapOrThrow(
      await this.tabletSvc.raiseSosAlert({
        workerId: coerceWorkerId(dto.workerId),
        workerName: dto.workerName,
        sessionId: dto.sessionId === undefined || dto.sessionId === null ? null : String(dto.sessionId),
        equipmentId: dto.equipmentId ?? null,
        alertType: dto.alertType,
        message: dto.message,
      }),
    );
  }

  @ApiOperation({ summary: 'Tablet shift handover (INSERT shift_handovers)' })
  @ApiResponse({ status: 201, description: 'OK' })
  @Post('tablet/handover')
  @Public()
  @UseGuards(TabletTokenGuard)
  async tabletHandover(@Body() body: unknown) {
    const dto = HandoverSchema.parse(body ?? {});
    const today = new Date().toISOString().slice(0, 10);
    // SB0304/SB0324/SB0349 (2-signature enforcement): shift_handovers.status
    // only reaches 'completed' once BOTH the outgoing operator's signature
    // (signatureData, required by the schema above) AND a receiving operator
    // (receivedBy) are present. A handover submitted without a receiving
    // operator (tablet UI does not yet collect one — no separate "accept"
    // step exists) stays 'pending', matching the FE-visible reality instead
    // of silently reporting a one-sided handover as done.
    const status = dto.receivedBy != null ? 'completed' : 'pending';
    const r = await db.execute(sql`
      INSERT INTO shift_handovers (
        handover_date, department, machine_status, pending_tasks,
        quality_issues, safety_notes, material_status,
        handed_over_by, received_by, signature_data, status, created_at
      ) VALUES (
        ${dto.handoverDate ?? today},
        ${dto.department},
        ${dto.machineStatus ?? null},
        ${dto.pendingTasks ?? null},
        ${dto.qualityIssues ?? null},
        ${dto.safetyNotes ?? null},
        ${dto.materialStatus ?? null},
        ${dto.handedOverBy},
        ${dto.receivedBy ?? null},
        ${dto.signatureData},
        ${status},
        NOW()
      ) RETURNING *
    `);
    const row = ((r as Rows).rows ?? [])[0] ?? {};
    return { data: row };
  }

  @ApiOperation({ summary: 'Receiving operator accepts a pending shift handover (2nd signature)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Handover not found or already completed' })
  @Patch('tablet/handover/:id/accept')
  @Public()
  @UseGuards(TabletTokenGuard)
  async acceptTabletHandover(@Param('id') id: string, @Body() body: unknown) {
    const dto = AcceptHandoverSchema.parse(body ?? {});
    const handoverId = parseInt(id, 10);
    const r = await db.execute(sql`
      UPDATE shift_handovers
      SET received_by = ${dto.receivedBy},
          signature_data = COALESCE(signature_data || ' | ', '') || 'RECEIVED::' || ${dto.signatureData},
          status = 'completed'
      WHERE id = ${handoverId} AND status <> 'completed'
      RETURNING *
    `);
    const row = ((r as Rows).rows ?? [])[0];
    if (!row) {
      throw new UnprocessableEntityException(
        'Handover topilmadi yoki allaqachon yakunlangan (status=completed)',
      );
    }
    return { data: row };
  }

  // -- Material kit scan endpoints ---------------------------------------------

  @ApiOperation({ summary: 'Scan material kit item (POST)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Post('material-kit-items/:id/scan')
  @Public()
  @UseGuards(TabletTokenGuard)
  async scanMaterialKitItem(@Param('id') id: string, @Body() body: unknown) {
    const dto = MaterialKitScanSchema.parse(body ?? {});
    return this.persistKitItemScan(parseInt(id, 10), dto);
  }

  @ApiOperation({ summary: 'Scan material kit item (PATCH)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Patch('material-kit-items/:id/scan')
  @Public()
  @UseGuards(TabletTokenGuard)
  async patchScanMaterialKitItem(@Param('id') id: string, @Body() body: unknown) {
    const dto = MaterialKitScanSchema.parse(body ?? {});
    return this.persistKitItemScan(parseInt(id, 10), dto);
  }

  /**
   * VISION-3340 #16 (MES LOT/batch WRITER-wire): material_kit_items had no FK to
   * material_batches (28 cols, 0 rows) — a floor-operator's scan could never be traced
   * back to the physical LOT it consumed, and material_batches.remaining_quantity had
   * zero writers pointed at it anywhere in the codebase. When the scan resolves a
   * batchId (material_batches.id, e.g. from a batch barcode), this now (a) persists it
   * onto material_kit_items.batch_id — COALESCE-guarded so an already-linked item keeps
   * its batch on a re-scan (same first-write-wins idiom as T12-02 operator_card_id) —
   * and (b) decrements that batch's remaining_quantity by the kit item's
   * required_quantity (the amount this kit item needed, i.e. consumed from the LOT).
   * Both writes share ONE transaction (mirrors reportProductionDefect's session +
   * downtime_events wrap) so a batch-quantity failure cannot leave the scan
   * half-committed. GREATEST(0, ...) guards remaining_quantity against going negative
   * on an over-scan (Q-40 — no silent wraparound). No batchId supplied = behaves
   * exactly as before (scan-only, no batch link, no stock movement).
   */
  private async persistKitItemScan(
    id: number,
    dto: { scannedBy?: number; batchId?: number },
  ): Promise<{ id: number; scanned: true; batchId: number | null }> {
    let batchDecrementedFrom: number | null = null;
    await db.transaction(async (tx) => {
      const upd = await tx.execute(sql`
        UPDATE material_kit_items
        SET is_scanned = true,
            scanned_at = NOW(),
            scanned_by = ${dto.scannedBy ?? null},
            batch_id   = COALESCE(${dto.batchId ?? null}, batch_id)
        WHERE id = ${id}
        RETURNING required_quantity
      `);
      if (dto.batchId != null) {
        const row = ((upd as Rows).rows ?? [])[0] as Record<string, unknown> | undefined;
        const consumedQty = row ? Number(row['required_quantity'] ?? 0) : 0;
        await tx.execute(sql`
          UPDATE material_batches
          SET remaining_quantity = GREATEST(0, remaining_quantity - ${consumedQty})
          WHERE id = ${dto.batchId}
        `);
        batchDecrementedFrom = dto.batchId;
      }
    });
    return { id, scanned: true, batchId: batchDecrementedFrom };
  }

  // -- Production-sessions endpoints -------------------------------------------
  // Note: list (GET) is already served by general-legacy-b.controller.ts at
  //       @Get('iot/production-sessions'). Fastify rejects duplicate GET
  //       declarations, so we keep only POST/Sub-routes here.

  @ApiOperation({ summary: 'Create production session' })
  @ApiResponse({ status: 201, description: 'OK' })
  @Post('production-sessions')
  @Public()
  @UseGuards(TabletTokenGuard)
  async createProductionSession(@Body() body: unknown) {
    const dto = ProductionSessionSchema.parse(body ?? {});
    // Resolve the canonical FE fields with back-compat aliases. equipment_id and machine_id
    // both denote the machine, so populate each from whichever id was supplied.
    const num = (v: unknown): number | null => (v != null && v !== '' ? Number(v) : null);
    const poNum  = num(dto.productionOrderId ?? dto.orderId);
    const eqNum  = num(dto.equipmentId ?? dto.machineId);
    const mcNum  = num(dto.machineId ?? dto.equipmentId);
    const tgtNum = num(dto.targetQuantity);
    const r = await db.execute(sql`
      INSERT INTO production_sessions (
        session_number, production_order_id, equipment_id, worker_id, status,
        target_quantity, actual_quantity, defect_quantity,
        running_time_seconds, stopped_time_seconds,
        order_id, machine_id, shift_id, created_at, updated_at
      ) VALUES (
        'SES-' || extract(epoch from now())::bigint,
        ${poNum ?? 0},
        ${eqNum ?? 0}, 0, 'pending', ${tgtNum ?? 0}, 0, 0, 0, 0,
        ${poNum},
        ${mcNum},
        ${dto.shiftId ? Number(dto.shiftId) : null},
        NOW(), NOW()
      ) RETURNING *
    `);
    const row = ((r as Rows).rows ?? [])[0] ?? {};
    await this.autoSeedChecklist(row);
    return { data: row };
  }

  @ApiOperation({ summary: 'Get production session crew' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('production-sessions/:id/crew')
  @Public()
  @UseGuards(TabletTokenGuard)
  async getProductionSessionCrew(@Param('id') id: string) {
    const sessionId = parseInt(id, 10);
    const r = await db.execute(sql`
      SELECT * FROM machine_crews WHERE session_id = ${sessionId} ORDER BY id ASC
    `);
    const items = ((r as Rows).rows) ?? [];
    return { items, total: items.length };
  }

  @ApiOperation({ summary: 'Save production session crew (upsert)' })
  @ApiResponse({ status: 201, description: 'Created' })
  @Post('production-sessions/:id/crew')
  @Public()
  @UseGuards(TabletTokenGuard)
  async saveProductionSessionCrew(@Param('id') id: string, @Body() body: unknown) {
    const dto = CrewSchema.parse(body ?? {});
    const sessionId = parseInt(id, 10);
    // master_id is NOT NULL in DB — default to 0 when not provided
    const masterId    = dto.masterId    ?? 0;
    const polmasterId = dto.polmasterId ?? null;
    const shogirdId   = dto.shogirdId   ?? null;
    const roklerId    = dto.roklerId    ?? null;
    const r = await db.execute(sql`
      INSERT INTO machine_crews (session_id, master_id, polmaster_id, shogird_id, rokler_id, created_at)
      VALUES (${sessionId}, ${masterId}, ${polmasterId}, ${shogirdId}, ${roklerId}, NOW())
      ON CONFLICT DO NOTHING
      RETURNING *
    `);
    const row = ((r as Rows).rows ?? [])[0] ?? {};
    return { data: row };
  }

  // -- Setup-checklist CRUD (VISION-3340 #45 / 08-mes#8) -----------------------
  // The session start gate (startProductionSession here + StartSessionHandler) is
  // correctly fail-closed against setup_checklists/checklist_items, but nothing ever
  // seeded a checklist or let an operator tick items off — so EVERY session was
  // permanently un-startable. These two endpoints make the gate SATISFIABLE; they do
  // NOT touch the gate itself. All queries key off the varchar `session_id` link or a
  // row's own integer PK — never the setup_checklists.id ↔ checklist_items.checklist_id
  // comparison — so the seed/toggle are type-safe regardless of that column's type.

  /**
   * Seeds one `setup_checklists` row + the fixed TB-safety item set for a session and
   * returns them. Idempotent: an existing checklist for the session is returned
   * unchanged (so the tablet can fetch-or-create in a single call, no duplicate rows).
   */
  private async seedSessionChecklist(
    sessionId: number,
  ): Promise<{ checklistId: number; items: unknown[]; seeded: boolean }> {
    // Idempotency probe on the varchar session_id (varchar = varchar — type-safe).
    const existing = await db.execute(sql`
      SELECT id FROM setup_checklists WHERE session_id = ${String(sessionId)} ORDER BY id ASC LIMIT 1
    `);
    const existingRow = (((existing as Rows).rows) ?? [])[0] as { id?: unknown } | undefined;
    if (existingRow?.id !== undefined && existingRow.id !== null) {
      const checklistId = Number(existingRow.id);
      const itemsR = await db.execute(sql`
        SELECT * FROM checklist_items
        WHERE checklist_id = ${String(checklistId)}
        ORDER BY sort_order ASC, id ASC
      `);
      const existingItems = ((itemsR as Rows).rows) ?? [];
      return { checklistId, items: Array.isArray(existingItems) ? existingItems : [], seeded: false };
    }

    const scR = await db.execute(sql`
      INSERT INTO setup_checklists (session_id, status, created_at)
      VALUES (${String(sessionId)}, 'pending', NOW())
      RETURNING id
    `);
    const checklistId = Number((((scR as Rows).rows ?? [])[0] as { id?: unknown } | undefined)?.id ?? 0);

    // Single multi-row INSERT (no N+1). checklist_id is written as text so the write
    // succeeds whether the column is varchar (canonical schema) or integer.
    const valueRows = SETUP_CHECKLIST_DEFAULT_ITEMS.map((it, idx) =>
      sql`(${String(checklistId)}, ${it.category}, ${it.itemType}, ${it.title}, true, false, ${idx})`,
    );
    const insR = await db.execute(sql`
      INSERT INTO checklist_items
        (checklist_id, category, item_type, title, is_required, is_completed, sort_order)
      VALUES ${sql.join(valueRows, sql`, `)}
      RETURNING *
    `);
    const items = ((insR as Rows).rows) ?? [];
    return { checklistId, items: Array.isArray(items) ? items : [], seeded: true };
  }

  /**
   * Best-effort auto-seed used by the two session-create paths: reads the new row's
   * integer id and seeds its checklist. A seed failure must NEVER fail session
   * creation — a missing checklist just leaves the gate's fail-safe block in place.
   */
  private async autoSeedChecklist(row: unknown): Promise<void> {
    const newId = Number((row as { id?: unknown } | undefined)?.id);
    if (!Number.isFinite(newId) || newId <= 0) return;
    try {
      await this.seedSessionChecklist(newId);
    } catch (err) {
      this.logger.warn(`[IoT] auto-seed checklist failed (sessionId=${newId}): ${String(err)}`);
    }
  }

  @ApiOperation({ summary: 'Seed / fetch setup-checklist for a production session' })
  @ApiResponse({ status: 201, description: 'OK — checklist + items' })
  @Post('production-sessions/:id/checklist')
  @Public()
  @UseGuards(TabletTokenGuard)
  async seedProductionSessionChecklist(@Param('id') id: string, @Body() body: unknown) {
    IotPassthroughSchema.parse(body ?? {});
    const sessionId = parseInt(id, 10);
    if (!Number.isFinite(sessionId) || sessionId <= 0) {
      throw new UnprocessableEntityException('Sessiya id noto\'g\'ri');
    }
    const result = await this.seedSessionChecklist(sessionId);
    return { data: { checklistId: result.checklistId, items: result.items }, seeded: result.seeded };
  }

  @ApiOperation({ summary: 'Complete a setup-checklist item' })
  @ApiResponse({ status: 200, description: 'OK — updated item' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  @Patch('checklist-items/:id/complete')
  @Public()
  @UseGuards(TabletTokenGuard)
  async completeChecklistItem(@Param('id') id: string, @Body() body: unknown) {
    const dto = ChecklistItemCompleteSchema.parse(body ?? {});
    const itemId = parseInt(id, 10);
    if (!Number.isFinite(itemId) || itemId <= 0) {
      throw new UnprocessableEntityException('Chek-list band id noto\'g\'ri');
    }
    const completedBy = dto.completedBy ?? null;
    // WHERE id = <int PK> — no int↔varchar comparison, always type-safe.
    const r = await db.execute(sql`
      UPDATE checklist_items
      SET is_completed = true,
          completed_by = ${completedBy},
          completed_at = NOW()
      WHERE id = ${itemId}
      RETURNING *
    `);
    const row = (((r as Rows).rows) ?? [])[0];
    if (!row) {
      throw new NotFoundException('Chek-list bandi topilmadi');
    }
    return { data: row };
  }

  @ApiOperation({ summary: 'Start production session' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 422, description: 'BLOCKED — TB-safety / readiness checklist incomplete' })
  @Post('production-sessions/:id/start')
  @Public()
  @UseGuards(TabletTokenGuard)
  async startProductionSession(@Param('id') id: string, @Body() body: unknown) {
    IotPassthroughSchema.parse(body ?? {});
    const sessionId = parseInt(id, 10);

    // TB-safety / smena-readiness gate (Q-40 — real enforcement, no silent flip).
    // Operator tablet is the floor hub (E4): a session may not go RUNNING unless
    // every REQUIRED item of its setup_checklists/checklist_items is completed.
    // No required checklist configured = BLOCKED (fail-safe: safety unverified).
    const chk = await db.execute(sql`
      SELECT ci.title AS title,
             COALESCE(ci.is_completed, false) AS is_completed
      FROM checklist_items ci
      JOIN setup_checklists sc ON sc.id = ci.checklist_id
      WHERE sc.session_id = ${String(sessionId)}
        AND COALESCE(ci.is_required, true) = true
    `);
    const items = (((chk as Rows).rows) ?? []) as Array<{ title?: unknown; is_completed?: unknown }>;
    const incomplete = items
      .filter((it) => it.is_completed !== true)
      .map((it) => String(it.title ?? 'Nomsiz band'));
    if (items.length === 0) {
      throw new UnprocessableEntityException(
        'BLOCKED: smena-tayyorlik / TB-xavfsizlik chek-listi sozlanmagan — sessiyani boshlab bo\'lmaydi',
      );
    }
    if (incomplete.length > 0) {
      throw new UnprocessableEntityException(
        `BLOCKED: majburiy chek-list bandlari bajarilmagan (${incomplete.length}): ${incomplete.join(', ')}`,
      );
    }

    // 3.6 MES stage-tracking: first start of a session opens the GSD SETUP stage
    // (current_stage/stage_started_at were NULL until now — mirrors
    // ProductionSession.beginStages()/advanceSessionStage's "current_stage NULL →
    // start SETUP" rule). Re-starting an already-staged session (e.g. after a
    // resume that already restarted the clock) leaves current_stage/stage_started_at
    // untouched via COALESCE, so this call is idempotent.
    const started = await db.execute(sql`
      UPDATE production_sessions
      SET status='running',
          started_at=COALESCE(started_at, NOW()),
          current_stage=COALESCE(current_stage, 'setup'),
          stage_started_at=COALESCE(stage_started_at, NOW()),
          updated_at=NOW()
      WHERE id=${sessionId}
      RETURNING current_stage
    `);
    const stage = (((started as Rows).rows ?? [])[0] as Record<string, unknown> | undefined)?.current_stage ?? 'setup';
    await this.logStageTransition(sessionId, 'START', null, String(stage), null);
    return { id: sessionId, status: 'running', currentStage: stage };
  }

  @ApiOperation({ summary: 'Stop production session and compute OEE' })
  @ApiResponse({ status: 200, description: 'OK — includes OEE report in report field' })
  @Post('production-sessions/:id/stop')
  @Public()
  @UseGuards(TabletTokenGuard)
  async stopProductionSession(@Param('id') id: string, @Body() body: unknown) {
    // Step 1: parse typed stop body (FE sends runningTimeSeconds + actualQuantity)
    const dto = StopSessionSchema.parse(body ?? {});
    const sessionId = parseInt(id, 10);

    const bodyRunTimeSec = (dto.runningTimeSeconds !== undefined && Number.isFinite(dto.runningTimeSeconds))
      ? dto.runningTimeSeconds : null;
    const bodyActualQty  = (dto.actualQuantity !== undefined && Number.isFinite(dto.actualQuantity))
      ? dto.actualQuantity : null;

    // Step 2: persist FE stopwatch/qty values into DB before reading for OEE
    if (bodyRunTimeSec !== null || bodyActualQty !== null) {
      await db.execute(sql`
        UPDATE production_sessions
        SET running_time_seconds = COALESCE(${bodyRunTimeSec}, running_time_seconds),
            actual_quantity      = COALESCE(${bodyActualQty},  actual_quantity),
            updated_at           = NOW()
        WHERE id = ${sessionId}
      `);
    }

    // 1. Read session row from DB (now contains real FE values)
    //    production_order_id is the canonical ppId (mirrors drizzle-mes.repo.ts toSession),
    //    needed for the MesCompletedEvent → QC payload below.
    const sessionRes = await db.execute(sql`
      SELECT actual_quantity, target_quantity, defect_quantity,
             running_time_seconds, stopped_time_seconds, production_order_id
      FROM production_sessions
      WHERE id = ${sessionId}
      LIMIT 1
    `);
    const row = ((sessionRes as Rows).rows ?? [])[0] as Record<string, unknown> | undefined;

    const ppId       = row ? Number(row['production_order_id'] ?? 0) : 0;
    const actualQty  = row ? Number(row['actual_quantity']  ?? 0) : 0;
    const targetQty  = row ? Number(row['target_quantity']  ?? 1) : 1;
    const defectQty  = row ? Number(row['defect_quantity']  ?? 0) : 0;
    const runTimeSec = row ? Number(row['running_time_seconds']  ?? 0) : 0;
    const stopSec    = row ? Number(row['stopped_time_seconds'] ?? 0) : 0;

    // 2. Compute OEE
    const plannedProductionTime = runTimeSec + stopSec;
    // idealCycleTime = plannedProductionTime / GREATEST(targetQty, 1)  (seconds per unit)
    const idealCycleTime = plannedProductionTime / Math.max(targetQty, 1);

    const oeeResult = await this.oeeSvc.calculate({
      plannedProductionTime,
      runTime: runTimeSec,
      idealCycleTime,
      actualQuantity: actualQty,
      defectQuantity: Math.min(defectQty, actualQty), // guard: defect <= actual
    });

    // Extract factors — default 0 if calculation failed (e.g. zero session)
    const availability = oeeResult.ok ? oeeResult.data.availability : 0;
    const performance  = oeeResult.ok ? oeeResult.data.performance  : 0;
    const quality      = oeeResult.ok ? oeeResult.data.quality      : 0;
    const oee          = oeeResult.ok ? oeeResult.data.oee          : 0;

    // 3. UPDATE: set status, ended_at, OEE columns.
    //    3.6 MES stage-tracking: stop finalizes the GSD pipeline — whichever
    //    stage was open (setup/main/teardown) has its elapsed time (since
    //    stage_started_at) folded into that stage's accumulator, then
    //    current_stage moves to 'done' and stage_started_at is cleared
    //    (mirrors ProductionSession.advanceStage's per-stage accumulation).
    const stoppedRow = await db.execute(sql`
      UPDATE production_sessions
      SET status       = 'stopped',
          ended_at     = COALESCE(ended_at, NOW()),
          availability = ${availability},
          performance  = ${performance},
          quality      = ${quality},
          oee          = ${oee},
          setup_seconds = CASE WHEN current_stage = 'setup' AND stage_started_at IS NOT NULL
            THEN setup_seconds + GREATEST(0, EXTRACT(EPOCH FROM (NOW() - stage_started_at))::int)
            ELSE setup_seconds END,
          main_seconds = CASE WHEN current_stage = 'main' AND stage_started_at IS NOT NULL
            THEN main_seconds + GREATEST(0, EXTRACT(EPOCH FROM (NOW() - stage_started_at))::int)
            ELSE main_seconds END,
          teardown_seconds = CASE WHEN current_stage = 'teardown' AND stage_started_at IS NOT NULL
            THEN teardown_seconds + GREATEST(0, EXTRACT(EPOCH FROM (NOW() - stage_started_at))::int)
            ELSE teardown_seconds END,
          current_stage    = CASE WHEN current_stage IS NOT NULL THEN 'done' ELSE current_stage END,
          stage_started_at = NULL,
          updated_at   = NOW()
      WHERE id = ${sessionId}
      RETURNING current_stage
    `);
    const finalStage = (((stoppedRow as Rows).rows ?? [])[0] as Record<string, unknown> | undefined)?.current_stage ?? null;
    await this.logStageTransition(sessionId, 'STOP', null, finalStage === null ? '' : String(finalStage), null);

    // 3b. GOLDEN-THREAD (HOP 3, MES→QC): the floor-operator tablet stop must fire the
    //     SAME event the CQRS complete-session.handler publishes, so QC's
    //     @EventsHandler(MesCompletedEvent) (mes-completed.listener.ts) opens a PENDING
    //     qc_inspection for this production order. Previously the tablet stop never
    //     published, so tablet-completed sessions silently broke the chain at QC.
    //     Identical class + payload shape: (sessionId, ppId, timestamp). The EventBridge
    //     re-emits to legacy @OnEvent consumers via ERP_EVENTS.MES_COMPLETED.
    this.eventBus.publish(new MesCompletedEvent(sessionId, ppId, this.time.now()));

    // 4. Build FE-contract report shape (CompletionReportData)
    const elapsedSeconds = plannedProductionTime;
    const goodQty        = Math.max(actualQty - defectQty, 0);
    const completionPct  = targetQty > 0
      ? Math.round((actualQty / targetQty) * 1000) / 10
      : 0;

    return {
      id: sessionId,
      status: 'stopped',
      report: {
        production: {
          targetQuantity:    targetQty,
          actualQuantity:    actualQty,
          goodQuantity:      goodQty,
          defectQuantity:    defectQty,
          completionPercent: completionPct,
        },
        time: {
          runningSeconds:  runTimeSec,
          downtimeSeconds: stopSec,
          totalSeconds:    elapsedSeconds,
        },
        metrics: {
          availability,
          performance,
          quality,
          oee,
        },
      },
    };
  }

  @ApiOperation({ summary: 'Report production defect (updates session + inserts downtime_event + qc_defects)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Post('production-sessions/:id/defect')
  @Public()
  @UseGuards(TabletTokenGuard)
  async reportProductionDefect(@Param('id') id: string, @Body() body: unknown) {
    const dto = DefectReportSchema.parse(body ?? {});
    const sessionId = parseInt(id, 10);
    // Resolve the FE aliases: the tablet sends `quantity` + `reason`; the canonical names are
    // defectCount/reasonDescription. Record the operator's REAL count (was always 1) and carry
    // the free-text reason. defectCount falls back to 1 only when neither field is supplied.
    const defectCount = dto.defectCount ?? (dto.quantity != null ? Number(dto.quantity) : 1);
    const reasonDescription = dto.reasonDescription ?? dto.reason ?? null;
    // VISION-3340 #38 (idempotency): an offline tablet re-submitting after a network
    // retry carries the same (tablet_id, local_seq_no). If that pair already produced
    // a downtime_events row, the defect was already counted + QC-bridged — return an
    // idempotent success WITHOUT re-running the transaction (no double defect_quantity
    // bump), the brak-limit check, or the QC command dispatch.
    if (await this.isDuplicateTabletSubmit('downtime_events', dto.tabletId, dto.localSeqNo)) {
      return { sessionId, defectCount, reported: true, brakLimitCheck: null, qcDefectId: null, idempotent: true };
    }
    // 5.2 (Critical-Correctness audit): the session-defect UPDATE and the
    // downtime_events INSERT must land together or not at all — wrapped in a
    // single db.transaction (same convention as procurement-request.service.ts)
    // so a failed INSERT rolls back the UPDATE instead of leaving a defect
    // count bumped with no matching downtime_events row. The QC-bridge call
    // below stays OUTSIDE this transaction on purpose: it already has its own
    // try/catch and reports into a different module's table (qc_defects) —
    // forcing it into this transaction would let a QC-bridge hiccup roll back
    // a legitimate, already-valid production_sessions/downtime_events write.
    await db.transaction(async (tx) => {
      await tx.execute(sql`
        UPDATE production_sessions
        SET defect_quantity = defect_quantity + ${defectCount}, updated_at=NOW()
        WHERE id=${sessionId}
      `);
      await tx.execute(sql`
        INSERT INTO downtime_events (
          session_id, event_type, started_at,
          reason_code, reason_description, is_planned, notes, created_at,
          tablet_id, local_seq_no
        ) VALUES (
          ${sessionId}, ${dto.eventType}, NOW(),
          ${dto.reasonCode ?? null}, ${reasonDescription},
          false, ${dto.notes ?? null}, NOW(),
          ${dto.tabletId ?? null}, ${dto.localSeqNo ?? null}
        )
      `);
    });
    // 3.2-brak-ushlanma-zanjiri (Master-reja §5.3): work_centers.brak_limit_pct konfiguratsiya
    // qilingan bo'lsa (egasi-data — C14 hali OCHIQ, shu sabab % FABRIKATSIYA QILINMAYDI, faqat
    // MAVJUD ustun o'qiladi), limit oshganda signal + (agar HR fine_rules siyosati mavjud bo'lsa)
    // discipline_records ushlanma yozuvi yaratiladi. Limit NULL bo'lsa — fail-safe, hech narsa.
    const brakCheck = await this.brakLimitRepo.checkBrakLimit(sessionId);

    // SB0357 (IoT-08): floor-operator defect reports previously stayed in
    // downtime_events only — QC's own qc_defects table never saw them, so a
    // shop-floor brak never showed up in any QC dashboard/report. Reuses the
    // same ReportDefectCommand the QC module's own controllers dispatch
    // (report-defect.handler.ts) — no new table, no duplicated insert logic.
    // production_order_id/work_center_id are left null: qc_defects declares
    // them uuid while production_sessions ids are integer (documented two-id-worlds
    // mismatch, see drizzle-defect.repo.ts) — inspection_id is the correct link
    // and is not available from the tablet flow, so this surfaces as an
    // unlinked (but real, queryable) QC defect row.
    let qcDefectId: string | null = null;
    try {
      const workerRows = ((await db.execute(sql`
        SELECT worker_id FROM production_sessions WHERE id = ${sessionId}
      `)) as Rows).rows ?? [];
      const workerId = (workerRows[0] as Record<string, unknown> | undefined)?.worker_id;
      const reportedBy = workerId != null ? String(workerId) : `session:${sessionId}`;

      const qcResult = await this.commandBus.execute(
        new ReportDefectCommand(
          null,
          null,
          null,
          dto.reasonCode ?? 'IOT_TABLET_DEFECT',
          reasonDescription ?? dto.notes ?? `Tablet defect report (session #${sessionId})`,
          DefectSeverity.MINOR,
          defectCount,
          'pcs',
          reportedBy,
        ),
      );
      if (qcResult && (qcResult as { ok?: boolean; data?: { id?: string } }).ok) {
        qcDefectId = (qcResult as { data?: { id?: string } }).data?.id ?? null;
      }
    } catch (err) {
      this.logger.error(`[IoT] reportProductionDefect: QC bridge failed (sessionId=${sessionId}): ${String(err)}`);
    }

    return { sessionId, defectCount: dto.defectCount, reported: true, brakLimitCheck: brakCheck, qcDefectId };
  }

  @ApiOperation({ summary: 'Submit production evaluation' })
  @ApiResponse({ status: 201, description: 'OK' })
  @Post('production-sessions/:id/evaluation')
  @Public()
  @UseGuards(TabletTokenGuard)
  async submitProductionEvaluation(@Param('id') id: string, @Body() body: unknown) {
    const dto = EvaluationSchema.parse(body ?? {});
    const sessionId = parseInt(id, 10);
    const r = await db.execute(sql`
      INSERT INTO shift_evaluations (
        eval_id, shift_name, operator_id,
        safety_score, quality_score, productivity_score, teamwork_score,
        overall_score, issues_reported, suggestions, notes, skipped, created_at
      ) VALUES (
        ${sessionId},
        ${dto.shiftName ?? `Session ${sessionId}`},
        ${dto.operatorId ?? null},
        ${dto.safetyScore ?? null},
        ${dto.qualityScore ?? null},
        ${dto.productivityScore ?? null},
        ${dto.teamworkScore ?? null},
        ${dto.overallScore},
        ${dto.issuesReported ?? null},
        ${dto.suggestions ?? null},
        ${dto.notes ?? null},
        false,
        NOW()
      ) RETURNING *
    `);
    const row = ((r as Rows).rows ?? [])[0] ?? {};
    return { data: row };
  }

  @ApiOperation({ summary: 'Submit material return' })
  @ApiResponse({ status: 201, description: 'OK' })
  @Post('production-sessions/:id/material-return')
  @Public()
  @UseGuards(TabletTokenGuard)
  async submitMaterialReturn(@Param('id') id: string, @Body() body: unknown) {
    const dto = MaterialReturnSchema.parse(body ?? {});
    const sessionId = parseInt(id, 10);
    // VISION-3340 #38 (idempotency): a re-submitted material return carrying the same
    // (tablet_id, local_seq_no) must NOT be inserted a second time — a duplicate would
    // both double the material_movements audit trail AND double-credit warehouse_stock.
    // Return an idempotent success without the INSERT or the stock credit.
    if (await this.isDuplicateTabletSubmit('material_movements', dto.tabletId, dto.localSeqNo)) {
      return { data: null, idempotent: true };
    }
    const r = await db.execute(sql`
      INSERT INTO material_movements (
        session_id, movement_type, material_name, quantity, unit,
        performed_by, material_id, reason, notes, created_at,
        tablet_id, local_seq_no
      ) VALUES (
        ${sessionId}, 'RETURN',
        ${dto.materialName},
        ${dto.quantity},
        ${dto.unit},
        ${dto.performedBy},
        ${dto.materialId ?? null},
        ${dto.reason ?? null},
        ${dto.notes ?? null},
        NOW(),
        ${dto.tabletId ?? null}, ${dto.localSeqNo ?? null}
      ) RETURNING *
    `);
    const row = ((r as Rows).rows ?? [])[0] ?? {};

    // Canonical WMS chain (mirrors WarehouseConfigService.receiveStock, pos-wms-sync
    // 'in' direction): a production material RETURN is a stock receipt back into the
    // material's home warehouse. Previously this endpoint only wrote the
    // material_movements audit row — warehouse_stock/material_cards.current_stock never
    // moved, so returned material was invisible on WMS balance/aging reports (Q-46).
    if (dto.materialId && dto.quantity > 0) {
      await this.creditReturnedMaterialToStock(dto.materialId, dto.quantity, sessionId);
    }

    return { data: row };
  }

  /**
   * VISION-3340 #38 (IoT-tablet idempotency): probes whether an offline tablet's
   * defect / inline-QC / material-return submit has ALREADY landed. When the tablet
   * supplies BOTH a stable tablet_id and a monotonic per-tablet local_seq_no, a
   * network-retry re-submit carries the same pair, so a matching persisted row means
   * "this mutation already applied" — the caller must return an idempotent success
   * WITHOUT re-inserting, re-bumping any count, re-crediting stock, or re-dispatching
   * any command (the key correctness point). Missing either key = returns false =
   * behave exactly as before. The PARTIAL UNIQUE INDEX (tablet_id, local_seq_no)
   * WHERE both NOT NULL is the race backstop if two retries slip past the probe.
   * Table is a fixed literal union (never user input) so each branch stays a static,
   * fully-parameterised sql template (Rule B — no sql.raw on a variable).
   */
  private async isDuplicateTabletSubmit(
    table: 'downtime_events' | 'inline_qc_checks' | 'material_movements',
    tabletId: string | undefined,
    localSeqNo: number | undefined,
  ): Promise<boolean> {
    if (tabletId == null || localSeqNo == null) return false;
    let probe;
    if (table === 'downtime_events') {
      probe = sql`SELECT 1 FROM downtime_events WHERE tablet_id = ${tabletId} AND local_seq_no = ${localSeqNo} LIMIT 1`;
    } else if (table === 'inline_qc_checks') {
      probe = sql`SELECT 1 FROM inline_qc_checks WHERE tablet_id = ${tabletId} AND local_seq_no = ${localSeqNo} LIMIT 1`;
    } else {
      probe = sql`SELECT 1 FROM material_movements WHERE tablet_id = ${tabletId} AND local_seq_no = ${localSeqNo} LIMIT 1`;
    }
    const rows = ((await db.execute(probe)) as Rows).rows ?? [];
    return Array.isArray(rows) && rows.length > 0;
  }

  /**
   * 3.6 MES stage-tracking — appends a stage-transition row to the canonical
   * `audit_logs` table (same append-only mechanism HR's create/save-employee
   * handlers use — no new table, Q-35). Mirrors
   * MesShiftsStatsRepository.logStageTransition (pause/resume) so a session's
   * full START→PAUSE→RESUME→STOP history is queryable from one place:
   *   SELECT * FROM audit_logs WHERE table_name = 'production_sessions'
   *     AND record_id = '<sessionId>' ORDER BY created_at;
   * Best-effort: a logging failure must never fail the floor operator's
   * start/stop action, so errors are caught and logged, not thrown.
   */
  private async logStageTransition(
    sessionId: number,
    action: string,
    fromStage: string | null,
    toStage: string,
    reason: string | null,
  ): Promise<void> {
    try {
      await db.execute(sql`
        INSERT INTO audit_logs (id, table_name, record_id, action, old_values, new_values, reason, created_at)
        VALUES (
          gen_random_uuid()::text,
          'production_sessions',
          ${String(sessionId)},
          ${action},
          ${JSON.stringify({ stage: fromStage })}::jsonb,
          ${JSON.stringify({ stage: toStage || null })}::jsonb,
          ${reason},
          NOW()
        )
      `);
    } catch (err) {
      this.logger.error(`[IoT] logStageTransition failed (sessionId=${sessionId} action=${action}): ${String(err)}`);
    }
  }

  /**
   * Credits a returned-from-production quantity back onto the material's home
   * warehouse (`material_cards.warehouse_id`) — canonical `warehouse_stock` upsert +
   * `material_cards.current_stock` mirror, same two writes `WarehouseConfigService
   * .receiveStock` performs for a manual kirim. If the material has no home warehouse
   * configured, the stock write is skipped (logged) — the audit row above is still kept.
   *
   * C-CORRECTNESS-5.3 (2026-07-07): the warehouse_stock write used to be a
   * SELECT/UPDATE-else-INSERT — TOCTOU-prone under concurrent returns for the same
   * (warehouseId, materialId) pair (two requests can both miss the UPDATE and both
   * INSERT, or race between the UPDATE and a concurrent INSERT). Collapsed into a
   * single atomic `INSERT ... ON CONFLICT (warehouse_id, material_id) DO UPDATE`,
   * the same established upsert shape as `execReceiveFg` (queries-wms.ts) and
   * `upsertWarehouseStock` (pos-wms-sync.helpers.ts) — both rely on the
   * `warehouse_stock_wh_mat_uniq` UNIQUE(warehouse_id, material_id) index. The
   * increment formula (quantity/available_quantity both += quantity,
   * last_movement_at/last_updated_at touched) is preserved exactly from the
   * original UPDATE branch; the original INSERT branch's column list/defaults
   * (reserved_quantity=0) are preserved as the ON CONFLICT's initial-insert values.
   */
  private async creditReturnedMaterialToStock(materialId: number, quantity: number, sessionId: number): Promise<void> {
    try {
      const matRows = ((await db.execute(sql`
        SELECT warehouse_id FROM material_cards WHERE id = ${materialId}
      `)) as Rows).rows ?? [];
      const warehouseId = matRows[0] ? Number((matRows[0] as Record<string, unknown>).warehouse_id) : null;
      if (!warehouseId) {
        this.logger.warn(
          `[IoT] Material return: materialId=${materialId} sessionId=${sessionId} — warehouse_id yo'q, warehouse_stock yozilmadi`,
        );
        return;
      }

      await db.execute(sql`
        INSERT INTO warehouse_stock
          (warehouse_id, material_id, quantity, reserved_quantity, available_quantity, last_updated_at, created_at, last_movement_at)
        VALUES
          (${warehouseId}, ${materialId}, ${quantity}, 0, ${quantity}, NOW(), NOW(), NOW())
        ON CONFLICT (warehouse_id, material_id)
        DO UPDATE SET
          quantity            = warehouse_stock.quantity + ${quantity},
          available_quantity  = warehouse_stock.available_quantity + ${quantity},
          last_movement_at    = NOW(),
          last_updated_at     = NOW()
      `);

      await db.execute(sql`
        UPDATE material_cards SET current_stock = COALESCE(current_stock, 0) + ${quantity} WHERE id = ${materialId}
      `);

      this.logger.log(
        `[IoT] Material return: sessionId=${sessionId} materialId=${materialId} +${quantity} → warehouse #${warehouseId} (warehouse_stock+material_cards.current_stock)`,
      );
    } catch (err) {
      this.logger.error(`[IoT] creditReturnedMaterialToStock failed (sessionId=${sessionId} materialId=${materialId}): ${String(err)}`);
    }
  }

  @ApiOperation({ summary: 'Submit inline QC check (bridges to qc_defects when defectCount > 0)' })
  @ApiResponse({ status: 201, description: 'OK' })
  @Post('production-sessions/:id/inline-qc')
  @Public()
  @UseGuards(TabletTokenGuard)
  async submitInlineQc(@Param('id') id: string, @Body() body: unknown) {
    const dto = InlineQcSchema.parse(body ?? {});
    const sessionId = parseInt(id, 10);
    // VISION-3340 #38 (idempotency): a re-submitted inline-QC check carrying the same
    // (tablet_id, local_seq_no) must NOT insert a second inline_qc_checks row or
    // re-dispatch the QC ReportDefectCommand. Return an idempotent success instead.
    if (await this.isDuplicateTabletSubmit('inline_qc_checks', dto.tabletId, dto.localSeqNo)) {
      return { data: null, qcDefectId: null, idempotent: true };
    }
    const passRate = dto.passRate ??
      (dto.sampleSize > 0 ? Math.round((dto.sampleSize - dto.defectCount) / dto.sampleSize * 100) : 100);
    const r = await db.execute(sql`
      INSERT INTO inline_qc_checks (session_id, sample_size, defect_count, pass_rate, notes, checked_at, tablet_id, local_seq_no)
      VALUES (${sessionId}, ${dto.sampleSize}, ${dto.defectCount}, ${passRate}, ${dto.notes ?? null}, NOW(), ${dto.tabletId ?? null}, ${dto.localSeqNo ?? null})
      RETURNING *
    `);
    const row = ((r as Rows).rows ?? [])[0] ?? {};

    // SB0357 (IoT-08): same QC bridge as reportProductionDefect — an inline QC
    // check that finds defects is a real quality event and must reach
    // qc_defects, not stay siloed in inline_qc_checks (which no QC controller
    // reads — see grep confirmation in the commit note). Only bridges when
    // defects are actually found; a clean check has nothing for QC to review.
    let qcDefectId: string | null = null;
    if (dto.defectCount > 0) {
      try {
        const workerRows = ((await db.execute(sql`
          SELECT worker_id FROM production_sessions WHERE id = ${sessionId}
        `)) as Rows).rows ?? [];
        const workerId = (workerRows[0] as Record<string, unknown> | undefined)?.worker_id;
        const reportedBy = workerId != null ? String(workerId) : `session:${sessionId}`;
        const severity = passRate < IOT_INLINE_QC_MAJOR_DEFECT_THRESHOLD_PCT ? DefectSeverity.MAJOR : DefectSeverity.MINOR;

        const qcResult = await this.commandBus.execute(
          new ReportDefectCommand(
            null,
            null,
            null,
            'IOT_INLINE_QC_DEFECT',
            dto.notes ?? `Inline QC: ${dto.defectCount}/${dto.sampleSize} nuqsonli (pass rate ${passRate}%, session #${sessionId})`,
            severity,
            dto.defectCount,
            'pcs',
            reportedBy,
          ),
        );
        if (qcResult && (qcResult as { ok?: boolean; data?: { id?: string } }).ok) {
          qcDefectId = (qcResult as { data?: { id?: string } }).data?.id ?? null;
        }
      } catch (err) {
        this.logger.error(`[IoT] submitInlineQc: QC bridge failed (sessionId=${sessionId}): ${String(err)}`);
      }
    }

    return { data: row, qcDefectId };
  }

  // -- Downtime events ---------------------------------------------------------

  @ApiOperation({ summary: 'Report manual downtime event (POST /api/iot/downtime-events)' })
  @ApiResponse({ status: 201, description: 'Created' })
  @Post('downtime-events')
  @Public()
  @UseGuards(TabletTokenGuard)
  async reportDowntimeEvent(@Body() body: unknown) {
    const dto = DowntimeEventSchema.parse(body ?? {});
    const durationSeconds = dto.durationMinutes * 60;

    // VISION-3340 #44 (08-mes#10): when the operator picked a reason from the LIVE
    // mes_downtime_reasons list, resolve that row so downtime_events.reason_code_id
    // is populated (root-cause stats group by it) and reason_code stays consistent
    // with the catalog code. When reasonId is absent OR does not resolve, fall back
    // to the free-text reason_code with reason_code_id NULL — pre-existing behaviour.
    let reasonCodeId: number | null = null;
    let reasonCode: string = dto.reasonCode;
    if (dto.reasonId != null) {
      const reasonRows = ((await db.execute(sql`
        SELECT id, code FROM mes_downtime_reasons WHERE id = ${dto.reasonId} LIMIT 1
      `)) as Rows).rows ?? [];
      const reasonRow = reasonRows[0] as { id?: unknown; code?: unknown } | undefined;
      if (reasonRow) {
        reasonCodeId = Number(reasonRow.id);
        if (typeof reasonRow.code === 'string' && reasonRow.code.length > 0) {
          reasonCode = reasonRow.code;
        }
      }
    }

    const r = await db.execute(sql`
      INSERT INTO downtime_events (
        session_id, event_type,
        started_at, ended_at,
        duration_seconds, duration_minutes,
        reason_code, reason_code_id, is_planned,
        notes, created_at
      ) VALUES (
        ${dto.sessionId},
        ${dto.eventType},
        NOW() - (${dto.durationMinutes} * INTERVAL '1 minute'),
        NOW(),
        ${durationSeconds},
        ${dto.durationMinutes},
        ${reasonCode},
        ${reasonCodeId},
        false,
        ${dto.notes ?? null},
        NOW()
      ) RETURNING *
    `);
    const row = ((r as Rows).rows ?? [])[0] ?? {};
    return { data: row };
  }
}
