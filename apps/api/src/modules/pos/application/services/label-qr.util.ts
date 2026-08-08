/**
 * @module label-qr.util
 * @description QR-kod generatsiya yordamchisi (label.service/label-ext.service uchun).
 *   `qrcode` (npm, ISC litsenziya, real ISO/IEC-18004 encoder) paketining ochiq
 *   `create()` API'sidan foydalanadi — bu funksiya kutubxonaning barcha rasmiy
 *   renderer'lari (PNG/SVG/terminal) tomonidan ham ishlatiladigan hujjatlashtirilgan
 *   ochiq yuza (public surface), shuning uchun ichki/beqaror API emas.
 *   Natija — haqiqiy QR modul-matritsasi (chiziq emas, real ISO QR simvoli).
 * @layer Utility (POS — Barcode/QR/Etiket FAZA)
 */

import * as QRCode from 'qrcode';
import {
  QR_QUIET_ZONE_MODULES,
  QR_EPL_MODULE_SCALE,
  QR_EPL_MODULE_SCALE_COMPACT,
} from '@common/constants/app.constants';

export interface QrMatrix {
  /** Modul tomonining o'lchami (QR versiyasiga bog'liq, masalan 21, 25, 29...). */
  size: number;
  /** (row, col) pozitsiyasi qora (true) yoki oq (false) modulmi. */
  isDark: (row: number, col: number) => boolean;
}

export interface QrBitmap {
  /** Har qatordagi baytlar soni (8 piksel/bayt, MSB=chap). */
  widthBytes: number;
  /** Bitmap kengligi piksel (dot) da. */
  widthPx: number;
  /** Bitmap balandligi piksel (dot) da. */
  heightPx: number;
  /** 1-bit monoxrom raster ma'lumot (widthBytes * heightPx uzunlik), 1=qora nuqta. */
  bytes: Buffer;
}

/**
 * Haqiqiy QR-kod modul-matritsasini generatsiya qiladi (ISO/IEC 18004 encoder).
 * @param data     QR ichiga yoziladigan matn (barkod|material-kod|partiya va h.k.)
 * @param ecLevel  Xato-tuzatish darajasi (L/M/Q/H) — standart 'M'.
 */
export function generateQrMatrix(data: string, ecLevel: 'L' | 'M' | 'Q' | 'H' = 'M'): QrMatrix {
  const qr = QRCode.create(data, { errorCorrectionLevel: ecLevel });
  return {
    size: qr.modules.size,
    isDark: (row: number, col: number) => !!qr.modules.get(row, col),
  };
}

/**
 * QR matritsasini 1-bit monoxrom bitmap'ga o'giradi (EPL2 `GW` grafik buyrug'i uchun).
 * Har modul `scale` x `scale` piksel bo'lib chiziladi, atrofida ISO jim-zona (quiet zone)
 * qo'shiladi (skanerlash ishonchliligi uchun majburiy — ISO/IEC 18004 §5.3.2).
 */
export function qrMatrixToBitmap(qr: QrMatrix, compact: boolean = false): QrBitmap {
  const scale = compact ? QR_EPL_MODULE_SCALE_COMPACT : QR_EPL_MODULE_SCALE;
  const modulesSide = qr.size + QR_QUIET_ZONE_MODULES * 2;
  const widthPx = modulesSide * scale;
  const heightPx = modulesSide * scale;
  const widthBytes = Math.ceil(widthPx / 8);
  const bytes = Buffer.alloc(widthBytes * heightPx, 0x00);

  for (let py = 0; py < heightPx; py++) {
    const moduleRow = Math.floor(py / scale) - QR_QUIET_ZONE_MODULES;
    if (moduleRow < 0 || moduleRow >= qr.size) continue;
    for (let px = 0; px < widthPx; px++) {
      const moduleCol = Math.floor(px / scale) - QR_QUIET_ZONE_MODULES;
      if (moduleCol < 0 || moduleCol >= qr.size) continue;
      if (!qr.isDark(moduleRow, moduleCol)) continue;
      const byteIndex = py * widthBytes + Math.floor(px / 8);
      const bitIndex = 7 - (px % 8);
      bytes[byteIndex] |= (1 << bitIndex);
    }
  }
  return { widthBytes, widthPx, heightPx, bytes };
}

/** Barkod/material/partiya ma'lumotidan QR payload matnini yig'adi (Q-40: real maydonlar, fabrikatsiya yo'q). */
export function buildQrPayload(parts: {
  barcode?: string;
  materialCode?: string;
  batchNumber?: string;
}): string {
  return [parts.barcode, parts.materialCode, parts.batchNumber]
    .filter((v): v is string => !!v && v.length > 0)
    .join('|');
}
