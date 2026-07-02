/**
 * Communication Center — ERP modullar bilan EventBus integratsiyasi
 *
 * Wave 4 round-4 (PA2-18): migrated from legacy `@OnEvent('cc.spawn')` string
 * topic to canonical CQRS `@EventsHandler(CcSpawnRequestedEvent)`. EventBridge
 * keeps re-emitting to the legacy string topic for non-migrated emit sites
 * (notably `cc-webhook.controller.ts` still emits the string form) — see
 * EVENT_NAME_MAP entry in event-bridge.service.ts.
 *
 * Boshqa modullar voqea chiqaradi (`eventBus.publish(new CcSpawnRequestedEvent(payload))`
 * yoki legacy `eventEmitter.emit('cc.spawn', payload)`), bu listener qabul qiladi va
 * kerakli hujjat shabloni asosida draft yaratib birinchi tasdiqlash bosqichiga yuboradi.
 *
 * Standart event nomi: 'cc.spawn' (legacy) / CcSpawnRequestedEvent (canonical)
 *
 * Payload:
 * {
 *   templateCode:    'ZRS_ZVS' | 'ORDER' | 'DOKLAD' | 'REPORT' | ...
 *   senderUserId:    number     // kim "yuborgan" sifatida ko'rinadi (yoki tizim user'i)
 *   subject:         string
 *   body:            string     // tayyor matn (AI'siz)
 *   priority?:       'low' | 'normal' | 'high' | 'urgent'
 *   language?:       'uz' | 'ru'
 *   metadata?:       Record<string, unknown>
 *   autoSend?:       boolean    // true bo'lsa darhol birinchi approver inbox'iga
 * }
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { sql } from 'drizzle-orm';
import { runQuery, db } from '@shared/db';
import { isOk } from '@common/result';
import { CcWorkflowService } from '../application/cc-workflow.service';
import { CcDocumentsRepository } from '../infrastructure/repositories/cc-documents.repo';
import { CcDocumentNumberService } from '../application/cc-document-number.service';
import { CcSpawnRequestedEvent } from '../domain/events/cc-spawn-requested.event';
import type { Priority } from '../domain/types';

@Injectable()
@EventsHandler(CcSpawnRequestedEvent)
export class CcEventListener implements IEventHandler<CcSpawnRequestedEvent> {
  private readonly logger = new Logger(CcEventListener.name);

  constructor(
    private readonly wf:      CcWorkflowService,
    private readonly docs:    CcDocumentsRepository,
    private readonly numbers: CcDocumentNumberService,
  ) {}

  /** Universal hujjat yaratish event'i — CqrsEventBus orqali */
  async handle(event: CcSpawnRequestedEvent): Promise<void> {
    const payload = event.props;
    try {
      // 1) Template'ni kod bo'yicha topamiz
      const tmplR = await runQuery<{ id: string; version: number; default_priority: string; number_format: string }>(sql`
        SELECT id::text, version, default_priority, number_format
        FROM cc_document_templates
        WHERE code = ${payload.templateCode} AND is_active = true
        LIMIT 1
      `);
      const tmpl = tmplR.rows[0];
      if (!tmpl) {
        this.logger.warn(`cc.spawn: shablon ${payload.templateCode} topilmadi`);
        return;
      }

      // 2) Draft yaratamiz (AI'siz, to'g'ridan-to'g'ri body bilan)
      const docNumR = await this.numbers.generate(tmpl.id, tmpl.number_format);
      if (!isOk(docNumR)) {
        this.logger.error(`cc.spawn: hujjat raqami xatosi — ${docNumR.error.message}`);
        return;
      }
      const documentNumber = docNumR.data;
      const draftR = await this.docs.createDraft({
        templateId:      tmpl.id,
        templateVersion: tmpl.version,
        senderUserId:    payload.senderUserId,
        branchId:        null,
        subject:         payload.subject,
        aiBody:          payload.body,
        aiAnswers:       payload.metadata ?? {},
        senderComment:   null,
        priority:        payload.priority ?? (tmpl.default_priority as Priority),
        language:        payload.language ?? 'uz',
        documentNumber,
      });
      if (!isOk(draftR)) {
        this.logger.error(`cc.spawn: draft yaratish xatosi — ${draftR.error.message}`);
        return;
      }

      this.logger.log(`cc.spawn: draft ${draftR.data.documentNumber} yaratildi (${payload.templateCode})`);

      // 4) CC→Kanban ko'prik: har CC draft uchun kanban karta yaratamiz.
      //    Board va column ID'lari runtime'da nom bo'yicha qidiriladi (qattiq ID emas).
      //    Xato bo'lsa ignore — kanban qo'shimcha funksiya (task management).
      try {
        // Runtime lookup — fragile hardcoded ID'lar o'rniga nom bo'yicha
        const boardR = await runQuery<{ id: number }>(sql`
          SELECT id FROM kanban_boards WHERE name = 'EUROPRINT' LIMIT 1
        `);
        const board = boardR.rows[0];
        if (!board) {
          this.logger.warn(`cc.spawn: kanban board "EUROPRINT" topilmadi — karta yaratilmadi`);
        } else {
          // FIX (G4): jonli kanban_columns'da ustun nomi sort_order (position EMAS —
          // 42703 xato jimgina yutilardi, ko'prik hech qachon karta yaratmasdi).
          const colR = await runQuery<{ id: number }>(sql`
            SELECT id FROM kanban_columns
            WHERE board_id = ${board.id} AND deleted_at IS NULL
            ORDER BY sort_order ASC
            LIMIT 1
          `);
          const col = colR.rows[0];
          if (!col) {
            this.logger.warn(`cc.spawn: board ${board.id} uchun ustun topilmadi — karta yaratilmadi`);
          } else {
            // FIX (G4): kanban_cards.related_id INTEGER — cc_documents.id UUID
            // String(uuid) 22P02 bilan yiqilardi. UUID endi related_ref (text)
            // ustuniga yoziladi (additive migration g4-cc-kanban-kassir-2026-07-02.sql).
            await db.execute(sql`
              INSERT INTO kanban_cards
                (board_id, column_id, title, description, related_type, related_ref,
                 owner_user_id, priority, created_at, updated_at)
              VALUES (
                ${board.id}, ${col.id},
                ${payload.subject},
                ${payload.body ?? ''},
                'cc_document',
                ${String(draftR.data.id)},
                ${payload.senderUserId},
                ${payload.priority ?? 'normal'},
                NOW(), NOW()
              )
            `);
            this.logger.log(`cc.spawn: kanban karta yaratildi (board=${board.id}, col=${col.id}, draft=${draftR.data.id})`);
          }
        }
      } catch (kanbanErr) {
        // FIX (G4): silent-catch warn edi — golden-thread uzilishi ko'rinmasdi.
        this.logger.error(`cc.spawn: kanban karta yaratilmadi: ${String(kanbanErr)}`);
      }

      // 3) autoSend bo'lsa — workflow ishga tushadi (PIN talab qilinmasligi uchun
      //    "tizim PIN'i" mexanizmi keyingi versiyada qo'shiladi; hozir draft holatda qoladi)
      if (payload.autoSend) {
        this.logger.warn(
          `cc.spawn: autoSend=true bo'ldi, lekin send uchun PIN talab qilinadi. ` +
          `Draft holatda qoldirildi: ${draftR.data.id}`,
        );
      }
    } catch (err) {
      this.logger.error(`cc.spawn xatosi: ${(err as Error).message}`);
    }
  }
}
