/**
 * @module inspection-pdf.helpers
 * @description PDF generation + Object Storage helpers split from inspection.service.ts (Rule 16).
 */

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { Result, AppError, Err, Ok } from '@common/result';
import { TashkentTimeService } from '@common/time';
import { objectStorageClient } from '../../../lib/objectStorage';
import { randomUUID } from 'crypto';
import type { ManualInspectionDto } from './dto/inspection.dto';

const _time = new TashkentTimeService();

/** Parse `/bucket/object/path` or `gs://bucket/path` into { bucketName, objectName } */
export function parseBucketPath(fullPath: string): Result<{ bucketName: string; objectName: string }> {
  let normalized = fullPath.startsWith('gs://') ? fullPath.replace(/^gs:\/\//, '/') : fullPath;
  if (!normalized.startsWith('/')) normalized = `/${normalized}`;
  const parts      = normalized.split('/');
  const bucketName = parts[1] ?? '';
  const objectPath = parts.slice(2).join('/');
  if (!bucketName) return Err(`Noto'g'ri Object Storage path: "${fullPath}"`);
  return Ok({ bucketName, objectName: objectPath });
}

export async function storeImage(roomCode: string, imageBase64: string, suffix: string): Promise<Result<string>> {
  const privateDir = process.env['PRIVATE_OBJECT_DIR'] ?? '';
  if (!privateDir) return Err('PRIVATE_OBJECT_DIR sozlanmagan — Object Storage kerak');

  const pathResult = parseBucketPath(privateDir);
  if (!pathResult.ok) return Err(pathResult.error);
  const { bucketName, objectName: objPrefix } = pathResult.data;
  const objectName  = `${objPrefix}/inspection/rooms/${roomCode}/${suffix}-${randomUUID()}.jpg`;
  const base64Data  = imageBase64.includes(',') ? imageBase64.split(',')[1]! : imageBase64;
  const buffer      = Buffer.from(base64Data, 'base64');

  await objectStorageClient.bucket(bucketName).file(objectName).save(buffer, {
    metadata: { contentType: 'image/jpeg' },
  });
  return Ok(`https://storage.googleapis.com/${bucketName}/${objectName}`);
}

export async function storePdfBuffer(buffer: Buffer, analysisId: string): Promise<Result<string>> {
  const privateDir = process.env['PRIVATE_OBJECT_DIR'] ?? '';
  if (!privateDir) return Err('PRIVATE_OBJECT_DIR sozlanmagan — Object Storage kerak');

  const pathResult = parseBucketPath(privateDir);
  if (!pathResult.ok) return Err(pathResult.error);
  const { bucketName, objectName: objPrefix } = pathResult.data;
  const objectName = `${objPrefix}/inspection/checklists/${analysisId}.pdf`;

  await objectStorageClient.bucket(bucketName).file(objectName).save(buffer, {
    metadata: { contentType: 'application/pdf' },
  });
  return Ok(`https://storage.googleapis.com/${bucketName}/${objectName}`);
}

export async function generateChecklistPdf(
  analysisId: string,
  dto: ManualInspectionDto,
  inspectorId?: string,
): Promise<Result<string, AppError>> {
  try {
    const pdfDoc   = await PDFDocument.create();
    const page     = pdfDoc.addPage([595, 842]);
    const font     = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const { width, height } = page.getSize();
    let y = height - 60;

    page.drawText('XONA INSPEKSIYASI CHECKLIST', {
      x: 40, y, size: 18, font: boldFont, color: rgb(0.12, 0.28, 0.60),
    });
    y -= 30;
    page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 1, color: rgb(0.7, 0.7, 0.7) });
    y -= 20;

    const addRow = (label: string, value: string) => {
      page.drawText(`${label}:`, { x: 40, y, size: 10, font: boldFont, color: rgb(0.3, 0.3, 0.3) });
      page.drawText(value, { x: 180, y, size: 10, font, color: rgb(0.1, 0.1, 0.1) });
      y -= 18;
    };

    addRow('Xona kodi',       dto.room_code);
    addRow('Inspeksiya vaqti', _time.now().toLocaleString('uz'));
    addRow('Inspektor ID',    inspectorId ?? 'Noaniq');
    addRow('Tahlil ID',       analysisId);

    y -= 10;
    page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });
    y -= 18;

    const stars = (n: number) => (Array(5).fill(0) ?? []).map((_, i) => i < n ? '★' : '☆').join('');
    addRow('Tozalik',     `${stars(dto.cleanliness)}  (${dto.cleanliness}/5)`);
    addRow('Tartib',      `${stars(dto.order_score)}  (${dto.order_score}/5)`);
    addRow('Jihozlar',    dto.equipment_ok ? 'OK — Joyida' : 'MUAMMO — Tekshirilsin');
    addRow('Favqulodda',  dto.emergency_issues ? 'HA — Zudlik bilan!' : 'Yo\'q');

    if (dto.notes) {
      y -= 5;
      page.drawText('Izohlar:', { x: 40, y, size: 10, font: boldFont, color: rgb(0.3, 0.3, 0.3) });
      y -= 15;
      page.drawText(String(dto.notes ?? '').slice(0, 120), { x: 40, y, size: 9, font, color: rgb(0.2, 0.2, 0.2) });
      y -= 15;
    }

    y -= 20;
    const overallScore = ((dto.cleanliness + dto.order_score) / 10) * 100;
    const scoreColor   = overallScore >= 80 ? rgb(0.1, 0.5, 0.1)
                       : overallScore >= 60 ? rgb(0.8, 0.5, 0)
                       : rgb(0.7, 0.1, 0.1);
    page.drawText(`UMUMIY BAL: ${Math.round(overallScore)}%`, {
      x: 40, y, size: 14, font: boldFont, color: scoreColor,
    });
    page.drawText('EuroPrint ERP — Inspeksiya Moduli  v2.0', {
      x: 40, y: 30, size: 8, font, color: rgb(0.6, 0.6, 0.6),
    });

    const pdfBytes  = await pdfDoc.save();
    const pdfResult = await storePdfBuffer(Buffer.from(pdfBytes), analysisId);
    if (!pdfResult.ok) return Err(pdfResult.error);
    return Ok(pdfResult.data);
  } catch (e: unknown) {
    return Err(e instanceof Error ? e.message : String(e));
  }
}
