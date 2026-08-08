/**
 * test/bot-gateway/director-bot-kpi.spec.ts
 *
 * Section-6 Director-bot item: DirectorBotService.getKpi() queried a phantom
 * `kpi_metrics` table (does not exist in the live DB) filtered on a NULL `period`
 * column, so /kpi ALWAYS fell through to a DB-error reply. It now reads the
 * canonical kpi_definitions JOIN kpi_values (same source as the director dashboard).
 *
 * This renders the exact SQL getKpi hands to execSqlResult and asserts it targets
 * the canonical tables, never the phantom one — a wrong-table read of the Pass-2
 * bug class, proven by SQL text rather than a live query.
 */

import { PgDialect } from 'drizzle-orm/pg-core';

// Keep the real `sql` tag + reply helpers so the template builds a renderable SQL
// object; stub execSqlResult (capture the query) and hasBotPermission (allow director).
jest.mock('../../src/modules/bot-gateway/bots/bot.helpers', () => {
  const actual = jest.requireActual('../../src/modules/bot-gateway/bots/bot.helpers');
  return {
    ...actual,
    execSqlResult: jest.fn().mockResolvedValue({
      ok: true,
      rows: [{ metric_name: 'Umumiy KPI bali', value: '87.3000', target: '82.0000' }],
    }),
    hasBotPermission: jest.fn().mockReturnValue(true),
  };
});

import { DirectorBotService } from '../../src/modules/bot-gateway/bots/director.bot';
import { execSqlResult } from '../../src/modules/bot-gateway/bots/bot.helpers';

describe('DirectorBotService.getKpi — canonical KPI source (no phantom table)', () => {
  const svc = new DirectorBotService();

  beforeEach(() => (execSqlResult as jest.Mock).mockClear());

  it('renders SQL against kpi_definitions/kpi_values, never kpi_metrics', async () => {
    const reply = await svc.handle({ chatId: '1', text: '/kpi', command: '/kpi', role: 'director' });

    expect(execSqlResult).toHaveBeenCalledTimes(1);
    const queryArg = (execSqlResult as jest.Mock).mock.calls[0][0];
    const rendered = new PgDialect().sqlToQuery(queryArg).sql;

    expect(rendered).toContain('kpi_definitions');
    expect(rendered).toContain('kpi_values');
    expect(rendered).not.toContain('kpi_metrics');
    expect(reply.success).toBe(true);
    expect(reply.text).toContain('KPI');
  });

  it('surfaces a DB error reply (not "no data") when the query fails', async () => {
    (execSqlResult as jest.Mock).mockResolvedValueOnce({ ok: false, error: 'boom' });
    const reply = await svc.handle({ chatId: '1', text: '/kpi', command: '/kpi', role: 'director' });
    expect(reply.success).toBe(false);
  });
});
