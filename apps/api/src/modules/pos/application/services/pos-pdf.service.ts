/**
 * @module pos-pdf.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { castTo } from '@common/db-rows';
import { Result, AppError, safeCall } from '@common/result';
import { PDFDocument, StandardFonts, rgb, PageSizes, PDFPage, PDFFont } from 'pdf-lib';
import { posMovements, db, eq } from '@workspace/db';
import { resolveActTitle } from '../../dto/movement-enums';
import { toPdfSafeText } from '@common/pdf/pdf-safe-text.helper';
import { PosPdfInventoryService } from './pos-pdf-inventory.service';
import { PosPdfRepository } from '../../infrastructure/repositories/pos-pdf.repository';
import { PosEmployeeBalanceRepository } from '../../infrastructure/repositories/pos-employee-balance.repository';
import type { EmployeeInventoryItem } from '../../infrastructure/repositories/pos-employee-balance.repository';
import type { PdfMovementData } from './pos-pdf.types';

const PDF_MARGIN = 40;
const PDF_TITLE_FONT_SIZE = 14;
const PDF_HEADER_FONT_SIZE = 11;
const PDF_BODY_FONT_SIZE = 9;
const PDF_SMALL_FONT_SIZE = 8;
const PDF_FOOTER_FONT_SIZE = 7;
const PDF_TOP_OFFSET = 50;
const PDF_MIN_Y_BEFORE_NEW_PAGE = 80;
const PDF_TRUNCATE_MAX_CHARS = 28;
const PDF_LINE_HEIGHT_LG = 25;
const PDF_LINE_HEIGHT_MD = 20;
const PDF_LINE_HEIGHT_SM = 16;
const PDF_LINE_HEIGHT_XS = 14;
const PDF_CELL_OFFSET_X = 3;
const PDF_CELL_TEXT_Y_OFFSET_HD = 11;
const PDF_CELL_TEXT_Y_OFFSET_BD = 9;
const PDF_TABLE_ROW_HEIGHT = 16;
const PDF_SEPARATOR_THICKNESS = 0.3;
const PDF_SEPARATOR_Y_OFFSET = 13;
const PDF_ROW_SKIP = 5;
const PDF_SIGNATURE_Y_GAP = 40;
const PDF_SIGNATURE_LINE_X_START = 120;
const PDF_SIGNATURE_LINE_X_END = 280;
const PDF_SIGNATURE_LINE_THICKNESS = 0.5;

@Injectable()
export class PosPdfService {
  private readonly logger = new Logger(PosPdfService.name);

  constructor(
    private readonly inventorySvc: PosPdfInventoryService,
    private readonly pdfRepo: PosPdfRepository,
    private readonly employeeBalanceRepo: PosEmployeeBalanceRepository,
  ) {}

  // ─── Harakat Akti ─────────────────────────────────────────────────────────

  async generateMovementAct(movementId: number): Promise<Result<object, AppError>>{
    return safeCall(async () => {
      this.logger.log(`POS PDF generatsiya boshlanmoqda`);
      // Ma'lumotlarni yig'ish
      const [movement] = await db
        .select()
        .from(posMovements)
        .where(eq(posMovements.id, movementId));

      if (!movement) throw new NotFoundException(`Harakat topilmadi: ${movementId}`);

      // FAZA D bag-fix (2026-07-01): `linesRows` — `Result<PdfMovementLine[]>`, array emas.
      // Avval to'g'ridan `castTo(linesRows).map(...)` chaqirilardi — Result-obyektning
      // o'zida `.map` yo'q ("castTo(...).map is not a function", Q-46/Q-40 bag-fix).
      const linesResultR = await this.pdfRepo.getMovementLines(movementId);
      if (!linesResultR.ok) throw new InternalServerErrorException(linesResultR.error.message);
      const linesRows = linesResultR.data;
      const createdByName = await this.pdfRepo.getCreatorFullName(movement.createdBy as number);

      const data: PdfMovementData = {
        movementNumber:  movement.movementNumber,
        typeCode:        movement.movementType?.toString() ?? '',
        status:          movement.status,
        createdAt:       movement.createdAt,
        supplierName:    (movement as { supplierName?: string }).supplierName ?? null,
        documentNumber:  (movement as { documentNumber?: string }).documentNumber ?? null,
        fromWarehouse:   null,
        toWarehouse:     null,
        createdByName: createdByName.ok ? String(createdByName.data ?? '') : '',
        lines: (castTo<Record<string, unknown>[]>(linesRows)).map((r) => ({
          xomAshyo:      r['xom_ashyo'] as string,
          quantity:      Number(r['quantity']),
          unitOfMeasure: r['unit_of_measure'] as string,
          unitPrice:     Number(r['unit_price']),
          totalPrice:    Number(r['total_price']),
          currency:      r['currency'] as string ?? 'UZS',
          batchId:       r['batch_id'] as string ?? null,
          expiryDate:    r['expiry_date'] ? new Date(r['expiry_date'] as string) : null,
        })),
      };

      return this._buildPdf(data);
    });
  }

  // ─── Xodim Inventar Hisoboti (Mening inventarim → PDF) ────────────────────
  // APPROVED: egasi vizyon-qurish 2026-07-01, FAZA H (xodim inventari to'liqlash)

  async generateEmployeeInventoryPdf(userId: number): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      this.logger.log(`POS xodim inventar PDF generatsiya boshlanmoqda: userId=${userId}`);

      const itemsR = await this.employeeBalanceRepo.getInventory(userId);
      if (!itemsR.ok) throw new InternalServerErrorException(itemsR.error.message);
      const items = itemsR.data;

      const nameR = await this.pdfRepo.getCreatorFullName(userId);
      const employeeName = (nameR.ok ? nameR.data : null) ?? `Xodim #${userId}`;

      return this._buildEmployeeInventoryPdf(employeeName, items);
    });
  }

  private async _buildEmployeeInventoryPdf(
    employeeName: string,
    items: EmployeeInventoryItem[],
  ): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage(PageSizes.A4);
    const { width, height } = page.getSize();
    const fontBold    = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const margin = PDF_MARGIN;
    let y = height - PDF_TOP_OFFSET;

    // toPdfSafeText: sarlavha + xodim ismi (kirill kiritilgan bo'lishi mumkin) —
    // WinAnsi-crash oldini oladi (Q-40, FAZA D bag-fix).
    const title = toPdfSafeText('XODIM INVENTAR HISOBOTI / ОТЧЁТ ПО ИНВЕНТАРЮ');
    const titleWidth = fontBold.widthOfTextAtSize(title, PDF_TITLE_FONT_SIZE);
    page.drawText(title, { x: (width - titleWidth) / 2, y, size: PDF_TITLE_FONT_SIZE, font: fontBold, color: rgb(0, 0, 0) });
    y -= PDF_LINE_HEIGHT_MD;

    page.drawText(toPdfSafeText(`Xodim / Сотрудник: ${employeeName}`), { x: margin, y, size: PDF_BODY_FONT_SIZE, font: fontRegular, color: rgb(0.1, 0.1, 0.1) });
    y -= PDF_LINE_HEIGHT_XS;
    page.drawText(toPdfSafeText(`Sana / Дата: ${this._formatDate(_time.now())}`), { x: margin, y, size: PDF_BODY_FONT_SIZE, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });
    y -= PDF_LINE_HEIGHT_MD;

    const cols = ['Kod', 'Material', "O'lch.", 'Berilgan', 'Qaytarilgan', 'Balans', 'Qiymat'];
    const colWidth = (width - margin * 2) / cols.length;

    page.drawRectangle({ x: margin, y: y - PDF_LINE_HEIGHT_XS, width: width - margin * 2, height: PDF_TABLE_ROW_HEIGHT, color: rgb(0.9, 0.9, 0.9) });
    for (let i = 0; i < cols.length; i++) {
      page.drawText(cols[i], { x: margin + i * colWidth + PDF_CELL_OFFSET_X, y: y - PDF_CELL_TEXT_Y_OFFSET_HD, size: PDF_SMALL_FONT_SIZE, font: fontBold, color: rgb(0, 0, 0) });
    }
    y -= PDF_LINE_HEIGHT_MD;

    let totalValue = 0;
    for (const item of items) {
      if (y < PDF_MIN_Y_BEFORE_NEW_PAGE) {
        page = pdfDoc.addPage(PageSizes.A4);
        y = page.getSize().height - PDF_TOP_OFFSET;
      }
      const cells = [
        item.materialCode ?? '—',
        this._truncate(item.materialName ?? '—', PDF_TRUNCATE_MAX_CHARS),
        item.unitOfMeasure ?? '—',
        item.given.toFixed(2),
        item.returned.toFixed(2),
        item.balance.toFixed(2),
        this._formatMoney(item.totalValue),
      ];
      for (let i = 0; i < cells.length; i++) {
        // toPdfSafeText: materialName kirill bilan kiritilgan bo'lishi mumkin.
        page.drawText(toPdfSafeText(cells[i]), { x: margin + i * colWidth + PDF_CELL_OFFSET_X, y: y - PDF_CELL_TEXT_Y_OFFSET_BD, size: PDF_SMALL_FONT_SIZE, font: fontRegular, color: rgb(0, 0, 0) });
      }
      page.drawLine({ start: { x: margin, y: y - PDF_SEPARATOR_Y_OFFSET }, end: { x: width - margin, y: y - PDF_SEPARATOR_Y_OFFSET }, thickness: PDF_SEPARATOR_THICKNESS, color: rgb(0.8, 0.8, 0.8) });
      totalValue += item.totalValue;
      y -= PDF_LINE_HEIGHT_SM;
    }

    y -= PDF_ROW_SKIP;
    page.drawText(`Jami qiymat: ${this._formatMoney(totalValue)} UZS`, { x: margin, y, size: PDF_BODY_FONT_SIZE, font: fontBold, color: rgb(0, 0, 0) });

    const pages = pdfDoc.getPages();
    const lastPage = pages[pages.length - 1] ?? page;
    lastPage.drawText(`EuroPrint ERP | POS | ${_time.now().toLocaleDateString('uz-UZ')}`, {
      x: margin, y: 20, size: PDF_FOOTER_FONT_SIZE, font: fontRegular, color: rgb(0.5, 0.5, 0.5),
    });

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

  // ─── PDF Qurishqalish ─────────────────────────────────────────────────────

  private async _buildPdf(data: PdfMovementData): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage(PageSizes.A4);
    const { width, height } = page.getSize();

    const fontBold    = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const margin   = PDF_MARGIN;
    const colWidth = (width - margin * 2) / 5;
    let y = height - PDF_TOP_OFFSET;

    y = this._drawHeader(page, data, fontBold, width, y);
    y = this._drawMeta(page, data, fontRegular, margin, y);
    y = this._drawTable(page, pdfDoc, data, fontRegular, fontBold, margin, colWidth, y);

    // ─── Footer ───────────────────────────────────────────────────────────
    const pages = pdfDoc.getPages();
    const lastPage = pages[pages.length - 1] ?? pdfDoc.addPage(PageSizes.A4);
    lastPage.drawText(`EuroPrint ERP | POS | ${_time.now().toLocaleDateString('uz-UZ')}`, {
      x: margin,
      y: 20,
      size: PDF_FOOTER_FONT_SIZE,
      font: fontRegular,
      color: rgb(0.5, 0.5, 0.5),
    });

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

  // ─── Private draw helpers ─────────────────────────────────────────────────

  private _drawHeader(
    page: PDFPage,
    data: PdfMovementData,
    fontBold: PDFFont,
    width: number,
    startY: number,
  ): number {
    let y = startY;
    // FAZA D (2026-07-01): kategoriya-bo'yicha akt sarlavhasi — har turi (KIRIM/
    // CHIQIM/KOCHIRISH/INVENTARIZATSIYA/ZARAR) o'z nomi bilan chiqadi (bo'shliq
    // yopildi: avval hammasi bitta generic "HARAKAT AKTI" edi).
    const title = toPdfSafeText(resolveActTitle(data.typeCode));
    const titleWidth = fontBold.widthOfTextAtSize(title, PDF_TITLE_FONT_SIZE);
    page.drawText(title, {
      x: (width - titleWidth) / 2,
      y,
      size: PDF_TITLE_FONT_SIZE,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    y -= PDF_LINE_HEIGHT_MD;

    const numLine = toPdfSafeText(`№ ${data.movementNumber}`);
    page.drawText(numLine, {
      x: (width - fontBold.widthOfTextAtSize(numLine, PDF_HEADER_FONT_SIZE)) / 2,
      y,
      size: PDF_HEADER_FONT_SIZE,
      font: fontBold,
      color: rgb(0.2, 0.2, 0.2),
    });
    y -= PDF_LINE_HEIGHT_LG;
    return y;
  }

  private _drawMeta(
    page: PDFPage,
    data: PdfMovementData,
    fontRegular: PDFFont,
    margin: number,
    startY: number,
  ): number {
    let y = startY;
    const meta = [
      [`Sana / Дата:`,          this._formatDate(data.createdAt)],
      [`Holat / Статус:`,       this._translateStatus(data.status)],
      [`Tuzuvchi / Составил:`,  data.createdByName ?? '—'],
      [`Yetkazuvchi:`,          data.supplierName ?? '—'],
      [`Hujjat raqami:`,        data.documentNumber ?? '—'],
    ];

    for (const [label, value] of meta) {
      // toPdfSafeText: `label` — static uz/ru yorliq (kirill bo'lishi mumkin);
      // `value` — dinamik DB-qiymat (createdByName/supplierName kirill bilan
      // kiritilgan bo'lsa ham) — ikkalasi ham WinAnsi-xavfsiz qilinadi (Q-40).
      page.drawText(toPdfSafeText(`${label}  ${value}`), {
        x: margin,
        y,
        size: PDF_BODY_FONT_SIZE,
        font: fontRegular,
        color: rgb(0.1, 0.1, 0.1),
      });
      y -= PDF_LINE_HEIGHT_XS;
    }
    y -= PDF_LINE_HEIGHT_XS / 2;
    return y;
  }

  private _drawTable(
    page: PDFPage,
    pdfDoc: PDFDocument,
    data: PdfMovementData,
    fontRegular: PDFFont,
    fontBold: PDFFont,
    margin: number,
    colWidth: number,
    startY: number,
  ): number {
    let y = startY;
    const { width } = page.getSize();

    // ─── Jadval sarlavhasi ────────────────────────────────────────────────
    const headers = ['Nomi', 'Miqdor', "O'lch.", 'Narx', 'Jami'];
    const headerColor = rgb(0.9, 0.9, 0.9);

    page.drawRectangle({
      x: margin,
      y: y - PDF_LINE_HEIGHT_XS,
      width: width - margin * 2,
      height: PDF_TABLE_ROW_HEIGHT,
      color: headerColor,
    });

    for (let i = 0; i < headers.length; i++) {
      page.drawText(headers[i], {
        x: margin + i * colWidth + PDF_CELL_OFFSET_X,
        y: y - PDF_CELL_TEXT_Y_OFFSET_HD,
        size: PDF_SMALL_FONT_SIZE,
        font: fontBold,
        color: rgb(0, 0, 0),
      });
    }
    y -= PDF_LINE_HEIGHT_MD;

    // ─── Jadval qatorlari ─────────────────────────────────────────────────
    let totalSum = 0;
    let totalQty = 0;
    let activePage = page;

    for (const line of data.lines) {
      if (y < PDF_MIN_Y_BEFORE_NEW_PAGE) {
        activePage = pdfDoc.addPage(PageSizes.A4);
        y = activePage.getSize().height - PDF_TOP_OFFSET;
      }

      const cells = [
        this._truncate(line.xomAshyo, PDF_TRUNCATE_MAX_CHARS),
        line.quantity.toFixed(2),
        line.unitOfMeasure,
        this._formatMoney(line.unitPrice),
        this._formatMoney(line.totalPrice),
      ];

      for (let i = 0; i < cells.length; i++) {
        // toPdfSafeText: material nomi (xomAshyo) kirill bilan kiritilgan bo'lishi
        // mumkin bo'lgan dinamik DB-qiymat — WinAnsi-crash oldini oladi (Q-40).
        activePage.drawText(toPdfSafeText(cells[i]), {
          x: margin + i * colWidth + PDF_CELL_OFFSET_X,
          y: y - PDF_CELL_TEXT_Y_OFFSET_BD,
          size: PDF_SMALL_FONT_SIZE,
          font: fontRegular,
          color: rgb(0, 0, 0),
        });
      }

      // Chegara
      activePage.drawLine({
        start: { x: margin, y: y - PDF_SEPARATOR_Y_OFFSET },
        end:   { x: width - margin, y: y - PDF_SEPARATOR_Y_OFFSET },
        thickness: PDF_SEPARATOR_THICKNESS,
        color: rgb(0.8, 0.8, 0.8),
      });

      totalSum += line.totalPrice;
      totalQty += line.quantity;
      y -= PDF_LINE_HEIGHT_SM;
    }

    // ─── Jami ─────────────────────────────────────────────────────────────
    y -= PDF_ROW_SKIP;
    activePage.drawText(
      `Jami miqdor: ${totalQty.toFixed(2)}   Jami summa: ${this._formatMoney(totalSum)} UZS`,
      { x: margin, y, size: PDF_BODY_FONT_SIZE, font: fontBold, color: rgb(0, 0, 0) },
    );

    // ─── Imzolar ──────────────────────────────────────────────────────────
    y -= PDF_SIGNATURE_Y_GAP;
    const sigLabels = ['Berdi / Отпустил:', 'Qabul qildi / Принял:', 'Tekshirdi / Проверил:'];
    for (const label of sigLabels) {
      activePage.drawText(toPdfSafeText(label), { x: margin, y, size: PDF_SMALL_FONT_SIZE, font: fontRegular, color: rgb(0, 0, 0) });
      activePage.drawLine({
        start: { x: margin + PDF_SIGNATURE_LINE_X_START, y },
        end:   { x: margin + PDF_SIGNATURE_LINE_X_END, y },
        thickness: PDF_SIGNATURE_LINE_THICKNESS,
        color: rgb(0.3, 0.3, 0.3),
      });
      y -= PDF_LINE_HEIGHT_LG;
    }

    return y;
  }

  // ─── Yordamchi metodlar ───────────────────────────────────────────────────

  private _formatDate(d: Date): string {
    return d.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  private _formatMoney(amount: number): string {
    return amount.toLocaleString('uz-UZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  private _truncate(text: string, maxLen: number): string {
    return text.length > maxLen ? text.substring(0, maxLen - 1) + '…' : text;
  }

  private _translateStatus(status: string): string {
    const map: Record<string, string> = {
      draft:          'Qoralama',
      qc_pending:     'QC kutmoqda',
      qc_approved:    'QC tasdiqlandi',
      qc_rework:      'QC qayta ishlash',
      qc_rejected:    'QC rad etildi',
      pending:        'Kutilmoqda',
      approved:       'Tasdiqlandi',
      ai_processing:  'AI qayta ishlaydi',
      completed:      'Yakunlandi',
      cancelled:      'Bekor qilindi',
    };
    return map[status] ?? status;
  }

  async generateInventoryCountPdf(countId: number): Promise<Buffer> {
    const r = await this.inventorySvc.generateInventoryCountPdf(countId);
    if (!r.ok) throw new InternalServerErrorException(r.error.message);
    return r.data as Buffer;
  }
}
