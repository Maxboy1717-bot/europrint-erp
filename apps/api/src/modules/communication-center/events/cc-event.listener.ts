/**
 * Communication Center — ERP modullar bilan EventBus integratsiyasi
 *
 * Boshqa modullar voqea chiqaradi (`eventEmitter.emit('cc.spawn', payload)`),
 * bu listener qabul qiladi va kerakli hujjat shabloni asosida draft yaratib
 * birinchi tasdiqlash bosqichiga yuboradi.
 *
 * Standart event nomi: 'cc.spawn'
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
import { OnEvent } from '@nestjs/event-emitter';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { isOk } from '@common/result';
import { CcWorkflowService } from '../application/cc-workflow.service';
import { CcDocumentsRepository } from '../infrastructure/repositories/cc-documents.repo';
import { CcDocumentNumberService } from '../application/cc-document-number.service';
import type { Priority, Language } from '../domain/types';

export interface CcSpawnPayload {
  templateCode:  string;
  senderUserId:  number;
  subject:       string;
  body:          string;
  priority?:     Priority;
  language?:     Language;
  metadata?:     Record<string, unknown>;
  autoSend?:     boolean;
}

@Injectable()
export class CcEventListener {
  private readonly logger = new Logger(CcEventListener.name);

  constructor(
    private readonly wf:      CcWorkflowService,
    private readonly docs:    CcDocumentsRepository,
    private readonly numbers: CcDocumentNumberService,
  ) {}

  /** Universal hujjat yaratish event'i — boshqa modullar shu nomda emit qiladi */
  @OnEvent('cc.spawn', { async: true })
  async onSpawn(payload: CcSpawnPayload): Promise<void> {
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
