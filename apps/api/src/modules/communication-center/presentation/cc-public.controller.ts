/**
 * /api/cc/verify/* — autentifikatsiyasiz (JWT yo'q) public endpointlar.
 *
 * Maqsad: chop etilgan hujjatdagi QR kodni tashqi shaxslar (auditor, yetkazib beruvchi)
 * skanerlap, ERP'da akkauntsiz hujjatning haqiqiyligini tekshira oladi.
 */

import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { I18nService } from 'nestjs-i18n';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { Public } from '@common/decorators/public.decorator';

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

interface PublicDocRow {
  id: string; document_number: string; subject: string; workflow_state: string;
  template_name: string; sender_name: string | null; created_at: string; archived_at: string | null;
}

interface PublicApprovalRow {
  step_order: number; approver_name: string | null; state: string;
  signed_at: string | null; signature_hash: string | null;
}

@Throttle({ default: { limit: 10, ttl: 60_000 } })   // 10 req/min — siqiq limit (enumeration hujumidan himoya)
@Public()
@Controller('cc/verify')
export class CcPublicController {
  constructor(private readonly i18n: I18nService) {}
  /**
   * GET /api/cc/verify/:id — JWTsiz hujjat tekshiruvi.
   * QR kod qiymati: `${PUBLIC_BASE_URL}/cc/verify/${doc.id}`
   */
  @Get(':id')
  async verify(@Param('id') id: string): Promise<PublicDocVerify> {
    const doc = await this.loadDocRow(id);
    const apprRows = await this.loadApprovalRows(id);
    const signatures = this.mapSignatures(apprRows);

    return {
      documentNumber: doc.document_number,
      subject:        doc.subject,
      workflowState:  doc.workflow_state,
      templateName:   doc.template_name,
      senderName:     doc.sender_name,
      createdAt:      doc.created_at,
      approvedAt:     this.latestSignedAt(signatures),
      signatures,
      isValid:        doc.workflow_state === 'approved' || doc.workflow_state === 'archived',
    };
  }

  private async loadDocRow(id: string): Promise<PublicDocRow> {
    const docRes = await runQuery<PublicDocRow>(sql`
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
    if (!doc) throw new NotFoundException(await this.i18n.t('errors.documentOrQrNotFound'));
    return doc;
  }

  private async loadApprovalRows(id: string): Promise<PublicApprovalRow[]> {
    const apprRes = await runQuery<PublicApprovalRow>(sql`
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
    return apprRes.rows;
  }

  private mapSignatures(rows: PublicApprovalRow[]): PublicSignature[] {
    return rows.map((row) => ({
      stepOrder:     row.step_order,
      approverName:  row.approver_name,
      state:         row.state,
      signedAt:      row.signed_at,
      // Faqat oxirgi 12 belgi (privacy) — to'liq hash audit ichida qoladi
      signatureHash: row.signature_hash ? '...' + row.signature_hash.slice(-12) : null,
    }));
  }

  private latestSignedAt(signatures: PublicSignature[]): string | null {
    return signatures.reduce<string | null>((latest, s) => {
      if (!s.signedAt) return latest;
      return !latest || s.signedAt > latest ? s.signedAt : latest;
    }, null);
  }
}
