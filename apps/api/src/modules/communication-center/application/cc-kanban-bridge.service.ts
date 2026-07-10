/**
 * Communication Center → Kanban ko'prigi (umumiy xizmat)
 *
 * VAZIFA (2.9-cc-kanban-e2e): oldin faqat `cc-event.listener.ts` (CcSpawnRequestedEvent
 * orqali chaqiriladigan, boshqa modullardan avtomatik hujjat oqimlari — masalan POS P2P)
 * kanban karta yaratardi. Foydalanuvchi asosiy UI orqali (`NewDocumentModal.tsx` →
 * CcAiInterviewService.finalize → persistDraft) hujjat/farmoyish yaratganda bu ko'prik
 * chaqirilmasdi — kanban karta paydo bo'lmasdi (uzuq zanjir).
 *
 * Bu xizmat kodni bitta joyga chiqaradi va ikkala chaqiruvchi (CcEventListener +
 * CcAiInterviewService) shu yerdan foydalanadi — duplikat SQL yo'q.
 *
 * Board va column ID'lari runtime'da nom bo'yicha qidiriladi (qattiq ID emas).
 * Xato bo'lsa faqat log (kanban qo'shimcha funksiya — hujjat yaratishni to'xtatmaydi).
 */

import { Injectable, Logger } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { runQuery, db } from '@shared/db';
import type { Priority } from '../domain/types';

export interface CreateKanbanCardForDocumentInput {
  documentId: string;
  subject: string;
  body: string | null | undefined;
  senderUserId: number;
  priority?: Priority | string | null;
}

@Injectable()
export class CcKanbanBridgeService {
  private readonly logger = new Logger(CcKanbanBridgeService.name);

  /** Har CC draft uchun kanban karta yaratadi ("EUROPRINT" board, birinchi ustun). */
  async createCardForDocument(input: CreateKanbanCardForDocumentInput): Promise<void> {
    try {
      const boardR = await runQuery<{ id: number }>(sql`
        SELECT id FROM kanban_boards WHERE name = 'EUROPRINT' LIMIT 1
      `);
      const board = boardR.rows[0];
      if (!board) {
        this.logger.warn('cc-kanban-bridge: kanban board "EUROPRINT" topilmadi — karta yaratilmadi');
        return;
      }

      const colR = await runQuery<{ id: number }>(sql`
        SELECT id FROM kanban_columns
        WHERE board_id = ${board.id} AND deleted_at IS NULL
        ORDER BY sort_order ASC
        LIMIT 1
      `);
      const col = colR.rows[0];
      if (!col) {
        this.logger.warn(`cc-kanban-bridge: board ${board.id} uchun ustun topilmadi — karta yaratilmadi`);
        return;
      }

      // kanban_cards.related_id INTEGER — cc_documents.id UUID uchun related_ref (text) ishlatiladi.
      await db.execute(sql`
        INSERT INTO kanban_cards
          (board_id, column_id, title, description, related_type, related_ref,
           owner_user_id, priority, created_at, updated_at)
        VALUES (
          ${board.id}, ${col.id},
          ${input.subject},
          ${input.body ?? ''},
          'cc_document',
          ${String(input.documentId)},
          ${input.senderUserId},
          ${input.priority ?? 'normal'},
          NOW(), NOW()
        )
      `);
      this.logger.log(
        `cc-kanban-bridge: kanban karta yaratildi (board=${board.id}, col=${col.id}, doc=${input.documentId})`,
      );
    } catch (err) {
      this.logger.error(`cc-kanban-bridge: kanban karta yaratilmadi: ${String(err)}`);
    }
  }

  /**
   * CC #36: hujjatning yangi versiyasi yaratilganda (resubmit) mavjud Kanban
   * kartaga "[ESKIRGAN]" belgisi qo'yiladi — karta KO'CHIRILMAYDI/O'CHIRILMAYDI
   * (E1 naqsh, avto-ko'chirmasdan). Idempotent: allaqachon belgilangan karta
   * qayta belgilanmaydi. Xato bo'lsa faqat log — kanban qo'shimcha funksiya,
   * resubmit oqimini to'xtatmasligi kerak.
   */
  async markCardStale(documentId: string): Promise<void> {
    try {
      const r = await runQuery<{ id: number }>(sql`
        UPDATE kanban_cards
        SET title = title || ' [ESKIRGAN]', updated_at = NOW()
        WHERE related_type = 'cc_document'
          AND related_ref = ${String(documentId)}
          AND title NOT LIKE '%[ESKIRGAN]%'
        RETURNING id
      `);
      this.logger.log(
        `cc-kanban-bridge: ${r.rows.length} ta kanban karta 'eskirgan' deb belgilandi (doc=${documentId})`,
      );
    } catch (err) {
      this.logger.error(`cc-kanban-bridge: markCardStale xato (doc=${documentId}): ${String(err)}`);
    }
  }
}
