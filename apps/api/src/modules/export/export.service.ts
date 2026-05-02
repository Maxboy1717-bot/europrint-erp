import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { Ok, Result } from '@common/result';
import { ExportRepository } from './export.repository';

const FALLBACK_CSV = (headers: string[]) => headers.join(',') + '\n';

@Injectable()
export class ExportService {
  constructor(private readonly repo: ExportRepository) {}

  async getEmployeesCsv(): Promise<Result<string>> {
    const r = await this.repo.queryEmployeesCsv();
    if (!r.ok) return Ok(FALLBACK_CSV(['employee_code','full_name','email','department','position','hire_date','is_active','status']));
    return r;
  }

  async getAttendanceCsv(): Promise<Result<string>> {
    const r = await this.repo.queryAttendanceCsv();
    if (!r.ok) return Ok(FALLBACK_CSV(['full_name','department','date','check_in','check_out','status','work_hours']));
    return r;
  }

  async getDisciplineCsv(): Promise<Result<string>> {
    const r = await this.repo.queryDisciplineCsv();
    if (!r.ok) return Ok(FALLBACK_CSV(['full_name','department','type','reason','date','status','resolved_at']));
    return r;
  }

  async getHrStatsPdf(): Promise<Result<Uint8Array>> {
    const statsR = await this.repo.queryHrStats();
    const stats = statsR.ok ? statsR.data : { total: '0', active: '0', present: '0', depts: [] };

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const { width } = page.getSize();

    let y = 800;
    const draw = (text: string, size = 11, isBold = false, color = rgb(0.1, 0.1, 0.1)) => {
      page.drawText(text, { x: 50, y, size, font: isBold ? boldFont : font, color });
      y -= size + 6;
    };
    const drawLine = () => {
      page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 0.5, color: rgb(0.6, 0.6, 0.6) });
      y -= 10;
    };

    draw('EUROPRINT HR HISOBOT', 18, true, rgb(0.1, 0.2, 0.6));
    draw(`Sana: ${_time.now().toLocaleDateString('uz-UZ')}`, 10, false, rgb(0.4, 0.4, 0.4));
    y -= 10;
    drawLine();

    draw('Xodimlar Statistikasi', 13, true);
    draw(`Jami xodimlar: ${stats.total}`);
    draw(`Aktiv xodimlar: ${stats.active}`);
    draw(`Bugun ishda: ${stats.present}`);
    y -= 8;
    drawLine();

    draw("Bo'limlar bo'yicha", 13, true);
    for (const d of stats.depts) {
      draw(`  ${d.name}: ${d.cnt} ta xodim`);
    }
    y -= 8;
    drawLine();
    draw('Europrint ERP tizimi tomonidan yaratildi', 9, false, rgb(0.5, 0.5, 0.5));

    const bytes = await pdfDoc.save();
    return Ok(bytes);
  }

  async getHrStatsExcel(): Promise<Result<Buffer>> {
    const r = await this.repo.queryHrExcel();
    if (!r.ok) return Ok(Buffer.from('\ufeffdepartment,total_employees,active,avg_tenure_years\n', 'utf-8'));
    return Ok(Buffer.from(`\ufeff${r.data}`, 'utf-8'));
  }
}
