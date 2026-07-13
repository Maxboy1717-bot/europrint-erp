/**
 * @module document-access-log.service
 * @description Document Control STEP 3.3 — the single reusable writer for
 * `document_access_log` (owner 2026-07-13). Every module logs view/print/copy/export
 * through this one service so the director audit panel (#11) reads one canonical store.
 *
 * Best-effort: a logging failure NEVER breaks the underlying request (a document view must
 * not 500 because the log insert hiccuped) — it is warn-logged and swallowed. Retained
 * forever (no delete path anywhere in code).
 *
 * `resolveTier` centralises the document_type -> table mapping so callers never build SQL;
 * the switch is a hardcoded allowlist (no injection surface) and grows one case per module
 * as the roll-out (STEP 3.10) reaches each one.
 */

import { Injectable, Logger } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { db, document_access_log } from '@shared/db';
import type { DocumentAccessAction } from '@shared/db';

export interface DocumentAccessEntry {
  userId?: number | null;
  userFullName?: string | null;
  userRole?: string | null;
  documentType: string;
  documentId: string | number;
  action: DocumentAccessAction;
  reason?: string | null;
  sensitivityTier?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  device?: string | null;
}

// Minimal shape of the Fastify/Nest request we read for ip + user-agent.
interface ReqLike {
  ip?: string;
  headers?: Record<string, unknown>;
  user?: { id?: number; sub?: number; full_name?: string; fullName?: string; role?: string };
}

@Injectable()
export class DocumentAccessLogService {
  private readonly logger = new Logger(DocumentAccessLogService.name);

  async log(entry: DocumentAccessEntry): Promise<void> {
    try {
      await db.insert(document_access_log).values({
        user_id: entry.userId ?? null,
        user_full_name: entry.userFullName ?? null,
        user_role: entry.userRole ?? null,
        document_type: entry.documentType,
        document_id: String(entry.documentId),
        action: entry.action,
        reason: entry.reason ?? null,
        sensitivity_tier: entry.sensitivityTier ?? null,
        ip_address: entry.ip ?? null,
        user_agent: entry.userAgent ?? null,
        device: entry.device ?? null,
      });
    } catch (e) {
      // Never break the request over an audit-log write.
      this.logger.warn(`document_access_log write failed: ${String(e)}`);
    }
  }

  /** Convenience: pull ip/user-agent/user off the request, resolve tier, then log. */
  async logFromReq(
    req: ReqLike,
    params: { documentType: string; documentId: string | number; action: DocumentAccessAction; reason?: string | null },
  ): Promise<void> {
    const fwd = req.headers?.['x-forwarded-for'];
    const ip = (Array.isArray(fwd) ? fwd[0] : (fwd as string | undefined)) ?? req.ip ?? null;
    const ua = (req.headers?.['user-agent'] as string | undefined) ?? null;
    const tier = await this.resolveTier(params.documentType, params.documentId);
    await this.log({
      userId: req.user?.id ?? req.user?.sub ?? null,
      userFullName: req.user?.full_name ?? req.user?.fullName ?? null,
      userRole: req.user?.role ?? null,
      documentType: params.documentType,
      documentId: params.documentId,
      action: params.action,
      reason: params.reason ?? null,
      sensitivityTier: tier,
      ip,
      userAgent: ua,
    });
  }

  /**
   * document_type -> sensitivity_tier lookup. Hardcoded table allowlist (no SQL injection):
   * one case per module, added as the roll-out reaches it. Returns null if unknown/absent.
   */
  async resolveTier(documentType: string, documentId: string | number): Promise<string | null> {
    const map: Record<string, { table: string; idIsUuid: boolean }> = {
      cc: { table: 'cc_documents', idIsUuid: true },
      erp_document: { table: 'erp_documents', idIsUuid: true },
      hr_document: { table: 'hr_documents', idIsUuid: false },
      employment_contract: { table: 'employment_contracts', idIsUuid: false },
      technology_card: { table: 'technology_cards', idIsUuid: false },
      sd_contract: { table: 'sd_contracts', idIsUuid: false },
      lms_certificate: { table: 'certificates', idIsUuid: false },
      gl_document: { table: 'gl_documents', idIsUuid: false },
    };
    const m = map[documentType];
    if (!m) return null;
    try {
      const idVal = m.idIsUuid ? sql`${String(documentId)}::uuid` : sql`${Number(documentId)}`;
      const res = await db.execute(
        sql`SELECT sensitivity_tier FROM ${sql.raw(m.table)} WHERE id = ${idVal} LIMIT 1`,
      );
      const rows = (res as unknown as { rows?: Array<{ sensitivity_tier?: string | null }> }).rows ?? [];
      return rows[0]?.sensitivity_tier ?? null;
    } catch (e) {
      this.logger.warn(`resolveTier(${documentType}) failed: ${String(e)}`);
      return null;
    }
  }
}
