/**
 * @module node-portret.service
 * @description Business-logic service for the org-node "Portret" (lavozim
 *   kartochkasi) wizard + HR requests. Returns Result<T> from @common/result;
 *   never throws raw Errors. Tables are ensured lazily on first miss
 *   (same pattern as PositionFolderService).
 *
 *   PDF/email (2026-07-07): `generatePortretPdf` renders the karta (position +
 *   razryad + ЦКП target + salary range) and the saved portret wizard answers
 *   into an A4 PDF — same pdf-lib draw()-closure pattern as
 *   `hr-pdf-generator.service.ts` / `qc-certificate-pdf.service.ts`.
 *   `sendPortretEmail` attaches that PDF and sends it via the shared
 *   `IEmailSender` port (resolves to `SmtpEmailAdapter`) to HR managers and the
 *   employee(s) currently seated on the card — mirrors
 *   `pos/application/services/email.service.ts`'s honest-failure contract
 *   (Q-40: no fabricated "sent" when there is nothing to send to / SMTP unset).
 */

import { Inject, Injectable } from '@nestjs/common';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { Ok, Err, safeCall, Result, AppErr, AppError } from '@common/result';
import { toPdfSafeText } from '@common/pdf/pdf-safe-text.helper';
import { EMAIL_SENDER, type IEmailSender } from '@modules/notifications/domain/ports/i-email-sender.port';
import { NodePortretRepository, HrRequestInput } from './node-portret.repository';

type Row = Record<string, unknown>;

@Injectable()
export class NodePortretService {
  constructor(
    private readonly repo: NodePortretRepository,
    @Inject(EMAIL_SENDER) private readonly emailSender: IEmailSender,
  ) {}

  // ─── Portret ───────────────────────────────────────────────────────────────

  async getPortret(nodeId: number): Promise<Result<object, AppError>> {
    let r = await this.repo.getPortret(nodeId);
    if (!r.ok) {
      await safeCall(() => this.repo.ensureTables());
      r = await this.repo.getPortret(nodeId);
    }
    if (!r.ok) return Err(r.error);
    return Ok({ portret: r.data ?? null });
  }

  async savePortret(
    nodeId: number,
    portretData: Record<string, unknown>,
    creatorId: number | null,
  ): Promise<Result<object, AppError>> {
    let r = await this.repo.upsertPortret(nodeId, portretData, creatorId);
    if (!r.ok) {
      await safeCall(() => this.repo.ensureTables());
      r = await this.repo.upsertPortret(nodeId, portretData, creatorId);
    }
    if (!r.ok) return r;
    return Ok({ portret: r.data });
  }

  // ─── HR Requests ─────────────────────────────────────────────────────────────

  async getHrRequests(nodeId: number): Promise<Result<object, AppError>> {
    let r = await this.repo.getHrRequests(nodeId);
    if (!r.ok) {
      await safeCall(() => this.repo.ensureTables());
      r = await this.repo.getHrRequests(nodeId);
    }
    if (!r.ok) return r;
    return Ok({ requests: Array.isArray(r.data) ? r.data : [] });
  }

  async createHrRequest(
    nodeId: number,
    dto: HrRequestInput,
    requesterId: number | null,
  ): Promise<Result<object, AppError>> {
    let r = await this.repo.createHrRequest(nodeId, dto, requesterId);
    if (!r.ok) {
      await safeCall(() => this.repo.ensureTables());
      r = await this.repo.createHrRequest(nodeId, dto, requesterId);
    }
    if (!r.ok) return r;
    return Ok({ request: r.data });
  }

  // ─── Portret PDF ─────────────────────────────────────────────────────────────

  /**
   * Karta Portret PDF (A4): lavozim + razryad + ЦКП target + oylik vilkasi
   * (org_departments/razryad_levels — `getNodeCardInfo`) + saqlangan portret
   * so'rovnoma javoblari (`getPortret`). Karta topilmasa → NOT_FOUND; portret
   * hali to'ldirilmagan bo'lsa PDF baribir chiqadi ("hali to'ldirilmagan" belgisi
   * bilan — Q-40, fabrikatsiya yo'q).
   */
  async generatePortretPdf(nodeId: number): Promise<Result<Buffer, AppError>> {
    const nodeR = await this.repo.getNodeCardInfo(nodeId);
    if (!nodeR.ok) return Err(nodeR.error);
    if (!nodeR.data) return Err(AppErr('NOT_FOUND', `Karta topilmadi (nodeId=${nodeId})`));
    const node = nodeR.data;

    let portretR = await this.repo.getPortret(nodeId);
    if (!portretR.ok) {
      await safeCall(() => this.repo.ensureTables());
      portretR = await this.repo.getPortret(nodeId);
    }
    const portretRow = portretR.ok ? (portretR.data as Row | null) : null;
    const portretData = (portretRow?.['portret_data'] as { portret?: Row } | undefined)?.portret ?? null;

    return safeCall(async () => this.buildPortretPdf(node, portretData), 'INTERNAL');
  }

  /**
   * Portret PDF'ni HR menejerlar + kartaga biriktirilgan xodim(lar)ga email
   * qiladi (SmtpEmailAdapter — `IEmailSender` port). Qabul qiluvchi topilmasa
   * yoki SMTP sozlanmagan bo'lsa — VALIDATION/EXTERNAL_SERVICE bilan halol
   * muvaffaqiyatsizlik qaytariladi (Q-40: soxta "yuborildi" yo'q).
   */
  async sendPortretEmail(nodeId: number): Promise<Result<{ sent: number; failed: number; recipients: string[] }, AppError>> {
    const pdfR = await this.generatePortretPdf(nodeId);
    if (!pdfR.ok) return Err(pdfR.error);

    const recipientsR = await this.repo.getPortretRecipientEmails(nodeId);
    if (!recipientsR.ok) return Err(recipientsR.error);
    const recipients = recipientsR.data;
    if (recipients.length === 0) {
      return Err(AppErr(
        'VALIDATION',
        "Yuborish uchun email manzili topilmadi (HR menejer yoki kartaga biriktirilgan xodimning email manzili yo'q)",
      ));
    }

    const nodeR = await this.repo.getNodeCardInfo(nodeId);
    const nodeName = nodeR.ok && nodeR.data ? String(nodeR.data['name'] ?? `Karta #${nodeId}`) : `Karta #${nodeId}`;
    const filename = `portret-karta-${nodeId}.pdf`;

    let sent = 0;
    let failed = 0;
    for (const to of recipients) {
      const r = await this.emailSender.send({
        to,
        subject: `Karta Portret — ${nodeName}`,
        html: `<p>"${nodeName}" kartasi uchun Portret (lavozim kartochkasi) hujjati ilova qilingan.</p>`,
        attachments: [{ filename, content: pdfR.data, contentType: 'application/pdf' }],
      });
      if (r.ok) sent++; else failed++;
    }
    return Ok({ sent, failed, recipients });
  }

  // ─── PDF rendering (pdf-lib draw()-closure — hr-pdf-generator/qc-certificate pattern) ─

  private async buildPortretPdf(node: Row, portret: Row | null): Promise<Buffer> {
    const pdf = await PDFDocument.create();
    let page = pdf.addPage([595, 842]); // A4
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

    let y = 800;
    const ensureSpace = (needed: number) => {
      if (y < 40 + needed) {
        page = pdf.addPage([595, 842]);
        y = 800;
      }
    };
    const draw = (text: string, opts?: { x?: number; bold?: boolean; size?: number; color?: ReturnType<typeof rgb> }) => {
      const size = opts?.size ?? 11;
      ensureSpace(size + 6);
      // toPdfSafeText: karta nomi/tavsifi/portret javoblari — dinamik DB-qiymat,
      // kirill bilan kiritilgan bo'lishi mumkin (Q-40 WinAnsi crash bag-fix, FAZA D).
      page.drawText(toPdfSafeText(text), {
        x: opts?.x ?? 50, y,
        size,
        font: opts?.bold ? bold : font,
        color: opts?.color ?? rgb(0, 0, 0),
      });
      y -= size + 6;
    };

    draw('EuroPrint — Karta Portret (Lavozim Kartochkasi)', { bold: true, size: 16 });
    y -= 2;
    draw(String(node['name'] ?? '-'), { bold: true, size: 13, color: rgb(0.1, 0.3, 0.6) });
    if (node['parent_name']) draw(`Bo'lim: ${String(node['parent_name'])}`, { size: 9, color: rgb(0.4, 0.4, 0.4) });
    if (node['description']) draw(this.truncate(String(node['description']), 95), { size: 9, color: rgb(0.3, 0.3, 0.3) });
    y -= 6;

    draw('Razryad / Malaka darajasi:', { bold: true, size: 12 });
    if (node['razryad_level_id']) {
      draw(`  Daraja: ${node['razryad_level']} — ${String(node['razryad_name'] ?? '-')}`, { size: 10 });
      if (node['razryad_min_requirement']) {
        draw(`  Talab: ${this.truncate(String(node['razryad_min_requirement']), 90)}`, { size: 9 });
      }
    } else {
      draw('  Belgilanmagan', { size: 9, color: rgb(0.6, 0.6, 0.6) });
    }
    y -= 4;

    draw("ЦКП (Yakuniy foydali mahsulot):", { bold: true, size: 12 });
    draw(`  ${node['tskp'] ? this.truncate(String(node['tskp']), 90) : '-'}`, { size: 9 });
    if (node['tskp_target'] != null) {
      draw(`  Target: ${node['tskp_target']} ${node['tskp_measurement_unit'] ?? ''}`.trimEnd(), { size: 9 });
    }
    y -= 4;

    draw('Oylik (vilkasi):', { bold: true, size: 12 });
    const minSalary = node['min_salary'] != null ? Number(node['min_salary']).toLocaleString('uz-UZ') : null;
    const maxSalary = node['max_salary'] != null ? Number(node['max_salary']).toLocaleString('uz-UZ') : null;
    if (minSalary || maxSalary) {
      draw(`  ${minSalary ?? '-'} — ${maxSalary ?? '-'} UZS (${node['salary_type'] ?? '-'})`, { size: 9 });
    } else {
      draw('  Belgilanmagan', { size: 9, color: rgb(0.6, 0.6, 0.6) });
    }
    y -= 8;

    draw('Talablar (Portret so\'rovnomasi):', { bold: true, size: 12 });
    if (!portret) {
      draw('  Portret hali to\'ldirilmagan', { size: 9, color: rgb(0.6, 0.6, 0.6) });
    } else {
      const fields: Array<[string, unknown]> = [
        ['Lavozim maqsadi', portret['main_purpose']],
        ['Muammo (bu lavozim nimani hal qiladi)', portret['problem_solved']],
        ["Bo'lim vazifalari", portret['department_duties']],
        ['Asosiy majburiyatlar', portret['main_duties']],
        ['Kutilayotgan natija', portret['expected_result']],
        ["Ta'lim darajasi", portret['education_req']],
        [
          'Tajriba talabi',
          portret['experience_required'] ? (portret['experience_field'] || 'Talab qilinadi') : "Talab qilinmaydi",
        ],
        ['Kasbiy ko\'nikmalar', portret['professional_skills']],
        ['Ish jadvali', portret['work_schedule']],
      ];
      for (const [label, val] of fields) {
        if (val === undefined || val === null || val === '') continue;
        draw(`  ${label}: ${this.truncate(String(val), 85)}`, { size: 9 });
      }
    }

    y -= 10;
    draw(`Hisobot: ${new Date().toISOString().replace('T', ' ').slice(0, 19)}`, { size: 8, color: rgb(0.5, 0.5, 0.5) });

    const bytes = await pdf.save();
    return Buffer.from(bytes);
  }

  private truncate(s: string, max: number): string {
    return s.length > max ? `${s.slice(0, max - 1)}…` : s;
  }
}
