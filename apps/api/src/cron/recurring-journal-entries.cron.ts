/**
 * @module recurring-journal-entries.cron
 * @description Scheduled cron job. @nestjs/schedule registered task.
 *
 * F11 (ACCOUNTING-STANDARDS-AUDIT-2026-07-06): recurring journal entries, minimal viable.
 * Reads `gl_documents` rows with `document_type='recurring_template', status='active'`
 * (created via FinanceAccountingService.createRecurringTemplate) and, when a template's
 * period (monthly/quarterly/yearly) has rolled over since its last generation, creates a NEW
 * draft instance (`document_type='manual_journal', status='pending_review'`) — the SAME F9
 * draft-then-approve gate a hand-entered journal entry goes through. A recurring entry never
 * auto-posts unattended; a human still approves/rejects each generated instance.
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { TashkentTimeService } from '@common/time';
import { CronStatusService } from './cron-status.service';

const _time = new TashkentTimeService();

interface RecurringTemplateRow {
  id: number;
  document_number: string;
  description: string | null;
  total_debit: string;
  total_credit: string;
  metadata: unknown;
}

function currentPeriodKey(frequency: string, now: Date): string {
  const year = now.getFullYear();
  if (frequency === 'yearly') return String(year);
  const month = now.getMonth() + 1; // 1-12
  if (frequency === 'quarterly') return `${year}-Q${Math.ceil(month / 3)}`;
  return `${year}-${String(month).padStart(2, '0')}`; // monthly
}

@Injectable()
export class RecurringJournalEntriesCron {
  private readonly logger = new Logger(RecurringJournalEntriesCron.name);

  constructor(private readonly cronStatus: CronStatusService) {}

  @Cron('0 6 * * *')
  async run(): Promise<void> {
    const jobName = 'RecurringJournalEntriesCron';
    try {
      const templates = await runQuery<RecurringTemplateRow>(sql`
        SELECT id, document_number, description, total_debit, total_credit, metadata
        FROM gl_documents
        WHERE document_type = 'recurring_template' AND status = 'active'
      `);

      let generated = 0;
      let skipped = 0;
      const errors: string[] = [];
      const now = _time.now();
      const today = now.toISOString().slice(0, 10);

      for (const tpl of templates.rows) {
        const meta = (typeof tpl.metadata === 'string' ? JSON.parse(tpl.metadata) : tpl.metadata) as {
          lines?: unknown[]; frequency?: string; lastGeneratedPeriod?: string | null;
        };
        const frequency = meta?.frequency;
        if (!frequency || !['monthly', 'quarterly', 'yearly'].includes(frequency)) {
          errors.push(`shablon #${tpl.id}: yaroqsiz frequency (${frequency})`);
          continue;
        }
        const lines = Array.isArray(meta?.lines) ? meta.lines : [];
        if (lines.length === 0) {
          errors.push(`shablon #${tpl.id}: yozuvlar yo'qolgan`);
          continue;
        }

        const periodKey = currentPeriodKey(frequency, now);
        if (meta.lastGeneratedPeriod === periodKey) {
          skipped++;
          continue; // already generated this period — idempotent, no duplicate draft
        }

        const instanceNumber = `${tpl.document_number}-${periodKey}`;
        const inserted = await runQuery<{ id: number }>(sql`
          INSERT INTO gl_documents
            (document_number, document_date, posting_date, document_type, description, total_debit,
             total_credit, status, metadata, reference_type, reference_id, created_at)
          VALUES
            (${instanceNumber}, ${today}, ${today}, 'manual_journal',
             ${tpl.description ? `${tpl.description} (${periodKey})` : `Takrorlanuvchi yozuv (${periodKey})`},
             ${tpl.total_debit}, ${tpl.total_credit}, 'pending_review', ${JSON.stringify({ lines })}::jsonb,
             'recurring_template', ${String(tpl.id)}, NOW())
          RETURNING id
        `);
        if (!inserted.rows[0]) {
          errors.push(`shablon #${tpl.id}: qoralama yaratilmadi`);
          continue;
        }

        await runQuery(sql`
          UPDATE gl_documents
          SET metadata = jsonb_set(metadata, '{lastGeneratedPeriod}', ${JSON.stringify(periodKey)}::jsonb)
          WHERE id = ${tpl.id}
        `);
        generated++;
      }

      if (errors.length > 0) {
        this.logger.warn(`RecurringJournalEntriesCron: qisman muvaffaqiyat — generated=${generated}, skipped=${skipped}, xatolar=${errors.join('; ')}`);
      } else {
        this.logger.log(`RecurringJournalEntriesCron: ✅ generated=${generated}, skipped(already this period)=${skipped}`);
      }
      this.cronStatus.recordSuccess(jobName);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`❌ RecurringJournalEntriesCron: ${message}`);
      this.cronStatus.recordFailure(jobName, message);
    }
  }
}
