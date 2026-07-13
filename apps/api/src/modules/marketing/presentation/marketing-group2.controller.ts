/**
 * @module marketing-group2.controller
 * @description Marketing GURUH 2 real endpoints:
 *   blog, budget, calendar, competitors, lead-contacts.
 *
 * Replaces the corresponding stub handlers from
 * marketing-analytics-stubs.controller.ts.
 *
 * Rule 3: All @Body() validated with Zod.
 * Rule 6: Controller delegates to service; no business logic here.
 * Rule 10: No fake responses — every endpoint queries the DB.
 */

import {
  Controller, Get, Post, Patch, Put, Delete,
  Param, Body, Query,
  UseGuards, Logger, HttpCode, HttpStatus, HttpException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { I18nService } from 'nestjs-i18n';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { unwrapOrThrow, unwrapOrBadRequest } from '@common/http-result';
import { z } from 'zod';
import { MarketingGroup2Service } from '../application/marketing-group2.service';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';
type Rows = { rows?: unknown[] };

// ── Zod schemas ───────────────────────────────────────────────────────────────

const CreateBlogPostSchema = z.object({
  titleUz: z.string().min(3).max(500),
  titleRu: z.string().max(500).optional(),
  slug: z.string().min(3).max(200).optional(),
  bodyUz: z.string().optional(),
  bodyRu: z.string().optional(),
  excerpt: z.string().optional(),
  coverImage: z.string().max(2000).optional(),
  tags: z.array(z.string()).optional(),
  seoTitle: z.string().max(255).optional(),
  seoDescription: z.string().optional(),
  authorId: z.string().optional(),
}).strict();

const UpdateBlogPostSchema = CreateBlogPostSchema.partial();

const CreateBudgetLineSchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12).optional(),
  category: z.string().min(2).max(50),
  name: z.string().max(500).optional(),
  plannedAmount: z.coerce.number().min(0).optional().default(0),
  actualAmount: z.coerce.number().min(0).optional().default(0),
  description: z.string().max(500).optional(),
  notes: z.string().max(500).optional(),
}).strict();

const UpdateBudgetLineSchema = CreateBudgetLineSchema.partial();

const CreateCalendarEventSchema = z.object({
  title: z.string().min(2).max(500),
  eventType: z.enum(['campaign', 'meeting', 'deadline', 'exhibition']).optional().default('campaign'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD format kerak'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  description: z.string().optional(),
  status: z.enum(['planned', 'ongoing', 'completed', 'cancelled']).optional().default('planned'),
}).strict();

const CreateLeadContactSchema = z.object({
  type: z.enum(['call', 'meeting', 'email', 'whatsapp', 'telegram']),
  summary: z.string().optional(),
  outcome: z.enum(['interested', 'not_interested', 'callback', 'no_answer', 'converted']).optional(),
  contactedBy: z.string().optional(),
  nextFollowUp: z.string().datetime({ offset: true }).optional(),
}).strict();

const PapkaLookupSchema = z.object({
  papkaNo: z.string().min(1).max(50),
}).strict();

// ─────────────────────────────────────────────────────────────────────────────

@ApiTags('§17 Marketing GURUH 2')
@ApiBearerAuth()
@ApiThrottle()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('marketing')
@Roles('super_admin', 'director', 'manager')
export class MarketingGroup2Controller {
  private readonly logger = new Logger(MarketingGroup2Controller.name);

  constructor(
    private readonly svc: MarketingGroup2Service,
    private readonly i18n: I18nService,
  ) {}

  // ── Blog ──────────────────────────────────────────────────────────────────

  @Get('website/blog')
  @Roles('super_admin', 'marketing_manager', 'director')
  @ApiOperation({ summary: "Blog postlar ro'yxati (limit/offset, status filter)" })
  async getBlogPosts(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('status') status?: string,
  ) {
    const result = await this.svc.getBlogPosts({
      limit: limit ? Number(limit) : 20,
      offset: offset ? Number(offset) : 0,
      status,
    });
    return unwrapOrThrow(result);
  }

  @Post('website/blog')
  @Roles('super_admin', 'marketing_manager')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Blog post yaratish' })
  async createBlogPost(@Body() body: unknown) {
    const dto = CreateBlogPostSchema.parse(body);
    const result = await this.svc.createBlogPost(dto as Record<string, unknown>);
    return unwrapOrThrow(result);
  }

  @Patch('website/blog/:id')
  @Roles('super_admin', 'marketing_manager')
  @ApiOperation({ summary: "Blog post yangilash" })
  async updateBlogPost(@Param('id') id: string, @Body() body: unknown) {
    const dto = UpdateBlogPostSchema.parse(body);
    const result = await this.svc.updateBlogPost(id, dto as Record<string, unknown>);
    return unwrapOrThrow(result);
  }

  @Post('website/blog/:id/publish')
  @Roles('super_admin', 'marketing_manager')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Blog post nashr qilish (status = published)" })
  async publishBlogPost(@Param('id') id: string) {
    const result = await this.svc.publishBlogPost(id);
    return unwrapOrThrow(result);
  }

  @Delete('website/blog/:id')
  @Roles('super_admin', 'marketing_manager')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Blog post o'chirish" })
  async deleteBlogPost(@Param('id') id: string) {
    const result = await this.svc.deleteBlogPost(id);
    return unwrapOrThrow(result);
  }

  // ── Budget ────────────────────────────────────────────────────────────────

  @Get('budget')
  @Roles('super_admin', 'marketing_manager', 'director')
  @ApiOperation({ summary: "Marketing byudjet ro'yxati (year, month filter)" })
  async getBudget(
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    const result = await this.svc.getBudgetLines({
      year: year ? Number(year) : undefined,
      month: month ? Number(month) : undefined,
    });
    return unwrapOrThrow(result);
  }

  @Get('budget/:id')
  @Roles('super_admin', 'marketing_manager', 'director')
  @ApiOperation({ summary: 'Byudjet qatori tafsiloti' })
  async getBudgetById(@Param('id') id: string) {
    const result = await this.svc.getBudgetLineById(id);
    return unwrapOrThrow(result);
  }

  @Post('budget')
  @Roles('super_admin', 'marketing_manager')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Yangi byudjet qatori yaratish' })
  async createBudget(@Body() body: unknown) {
    const dto = CreateBudgetLineSchema.parse(body);
    const result = await this.svc.createBudgetLine(dto as unknown as Record<string, unknown>);
    return unwrapOrThrow(result);
  }

  @Put('budget/:id')
  @Roles('super_admin', 'marketing_manager')
  @ApiOperation({ summary: "Byudjet qatorini yangilash" })
  async updateBudget(@Param('id') id: string, @Body() body: unknown) {
    const dto = UpdateBudgetLineSchema.parse(body);
    const result = await this.svc.updateBudgetLine(id, dto as unknown as Record<string, unknown>);
    return unwrapOrThrow(result);
  }

  @Delete('budget/:id')
  @Roles('super_admin', 'marketing_manager')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Byudjet qatorini o\'chirish' })
  async deleteBudget(@Param('id') id: string) {
    await db.execute(sql`DELETE FROM marketing_budget_items WHERE id=${id}`);
    return { id, deleted: true };
  }

  // ── Calendar ──────────────────────────────────────────────────────────────

  @Get('calendar')
  @Roles('super_admin', 'marketing_manager', 'director')
  @ApiOperation({ summary: "Marketing taqvim tadbirlari (from/to filter)" })
  async getCalendar(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const result = await this.svc.getCalendarEvents({ from, to });
    return unwrapOrThrow(result);
  }

  @Get('calendar/:id')
  @Roles('super_admin', 'marketing_manager', 'director')
  @ApiOperation({ summary: 'Taqvim tadbiri tafsiloti' })
  async getCalendarById(@Param('id') id: string) {
    const result = await this.svc.getCalendarEventById(Number(id));
    return unwrapOrThrow(result);
  }

  @Post('calendar')
  @Roles('super_admin', 'marketing_manager')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Yangi taqvim tadbiri yaratish' })
  async createCalendarEvent(@Body() body: unknown) {
    const dto = CreateCalendarEventSchema.parse(body);
    const result = await this.svc.createCalendarEvent(dto as unknown as Record<string, unknown>);
    return unwrapOrThrow(result);
  }

  @Patch('calendar/:id')
  @Roles('super_admin', 'marketing_manager')
  @ApiOperation({ summary: 'Taqvim tadbirini yangilash' })
  async updateCalendarEvent(@Param('id') id: string, @Body() body: unknown) {
    const dto = z.object({
      title: z.string().max(500).optional(),
      event_type: z.string().max(100).optional(),
      start_date: z.string().optional(),
      end_date: z.string().optional(),
      description: z.string().max(2000).optional(),
      status: z.string().max(50).optional(),
    }).passthrough().parse(body);
    const r = await db.execute(sql`
      UPDATE marketing_calendar_events SET
        title       = COALESCE(${dto.title ?? null}, title),
        event_type  = COALESCE(${dto.event_type ?? null}, event_type),
        start_date  = COALESCE(${dto.start_date ?? null}::date, start_date),
        end_date    = COALESCE(${dto.end_date ?? null}::date, end_date),
        description = COALESCE(${dto.description ?? null}, description),
        status      = COALESCE(${dto.status ?? null}, status)
      WHERE id = ${parseInt(id, 10)}
      RETURNING *
    `);
    const row = ((r as Rows).rows ?? [])[0] ?? null;
    if (!row) throw new HttpException(await this.i18n.t('errors.calendarEventNotFoundWithId', { args: { id } }), 404);
    return { data: row };
  }

  @Delete('calendar/:id')
  @Roles('super_admin', 'marketing_manager')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Taqvim tadbirini o\'chirish' })
  async deleteCalendarEvent(@Param('id') id: string) {
    await db.execute(sql`DELETE FROM marketing_calendar_events WHERE id = ${parseInt(id, 10)}`);
    return { id, deleted: true };
  }

  // ── Papka repeat lookup (Item 14-75) ──────────────────────────────────────

  @Get('papka-lookup')
  @Roles('super_admin', 'marketing_manager', 'director', 'sales_manager')
  @ApiOperation({ summary: "Papka № (PT/KT/E) → bog'langan buyurtmani topish ('takror qil' uchun)" })
  async lookupPapka(@Query('papkaNo') papkaNo?: string) {
    const dto = PapkaLookupSchema.parse({ papkaNo });
    const result = await this.svc.resolvePapkaOrder(dto.papkaNo);
    return unwrapOrThrow(result);
  }

  // ── Competitors ───────────────────────────────────────────────────────────

  @Get('competitors')
  @Roles('super_admin', 'marketing_manager', 'director')
  @ApiOperation({ summary: "Raqiblar tahlili (sd_customer_competitors dan GROUP BY)" })
  async getCompetitors() {
    const result = await this.svc.getCompetitors();
    return unwrapOrBadRequest(result);
  }

  // ── Design workload (kanban yuki) ───────────────────────────────────────────

  @Get('design-workload')
  @Roles('super_admin', 'marketing_manager', 'director')
  @ApiOperation({ summary: "Dizayn bandligi (kanban yuki) — ustun bo'yicha jonli karta soni; va'da berishdan oldin ko'riladi" })
  async getDesignWorkload() {
    const result = await this.svc.getDesignWorkload();
    return unwrapOrThrow(result);
  }

  // ── Lead Contacts ─────────────────────────────────────────────────────────

  @Get('leads/:id/contacts')
  @Roles('super_admin', 'marketing_manager', 'director', 'sales_manager')
  @ApiOperation({ summary: "Lead aloqalar tarixi" })
  async getLeadContacts(@Param('id') id: string) {
    const result = await this.svc.getLeadContacts(id);
    return unwrapOrThrow(result);
  }

  @Post('leads/:id/contacts')
  @Roles('super_admin', 'marketing_manager', 'director', 'sales_manager')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Lead uchun yangi aloqa qo'shish" })
  async createLeadContact(@Param('id') id: string, @Body() body: unknown) {
    const dto = CreateLeadContactSchema.parse(body);
    const result = await this.svc.createLeadContact(id, dto as Record<string, unknown>);
    return unwrapOrThrow(result);
  }

  @Delete('leads/:id')
  @Roles('super_admin', 'marketing_manager', 'director')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Lead soft delete (deletedAt to'ldiriladi)" })
  async deleteLead(@Param('id') id: string) {
    const result = await this.svc.softDeleteLead(id);
    return unwrapOrThrow(result);
  }
}
