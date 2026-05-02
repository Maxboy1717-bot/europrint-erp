import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
/**
 * POS — Employee Controller
 * Xodim inventar javobgarligi endpointlari
 */

import {Controller, Get, Post, Patch, Param, Body, Query,
  UseGuards, ParseIntPipe, Logger, UseInterceptors , UsePipes,} from '@nestjs/common';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';

import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { CurrentUser }       from '@common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@common/types/user.types';
import { PermissionGuard }   from '@common/guards/permission.guard';
import { RequirePermission } from '@common/decorators/require-permission.decorator';

import { EmployeeLedgerService } from '../../pos/employee-ledger.service';
import { EmployeeWriteOffService } from '../../pos/employee-write-off.service';

import {
  CreateWriteOffActDto,
  OpenLiabilityCaseDto,
  UpdateLiabilityCaseDto,
  EmployeeBalanceFilterDto,
  EmployeeStatementDto,
  EmployeeDismissCheckDto,
} from '../dto/employee.dto';
import { unwrapOrInternal } from '@common/http-result';

@ApiTags('POS — Xodim Javobgarligi')
@ApiBearerAuth()
@UseGuards(PermissionGuard)
@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@Controller('pos/employees')
export class EmployeeController {
  private readonly logger = new Logger(EmployeeController.name);
  constructor(
    private readonly ledgerService:  EmployeeLedgerService,
    private readonly writeOffService: EmployeeWriteOffService,
  ) {}

  // ─── Xodim Balansi ────────────────────────────────────────────────────────

  @Get(':userId/balance')
  @RequirePermission('pos.employee.read')
  @ApiOperation({ summary: 'Xodim inventar balansi (qaysi materialda necha dona bor)' })
  async getBalance(
    @Param('userId', ParseIntPipe) userId: number,
    @Query() filter: EmployeeBalanceFilterDto,
  ) {
    return unwrapOrInternal(await this.ledgerService.getEmployeeBalance(userId, {
      onlyActive:  filter.onlyActive,
      warehouseId: filter.warehouseId,
    }));
  }

  // ─── O'zim Balansi (Employee o'zi) ───────────────────────────────────────

  @Get('me/balance')
  @RequirePermission('pos.employee.read_own')
  @ApiOperation({ summary: 'Mening inventar balansim' })
  async getMyBalance(@CurrentUser() user: AuthenticatedUser, @Query() filter: EmployeeBalanceFilterDto) {
    return unwrapOrInternal(await this.ledgerService.getEmployeeBalance(user.id, {
      onlyActive:  filter.onlyActive,
      warehouseId: filter.warehouseId,
    }));
  }

  // ─── Bo'lim Balansi ───────────────────────────────────────────────────────

  @Get('department/:code/balance')
  @RequirePermission('pos.employee.department_read')
  @ApiOperation({ summary: 'Bo\'lim barcha xodimlarining balanslari' })
  async getDepartmentBalance(@Param('code') departmentCode: string) {
    return unwrapOrInternal(await this.ledgerService.getDepartmentBalance(departmentCode));
  }

  // ─── Xodim Bayonnomasi ────────────────────────────────────────────────────

  @Get(':userId/statement')
  @RequirePermission('pos.employee.read')
  @ApiOperation({ summary: 'Xodim inventar harakatlari bayonnomasi (PDF uchun)' })
  async getStatement(
    @Param('userId', ParseIntPipe) userId: number,
    @Query() dto: EmployeeStatementDto,
  ) {
    return unwrapOrInternal(await this.ledgerService.getEmployeeStatement(
      userId,
      new Date(dto.dateFrom),
      new Date(dto.dateTo),
    ));
  }

  // ─── Hisobdan Chiqarish Akti ──────────────────────────────────────────────

  @Post('write-off')
  @RequirePermission('pos.write_off.create')
  @ApiOperation({ summary: 'Sarf materiallarni hisobdan chiqarish akti' })
  async createWriteOff(@Body() dto: CreateWriteOffActDto, @CurrentUser() user: AuthenticatedUser) {
    return unwrapOrInternal(await this.writeOffService.createWriteOffAct(
      {
        userId:       dto.userId,
        warehouseId:  dto.warehouseId,
        writeOffDate: dto.writeOffDate,
        reason:       dto.reason ?? '',
        lines:        dto.lines,
      },
      user.id,
    ));
  }

  // ─── Moddiy Javobgarlik Ishi ──────────────────────────────────────────────

  @Post('liability')
  @RequirePermission('pos.liability.create')
  @ApiOperation({ summary: 'Moddiy javobgarlik ishi ochish (aktiv yo\'qolgan / shikastlangan)' })
  async openLiabilityCase(@Body() dto: OpenLiabilityCaseDto, @CurrentUser() user: AuthenticatedUser) {
    return unwrapOrInternal(await this.ledgerService.openLiabilityCase({
      userId:          dto.userId,
      materialCardId:  dto.materialCardId,
      serialNumberItemId: dto.serialNumberItemId,
      warehouseId:     dto.warehouseId ?? '',
      incidentType:    dto.incidentType,
      incidentDate:    new Date(dto.incidentDate),
      description:     dto.description,
      quantity:        dto.quantity,
      assessedValue:   dto.assessedValue,
      openedBy:        user.id,
    }));
  }

  @Patch('liability/:id')
  @RequirePermission('pos.liability.update')
  @ApiOperation({ summary: 'Javobgarlik ishi statusini yangilash (HR)' })
  async updateLiabilityCase(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLiabilityCaseDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return unwrapOrInternal(await this.writeOffService.updateLiabilityCase(
      id,
      {
        status:             dto.status ?? '',
        compensationAmount: dto.compensationAmount,
        compensationDate:   dto.compensationDate,
        closedAt:           dto.closedAt,
      },
      user.id,
    ));
  }

  // ─── Xodim Chiqish Tekshiruv ──────────────────────────────────────────────

  @Post('dismiss-check')
  @RequirePermission('pos.employee.dismiss_check')
  @ApiOperation({ summary: 'Xodim ishdan chiqishdan oldin inventar tekshiruvi (HR)' })
  async checkDismiss(@Body() dto: EmployeeDismissCheckDto) {
    const balance = await this.ledgerService.getEmployeeBalance(dto.userId, { onlyActive: true });
    const liabilities = await this.writeOffService.getOpenLiabilityCases(dto.userId);

    const unresolvedAssets = (Array.isArray(balance) ? balance : []).filter(r => !r.isConsumable && (r.balance ?? 0) > 0);
    const liabilitiesData = (liabilities.ok ? liabilities.data as Record<string, unknown>[] : []);
    const canDismiss = unresolvedAssets.length === 0 && liabilitiesData.length === 0;

    return {
      userId:              dto.userId,
      canDismiss,
      openLiabilityCases:  liabilitiesData.length,
      unresolvedAssets,
      totalOutstandingValue: (Array.isArray(unresolvedAssets) ? unresolvedAssets : []).reduce((s, r) => s + (r.totalValue ?? 0), 0),
      message: canDismiss
        ? 'Xodim barcha inventarlarni qaytargan. Chiqish ruxsat etilgan.'
        : `DIQQAT: Xodimda ${unresolvedAssets.length} ta qaytarilmagan aktiv va ${liabilitiesData.length} ta ochiq javobgarlik ishi bor!`,
    };
  }
}
