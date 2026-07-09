/**
 * @module cc-retention.service
 * @description CC arxiv-saqlash muddati + imzo-hash yaxlitligi (Batch 5 Item 3, EP-CC-016 / Q73).
 *   Tasdiqlangan hujjat immutable — arxivga ko'chadi; saqlash muddati jo'natuvchi lavozimiga qarab:
 *   RAHBAR (leader — kengash/boshqaruv roli) 10 yil, ISHCHI (worker) 3 yil. Imzo-hash (cc_approvals.
 *   signature_hash, cc-pin.service tomonidan yaratiladi) formati/mavjudligi tekshiriladi (buzilmaganlik).
 *   Raw parametrized SQL (runQuery) + Result. Rule 6: hisob shu servisda.
 */

import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { Ok, Err, Result, AppError } from '@common/result';
import {
  CC_RETENTION_LEADER_YEARS, CC_RETENTION_WORKER_YEARS, CC_LEADER_ROLES,
} from '@common/constants/business.constants';

type Row = Record<string, unknown>;

export interface RetentionInfo {
  documentId: string;
  senderRole: string | null;
  retentionClass: 'leader' | 'worker';
  retentionYears: number;
  archivedAt: string | null;
  retentionUntil: string | null;
}

export interface SignatureVerifyResult {
  approvalId: string;
  state: string | null;
  hasHash: boolean;
  validFormat: boolean;   // cc:v1:{ts}:{64-hex}
  intact: boolean;        // signed + hash present + valid format
}

const LEADER_SET = new Set<string>(CC_LEADER_ROLES as readonly string[]);
const HASH_RX = /^cc:v1:\d+:[0-9a-f]{64}$/;

@Injectable()
export class CcRetentionService {
  /** Sinf + yillar: leader (kengash/boshqaruv) → 10, worker → 3. */
  private classify(role: string | null): { cls: 'leader' | 'worker'; years: number } {
    const isLeader = role != null && LEADER_SET.has(String(role).toLowerCase());
    return isLeader
      ? { cls: 'leader', years: CC_RETENTION_LEADER_YEARS }
      : { cls: 'worker', years: CC_RETENTION_WORKER_YEARS };
  }

  /** Hujjatning joriy/hisoblangan saqlash-muddati ma'lumoti (yozmaydi). */
  async getRetention(documentId: string): Promise<Result<RetentionInfo, AppError>> {
    try {
      const r = (await runQuery<Row>(sql`
        SELECT d.id, d.archived_at, d.retention_class, d.retention_until, u.role AS sender_role
        FROM cc_documents d
        LEFT JOIN users u ON u.id = d.sender_user_id
        WHERE d.id = ${documentId}::uuid
        LIMIT 1`)).rows[0];
      if (!r) return Err({ code: 'NOT_FOUND', message: 'Hujjat topilmadi' });
      const role = (r.sender_role as string | null) ?? null;
      const { cls, years } = this.classify(role);
      return Ok({
        documentId,
        senderRole: role,
        retentionClass: (r.retention_class as 'leader' | 'worker' | null) ?? cls,
        retentionYears: years,
        archivedAt: (r.archived_at as string | null) ?? null,
        retentionUntil: (r.retention_until as string | null) ?? null,
      });
    } catch (e) { return Err({ code: 'DB_ERROR', message: String(e) }); }
  }

  /**
   * Hujjatni arxivga ko'chirish + saqlash-muddatini o'rnatish. Immutable qoida: qayta-arxivlamaydi
   * (allaqachon retention_until bo'lsa — o'zgartirmaydi, CONFLICT). retention_until = (arxiv sanasi +
   * yillar) SQL'da hisoblanadi (Q-40 — fabrikatsiya yo'q, real hisob).
   */
  async archiveWithRetention(documentId: string): Promise<Result<RetentionInfo, AppError>> {
    try {
      const cur = (await runQuery<Row>(sql`
        SELECT d.id, d.retention_until, u.role AS sender_role
        FROM cc_documents d LEFT JOIN users u ON u.id = d.sender_user_id
        WHERE d.id = ${documentId}::uuid LIMIT 1`)).rows[0];
      if (!cur) return Err({ code: 'NOT_FOUND', message: 'Hujjat topilmadi' });
      if (cur.retention_until != null) return Err({ code: 'CONFLICT', message: 'Allaqachon arxivlangan (immutable)' });

      const { cls, years } = this.classify((cur.sender_role as string | null) ?? null);
      const upd = (await runQuery<Row>(sql`
        UPDATE cc_documents
        SET archived_at = COALESCE(archived_at, NOW()),
            retention_class = ${cls},
            retention_until = (COALESCE(archived_at::date, CURRENT_DATE) + (${years} * INTERVAL '1 year'))::date,
            updated_at = NOW()
        WHERE id = ${documentId}::uuid
        RETURNING id, archived_at, retention_class, retention_until`)).rows[0];
      if (!upd) return Err({ code: 'INTERNAL', message: 'Arxivlanmadi' });
      return Ok({
        documentId,
        senderRole: (cur.sender_role as string | null) ?? null,
        retentionClass: (upd.retention_class as 'leader' | 'worker'),
        retentionYears: years,
        archivedAt: (upd.archived_at as string | null) ?? null,
        retentionUntil: (upd.retention_until as string | null) ?? null,
      });
    } catch (e) { return Err({ code: 'DB_ERROR', message: String(e) }); }
  }

  /** Imzo-hash yaxlitligi: imzolangan tasdiq signature_hash bor + formati to'g'ri (cc:v1:{ts}:{sha256}). */
  async verifySignature(approvalId: string): Promise<Result<SignatureVerifyResult, AppError>> {
    try {
      const r = (await runQuery<Row>(sql`
        SELECT id, state, signature_hash FROM cc_approvals WHERE id = ${approvalId}::uuid LIMIT 1`)).rows[0];
      if (!r) return Err({ code: 'NOT_FOUND', message: 'Tasdiq topilmadi' });
      const hash = (r.signature_hash as string | null) ?? null;
      const state = (r.state as string | null) ?? null;
      const hasHash = hash != null && hash.length > 0;
      const validFormat = hasHash && HASH_RX.test(hash!);
      const signedStates = new Set(['approved', 'signed']);
      const intact = hasHash && validFormat && (state == null || signedStates.has(String(state)));
      return Ok({ approvalId, state, hasHash, validFormat, intact });
    } catch (e) { return Err({ code: 'DB_ERROR', message: String(e) }); }
  }
}
