/**
 * @module fp-cycle-cron.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CommandBus } from '@nestjs/cqrs';
import { Result, AppError, Ok } from '@common/result';
import { CreateNotificationCommand } from '../../notifications/application/commands/create-notification.command';
import { FP_CYCLE_CRON_REPO, type IFpCycleCronRepo } from '../domain/repositories/i-fp-cycle-cron.repo';

@Injectable()
export class FpCycleCronService {
  private readonly logger = new Logger(FpCycleCronService.name);

  constructor(
    private readonly commandBus: CommandBus,
    @Inject(FP_CYCLE_CRON_REPO) private readonly repo: IFpCycleCronRepo,
  ) {}

  private getWeekStart(): string {
    const d = _time.now();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d);
    monday.setDate(diff);
    return monday.toISOString().split('T')[0];
  }

  private async notifyRoles(
    roles: string[],
    title: string,
    body: string,
    type: string,
  ): Promise<void> {
    const idsResult = await this.repo.getEmployeeIdsByRoles(roles);
    const ids = idsResult.ok ? idsResult.data : [];
    await Promise.allSettled(
      (Array.isArray(ids) ? ids : []).map((userId) =>
        this.commandBus.execute(
          new CreateNotificationCommand(String(userId), title, body, type),
        ),
      ),
    );
    this.logger.log({ roles, recipients: ids.length }, `[FpCycleCron] Notified for ${title}`);
  }

  // Seshanba 09:00 — ZVS ariza eslatmasi va Рек.Совет
  @Cron('0 9 * * 2', { timeZone: 'Asia/Tashkent' })
  async onZvsDay(): Promise<Result<void, AppError>> {
    this.logger.log('[FpCycleCron] Seshanba — ZVS kuni');
    const weekStart = this.getWeekStart();
    const pendingResult = await this.repo.getPendingZvsCount(weekStart);
    const pendingCount = pendingResult.ok ? pendingResult.data : 0;
    await this.notifyRoles(
      ['director', 'manager', 'department_head'],
      `📋 ЗВС — Seshanba (${weekStart})`,
      `Kutayotgan ЗВС arizalar: ${pendingCount} ta. Рек.Совет majlisi bugun. ERP → Koordinatsiya → Moliyaviy Rejalashtirish.`,
      'fp_cycle_zvs',
    );
    return Ok(undefined);
  }

  // Chorshanba 09:00 — ФП moliya rejasi kuni
  @Cron('0 9 * * 3', { timeZone: 'Asia/Tashkent' })
  async onFpDay(): Promise<void> {
    this.logger.log('[FpCycleCron] Chorshanba — ФП moliya kuni');
    const weekStart = this.getWeekStart();
    const statsResult = await this.repo.getZvsStats(weekStart);
    const stats = statsResult.ok ? statsResult.data : { pending: '0', approved: '0', approved_total: '0' };
    const approvedTotal = Number(stats.approved_total).toLocaleString();
    await this.notifyRoles(
      ['director', 'cfo', 'finance_manager'],
      `💰 ФП Kuni — Chorshanba (${weekStart})`,
      `ЗВС holati: ${stats.pending} kutayotgan, ${stats.approved} tasdiqlangan (${approvedTotal} UZS). Moliyaviy reja tasdiqlansin.`,
      'fp_cycle_fp',
    );
  }

  // Payshanba 09:00 — Bank to'lov kuni
  @Cron('0 9 * * 4', { timeZone: 'Asia/Tashkent' })
  async onBankDay(): Promise<void> {
    this.logger.log('[FpCycleCron] Payshanba — Bank to\'lov kuni');
    await this.notifyRoles(
      ['cfo', 'finance_manager', 'accountant'],
      '🏦 Bank To\'lovlari — Payshanba',
      'Bugun bank o\'tkazmalari kuni. Barcha tasdiqlangan ЗВС to\'lovlarini bank orqali amalga oshiring.',
      'fp_cycle_bank',
    );
  }

  // Dushanba 09:00 — Naqd pul kuni
  @Cron('0 9 * * 1', { timeZone: 'Asia/Tashkent' })
  async onCashDay(): Promise<void> {
    this.logger.log('[FpCycleCron] Dushanba — Naqd pul kuni');
    await this.notifyRoles(
      ['cfo', 'cashier', 'finance_manager'],
      '💵 Naqd To\'lovlar — Dushanba',
      'Bugun naqd pul tarqatish va avans hisob-kitob kuni. Kassadan to\'lovlar ro\'yxatini tekshiring.',
      'fp_cycle_cash',
    );
  }
}
