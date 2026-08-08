/**
 * @module card.controller
 * @description HTTP routes for the canonical ORG CARD (`org_functions`) CRUD lifecycle.
 *   Extends the org-structure module (does not rewrite it). Zod-validated, Result-unwrapped.
 *   EP-ORG-001 (create) · 004 (read) · 005 (soft-delete) · 002 (atomic can-assign).
 */

import {
  Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put, Query,
  UseGuards, UseInterceptors, Logger,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@common/types/user.types';
import { unwrapOrThrow, unwrapOrInternal } from '@common/http-result';
import { z } from 'zod';
import { CardService } from './card.service';
import type { CardInput } from './card.repository';

const CardCreateSchema = z.object({
  positionName:           z.string().min(1).max(500),
  positionNameRu:         z.string().max(500).optional(),
  departmentId:           z.number().int().optional(),
  code:                   z.string().max(50).optional(),
  level:                  z.number().int().optional(),
  razryadLevelId:         z.number().int().optional(),
  salaryType:             z.enum(['ishbay', 'soatbay', 'oylik']).optional(),
  minSalary:              z.number().optional(),
  maxSalary:              z.number().optional(),
  rbacTier:               z.string().max(50).optional(),
  status:                 z.enum(['active', 'frozen', 'vacant', 'archived', 'io']).optional(),
  tskp:                   z.string().max(2000).optional(),
  tskpTarget:             z.string().max(500).optional(),
  tskpMeasurementUnit:    z.enum(['SON', 'FOIZ', 'VAQT']).optional(),
  statisticsType:         z.string().max(50).optional(),
  aiExamEnabled:          z.boolean().optional(),
  functionDescription:    z.string().max(5000).optional(),
  functionDescriptionRu:  z.string().max(5000).optional(),
}).strict();

const CardUpdateSchema = CardCreateSchema.partial();

const AssignSchema = z.object({
  employeeId:       z.number().int().positive(),
  isPrimary:        z.boolean().optional(),
  isActing:         z.boolean().optional(),
  actingSupplement: z.number().nonnegative().optional(),
  endedAt:          z.string().optional(),
}).strict();

/**
 * Card Portret body. Permissive structured object stored as `portret_data` jsonb:
 * ЦКП / talablar / razryad / kutilmalar / KPI + any further keys. Accept the wrapped
 * `{ portret_data: {...} }` shape OR a bare object; both normalise to a single jsonb object.
 */
const CardPortretSchema = z.union([
  z.object({ portret_data: z.record(z.unknown()) }).passthrough(),
  z.record(z.unknown()),
]);

/**
 * FAZA-09 muzlatish: sabab MAJBURIY (VISION-3340 #24 — sezgir karta-holat o'zgarishi
 * sababsiz qabul qilinmaydi, min 3 belgi) + muddat (ISO sana/timestamp yoki null, ixtiyoriy).
 */
const CardFreezeSchema = z.object({
  reason: z.string().min(3).max(2000),
  until:  z.union([z.string().max(40), z.null()]).optional(),
}).strict();

/** "Kerakli jihozlar" (required equipment) — one equipment-name string per add/remove call. */
const EquipmentItemSchema = z.object({
  item: z.string().min(1).max(300),
}).strict();

/** EP-ORG-064 "Ikki kartani birlashtirish" — :id = primary (survivor), body names the secondary. */
const CardMergeSchema = z.object({
  secondaryCardId: z.number().int().positive(),
}).strict();

/** EP-ORG-065 "Bitta kartani ikkiga bo'lish" — :id = source card, two brand-new card definitions. */
const CardSplitSchema = z.object({
  cardA: CardCreateSchema,
  cardB: CardCreateSchema,
}).strict();

@Roles('admin', 'manager', 'hr_manager', 'director', 'super_admin')
@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard)
@ApiTags('Org Cards')
@ApiBearerAuth()
@Controller('org-structure/cards')
export class CardController {
  private readonly logger = new Logger(CardController.name);
  constructor(private readonly service: CardService) {}

  @ApiOperation({ summary: 'List cards' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get()
  async list(
    @Query('departmentId') departmentId?: string,
    @Query('status') status?: string,
  ) {
    const dep = departmentId ? parseInt(departmentId, 10) : null;
    const data = unwrapOrInternal(
      await this.service.list(dep !== null && Number.isFinite(dep) ? dep : null, status ?? null),
    );
    const items = Array.isArray(data) ? data : [];
    return { items, total: items.length };
  }

  @ApiOperation({ summary: 'Get card by id' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrThrow(await this.service.findById(id));
  }

  @ApiOperation({ summary: 'Check if a card can take another active employee (EP-ORG-002)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get(':id/can-assign')
  async canAssign(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrThrow(await this.service.canAssignEmployee(id));
  }

  // ─── Card-level Portret (org_node_portret, card_id-keyed) ────────────────────

  @ApiOperation({ summary: "Get a card's portret (ЦКП/talablar/razryad/kutilmalar). Null when unfilled." })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get(':id/portret')
  async getPortret(@Param('id', ParseIntPipe) id: number) {
    const data = unwrapOrInternal(await this.service.getCardPortret(id));
    return { portret: data ?? null };
  }

  @ApiOperation({ summary: "Save a card's portret (upsert portret_data jsonb)" })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Put(':id/portret')
  async savePortret(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const parsed = CardPortretSchema.parse(body) as Record<string, unknown>;
    const portretData = (parsed.portret_data && typeof parsed.portret_data === 'object'
      ? parsed.portret_data
      : parsed) as Record<string, unknown>;
    const creatorId = user?.id ?? user?.sub ?? null;
    const data = unwrapOrThrow(await this.service.saveCardPortret(id, portretData, creatorId));
    return { portret: data };
  }

  // ─── Kerakli jihozlar (required equipment per card, 2026-07-13) ────────────

  @ApiOperation({ summary: "Card's required equipment (Kerakli jihozlar)" })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get(':id/equipment')
  async equipment(@Param('id', ParseIntPipe) id: number) {
    const data = unwrapOrInternal(await this.service.listRequiredEquipment(id));
    const items = Array.isArray(data) ? data : [];
    return { items, total: items.length };
  }

  @ApiOperation({ summary: 'Add a required-equipment item' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Post(':id/equipment')
  async addEquipment(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    const dto = EquipmentItemSchema.parse(body);
    const data = unwrapOrThrow(await this.service.addRequiredEquipmentItem(id, dto.item));
    const items = Array.isArray(data) ? data : [];
    return { items, total: items.length };
  }

  @ApiOperation({ summary: 'Remove a required-equipment item' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Delete(':id/equipment')
  async removeEquipment(@Param('id', ParseIntPipe) id: number, @Query('item') item: string) {
    const parsed = z.string().min(1).max(300).parse(item);
    const data = unwrapOrThrow(await this.service.removeRequiredEquipmentItem(id, parsed));
    const items = Array.isArray(data) ? data : [];
    return { items, total: items.length };
  }

  // ─── Phase 5 card-detail tabs (read-only) ──────────────────────────────────

  @ApiOperation({ summary: 'Card employees (Xodimlar tab)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get(':id/employees')
  async employees(@Param('id', ParseIntPipe) id: number) {
    const data = unwrapOrInternal(await this.service.listEmployees(id));
    const items = Array.isArray(data) ? data : [];
    return { items, total: items.length };
  }

  @ApiOperation({ summary: 'Card↔employee fit score (deterministic v1 — vizyon: karta baholaydi)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get(':id/fit')
  async fit(@Param('id', ParseIntPipe) id: number) {
    const data = unwrapOrInternal(await this.service.computeCardFit(id));
    const items = Array.isArray(data) ? data : [];
    return { items, total: items.length };
  }

  @ApiOperation({ summary: 'Manager candidates (vertical hierarchy — excludes self + descendants)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get(':id/manager-candidates')
  async managerCandidates(@Param('id', ParseIntPipe) id: number) {
    const data = unwrapOrInternal(await this.service.listManagerCandidates(id));
    const items = Array.isArray(data) ? data : [];
    return { items, total: items.length };
  }

  @ApiOperation({ summary: "Set the card's manager (Vysotskiy 7 vertical chain; cycle-guarded)" })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Self/cycle rejected' })
  @Patch(':id/manager')
  async setManager(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    const dto = z.object({ managerId: z.number().int().positive().nullable() }).parse(body);
    return unwrapOrThrow(await this.service.setCardManager(id, dto.managerId));
  }

  @ApiOperation({ summary: 'Child cards (Farzandlar tab)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get(':id/children')
  async children(@Param('id', ParseIntPipe) id: number) {
    const data = unwrapOrInternal(await this.service.listChildren(id));
    const items = Array.isArray(data) ? data : [];
    return { items, total: items.length };
  }

  @ApiOperation({ summary: 'Card vacancies (Vakant tab)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get(':id/vacancies')
  async vacancies(@Param('id', ParseIntPipe) id: number) {
    const data = unwrapOrInternal(await this.service.listVacancies(id));
    const items = Array.isArray(data) ? data : [];
    return { items, total: items.length };
  }

  @ApiOperation({ summary: 'Card change history (Tarix tab)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get(':id/history')
  async history(@Param('id', ParseIntPipe) id: number) {
    const data = unwrapOrInternal(await this.service.listHistory(id));
    const items = Array.isArray(data) ? data : [];
    return { items, total: items.length };
  }

  // ─── Phase 6 employee↔card M:N + FORMULA A salary ──────────────────────────

  @ApiOperation({ summary: "An employee's cards + FORMULA-A total salary (EP-ORG-142)" })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('by-employee/:employeeId')
  async byEmployee(@Param('employeeId', ParseIntPipe) employeeId: number) {
    return unwrapOrThrow(await this.service.listEmployeeCards(employeeId));
  }

  @ApiOperation({ summary: 'Assign an employee to a card (atomic guard EP-ORG-002)' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 409, description: 'Card already occupied' })
  @Post(':id/assign')
  async assign(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    const dto = AssignSchema.parse(body);
    return unwrapOrThrow(await this.service.assignEmployeeToCard(
      id, dto.employeeId, dto.isPrimary ?? false,
      dto.isActing ?? false, dto.actingSupplement ?? null, dto.endedAt ?? null,
    ));
  }

  @ApiOperation({ summary: 'Unassign an employee from a card (soft)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Link not found' })
  @Delete(':id/assign/:employeeId')
  async unassign(
    @Param('id', ParseIntPipe) id: number,
    @Param('employeeId', ParseIntPipe) employeeId: number,
  ) {
    return unwrapOrThrow(await this.service.unassignEmployeeFromCard(id, employeeId));
  }

  @ApiOperation({ summary: "Card occupants' certificates + 30-day expiry (EP-ORG-047)" })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get(':id/certificates')
  async certificates(@Param('id', ParseIntPipe) id: number) {
    const data = unwrapOrInternal(await this.service.listCertificates(id));
    const items = Array.isArray(data) ? data : [];
    return { items, total: items.length };
  }

  @ApiOperation({ summary: 'Mark card reviewed now — resets the 1-year staleness clock (EP-ORG-137)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch(':id/review')
  async review(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrThrow(await this.service.markReviewed(id));
  }

  // ─── FAZA-09 karta 5-holat lifecycle: muzlatish / eritish (EP-ORG-084/086) ───

  @ApiOperation({ summary: 'Freeze card (active/io/vacant → frozen) — reason + until (EP-ORG-084)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found or archived' })
  @Patch(':id/freeze')
  async freeze(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    const dto = CardFreezeSchema.parse(body);
    return unwrapOrThrow(await this.service.freezeCard(id, dto.reason ?? null, dto.until ?? null));
  }

  @ApiOperation({ summary: 'Thaw card (frozen → active) — clears freeze meta (EP-ORG-086)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 409, description: 'Card is not frozen' })
  @Patch(':id/thaw')
  async thaw(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrThrow(await this.service.thawCard(id));
  }

  @ApiOperation({ summary: 'Make card vacant (active/frozen/io → vacant) — owner left (EP-ORG-085)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 409, description: 'Card is archived' })
  @Patch(':id/vacant')
  async vacant(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrThrow(await this.service.setVacantCard(id));
  }

  @ApiOperation({ summary: 'Restore archived card (archived → active) — undo soft-delete (EP-ORG-087)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 409, description: 'Card is not archived' })
  @Patch(':id/restore')
  async restore(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrThrow(await this.service.restoreCard(id));
  }

  // ─── EP-ORG-064 (merge) / EP-ORG-065 (split) ─────────────────────────────────
  // Tavsiya A, docs/audit/decisions/01-org-kartalar.md:460-472 — Holat OCHIQ (final owner
  // sign-off pending); implemented per the recorded recommendation so the endpoints exist
  // meanwhile (2026-08-04 discovery-sweep item "Karta Merge/Split endpointlari umuman yo'q").

  @ApiOperation({ summary: "Merge two cards (EP-ORG-064) — :id survives, secondary's history moves in + is archived" })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'primary === secondary' })
  @ApiResponse({ status: 404, description: 'Either card not found / not live' })
  @Post(':id/merge')
  async merge(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    const dto = CardMergeSchema.parse(body);
    return unwrapOrThrow(await this.service.mergeCards(id, dto.secondaryCardId));
  }

  @ApiOperation({ summary: "Split a card in two (EP-ORG-065) — :id is archived, two new cards link back via split_from_id" })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Source card not found / not live' })
  @Post(':id/split')
  async split(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    const dto = CardSplitSchema.parse(body);
    return unwrapOrThrow(await this.service.splitCard(id, dto.cardA as CardInput, dto.cardB as CardInput));
  }

  @ApiOperation({ summary: "User's card-gate: card-derived RBAC tier + salary eligibility (EP-ORG-003)" })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('gate/by-user/:userId')
  async gate(@Param('userId', ParseIntPipe) userId: number) {
    return unwrapOrThrow(await this.service.resolveGate(userId));
  }

  @ApiOperation({ summary: 'Create card' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post()
  async create(@Body() body: unknown) {
    const dto = CardCreateSchema.parse(body) as CardInput;
    this.logger.log('Creating org card');
    return unwrapOrThrow(await this.service.create(dto));
  }

  @ApiOperation({ summary: 'Update card' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    const dto = CardUpdateSchema.parse(body) as CardInput;
    return unwrapOrThrow(await this.service.update(id, dto));
  }

  @ApiOperation({ summary: 'Soft-delete (archive) card' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrThrow(await this.service.softDelete(id));
  }
}
