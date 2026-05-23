/**
 * @module reference-image-compare.cron
 * @description Every 2 hours — for each room/department with a saved "ideal"
 *   reference image, fetch the latest IoT camera snapshot and compare via
 *   Gemini Vision. Significant deviation triggers Telegram alert to HR + dept head.
 *
 * @layer Cron (HR / IoT)
 */

import { Injectable, Logger, Optional } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { TelegramService } from '../telegram/telegram.service';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';

interface RoomToCheck {
  room_id: number;
  room_name: string;
  reference_image_url: string;
  current_snapshot_url: string | null;
  hr_telegram_id: string | null;
  dept_head_telegram_id: string | null;
}

const COMPARE_PROMPT = `You compare two photos of the same workplace area.
First image: ideal/reference state. Second image: current state.
Return STRICT JSON: { "deviationScore": 0.0-1.0, "issues": ["list", "of", "issues"], "notes": "1 sentence" }
deviationScore 0 = identical, 1 = completely different.`;

@Injectable()
export class ReferenceImageCompareCron {
  private readonly logger = new Logger(ReferenceImageCompareCron.name);
  private gemini: GoogleGenerativeAI | null = null;

  constructor(
    private readonly cfg: ConfigService,
    @Optional() private readonly telegram: TelegramService,
  ) {
    const key = this.cfg.get<string>('AI_INTEGRATIONS_GEMINI_API_KEY');
    if (key) this.gemini = new GoogleGenerativeAI(key);
  }

  @Cron('0 */2 * * *')  // every 2 hours
  async compareAllRooms(): Promise<void> {
    this.logger.log('Running reference-image-compare cron...');
    if (!this.gemini) { this.logger.warn('Gemini disabled — skipping'); return; }
    try {
      const rows = await db.execute(sql`
        SELECT
          rr.id AS room_id,
          rr.room_name,
          rr.reference_image_url,
          (SELECT cs.snapshot_url FROM camera_snapshots cs
            WHERE cs.room_id = rr.id
            ORDER BY cs.captured_at DESC LIMIT 1) AS current_snapshot_url,
          (SELECT e.telegram_chat_id FROM employees e
            JOIN org_functions of2 ON of2.id = e.org_function_id
            WHERE of2.position_name ILIKE 'HR%' LIMIT 1) AS hr_telegram_id,
          (SELECT e.telegram_chat_id FROM employees e
            WHERE e.id = rr.dept_head_id) AS dept_head_telegram_id
        FROM room_references rr
        WHERE rr.is_active = true
      `);
      const rooms = (rows as unknown as { rows: RoomToCheck[] }).rows;
      this.logger.log(`Comparing ${rooms.length} rooms`);

      for (const r of rooms) {
        if (!r.current_snapshot_url) continue;
        try {
          const model = this.gemini.getGenerativeModel({ model: 'gemini-1.5-flash' });
          const result = await model.generateContent([
            { text: COMPARE_PROMPT },
            { fileData: { mimeType: 'image/jpeg', fileUri: r.reference_image_url } },
            { fileData: { mimeType: 'image/jpeg', fileUri: r.current_snapshot_url } },
          ]);
          const txt = result.response.text().replace(/```json\s*|\s*```/g, '').trim();
          const parsed = JSON.parse(txt) as { deviationScore: number; issues: string[]; notes: string };

          await db.execute(sql`
            INSERT INTO room_reference_comparisons
              (room_id, deviation_score, issues, notes, compared_at)
            VALUES (${r.room_id}, ${parsed.deviationScore}, ${JSON.stringify(parsed.issues)}, ${parsed.notes}, NOW())
          `);

          if (parsed.deviationScore > 0.4) {
            const msg = `⚠️ Xona holati o'zgargan: ${r.room_name}\n\n` +
              `📊 O'zgarish: ${(parsed.deviationScore * 100).toFixed(0)}%\n` +
              `📋 Muammolar: ${parsed.issues.slice(0, 3).join(', ')}\n\n` +
              `${parsed.notes}`;
            const targets = [r.hr_telegram_id, r.dept_head_telegram_id].filter((x): x is string => !!x);
            for (const tid of targets) {
              await this.telegram?.sendMessage(tid, msg).catch(() => { /* noop */ });
            }
          }
        } catch (err) {
          this.logger.warn(`Compare failed for room ${r.room_id}: ${String(err)}`);
        }
      }
    } catch (err) {
      this.logger.error(`reference-image-compare cron failed: ${String(err)}`);
    }
  }
}
