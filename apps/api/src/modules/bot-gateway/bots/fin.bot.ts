/**
 * @module fin.bot
 * @description Source module. See exports for details.
 */

import { Injectable, Logger } from '@nestjs/common';
import { execSql, helpReply, deniedReply, hasBotPermission, sql } from './bot.helpers';
import type { BotMessage, BotReply } from './bot.helpers';


@Injectable()
export class FinBotService {
  private readonly logger = new Logger(FinBotService.name);
  readonly botName = 'fin_bot';

  async handle(msg: BotMessage): Promise<BotReply> {
    if (!hasBotPermission('fin', msg.role)) return deniedReply(msg.role);

    const cmd = (msg.command ?? '').toLowerCase();

    if (cmd === '/cashflow' || msg.text.toLowerCase().includes('pul oqim')) return this.getCashflow();
    if (cmd === '/debts'    || msg.text.toLowerCase().includes('qarz'))     return this.getDebts();

    return helpReply('💰 Moliya Bot:\n/cashflow — Pul oqimi\n/debts — Qarzlar ro\'yxati');
  }

  private async getCashflow(): Promise<BotReply> {
    // Audit 2026-08-07: 'finance_transactions' jadvali bazada YO'Q — bu buyruq HAR DOIM
    // "0 / 0 / 0" derdi (execSql fallback). Kanonik GL manbai — 'entries' (financial-reports
    // balans-hisoboti ham aynan shundan o'qiydi, gl_entries EMAS — ikkala jadval jonli bazada
    // bor, lekin 'entries' hisobot uchun tanlangan kanonik). 'INCOME'/'EXPENSE' lug'ati
    // to'g'ridan-to'g'ri mos kelmaydi: bu yerda debet-kredit tomonidan account_type='REVENUE'/
    // 'EXPENSE' bo'yicha hisoblanadi (standart bухгалтерия qoidasi — daromad hisobi kreditlanadi,
    // xarajat hisobi debetlanadi).
    const rows = await execSql<{ total_in: string; total_out: string }>(sql`
      SELECT
        COALESCE(SUM(CASE WHEN ca.account_type = 'REVENUE' THEN e.amount ELSE 0 END), 0) AS total_in,
        COALESCE(SUM(CASE WHEN da.account_type = 'EXPENSE' THEN e.amount ELSE 0 END), 0) AS total_out
      FROM entries e
      LEFT JOIN accounts da ON da.id = e.debit_account_id
      LEFT JOIN accounts ca ON ca.id = e.credit_account_id
      WHERE e.created_at >= date_trunc('month', NOW())
    `, [{ total_in: '0', total_out: '0' }]);

    const r = rows[0];
    const inAmt  = Number(r.total_in  ?? 0).toLocaleString('uz');
    const outAmt = Number(r.total_out ?? 0).toLocaleString('uz');
    const net    = (Number(r.total_in ?? 0) - Number(r.total_out ?? 0)).toLocaleString('uz');
    return helpReply(`💰 <b>Bu Oy Pul Oqimi</b>\n  📥 Kirim: ${inAmt} UZS\n  📤 Chiqim: ${outAmt} UZS\n  💵 Sof: ${net} UZS`);
  }

  private async getDebts(): Promise<BotReply> {
    const rows = await execSql<{ company_name: string; total: string }>(sql`
      SELECT c.company_name, SUM(p.amount) AS total
      FROM sd_payments p
      JOIN sd_customers sc ON sc.id = p.customer_id
      JOIN crm_companies c  ON c.id  = sc.company_id
      WHERE p.status = 'PENDING'
      GROUP BY c.company_name
      ORDER BY total DESC
      LIMIT 5
    `);
    if (!rows.length) return helpReply('✅ Qarzdorlik yo\'q');
    const lines = rows.map((r) => `  • <b>${r.company_name}</b>: ${Number(r.total).toLocaleString('uz')} UZS`);
    return { text: `💳 <b>Qarzdorlar (Top-5)</b>\n${lines.join('\n')}`, parse: 'HTML', success: true };
  }
}
