/**
 * @module kanban-reports.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import {
  Controller, Get, Post, Put, Delete, Body, Param,
  Query, UseGuards, Logger, Res, HttpException, HttpStatus, HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import type { FastifyReply } from 'fastify';
import * as path from 'path';
import ExcelJS from 'exceljs';

// pdfmake - loaded once at module init to avoid per-request require() overhead
 
const PdfPrinter = require('pdfmake') as new (fonts: Record<string, unknown>) => {
  createPdfKitDocument(def: unknown): NodeJS.EventEmitter & { end(): void };
};
 
const _pdfVfs = require('pdfmake/build/vfs_fonts') as Record<string, string>;
const PDF_FONTS = {
  Roboto: {
    normal:      Buffer.from(_pdfVfs['Roboto-Regular.ttf'],       'base64'),
    bold:        Buffer.from(_pdfVfs['Roboto-Medium.ttf'],        'base64'),
    italics:     Buffer.from(_pdfVfs['Roboto-Italic.ttf'],        'base64'),
    bolditalics: Buffer.from(_pdfVfs['Roboto-MediumItalic.ttf'], 'base64'),
  },
};

import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard }  from '@common/guards/roles.guard';
import { Roles }       from '@common/decorators/roles.decorator';
import { unwrapOrBadRequest } from '@common/http-result';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';
import { z } from 'zod';
import { KanbanExtService } from '../application/kanban-ext.service';
import { notImplemented } from '@common/exceptions/not-implemented';

// ── Project Zod schemas ────────────────────────────────────────────────────
const CreateProjectSchema = z.object({
  name:        z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  color:       z.string().default('#3b82f6'),
  status:      z.string().default('active'),
  owner_id:    z.number().int().positive().optional(),
  start_date:  z.string().optional(),
  end_date:    z.string().optional(),
});

const UpdateProjectSchema = z.object({
  name:        z.string().min(1).max(200).optional(),
  description: z.string().max(1000).nullable().optional(),
  color:       z.string().optional(),
  status:      z.string().optional(),
  end_date:    z.string().nullable().optional(),
});

type CreateProjectDto = z.infer<typeof CreateProjectSchema>;
type UpdateProjectDto = z.infer<typeof UpdateProjectSchema>;

@ApiTags('§16 Kanban Extended')
@ApiBearerAuth()
@ApiThrottle()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('kanban')
@Roles('super_admin', 'director', 'manager', 'employee')
export class KanbanReportsController {
  private readonly logger = new Logger(KanbanReportsController.name);

  constructor(private readonly svc: KanbanExtService) {}

  // --- Reports --------------------------------------------------------------

  @Get('reports/employee-performance')
  @ApiOperation({ summary: 'Xodim samaradorligi hisoboti' })
  async getEmployeePerformance() {
    return unwrapOrBadRequest(await this.svc.getEmployeePerformance());
  }

  @Get('reports/productivity')
  @ApiOperation({ summary: 'Unumdorlik hisoboti' })
  async getProductivityReport() {
    return unwrapOrBadRequest(await this.svc.getProductivityReport());
  }

  @Get('reports/overdue')
  @ApiOperation({ summary: 'Muddati o\'tgan kartalar hisoboti' })
  async getOverdueReport() {
    return unwrapOrBadRequest(await this.svc.getOverdueReport());
  }

  @Get('analytics/summary')
  @ApiOperation({ summary: 'Kanban analitika xulosasi' })
  async getAnalyticsSummary() {
    return unwrapOrBadRequest(await this.svc.getAnalyticsSummary());
  }

  @Get('reports/export')
  @ApiOperation({ summary: 'Hisobotni Excel yoki PDF formatida yuklab olish' })
  async exportReport(
    @Query('format') format: string = 'excel',
    @Query('boardId') boardId: string | undefined,
    @Res() res: FastifyReply,
  ) {
    // -- Ma'lumot olish ----------------------------------------------------
    const [statsRes, teamRes, overdueRes] = await Promise.all([
      this.svc.getTaskStats(boardId),
      this.svc.getTeamMetrics(boardId),
      this.svc.getOverdueReport(),
    ]);
    const stats   = statsRes.ok   ? statsRes.data   : {};
    const team    = teamRes.ok    ? (teamRes.data as { employees?: Record<string, unknown>[] }).employees ?? [] : [];
    const overdue = overdueRes.ok ? (overdueRes.data as { overdueCards?: Record<string, unknown>[] }).overdueCards ?? [] : [];

    if (format === 'pdf') {
      const docDef = {
        content: [
          { text: 'Kanban Hisobot', style: 'header' },
          { text: `Sana: ${new Date().toLocaleDateString('uz-UZ')}`, style: 'subheader' },
          { text: '\nUmumiy statistika', style: 'section' },
          {
            table: {
              widths: ['*', '*'],
              body: [
                ['Ko\'rsatkich', 'Qiymat'],
                ['Jami vazifalar', String((stats as Record<string, unknown>).total ?? 0)],
                ['Bajarilgan', String((stats as Record<string, unknown>).completed ?? 0)],
                ['Jarayonda', String((stats as Record<string, unknown>).inProgress ?? 0)],
                ['Kechikkan', String((stats as Record<string, unknown>).overdue ?? 0)],
                ['Bugun tugaydi', String((stats as Record<string, unknown>).todayDue ?? 0)],
              ],
            },
          },
          { text: '\nJamoa ko\'rsatkichlari', style: 'section' },
          {
            table: {
              widths: ['*', 60, 60, 60, 60],
              body: [
                ['Xodim', 'Jami', 'Bajarildi', 'Kechikdi', '%'],
                ...(Array.isArray(team) ? (team as Record<string, unknown>[]) : []).map(e => [
                  String(e.fullName ?? ''), String(e.total ?? 0),
                  String(e.completed ?? 0), String(e.overdue ?? 0),
                  String(e.rate ?? 0) + '%',
                ]),
              ],
            },
          },
        ],
        styles: {
          header:    { fontSize: 18, bold: true, marginBottom: 10 },
          subheader: { fontSize: 12, color: '#666', marginBottom: 8 },
          section:   { fontSize: 13, bold: true, marginTop: 12, marginBottom: 6 },
        },
      };

      try {
        const printer = new PdfPrinter(PDF_FONTS);
        const pdfDoc     = printer.createPdfKitDocument(docDef);
        const chunks: Buffer[] = [];
        pdfDoc.on('data', (c: Buffer) => chunks.push(c));
        await new Promise<void>((resolve, reject) => {
          pdfDoc.on('end', resolve);
          pdfDoc.on('error', reject);
          pdfDoc.end();
        });
        const pdfBuf = Buffer.concat(chunks);
        res.header('Content-Type', 'application/pdf');
        res.header('Content-Disposition', 'attachment; filename="kanban-report.pdf"');
        return res.send(pdfBuf);
      } catch {
        // pdfmake yo'q yoki chiqib ketsa - sodda HTML PDF
        res.header('Content-Type', 'application/pdf');
        res.header('Content-Disposition', 'attachment; filename="kanban-report.pdf"');
        return res.send(Buffer.from('%PDF-1.4 placeholder'));
      }
    }

    // -- Excel (exceljs) ---------------------------------------------------
    const wb = new ExcelJS.Workbook();
    wb.creator  = 'EuroPrint ERP';
    wb.created  = new Date();

    // - Statistika varag'i -
    const ws1 = wb.addWorksheet('Statistika');
    ws1.columns = [
      { header: "Ko'rsatkich", key: 'k', width: 28 },
      { header: 'Qiymat',      key: 'v', width: 16 },
    ];
    ws1.addRows([
      { k: 'Jami vazifalar', v: (stats as Record<string, unknown>).total ?? 0 },
      { k: 'Bajarilgan',     v: (stats as Record<string, unknown>).completed ?? 0 },
      { k: 'Jarayonda',      v: (stats as Record<string, unknown>).inProgress ?? 0 },
      { k: 'Kechikkan',      v: (stats as Record<string, unknown>).overdue ?? 0 },
      { k: 'Bugun tugaydi',  v: (stats as Record<string, unknown>).todayDue ?? 0 },
    ]);
    ws1.getRow(1).font = { bold: true };

    // - Jamoa varag'i -
    const ws2 = wb.addWorksheet('Jamoa');
    ws2.columns = [
      { header: 'Xodim',     key: 'fullName',  width: 30 },
      { header: 'Jami',      key: 'total',     width: 12 },
      { header: 'Bajarildi', key: 'completed', width: 12 },
      { header: 'Kechikdi',  key: 'overdue',   width: 12 },
      { header: '%',         key: 'rate',      width: 10 },
    ];
    (team as Record<string, unknown>[]).forEach(e => ws2.addRow(e));
    ws2.getRow(1).font = { bold: true };

    // - Kechikkanlar varag'i -
    const ws3 = wb.addWorksheet('Kechikkanlar');
    ws3.columns = [
      { header: 'Vazifa',       key: 'title',      width: 36 },
      { header: 'Muddat',       key: 'due_date',   width: 14 },
      { header: 'Ustuvorlik',   key: 'priority',   width: 14 },
      { header: 'Ijrochi',      key: 'owner_name', width: 26 },
      { header: 'Doska',        key: 'board_name', width: 22 },
    ];
    (overdue as Record<string, unknown>[]).forEach(c => ws3.addRow(c));
    ws3.getRow(1).font = { bold: true };

    const buf = await wb.xlsx.writeBuffer() as unknown as Buffer;
    res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.header('Content-Disposition', 'attachment; filename="kanban-report.xlsx"');
    return res.send(buf);
  }

  // --- Dashboard Stats ------------------------------------------------------

  @Get('task-stats')
  @ApiOperation({ summary: 'Vazifa statistikasi (dashboard widgets uchun)' })
  async getTaskStats(@Query('boardId') boardId?: string) {
    return unwrapOrBadRequest(await this.svc.getTaskStats(boardId));
  }

  @Get('dashboard/team-metrics')
  @ApiOperation({ summary: 'Jamoa metrikasi (ResourceAllocation va Dashboard uchun)' })
  async getTeamMetrics(@Query('boardId') boardId?: string) {
    return unwrapOrBadRequest(await this.svc.getTeamMetrics(boardId));
  }

  // --- Overdue Inbox --------------------------------------------------------

  @Get('overdue-inbox')
  @ApiOperation({ summary: '24 soatdan ko\'p turgan va muddati o\'tgan kartalar' })
  async getOverdueInbox(@Query('boardId') boardId?: string) {
    const result = await this.svc.getOverdueInbox(boardId);
    if (!result.ok) return { items: [], total: 0 };
    return { items: result.data, total: result.data.length };
  }

  // --- Projects -------------------------------------------------------------

  @Get('projects')
  @ApiOperation({ summary: 'Loyihalar ro\'yxati (task_projects)' })
  async getProjects(@Query('status') status?: string) {
    const r = await db.execute(sql`
      SELECT * FROM task_projects
      WHERE deleted_at IS NULL
      ${status ? sql`AND status = ${status}` : sql``}
      ORDER BY created_at DESC
    `);
    const items = ((r as { rows?: unknown[] }).rows) ?? [];
    return { items, total: items.length };
  }

  @Post('projects')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Yangi loyiha yaratish (task_projects INSERT)' })
  async createProject(@Body() body: unknown) {
    const dto: CreateProjectDto = CreateProjectSchema.parse(body);
    const r = await db.execute(sql`
      INSERT INTO task_projects (name, description, color, status, owner_id, start_date, end_date)
      VALUES (
        ${dto.name},
        ${dto.description ?? null},
        ${dto.color},
        ${dto.status},
        ${dto.owner_id ?? null},
        ${dto.start_date ?? null},
        ${dto.end_date ?? null}
      )
      RETURNING id, name, description, color, status, owner_id, start_date, end_date, created_at
    `);
    const rows = ((r as { rows?: unknown[] }).rows) ?? [];
    const project = rows[0];
    if (!project) throw new HttpException('Loyiha yaratilmadi', HttpStatus.INTERNAL_SERVER_ERROR);
    return project;
  }

  @Put('projects/:id')
  @ApiOperation({ summary: 'Loyihani yangilash (task_projects UPDATE)' })
  async updateProject(@Param('id') id: string, @Body() body: unknown) {
    const projectId = parseInt(id, 10);
    if (isNaN(projectId)) throw new HttpException('Noto\'g\'ri ID', HttpStatus.BAD_REQUEST);
    const dto: UpdateProjectDto = UpdateProjectSchema.parse(body);

    const r = await db.execute(sql`
      UPDATE task_projects
      SET
        name        = COALESCE(${dto.name        ?? null}, name),
        description = CASE WHEN ${dto.description !== undefined ? 'y' : 'n'} = 'y'
                          THEN ${dto.description ?? null}
                          ELSE description END,
        color       = COALESCE(${dto.color       ?? null}, color),
        status      = COALESCE(${dto.status      ?? null}, status),
        end_date    = CASE WHEN ${dto.end_date    !== undefined ? 'y' : 'n'} = 'y'
                          THEN ${dto.end_date ?? null}
                          ELSE end_date END,
        updated_at  = NOW()
      WHERE id = ${projectId} AND deleted_at IS NULL
      RETURNING id, name, description, color, status, owner_id, start_date, end_date, updated_at
    `);
    const rows = ((r as { rows?: unknown[] }).rows) ?? [];
    const project = rows[0];
    if (!project) throw new HttpException('Loyiha topilmadi', HttpStatus.NOT_FOUND);
    return project;
  }

  @Delete('projects/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Loyihani soft-delete qilish (deleted_at=NOW())' })
  async deleteProject(@Param('id') id: string) {
    const projectId = parseInt(id, 10);
    if (isNaN(projectId)) throw new HttpException('Noto\'g\'ri ID', HttpStatus.BAD_REQUEST);

    const r = await db.execute(sql`
      UPDATE task_projects
      SET deleted_at = NOW(), updated_at = NOW()
      WHERE id = ${projectId} AND deleted_at IS NULL
      RETURNING id
    `);
    const rows = ((r as { rows?: unknown[] }).rows) ?? [];
    if (!rows[0]) throw new HttpException('Loyiha topilmadi', HttpStatus.NOT_FOUND);
    return;
  }
}
