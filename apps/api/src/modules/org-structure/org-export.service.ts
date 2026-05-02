import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable , Logger} from '@nestjs/common';
import { Result, AppError, safeCall } from '@common/result';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import ExcelJS from 'exceljs';
import { OrgExportRepository } from './org-export.repository';

@Injectable()
export class OrgExportService {
  private readonly logger = new Logger(OrgExportService.name);

  constructor(private readonly repo: OrgExportRepository) {}

  private async getFlatNodes() {
    return this.repo.getFlatNodes();
  }

  async exportExcel(): Promise<Result<object, AppError>>{
    return safeCall(async () => {
      this.logger.log(`Org tuzilishi eksport boshlanmoqda`);
      const nodesR = await this.getFlatNodes();
      const nodes = (nodesR.ok ? nodesR.data as Record<string, unknown>[] : []);
  
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'EuroPrint ERP';
      workbook.created = _time.now();
  
      const ws = workbook.addWorksheet('Tashkiliy Tuzilma', {
        pageSetup: { paperSize: 9, orientation: 'landscape' },
      });
  
      ws.columns = [
        { header: 'ID', key: 'id', width: 6 },
        { header: 'Bo\'lim / Lavozim', key: 'name', width: 36 },
        { header: 'Ota bo\'lim', key: 'parentName', width: 28 },
        { header: 'Turi', key: 'nodeType', width: 16 },
        { header: 'Daraja', key: 'hierarchyLevel', width: 10 },
        { header: 'Rahbar', key: 'headUserName', width: 28 },
        { header: 'Xodim soni', key: 'employeeCount', width: 14 },
        { header: 'QYaM', key: 'tskp', width: 40 },
      ];
  
      const NODE_TYPE_LABELS: Record<string, string> = {
        owner: 'Egasi',
        top_director: 'Bosh Direktor',
        director: 'Direktor',
        department: 'Bo\'lim',
        section: 'Sektor',
        position: 'Lavozim',
      };
  
      const LEVEL_COLORS: Record<number, string> = {
        0: 'FF7C3AED',
        1: 'FF1D4ED8',
        2: 'FF16A34A',
        3: 'FFB45309',
        4: 'FFDC2626',
      };
  
      // Header row styling
      const headerRow = ws.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF5D2E' } };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      headerRow.height = 22;
  
      (nodes ?? []).forEach((node) => {
        const row = ws.addRow({
          id: node.id,
          name: '  '.repeat(Number(node.hierarchyLevel) || 0) + node.name,
          parentName: node.parentName || '—',
          nodeType: NODE_TYPE_LABELS[String(node.nodeType)] || node.nodeType,
          hierarchyLevel: node.hierarchyLevel,
          headUserName: node.headUserName || 'Vakant',
          employeeCount: node.employeeCount || 0,
          tskp: node.tskp || '—',
        });
  
        const levelColor = LEVEL_COLORS[Number(node.hierarchyLevel)] || 'FF4B5563';
        row.getCell('name').font = { color: { argb: levelColor }, bold: Number(node.hierarchyLevel) <= 1 };
  
        if (!node.headUserName) {
          row.getCell('headUserName').font = { color: { argb: 'FFEF4444' }, italic: true };
        }
  
        row.getCell('employeeCount').alignment = { horizontal: 'center' };
        row.getCell('id').alignment = { horizontal: 'center' };
        row.getCell('hierarchyLevel').alignment = { horizontal: 'center' };
  
        if (node.hierarchyLevel === 0) {
          row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3E8FF' } };
        } else if (node.hierarchyLevel === 1) {
          row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } };
        }
      });
  
      // Borders for all used cells
      ws.eachRow((row) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          };
        });
      });
  
      // Summary sheet
      const totalRow = ws.addRow([]);
      totalRow.height = 6;
  
      const summaryWs = workbook.addWorksheet('Statistika');
      summaryWs.columns = [
        { header: 'Ko\'rsatkich', key: 'label', width: 32 },
        { header: 'Qiymat', key: 'value', width: 20 },
      ];
      const totalEmployees = (Array.isArray(nodes) ? nodes : []).reduce((s, n) => s + (Number(n.employeeCount) || 0), 0);
      const vacantNodes = (Array.isArray(nodes) ? nodes : []).filter((n) => !n.headUserName).length;
      summaryWs.addRow({ label: 'Jami bo\'limlar', value: nodes.length });
      summaryWs.addRow({ label: 'Jami xodimlar', value: totalEmployees });
      summaryWs.addRow({ label: 'Vakant lavozimlar', value: vacantNodes });
      summaryWs.addRow({ label: 'Eksport sanasi', value: _time.now().toLocaleDateString('uz-UZ') });
  
      summaryWs.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      summaryWs.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF5D2E' } };
  
      const buffer = await workbook.xlsx.writeBuffer();
      return Buffer.from(buffer);
    });
  }

  async exportPdf(): Promise<Result<Buffer, AppError>> {
    return safeCall(async () => {
    const nodesR = await this.getFlatNodes();
    const nodes = (nodesR.ok ? nodesR.data as Record<string, unknown>[] : []);

    const NODE_TYPE_LABELS: Record<string, string> = {
      owner: 'Egasi', top_director: 'Bosh Direktor', director: 'Direktor',
      department: "Bo'lim", section: 'Sektor', position: 'Lavozim',
    };

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const pageWidth = 841.89;  // A4 landscape
    const pageHeight = 595.28;
    const margin = 36;
    const rowH = 20;

    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;

    const drawText = (
      text: string,
      x: number,
      yPos: number,
      opts: { size?: number; bold?: boolean; color?: [number, number, number] } = {}
    ) => {
      const { size = 8, bold = false, color = [0, 0, 0] } = opts;
      const f = bold ? fontBold : font;
      const safeText = String(text || '').replace(/[^\x20-\x7E\u0020-\u007E]/g, '?');
      page.drawText(safeText, {
        x, y: yPos, size, font: f, color: rgb(color[0], color[1], color[2]),
        maxWidth: pageWidth - margin * 2 - 10,
      });
    };

    // Header
    page.drawRectangle({
      x: margin, y: y - 32, width: pageWidth - margin * 2, height: 36,
      color: rgb(1, 0.365, 0.18),
    });
    drawText('EuroPrint — Tashkiliy Tuzilma', margin + 8, y - 12, { size: 16, bold: true, color: [1, 1, 1] });
    drawText(`Eksport: ${_time.now().toLocaleDateString('uz-UZ')} | Jami bo'limlar: ${nodes.length}`, margin + 8, y - 26, { size: 8, color: [1, 1, 1] });
    y -= 48;

    // Column definitions
    const cols = [
      { label: '#', width: 30, key: 'id' },
      { label: "Bo'lim / Lavozim", width: 220, key: 'name' },
      { label: 'Turi', width: 80, key: 'nodeType' },
      { label: 'Rahbar', width: 160, key: 'headUserName' },
      { label: 'Xodim', width: 50, key: 'employeeCount' },
      { label: 'QYaM', width: 230, key: 'tskp' },
    ];

    const drawRow = (rowData: unknown[], isHeader = false) => {
      if (y < margin + rowH + 10) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
      }
      const bg = isHeader ? rgb(0.95, 0.95, 0.95) : rgb(1, 1, 1);
      page.drawRectangle({ x: margin, y: y - rowH + 4, width: pageWidth - margin * 2, height: rowH, color: bg });

      let x = margin + 4;
      (cols ?? []).forEach((col, i) => {
        const val = String(rowData[i] || '');
        const truncated = val.length > 40 ? val.slice(0, 38) + '..' : val;
        drawText(truncated, x, y - 12, { bold: isHeader, size: isHeader ? 8 : 7.5 });
        x += col.width;
      });

      // Bottom border
      page.drawLine({ start: { x: margin, y: y - rowH + 4 }, end: { x: pageWidth - margin, y: y - rowH + 4 }, thickness: 0.3, color: rgb(0.8, 0.8, 0.8) });
      y -= rowH;
    };

    // Draw header row
    drawRow((cols ?? []).map((c) => c.label), true);

    // Draw data rows
    const LEVEL_COLORS_RGB: Record<number, [number, number, number]> = {
      0: [0.49, 0.23, 0.93],
      1: [0.11, 0.31, 0.85],
      2: [0.09, 0.64, 0.29],
      3: [0.71, 0.33, 0.04],
      4: [0.86, 0.15, 0.15],
    };

    (nodes ?? []).forEach((node) => {
      const indent = '  '.repeat(Number(node.hierarchyLevel) || 0);
      const color = LEVEL_COLORS_RGB[Number(node.hierarchyLevel)] || [0.3, 0.3, 0.3];
      const nameText = indent + node.name;
      const typeText = NODE_TYPE_LABELS[String(node.nodeType)] || node.nodeType;
      const headText = node.headUserName || 'Vakant';
      const empText = String(node.employeeCount || 0);
      const tskpText = node.tskp || '—';

      if (y < margin + rowH + 10) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
      }

      const bgColor = node.hierarchyLevel === 0 ? rgb(0.97, 0.94, 1) : node.hierarchyLevel === 1 ? rgb(0.94, 0.96, 1) : rgb(1, 1, 1);
      page.drawRectangle({ x: margin, y: y - rowH + 4, width: pageWidth - margin * 2, height: rowH, color: bgColor });

      let x = margin + 4;
      const vals = [String(node.id), nameText, typeText, headText, empText, tskpText];
      (cols ?? []).forEach((col, i) => {
        const val = String(vals[i] || '');
        const truncated = val.length > 40 ? val.slice(0, 38) + '..' : val;
        const isName = i === 1;
        const textColor: [number, number, number] = isName ? color : (i === 3 && !node.headUserName ? [0.93, 0.27, 0.27] : [0.1, 0.1, 0.1]);
        drawText(truncated, x, y - 12, { size: 7.5, bold: isName && Number(node.hierarchyLevel) <= 1, color: textColor });
        x += col.width;
      });

      page.drawLine({ start: { x: margin, y: y - rowH + 4 }, end: { x: pageWidth - margin, y: y - rowH + 4 }, thickness: 0.3, color: rgb(0.87, 0.87, 0.87) });
      y -= rowH;
    });

    // Footer
    if (y > margin + 20) {
      page.drawLine({ start: { x: margin, y: y - 8 }, end: { x: pageWidth - margin, y: y - 8 }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });
      drawText('EuroPrint ERP — Tashkiliy Tuzilma Eksporti', margin, y - 18, { size: 7, color: [0.5, 0.5, 0.5] });
    }

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
    });
  }
}
