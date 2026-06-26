import {
  Controller, Post, Get, Param, Query, ParseIntPipe,
  UseGuards, UseInterceptors,
} from '@nestjs/common';
import { z } from 'zod';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { Throttle } from '@nestjs/throttler';
import { unwrapOrInternal } from '@common/http-result';
import { PayrollService } from './payroll.service';

const PAYROLL_CLOSE_ROLES = ['SUPER_ADMIN', 'DIRECTOR', 'PAYROLL_OFFICER', 'HR_MANAGER', 'admin'] as const;

/**
 * Karta-oylik preview so'rovi (egasi 8-qaror #5 formulasi: baza × razryad × ЦКП% × stake × proratsiya × gate).
 * Sana ISO 'YYYY-MM-DD'. razryadCoeff berilmasa JONLI kanonik kartadan o'qiladi (A8/MASSIV-100).
 * Coerce: query stringlari → son/null (FE query-string yuboradi).
 */
const CardSalaryPreviewSchema = z.object({
  cardId:            z.coerce.number().int().positive(),
  employeeId:        z.coerce.number().int().positive(),
  from:              z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana 'YYYY-MM-DD' bo'lishi kerak"),
  to:                z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana 'YYYY-MM-DD' bo'lishi kerak"),
  baseSalary:        z.coerce.number().nonnegative(),
  ckpAchievementPct: z.coerce.number().min(0).nullish(),
  stakeShare:        z.coerce.number().min(0).max(1).nullish(),
  workedDays:        z.coerce.number().int().min(0).nullish(),
  periodWorkingDays: z.coerce.number().int().min(0).nullish(),
  razryadCoeff:      z.coerce.number().positive().nullish(),
});

@Throttle({ default: { limit: 30, ttl: 60_000 } })
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...PAYROLL_CLOSE_ROLES)
@Controller('hr/payroll/closure')
export class HrPayrollClosureController {
  constructor(private readonly svc: PayrollService) {}

  /**
   * ⭐ Gap #1 (T20-A1) — KARTA-OYLIK QATORLARINI GENERATSIYA (egasi 8-qaror #5).
   * Har aktiv-kartali xodim uchun razryad-koeff + stake + baza yig'ib, ЦКП/LMS-darvozadan
   * o'tkazib payroll_rows ga upsert qiladi (idempotent). closePeriod'dan OLDIN chaqiriladi.
   */
  @Post('periods/:id/generate')
  async generatePeriodRows(@Param('id', ParseIntPipe) id: number) {
    const r = await this.svc.generatePeriodRows(id);
    return { data: unwrapOrInternal(r) };
  }

  @Post('periods/:id/close')
  async closePeriod(@Param('id', ParseIntPipe) id: number) {
    const r = await this.svc.closePeriod(id);
    return { data: unwrapOrInternal(r) };
  }

  /**
   * ⭐ T7-09 — KARTA-OYLIK FORMULASI JONLI PREVIEW (egasi 8-qaror #5).
   * A7 formula metodini (`previewCardSalary`) JONLI manbalarga ulaydi: razryad-koeff
   * kanonik kartadan, ЦКП-gate jonli `ckp_fact_values`, LMS-gate jonli darslik, stake.
   * Read-only hisob (DB yozmaydi) — `closePeriod`/`calculatePayroll` ga tegmaydi.
   */
  @Get('card-salary-preview')
  async cardSalaryPreview(@Query() query: unknown) {
    const dto = CardSalaryPreviewSchema.parse(query);
    const r = await this.svc.previewCardSalary(
      dto.cardId,
      dto.employeeId,
      dto.from,
      dto.to,
      dto.baseSalary,
      dto.ckpAchievementPct ?? null,
      dto.stakeShare ?? null,
      dto.workedDays ?? null,
      dto.periodWorkingDays ?? null,
      dto.razryadCoeff ?? null,
    );
    return { data: unwrapOrInternal(r) };
  }
}
