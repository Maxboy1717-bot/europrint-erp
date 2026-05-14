/**
 * auto-gl-posting.service.ts
 *
 * Har harakat yakunlanganda avtomatik GL Posting yaratish.
 * Hisob juftliklari UzBekiston standart reja asosida.
 */
import { Injectable, Logger } from '@nestjs/common';
import { Result, Ok, Err, AppError } from '@common/result';
import { AutoGlPostingRepository } from '../repositories/auto-gl-posting.repository';

export interface GlEntry {
  movementId:    number;
  debitAccount:  string;
  creditAccount: string;
  amount:        number;
  description:   string;
}

const GL_ACCOUNTS = {
  WAREHOUSE_RM:        '1010',
  WAREHOUSE_WIP:       '1020',
  WAREHOUSE_FG:        '1030',
  WAREHOUSE_QC:        '1040',
  WAREHOUSE_TOOLS:     '1050',
  ACCOUNTS_PAYABLE:    '6010',
  ACCOUNTS_RECEIVABLE: '4010',
  REVENUE:             '9010',
  COGS:                '9110',
  DEPT_EXPENSE:        '2010',
  QC_EXPENSE:          '9410',
  DAMAGE_EXPENSE:      '9430',
} as const;

@Injectable()
export class AutoGlPostingService {
  private readonly logger = new Logger(AutoGlPostingService.name);

  constructor(private readonly repo: AutoGlPostingRepository) {}

  private calculateEntries(movementType: string, amount: number, movementId: number): GlEntry[] {
    const entries: GlEntry[] = [];
    switch (movementType) {
      case 'EXTERNAL_IN':
        entries.push({ movementId, debitAccount: GL_ACCOUNTS.WAREHOUSE_QC, creditAccount: GL_ACCOUNTS.ACCOUNTS_PAYABLE, amount, description: 'Tashqi kirim — Karantin omboriga' });
        break;
      case 'EXTERNAL_OUT':
        entries.push({ movementId, debitAccount: GL_ACCOUNTS.ACCOUNTS_RECEIVABLE, creditAccount: GL_ACCOUNTS.REVENUE, amount, description: 'Tashqi chiqim — Mijozga sotish' });
        entries.push({ movementId, debitAccount: GL_ACCOUNTS.COGS, creditAccount: GL_ACCOUNTS.WAREHOUSE_FG, amount, description: 'Sotilgan tovar tannarxi' });
        break;
      case 'INTERNAL_ISSUE':
        entries.push({ movementId, debitAccount: GL_ACCOUNTS.DEPT_EXPENSE, creditAccount: GL_ACCOUNTS.WAREHOUSE_RM, amount, description: 'Bo\'limga berish — Material xarajati' });
        break;
      case 'INTERNAL_RETURN':
        entries.push({ movementId, debitAccount: GL_ACCOUNTS.WAREHOUSE_RM, creditAccount: GL_ACCOUNTS.DEPT_EXPENSE, amount, description: 'Materialni omborga qaytarish' });
        break;
      case 'DAMAGE':
        entries.push({ movementId, debitAccount: GL_ACCOUNTS.DAMAGE_EXPENSE, creditAccount: GL_ACCOUNTS.WAREHOUSE_RM, amount, description: 'Zarar akti — Yo\'qolish/buzilish' });
        break;
      case 'INTERNAL_TRANSFER':
        entries.push({ movementId, debitAccount: GL_ACCOUNTS.WAREHOUSE_RM, creditAccount: GL_ACCOUNTS.WAREHOUSE_RM, amount, description: 'Omborlararo ko\'chirish (audit)' });
        break;
      case 'INVENTORY_ADJUST':
        entries.push({ movementId, debitAccount: amount >= 0 ? GL_ACCOUNTS.WAREHOUSE_RM : GL_ACCOUNTS.DAMAGE_EXPENSE, creditAccount: amount >= 0 ? GL_ACCOUNTS.DAMAGE_EXPENSE : GL_ACCOUNTS.WAREHOUSE_RM, amount: Math.abs(amount), description: `Inventarizatsiya tuzatish (${amount >= 0 ? '+' : '-'})` });
        break;
      default:
        this.logger.warn(`[AutoGL] Noma'lum harakat turi: ${movementType}`);
    }
    return entries;
  }

  async postForMovement(movementId: number): Promise<Result<{ posted: number; entries: GlEntry[] }, AppError>> {
    try {
      this.logger.log(`[AutoGL] Movement ${movementId} uchun GL posting hisoblanmoqda...`);

      const mov = await this.repo.findMovement(movementId);
      if (!mov) return Err({ message: 'Harakat topilmadi', code: 'NOT_FOUND' });

      let totalAmount = Number(mov.total_amount);
      if (totalAmount === 0) {
        totalAmount = await this.repo.sumLines(movementId);
      }
      if (totalAmount === 0) {
        this.logger.log(`[AutoGL] Movement ${movementId} miqdori 0 — GL posting o'tkazilmadi`);
        return Ok({ posted: 0, entries: [] });
      }

      const entries = this.calculateEntries(mov.movement_type, totalAmount, movementId);
      if (entries.length === 0) return Ok({ posted: 0, entries: [] });

      const existing = await this.repo.countExistingPostings(movementId);
      if (existing > 0) {
        this.logger.log(`[AutoGL] Movement ${movementId} uchun ${existing} ta GL yozuvi allaqachon bor`);
        return Ok({ posted: 0, entries: [] });
      }

      let posted = 0;
      const exchangeRate = Number(mov.exchange_rate) || 1;
      for (const e of entries) {
        await this.repo.insertPosting({
          movementId:   e.movementId,
          debitAccount: e.debitAccount,
          creditAccount: e.creditAccount,
          amount:       e.amount,
          currency:     mov.currency,
          exchangeRate,
          amountBase:   e.amount * exchangeRate,
          description:  e.description,
        });
        posted++;
      }

      this.logger.log(`[AutoGL] ✅ ${mov.movement_number}: ${posted} ta GL yozuvi yaratildi (jami: ${totalAmount} ${mov.currency})`);
      return Ok({ posted, entries });
    } catch (e) {
      this.logger.error(`[AutoGL] Xato: ${String(e)}`);
      return Err({ message: String(e), code: 'DB_ERROR' });
    }
  }

  async listForMovement(movementId: number) {
    return this.repo.listForMovement(movementId).then(rows => ({ ok: true as const, data: rows }));
  }

  async getJournal(filters?: {
    dateFrom?: string; dateTo?: string;
    debitAccount?: string; creditAccount?: string;
    limit?: number;
  }) {
    return this.repo.getJournal(filters).then(rows => ({ ok: true as const, data: rows }));
  }
}
