/**
 * auto-gl-posting.service.ts
 *
 * Har harakat yakunlanganda avtomatik GL Posting yaratish.
 * Hisob juftliklari UzBekiston standart reja asosida.
 */
import { Injectable, Logger } from '@nestjs/common';
import { Result, Ok, Err, AppError } from '@common/result';
import { AutoGlPostingRepository } from '../../infrastructure/repositories/auto-gl-posting.repository';

export interface GlEntry {
  movementId:    number;
  debitAccount:  string;
  creditAccount: string;
  amount:        number;
  description:   string;
}

// #10 GL-unify (P2): corrected to LIVE Uzbek BHMS codes (table `accounts`). This POS auto-posting feeds
// the `pos_gl_postings` SUBLEDGER (not the canonical `entries`), but it was using codes that don't exist
// (6010/4010/9110/1020/1030) and 9430 = Amortizatsiya (depreciation) for damage. FLAGGED for owner: the
// chart has no distinct quarantine-inventory or tools/MRO account → both map to 1010 (Xom ashyo); and
// INTERNAL_TRANSFER between same-class warehouses has no GL value change (1010↔1010 nets to zero — a
// harmless wash; ideally it would post no entry at all).
const GL_ACCOUNTS = {
  WAREHOUSE_RM:        '1010', // Xom ashyo va materiallar
  WAREHOUSE_WIP:       '2010', // Asosiy ishlab chiqarish (WIP)
  WAREHOUSE_FG:        '2810', // Tayyor mahsulot
  WAREHOUSE_QC:        '1010', // quarantine RM → Xom ashyo (no distinct quarantine account — FLAGGED)
  WAREHOUSE_TOOLS:     '1010', // no distinct tools/MRO inventory account — FLAGGED
  ACCOUNTS_PAYABLE:    '6000', // Yetkazib beruvchilarga to'lovlar (Kreditorlar)
  ACCOUNTS_RECEIVABLE: '4000', // Mijozlardan olinadigan summalar (Debitorlar)
  REVENUE:             '9010', // Tayyor mahsulot sotuvidan tushum
  COGS:                '9100', // Sotilgan mahsulot tannarxi
  DEPT_EXPENSE:        '2010', // Asosiy ishlab chiqarish (material issued to production / WIP)
  QC_EXPENSE:          '9500', // Boshqa operatsion xarajatlar (no distinct QC-expense account)
  DAMAGE_EXPENSE:      '9500', // Boshqa operatsion xarajatlar (shortage/damage write-off — NOT depreciation)
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

      const movR = await this.repo.findMovement(movementId);
      if (!movR.ok) return Err(movR.error);
      const mov = movR.data;
      if (!mov) return Err({ message: 'Harakat topilmadi', code: 'NOT_FOUND' });

      let totalAmount = Number(mov.total_amount);
      if (totalAmount === 0) {
        const sumR = await this.repo.sumLines(movementId);
        if (!sumR.ok) return Err(sumR.error);
        totalAmount = sumR.data;
      }
      if (totalAmount === 0) {
        this.logger.log(`[AutoGL] Movement ${movementId} miqdori 0 — GL posting o'tkazilmadi`);
        return Ok({ posted: 0, entries: [] });
      }

      const entries = this.calculateEntries(mov.movement_type, totalAmount, movementId);
      if (entries.length === 0) return Ok({ posted: 0, entries: [] });

      const existingR = await this.repo.countExistingPostings(movementId);
      if (!existingR.ok) return Err(existingR.error);
      const existing = existingR.data;
      if (existing > 0) {
        this.logger.log(`[AutoGL] Movement ${movementId} uchun ${existing} ta GL yozuvi allaqachon bor`);
        return Ok({ posted: 0, entries: [] });
      }

      // A86 — ATOMIK yozish: harakatning BARCHA GL oyoqlari bitta tranzaksiyada (hammasi yoki hech biri).
      // Eski har-oyoq alohida `insertPosting` loop balanssiz yarim-yozuv qoldirar edi (masalan EXTERNAL_OUT
      // ning 2 oyog'idan biri yozilib, ikkinchisi xato bersa). Endi balansli juftlik atomik kafolatlanadi.
      const exchangeRate = Number(mov.exchange_rate) || 1;
      const postingR = await this.repo.insertPostingsAtomic(
        entries.map((e) => ({
          movementId:   e.movementId,
          debitAccount: e.debitAccount,
          creditAccount: e.creditAccount,
          amount:       e.amount,
          currency:     mov.currency,
          exchangeRate,
          amountBase:   e.amount * exchangeRate,
          description:  e.description,
        })),
      );
      if (!postingR.ok) return Err(postingR.error);
      const posted = postingR.data;

      this.logger.log(`[AutoGL] ✅ ${mov.movement_number}: ${posted} ta GL yozuvi atomik yaratildi (jami: ${totalAmount} ${mov.currency})`);
      return Ok({ posted, entries });
    } catch (e) {
      this.logger.error(`[AutoGL] Xato: ${String(e)}`);
      return Err({ message: String(e), code: 'DB_ERROR' });
    }
  }

  async listForMovement(movementId: number): Promise<Result<unknown[], AppError>> {
    return this.repo.listForMovement(movementId);
  }

  async getJournal(filters?: {
    dateFrom?: string; dateTo?: string;
    debitAccount?: string; creditAccount?: string;
    limit?: number;
  }): Promise<Result<unknown[], AppError>> {
    return this.repo.getJournal(filters);
  }
}
