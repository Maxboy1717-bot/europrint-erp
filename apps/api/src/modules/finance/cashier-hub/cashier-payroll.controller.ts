/**
 * @module cashier-payroll.controller
 * @description CASHIER-HUB Phase 2 HTTP routes (transport-only): KAS-2 salary-payout approval
 *   gate (FEATURE A) + podotchet advance/debt cycle (FEATURE B). Validates via service Zod,
 *   delegates, unwraps Result. Roles: cashier / finance_manager / director / super_admin.
 *   Mounted under the global `api` prefix → /api/finance/cashier/...
 * @layer Presentation (Finance)
 */

import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { unwrapOrThrow } from '@common/http-result';
import { Roles } from '@common/decorators/roles.decorator';
import { RolesGuard } from '@common/guards/roles.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@common/types/user.types';
import { CashierPayrollService } from './cashier-payroll.service';
import { CashierPodotchetService } from './cashier-podotchet.service';

const CASHIER_ROLES = ['cashier', 'finance_manager', 'director', 'super_admin'] as const;

@ApiTags('Finance Cashier Hub — KAS-2 + Podotchet')
@Controller('finance/cashier')
@UseGuards(RolesGuard)
@Roles(...CASHIER_ROLES)
export class CashierPayrollController {
  constructor(
    private readonly payroll: CashierPayrollService,
    private readonly podotchet: CashierPodotchetService,
  ) {}

  // ---------------- FEATURE A: KAS-2 salary-payout approval gate ----------------

  // GET /api/finance/cashier/salary-payouts — the approval queue (?status=pending default, ?status=all lifts it).
  @ApiOperation({ summary: 'KAS-2: list the salary-payout approval queue (default status=pending)' })
  @ApiResponse({ status: 200, description: 'OK — { data, total }' })
  @Get('salary-payouts')
  async listSalaryPayouts(@Query() query: unknown) {
    return unwrapOrThrow(await this.payroll.listSalaryPayouts(query ?? {}));
  }

  // POST /api/finance/cashier/salary-payouts — open an approval chain.
  @ApiOperation({ summary: 'KAS-2: request a salary payout (opens approval chain)' })
  @ApiResponse({ status: 201, description: 'Approval chain created (pending)' })
  @Post('salary-payouts')
  async requestSalaryPayout(@Body() body: unknown) {
    return unwrapOrThrow(await this.payroll.requestSalaryPayout(body));
  }

  // POST /api/finance/cashier/salary-payouts/:id/approve — advance one stage of the chain.
  @ApiOperation({ summary: 'KAS-2: approve one stage of the salary-payout chain' })
  @ApiResponse({ status: 201, description: 'Stage approved' })
  @ApiResponse({ status: 409, description: 'Stages must be approved in order' })
  @Post('salary-payouts/:id/approve')
  async approveStage(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const approverUserId = user?.userId ?? user?.id;
    return unwrapOrThrow(await this.payroll.approveStage(id, body, approverUserId as number));
  }

  // POST /api/finance/cashier/salary-payouts/:id/reject — reject the chain.
  @ApiOperation({ summary: 'KAS-2: reject the salary-payout chain' })
  @ApiResponse({ status: 201, description: 'Chain rejected' })
  @Post('salary-payouts/:id/reject')
  async rejectApproval(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const rejectedBy = user?.userId ?? user?.id;
    return unwrapOrThrow(await this.payroll.rejectApproval(id, body, rejectedBy as number));
  }

  // POST /api/finance/cashier/salary-payouts/pay — pay out (gated on full chain + 4-digit PIN).
  @ApiOperation({ summary: 'KAS-2: pay out a salary (requires approved chain + valid PIN)' })
  @ApiResponse({ status: 201, description: 'Paid out + GL posted (Dr 6710 / Cr 5010)' })
  @ApiResponse({ status: 403, description: 'Chain incomplete or PIN invalid — payout blocked' })
  @Post('salary-payouts/pay')
  async recordSalaryPayout(@Body() body: unknown, @CurrentUser() user: AuthenticatedUser) {
    const operatorUserId = user?.userId ?? user?.id;
    return unwrapOrThrow(await this.payroll.recordSalaryPayout(body, operatorUserId));
  }

  // ---------------- FEATURE B: podotchet (advance / debt) ----------------

  // POST /api/finance/cashier/advances — issue a cash advance (opens employee debt).
  @ApiOperation({ summary: 'Podotchet: issue a cash advance (cash-out + opens employee debt)' })
  @ApiResponse({ status: 201, description: 'Advance issued + GL posted (Dr 4000 / Cr 5010) + debt opened' })
  @ApiResponse({ status: 403, description: 'PIN required / invalid for the advance cash-out' })
  @Post('advances')
  async issueAdvance(@Body() body: unknown, @CurrentUser() user: AuthenticatedUser) {
    const operatorUserId = user?.userId ?? user?.id;
    return unwrapOrThrow(await this.podotchet.issueAdvance(body, operatorUserId));
  }

  // GET /api/finance/cashier/advance-reports — list advance reports (?status=pending|approved filter).
  @ApiOperation({ summary: 'Podotchet: list advance reports (optional ?status=pending|approved)' })
  @ApiResponse({ status: 200, description: 'OK — { data, total }' })
  @Get('advance-reports')
  async listAdvanceReports(@Query() query: unknown) {
    return unwrapOrThrow(await this.podotchet.listAdvanceReports(query ?? {}));
  }

  // POST /api/finance/cashier/advance-reports — submit an advance report (receipt, pending).
  @ApiOperation({ summary: 'Podotchet: submit an advance report (receipt) — pending approval' })
  @ApiResponse({ status: 201, description: 'Advance report submitted (pending)' })
  @Post('advance-reports')
  async submitAdvanceReport(@Body() body: unknown) {
    return unwrapOrThrow(await this.podotchet.submitAdvanceReport(body));
  }

  // POST /api/finance/cashier/advance-reports/:id/approve — approve → clears matching debt.
  @ApiOperation({ summary: 'Podotchet: approve an advance report (clears the matching debt)' })
  @ApiResponse({ status: 201, description: 'Report approved + debt cleared' })
  @Post('advance-reports/:id/approve')
  async approveAdvanceReport(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthenticatedUser) {
    const approverUserId = user?.userId ?? user?.id;
    return unwrapOrThrow(await this.podotchet.approveAdvanceReport(id, approverUserId as number));
  }

  // GET /api/finance/cashier/employees/:id/debt — profile debt (SUM open + open rows).
  @ApiOperation({ summary: 'Podotchet: get an employee profile debt (sum of open debt)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('employees/:id/debt')
  async getEmployeeDebt(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrThrow(await this.podotchet.getEmployeeDebt(id));
  }
}
