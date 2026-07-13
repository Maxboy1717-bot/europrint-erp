/**
 * @module cc-approved-gl-posting.listener
 * @description 20-cc#49 (P0, owner 2026-07-11): CC hujjat TO'LIQ tasdiqlanganda
 *   (CcDocumentFullyApprovedEvent — publisher buni faqat ADVANCE / FINANCIAL_AID
 *   shablonlari uchun chiqaradi, cc-workflow.service.ts emitFullyApprovedIfFinancial)
 *   endi AVTOMATIK GL jurnal yozuvi ham yaratiladi.
 *
 *   Kontekst: avval faqat cc_notifications + Socket.IO push edi
 *   (CcApprovedKassirListener), va uning JSDoc'i "To'lov AVTO yaratilmaydi"
 *   deb aniq yozgan edi — bu ziddiyat P0 sifatida navbatga qo'yilgan edi
 *   (20-cc#49). Bu listener o'sha ziddiyatni yopadi, LEKIN kassir-ko'prikni
 *   ALMASHTIRMAYDI: ikkalasi ham bir xil event'ni MUSTAQIL qabul qiladi.
 *   Kassir hamon PIN + ochiq smena bilan haqiqiy naqd to'lovni KAS-1'da
 *   o'zi kiritadi (pul harakati subledger); bu listener esa BUXGALTERIYA
 *   kanonik jurnaliga (`entries`) hujjat tasdiqlangan zahoti majburiyat/xarajat
 *   tomonini qayd etadi — xuddi POS'ning
 *   GlPostingLogRepository.postMovementToLedger bilan bir xil naqsh
 *   (gl_account_mappings'dan transaction_type bo'yicha debit/credit hisob kodi
 *   o'qiladi, keyin GlPostingService.postJournal — YAGONA GL yozuv dvigateli —
 *   orqali kanonik `entries`ga yoziladi).
 *
 *   Shart (ikkalasi ham bajarilishi kerak, aks holda GL yozuvi YO'Q — Q-40,
 *   fabrikatsiya taqiq):
 *     1. Hujjatda musbat `amount` bo'lishi (ai_answers.amount — ADVANCE/
 *        FINANCIAL_AID ikkalasida ham shablon darajasida required:true).
 *     2. gl_account_mappings'da transaction_type=templateCode uchun
 *        debit_account/credit_account xaritalash mavjud bo'lishi (owner/
 *        buxgalter ma'lumoti — mavjud GL Mapping CRUD orqali sozlanadi).
 *
 *   Idempotent: GlPostingService.postJournal reference=`CC-${documentNumber}`
 *   LIKE-prefiks bilan mavjud yozuvni tekshiradi — event qayta-ishlansa
 *   (masalan retry) ikkinchi marta yozilmaydi.
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { CcDocumentFullyApprovedEvent } from '../domain/events/cc-document-fully-approved.event';
import { GlPostingService, type JournalLine } from '@modules/finance/domain/services/gl-posting.service';

interface GlAccountMappingRow {
  debit_account:  string | null;
  credit_account: string | null;
}

@Injectable()
@EventsHandler(CcDocumentFullyApprovedEvent)
export class CcApprovedGlPostingListener implements IEventHandler<CcDocumentFullyApprovedEvent> {
  private readonly logger = new Logger(CcApprovedGlPostingListener.name);

  constructor(private readonly glPosting: GlPostingService) {}

  async handle(event: CcDocumentFullyApprovedEvent): Promise<void> {
    const { documentNumber, templateCode, amount, approverUserId } = event.props;
    try {
      if (amount == null || !(amount > 0)) {
        this.logger.log(
          `cc→GL: ${documentNumber} (${templateCode}) — musbat summa yo'q (amount=${amount}) — ` +
          `GL yozuvi o'tkazib yuborildi (soxta/nol yozuv taqiq).`,
        );
        return;
      }

      // Xaritalash — owner/buxgalter ma'lumoti (gl_account_mappings), fabrikatsiya qilinmaydi.
      const mapRows = await runQuery<GlAccountMappingRow>(sql`
        SELECT debit_account, credit_account
        FROM gl_account_mappings
        WHERE transaction_type = ${templateCode}
        LIMIT 1
      `);
      const mapping = mapRows.rows[0];
      if (!mapping || !mapping.debit_account || !mapping.credit_account) {
        this.logger.warn(
          `cc→GL: ${documentNumber} (${templateCode}) uchun gl_account_mappings'da xaritalash ` +
          `topilmadi — GL yozuvi yaratilmadi. EGASI-DATA: gl_account_mappings.transaction_type=` +
          `'${templateCode}' qatorini qo'shing/tekshiring (GL Mapping CRUD).`,
        );
        return;
      }

      const description = `CC hujjat ${documentNumber} (${templateCode}) tasdiqlandi`;
      const lines: JournalLine[] = [
        { accountCode: mapping.debit_account,  accountName: description, debit: amount, credit: 0 },
        { accountCode: mapping.credit_account, accountName: description, debit: 0, credit: amount },
      ];
      const reference = `CC-${documentNumber}`;
      const glR = await this.glPosting.postJournal(lines, reference, approverUserId);
      if (!glR.ok) {
        this.logger.error(`cc→GL: ${documentNumber} (${templateCode}) GL yozuvi muvaffaqiyatsiz: ${glR.error.message}`);
        return;
      }
      this.logger.log(
        `cc→GL: ✅ ${documentNumber} (${templateCode}) uchun GL jurnal yozuvi yaratildi ` +
        `(entry id=${glR.data}, summa=${amount}, Dr ${mapping.debit_account} / Cr ${mapping.credit_account}).`,
      );
    } catch (e) {
      this.logger.error(`cc→GL xatosi (${documentNumber}): ${String(e)}`);
    }
  }
}
