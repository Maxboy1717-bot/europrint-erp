/**
 * /api/cc/verify/* — autentifikatsiyasiz (JWT yo'q) public endpointlar.
 *
 * Maqsad: chop etilgan hujjatdagi QR kodni tashqi shaxslar (auditor, yetkazib beruvchi)
 * skanerlap, ERP'da akkauntsiz hujjatning haqiqiyligini tekshira oladi.
 */

import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';

interface PublicSignature {
  stepOrder:     number;
  approverName:  string | null;
  state:         string;
  signedAt:      string | null;
  signatureHash: string | null;   // tasdiq uchun (faqat oxirgi 12 belgi ko'rinadi)
}

interface PublicDocVerify {
  documentNumber: string;
  subject:        string;
  workflowState:  string;
  templateName:   string;
  senderName:     string | null;
  createdAt:      string;
  approvedAt:     string | null;
  signatures:     PublicSignature[];
  isValid:        boolean;
}

@Throttle({ default: { limit: 10, ttl: 60_000 } })   // 10 req/min — siqiq limit (enumeration hujumidan himoya)
@Controller('cc/verify')
export class CcPublicController {
  /**
   * GET /api/cc/verify/:id — JWTsiz hujjat tekshiruvi.
   * QR kod qiymati: `${PUBLIC_BASE_URL}/cc/verify/${doc.id}`
   */
  @Get(':id')
  async verify(@Param('id') id: string): Promise<PublicDocVerify> {
    // Hujjat
    const docRes = await runQuery<{
      id: string; document_number: string; subject: string; workflow_state: string;
      template_name: string; sender_name: string | null; created_at: string; archived_at: string | null;
    }>(sql`
      SELECT
        d.id::text                                  AS id,
        d.document_number                           AS document_number,
        d.subject                                   AS subject,
        d.workflow_state                            AS workflow_state,
        t.name_uz                                   AS template_name,
        NULLIF(TRIM(COALESCE(u.first_name,'') || ' ' || COALESCE(u.last_name,'')), '') AS sender_name,
        d.created_at                                AS created_at,
        d.archived_at                               AS archived_at
      FROM cc_documents d
      LEFT JOIN cc_document_templates t ON t.id = d.template_id
      LEFT JOIN users u                 ON u.id = d.sender_user_id
      WHERE d.id = ${id} LIMIT 1
    `);
    const doc = docRes.rows[0];
    if (!doc) throw new NotFoundException('Hujjat topilmadi yoki QR kod noto\'g\'ri');

    // Imzolar zanjiri
    const apprRes = await runQuery<{
      step_order: number; approver_name: string | null; state: string;
      signed_at: string | null; signature_hash: string | null;
    }>(sql`
      SELECT
        a.step_order,
        NULLIF(TRIM(COALESCE(u.first_name,'') || ' ' || COALESCE(u.last_name,'')), '') AS approver_name,
        a.state,
        a.signed_at::text AS signed_at,
        a.signature_hash
      FROM cc_approvals a
      LEFT JOIN users u ON u.id = a.approver_user_id
      WHERE a.document_id = ${id}
      ORDER BY a.step_order ASC, a.created_at ASC
    `);

    const signatures: PublicSignature[] = apprRes.rows.map((row) => ({
      stepOrder:     row.step_order,
      approverName:  row.approver_name,
      state:         row.state,
      signedAt:      row.signed_at,
      // Faqat oxirgi 12 belgi (privacy) — to'liq hash audit ichida qoladi
      signatureHash: row.signature_hash ? '...' + row.signature_hash.slice(-12) : null,
    }));

    return {
      documentNumber: doc.document_number,
      subject:        doc.subject,
      workflowState:  doc.workflow_state,
      templateName:   doc.template_name,
      senderName:     doc.sender_name,
      createdAt:      doc.created_at,
      approvedAt:     signatures.reduce<string | null>((latest, s) => {
        if (!s.signedAt) return latest;
        return !latest || s.signedAt > latest ? s.signedAt : latest;
      }, null),
      signatures,
      isValid:        doc.workflow_state === 'approved' || doc.workflow_state === 'archived',
    };
  }
}
