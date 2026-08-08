/**
 * @module cashier-hub.controller
 * @description CASHIER-HUB KAS-1 HTTP routes (the single factory cashier hub). Transport-only:
 *   validates via service Zod, delegates, unwraps Result. Roles: cashier / finance_manager /
 *   super_admin. Mounted under the global `api` prefix → /api/finance/cashier/...
 * @layer Presentation (Finance)
 */

import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { FastifyReply } from 'fastify';
import { unwrapOrThrow } from '@common/http-result';
import { Roles } from '@common/decorators/roles.decorator';
import { RolesGuard } from '@common/guards/roles.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@common/types/user.types';
import { CashierHubService } from './cashier-hub.service';
import { CashierHubPdfService } from './cashier-hub-pdf.service';

const CASHIER_ROLES = ['cashier', 'finance_manager', 'super_admin'] as const;

@ApiTags('Finance Cashier Hub')
@Controller('finance/cashier')
@UseGuards(RolesGuard)
@Roles(...CASHIER_ROLES)
export class CashierHubController {
  constructor(
    private readonly service: CashierHubService,
    private readonly pdfService: CashierHubPdfService,
  ) {}

  // POST /api/finance/cashier/shifts/open — open a cashier shift (one open per cashier).
  @ApiOperation({ summary: 'Open a cashier shift' })
  @ApiResponse({ status: 201, description: 'Shift opened' })
  @Post('shifts/open')
  async openShift(@Body() body: unknown, @CurrentUser() user: AuthenticatedUser) {
    // Default the cashier to the authenticated user when the body omits it.
    const raw =
      body && typeof body === 'object' && 'cashierUserId' in body
        ? body
        : { ...(body as object), cashierUserId: user?.userId ?? user?.id };
    return unwrapOrThrow(await this.service.openShift(raw));
  }

  // POST /api/finance/cashier/shifts/:id/close — close shift, returns X/Z summary.
  @ApiOperation({ summary: 'Close a cashier shift (X/Z report)' })
  @ApiResponse({ status: 201, description: 'Shift closed, X/Z returned' })
  @Post('shifts/:id/close')
  async closeShift(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    return unwrapOrThrow(await this.service.closeShift(id, body ?? {}));
  }

  // POST /api/finance/cashier/shifts/:id/movements — record a cash movement (real GL post).
  @ApiOperation({ summary: 'Record a cash movement (posts to canonical GL)' })
  @ApiResponse({ status: 201, description: 'Movement recorded + GL posted' })
  @ApiResponse({ status: 403, description: 'PIN required / invalid for cash-out movements' })
  @Post('shifts/:id/movements')
  async recordMovement(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const operatorUserId = user?.userId ?? user?.id;
    return unwrapOrThrow(await this.service.recordMovement(id, body, operatorUserId));
  }

  // GET /api/finance/cashier/shifts — paginated shift list (?status= & ?cashierId= filters).
  @ApiOperation({ summary: 'List cashier shifts (paginated; optional status / cashierId filters)' })
  @ApiResponse({ status: 200, description: 'OK — { data, total }' })
  @Get('shifts')
  async listShifts(@Query() query: unknown) {
    return unwrapOrThrow(await this.service.listShifts(query ?? {}));
  }

  // GET /api/finance/cashier/shifts/current — the calling user's currently-open shift, or null.
  // Declared BEFORE shifts/:id so the literal `current` is not captured by the :id param.
  @ApiOperation({ summary: "Get the calling cashier's currently-open shift (or null)" })
  @ApiResponse({ status: 200, description: 'OK — the open shift, or null when none' })
  @Get('shifts/current')
  async getCurrentShift(@CurrentUser() user: AuthenticatedUser) {
    const cashierUserId = user?.userId ?? user?.id;
    return unwrapOrThrow(await this.service.getCurrentShift(cashierUserId as number | undefined));
  }

  // GET /api/finance/cashier/shifts/:id/ledger — X/Z naqd-ledger: chronological cash
  // in/out lines with running drawer balance + saldo + optional daily-limit warning.
  // Declared BEFORE shifts/:id so the literal `ledger` segment is not captured by :id.
  @ApiOperation({ summary: "Cashier shift cash ledger (kirim/chiqim + running saldo + limit warning)" })
  @ApiResponse({ status: 200, description: 'OK — { openingAmount, balance, dailyCashLimit, limitExceeded, lines[] }' })
  @Get('shifts/:id/ledger')
  async getShiftLedger(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrThrow(await this.service.getShiftLedger(id));
  }

  // GET /api/finance/cashier/shifts/:id/pdf — kunlik kassa hisoboti (Z-report PDF, egasi §A+.18b).
  // Declared BEFORE shifts/:id so the literal `pdf` segment is not captured by :id.
  @ApiOperation({ summary: 'Kunlik kassa hisoboti PDF (Z-report) for a shift' })
  @ApiResponse({ status: 200, description: 'application/pdf' })
  @Get('shifts/:id/pdf')
  async downloadDailyReport(@Param('id', ParseIntPipe) id: number, @Res() res: FastifyReply) {
    const payload = unwrapOrThrow(await this.service.getDailyReportPayload(id));
    const buffer = await this.pdfService.generateDailyCashReport(payload);
    res
      .header('Content-Type', 'application/pdf')
      .header('Content-Disposition', `attachment; filename="kassa-kunlik-${id}.pdf"`)
      .header('Content-Length', buffer.length)
      .send(buffer);
  }

  // GET /api/finance/cashier/shifts/:id — shift + running X summary.
  @ApiOperation({ summary: 'Get a cashier shift with its X summary' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('shifts/:id')
  async getShift(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrThrow(await this.service.getShiftSummary(id));
  }
}
