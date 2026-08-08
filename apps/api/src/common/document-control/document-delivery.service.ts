/**
 * @module document-delivery.service
 * @description Document Control STEP 3.5 — in-app chat delivery of "a document needs your
 * attention" (owner decision #2). When a document names/assigns an employee, the system
 * sends them a CHAT message (from the reserved 'Tizim' system user, id in business_settings)
 * containing a link that opens the document in-app — NOT a file attachment, NOT email.
 *
 * This is a pure CONSUMER of the chat module: it composes the already-exported public
 * ChatService methods (getOrCreateDirectRoom + sendMessage) and ChatGateway emit — it does
 * NOT modify chat's send-path internals (handleSendMessage/gateway/WS reconnect). Best-effort:
 * a chat-delivery failure never breaks the document workflow that triggered it.
 */

import { Injectable, Logger } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { db } from '@shared/db';
import { ChatService } from '../../modules/chat/chat.service';
import { ChatGateway } from '../../modules/chat/chat.gateway';

export interface AssignedDocRef {
  documentType: string; // 'cc' | 'erp_document' | 'hr_document' | …
  documentId: string | number;
  title: string;
}

@Injectable()
export class DocumentDeliveryService {
  private readonly logger = new Logger(DocumentDeliveryService.name);
  private cachedSystemUserId: number | null = null;

  constructor(
    private readonly chat: ChatService,
    private readonly gateway: ChatGateway,
  ) {}

  /** Reserved 'Tizim' sender id — from business_settings (CRUD-editable), users fallback. */
  private async systemUserId(): Promise<number> {
    if (this.cachedSystemUserId) return this.cachedSystemUserId;
    try {
      const s = await db.execute(
        sql`SELECT value_num FROM business_settings WHERE module='document_control' AND setting_key='chat_system_user_id' LIMIT 1`,
      );
      const num = Number((s as unknown as { rows?: Array<{ value_num?: unknown }> }).rows?.[0]?.value_num);
      if (num > 0) return (this.cachedSystemUserId = num);
      const u = await db.execute(sql`SELECT id FROM users WHERE username='tizim_system' LIMIT 1`);
      const uid = Number((u as unknown as { rows?: Array<{ id?: unknown }> }).rows?.[0]?.id);
      if (uid > 0) return (this.cachedSystemUserId = uid);
    } catch (e) {
      this.logger.warn(`systemUserId lookup failed: ${String(e)}`);
    }
    return 0;
  }

  private buildLink(documentType: string, documentId: string | number): string {
    switch (documentType) {
      case 'cc': return `/cc/documents/${documentId}`;
      case 'erp_document': return `/documents/${documentId}`;
      case 'erp_spreadsheet': return `/spreadsheets/${documentId}`;
      default: return `/documents/${documentId}`;
    }
  }

  /** Send one 'Tizim' chat message to a target employee with an in-app document link. */
  async notifyDocumentAssigned(targetUserId: number, doc: AssignedDocRef): Promise<void> {
    try {
      const tizim = await this.systemUserId();
      if (!tizim || !targetUserId || tizim === targetUserId) return;

      const roomRes = await this.chat.getOrCreateDirectRoom(tizim, targetUserId);
      if (!roomRes.ok) return;
      const roomId = String((roomRes.data as Record<string, unknown>)['id']);

      const link = this.buildLink(doc.documentType, doc.documentId);
      const content = `📄 Yangi hujjat sizga biriktirildi: "${doc.title}". Ochish: ${link}`;

      const msgRes = await this.chat.sendMessage(roomId, tizim, content);
      if (!msgRes.ok) return;

      // Live delivery (same events the normal send flow uses).
      this.gateway.emitToRoom(roomId, 'new_message', msgRes.data as Record<string, unknown>);
      this.gateway.emitToUser(targetUserId, 'room_updated', { roomId });
      const unread = await this.chat.getTotalUnreadCount(targetUserId);
      this.gateway.emitToUser(targetUserId, 'unread_count', { count: Number(unread) || 0 });
    } catch (e) {
      // Never break the triggering document workflow over a chat-delivery hiccup.
      this.logger.warn(`notifyDocumentAssigned failed (user ${targetUserId}): ${String(e)}`);
    }
  }
}
