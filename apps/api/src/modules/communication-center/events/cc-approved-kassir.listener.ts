/**
 * @module cc-approved-kassir.listener
 * @description G4 CC APPROVE→KASSIR ko'prigi.
 *
 *   CcDocumentFullyApprovedEvent (faqat ADVANCE / FINANCIAL_AID — publisher
 *   filtrlaydi) kelganda kassir(lar)ga cc_notifications orqali
 *   "Tasdiqlangan avans-hujjat to'lovga tayyor" bildirishnomasi yaratadi
 *   + Socket.IO real-time push (CcGateway).
 *
 *   MUHIM: To'lov AVTO yaratilmaydi — kassir to'lovni cashier-hub'da (KAS-1)
 *   PIN + ochiq smena bilan O'ZI kiritadi. Bu faqat bildirishnoma-ko'prik.
 *
 *   Kassir'ni topish tartibi (birinchi bo'sh bo'lmagan natija ishlatiladi):
 *     1. positions.code='KASSIR' yoki title~'kassir' faol xodimlar (CC
 *        workflow'dagi POSITION:KASSIR bilan bir xil manba)
 *     2. Kassir KARTAsiga (org_functions.position_name='Kassir') biriktirilgan
 *        userlar (users.card_id / users.org_function_id)
 *     3. users.role='kassir'
 *   Hech biri topilmasa — EGASI-DATA: Kassir kartasiga xodim biriktirilmagan,
 *   logger.warn bilan qayd etiladi (fabrikatsiya qilinmaydi).
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { CcDocumentFullyApprovedEvent } from '../domain/events/cc-document-fully-approved.event';
import { getCcGateway } from '../presentation/cc.gateway';

const TEMPLATE_NAMES_UZ: Record<string, string> = {
  ADVANCE:       'avans',
  FINANCIAL_AID: 'moddiy yordam',
};
const TEMPLATE_NAMES_RU: Record<string, string> = {
  ADVANCE:       'аванс',
  FINANCIAL_AID: 'материальная помощь',
};

@Injectable()
@EventsHandler(CcDocumentFullyApprovedEvent)
export class CcApprovedKassirListener implements IEventHandler<CcDocumentFullyApprovedEvent> {
  private readonly logger = new Logger(CcApprovedKassirListener.name);

  async handle(event: CcDocumentFullyApprovedEvent): Promise<void> {
    const { documentId, documentNumber, templateCode, subject } = event.props;
    try {
      const kassirIds = await this.resolveKassirUserIds();
      if (kassirIds.length === 0) {
        this.logger.warn(
          `cc→kassir: kassir topilmadi — bildirishnoma yuborilmadi (hujjat ${documentNumber}). ` +
          `EGASI-DATA: Kassir kartasiga (org_functions 'Kassir') yoki positions.code='KASSIR' ga xodim biriktirilmagan.`,
        );
        return;
      }

      const typeUz = TEMPLATE_NAMES_UZ[templateCode] ?? templateCode;
      const typeRu = TEMPLATE_NAMES_RU[templateCode] ?? templateCode;
      const titleUz = `Tasdiqlangan ${typeUz}-hujjat to'lovga tayyor`;
      const titleRu = `Утверждённый документ (${typeRu}) готов к выплате`;
      const messageUz =
        `${documentNumber} — "${subject}" to'liq tasdiqlandi. ` +
        `To'lovni kassa smenasida (PIN bilan) rasmiylashtiring.`;
      const messageRu =
        `${documentNumber} — «${subject}» полностью утверждён. ` +
        `Оформите выплату в кассовой смене (с PIN).`;

      const gw = getCcGateway();
      // Pattern 2: har kassir uchun mustaqil yozuvlar — parallel yuboriladi.
      await Promise.all(kassirIds.map(async (userId) => {
        // NOTE: raw SQL — cc_notifications VIEW (notifications ustida), Drizzle
        // barrel'da yo'q; cc-sla.cron.ts pushNotification bilan bir xil naqsh
        // (title/body NOT NULL — title_uz/message_uz nusxalanadi).
        await runQuery(sql`
          INSERT INTO cc_notifications
            (user_id, document_id, type, priority, title_uz, title_ru, message_uz, message_ru, title, body)
          VALUES
            (${userId}, ${documentId}, 'payment_ready', 'high',
             ${titleUz}, ${titleRu}, ${messageUz}, ${messageRu}, ${titleUz}, ${messageUz})
        `);
        gw?.emitToUser(userId, 'approved', { documentId, documentNumber, templateCode });
      }));

      this.logger.log(
        `cc→kassir: ${documentNumber} (${templateCode}) uchun ${kassirIds.length} kassirga bildirishnoma yaratildi`,
      );
    } catch (e) {
      this.logger.error(`cc→kassir bildirishnoma xatosi (${documentNumber}): ${String(e)}`);
    }
  }

  /** Kassir user ID'larini 3 bosqichli qidiruv bilan topadi (JSDoc yuqorida). */
  private async resolveKassirUserIds(): Promise<number[]> {
    // 1. Lavozim bo'yicha (POSITION:KASSIR bilan bir manba)
    const byPosition = await runQuery<{ user_id: number }>(sql`
      SELECT DISTINCT e.user_id
      FROM employees e
      INNER JOIN positions p ON p.id = e.position_id
      WHERE (UPPER(COALESCE(p.code, '')) = 'KASSIR'
             OR LOWER(COALESCE(p.title, p.name_uz, p.name, '')) LIKE '%kassir%')
        AND COALESCE(e.is_active, true) = true
        AND e.user_id IS NOT NULL
    `);
    const posIds = byPosition.rows.map(r => Number(r.user_id)).filter(id => id > 0);
    if (posIds.length > 0) return posIds;

    // 2. Kassir KARTAsi bo'yicha (karta-markazli model: users.card_id / org_function_id)
    const byCard = await runQuery<{ id: number }>(sql`
      SELECT DISTINCT u.id
      FROM users u
      INNER JOIN org_functions f
        ON (f.id = u.card_id OR f.id = u.org_function_id)
      WHERE LOWER(COALESCE(f.position_name, '')) LIKE '%kassir%'
        AND COALESCE(f.is_active, true) = true
        AND f.deleted_at IS NULL
        AND COALESCE(u.is_active, true) = true
        AND u.deleted_at IS NULL
    `);
    const cardIds = byCard.rows.map(r => Number(r.id)).filter(id => id > 0);
    if (cardIds.length > 0) return cardIds;

    // 3. Rol bo'yicha
    const byRole = await runQuery<{ id: number }>(sql`
      SELECT u.id FROM users u
      WHERE LOWER(COALESCE(u.role, '')) = 'kassir'
        AND COALESCE(u.is_active, true) = true
        AND u.deleted_at IS NULL
    `);
    return byRole.rows.map(r => Number(r.id)).filter(id => id > 0);
  }
}
