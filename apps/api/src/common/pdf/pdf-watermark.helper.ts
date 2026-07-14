/**
 * @module pdf-watermark.helper
 * @description Document-Control STEP 3.7 — stamps a tiled diagonal watermark onto an
 * already-generated PDF buffer (client-export leak prevention). Unlike the FE React overlay
 * (DocumentWatermark), this reaches the ACTUAL downloaded file: it re-opens the PDF with pdf-lib
 * and draws faint, non-intrusive repeating text over every page. Best-effort by contract — the
 * caller decides whether a stamp failure should fall back to the un-stamped PDF (it should NOT
 * silently drop the download); on parse failure this returns the original bytes so a valid
 * invoice still reaches the user, and the caller logs the failure.
 */

import { PDFDocument, StandardFonts, degrees, rgb } from 'pdf-lib';
import { Logger } from '@nestjs/common';

const logger = new Logger('PdfWatermark');

export async function stampPdfWatermark(pdfBytes: Uint8Array | Buffer, text: string): Promise<Buffer> {
  try {
    const pdf = await PDFDocument.load(pdfBytes);
    const font = await pdf.embedFont(StandardFonts.HelveticaBold);
    const size = 22;
    for (const page of pdf.getPages()) {
      const { width, height } = page.getSize();
      // Tiled grid so the mark covers the whole sheet without obscuring the content (opacity 0.10).
      for (let y = 30; y < height + 120; y += 150) {
        for (let x = -60; x < width; x += 300) {
          page.drawText(text, {
            x, y, size, font,
            color: rgb(0.55, 0.55, 0.6),
            opacity: 0.1,
            rotate: degrees(35),
          });
        }
      }
    }
    const out = await pdf.save();
    return Buffer.from(out);
  } catch (e) {
    // Never drop the download over a watermark failure — return the original, caller logs it.
    logger.warn(`stampPdfWatermark failed, returning un-stamped PDF: ${String(e)}`);
    return Buffer.from(pdfBytes);
  }
}
