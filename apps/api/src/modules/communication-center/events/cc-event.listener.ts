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
import { runQuery } from '@shared/db';
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
      const documentNumber = await this.numbers.generate(tmpl.id, tmpl.number_format);
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
