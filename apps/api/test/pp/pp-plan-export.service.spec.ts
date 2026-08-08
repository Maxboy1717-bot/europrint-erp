/**
 * test/pp/pp-plan-export.service.spec.ts
 *
 * EP-PP-129 (Modul-07 #41) — ranked production-plan CSV snapshot.
 *
 * Two layers:
 *   1. PpPlanExportService.serializePlanCsv — the pure serializer. Proves the
 *      header + one-line-per-row output, RFC-4180 escaping (comma/quote/newline),
 *      deadline formatting, and the honest header-only CSV for an empty queue
 *      (Q-40: no fabricated rows). No StreamableFile / HTTP in these tests.
 *   2. PpQueueController.exportPlanCsv — a light transport test (Rule 6 / Q-29):
 *      mocks queryBus + the serializer and proves the controller runs the query,
 *      hands the REAL rows to the serializer, and sets the CSV attachment headers.
 */

import { PpPlanExportService, PP_PLAN_EXPORT_HEADERS } from '../../src/modules/pp/application/services/pp-plan-export.service';
import { PpQueueController } from '../../src/modules/pp/presentation/pp-queue.controller';
import { GetProductionQueueQuery } from '../../src/modules/pp/application/queries/get-production-queue.query';
import { StreamableFile } from '@nestjs/common';
import type { QueryBus } from '@nestjs/cqrs';
import type { FastifyReply } from 'fastify';

const HEADER = PP_PLAN_EXPORT_HEADERS.join(',');

/** A representative ranked-queue row, matching GetProductionQueueHandler's output shape. */
function row(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    rank: 1,
    id: 42,
    orderNumber: 'PO-2026-001',
    productName: 'Gofra quti 3-sloy',
    status: 'released',
    priority: 'shoshilinch',
    isUrgent: true,
    isFrozen: false,
    deadline: new Date('2026-07-15T00:00:00.000Z'),
    ...overrides,
  };
}

describe('PpPlanExportService.serializePlanCsv', () => {
  const svc = new PpPlanExportService();

  it('emits a header-only CSV for an empty queue (Q-40: no fabricated rows)', () => {
    expect(svc.serializePlanCsv([])).toBe(`${HEADER}\n`);
  });

  it('treats a non-array input as empty and still emits the header only', () => {
    expect(svc.serializePlanCsv(null)).toBe(`${HEADER}\n`);
    expect(svc.serializePlanCsv(undefined)).toBe(`${HEADER}\n`);
  });

  it('emits the header plus exactly one line per plan item, in column order', () => {
    const csv = svc.serializePlanCsv([row(), row({ rank: 2, id: 43, orderNumber: 'PO-2026-002' })]);
    const lines = csv.trimEnd().split('\n');
    expect(lines).toHaveLength(3); // header + 2 rows
    expect(lines[0]).toBe(HEADER);
    expect(lines[1]).toBe('1,42,PO-2026-001,Gofra quti 3-sloy,released,shoshilinch,true,false,2026-07-15');
    expect(lines[2]).toBe('2,43,PO-2026-002,Gofra quti 3-sloy,released,shoshilinch,true,false,2026-07-15');
  });

  it('quotes a field containing a comma and doubles inner quotes (RFC-4180)', () => {
    const csv = svc.serializePlanCsv([row({ productName: 'Quti, katta "A" sinf' })]);
    const dataLine = csv.trimEnd().split('\n')[1];
    // comma + embedded quotes → whole field wrapped, inner " doubled
    expect(dataLine).toContain('"Quti, katta ""A"" sinf"');
  });

  it('quotes a field containing a newline', () => {
    const csv = svc.serializePlanCsv([row({ productName: 'Birinchi\nIkkinchi' })]);
    // the embedded \n must live INSIDE a quoted field (product_name = 4th column),
    // not split the record. The value round-trips wrapped in quotes:
    expect(csv).toContain('"Birinchi\nIkkinchi"');
    // and the data record begins right after the header with the quoted field in place:
    expect(csv.startsWith(`${HEADER}\n1,42,PO-2026-001,"Birinchi`)).toBe(true);
  });

  it('formats deadline: Date → YYYY-MM-DD, ISO string → YYYY-MM-DD, null → empty', () => {
    expect(svc.serializePlanCsv([row({ deadline: new Date('2026-01-05T10:20:30Z') })]).trimEnd().split('\n')[1])
      .toMatch(/,2026-01-05$/);
    expect(svc.serializePlanCsv([row({ deadline: '2026-02-09T00:00:00.000Z' })]).trimEnd().split('\n')[1])
      .toMatch(/,2026-02-09$/);
    expect(svc.serializePlanCsv([row({ deadline: null })]).trimEnd().split('\n')[1])
      .toMatch(/,$/); // trailing empty deadline cell
  });

  it('renders null order_number / product_name as empty cells (not the string "null")', () => {
    const dataLine = svc.serializePlanCsv([row({ orderNumber: null, productName: null })]).trimEnd().split('\n')[1];
    expect(dataLine).toBe('1,42,,,released,shoshilinch,true,false,2026-07-15');
  });
});

describe('PpQueueController.exportPlanCsv (transport-only — Rule 6)', () => {
  function build(queueResult: unknown) {
    const queryBus = { execute: jest.fn().mockResolvedValue(queueResult) } as unknown as jest.Mocked<QueryBus>;
    const planExport = { serializePlanCsv: jest.fn().mockReturnValue('rank\n1\n') } as unknown as jest.Mocked<PpPlanExportService>;
    const header = jest.fn().mockReturnThis();
    const res = { header } as unknown as FastifyReply;
    const ctrl = new PpQueueController(queryBus, planExport);
    return { ctrl, queryBus, planExport, res, header };
  }

  it('runs the queue query, serializes the REAL rows, and streams a CSV attachment', async () => {
    const rows = [row()];
    const { ctrl, queryBus, planExport, res, header } = build({ ok: true, data: rows });

    const out = await ctrl.exportPlanCsv(res);

    // 1) delegates to the same ranked-plan query as GET /pp/queue
    expect(queryBus.execute).toHaveBeenCalledTimes(1);
    expect(queryBus.execute.mock.calls[0][0]).toBeInstanceOf(GetProductionQueueQuery);
    // 2) hands the unwrapped REAL rows to the serializer (no business logic in the controller)
    expect(planExport.serializePlanCsv).toHaveBeenCalledWith(rows);
    // 3) sets the CSV download headers
    expect(header).toHaveBeenCalledWith('Content-Type', 'text/csv; charset=utf-8');
    expect(header).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename="production-plan.csv"');
    // 4) returns a streamable file
    expect(out).toBeInstanceOf(StreamableFile);
  });

  it('surfaces a failed queue Result as a thrown HTTP error (does not stream a fake file)', async () => {
    const { ctrl, res, planExport } = build({ ok: false, error: 'Ishlab chiqarish navbatini qurishda xatolik' });
    await expect(ctrl.exportPlanCsv(res)).rejects.toBeDefined();
    expect(planExport.serializePlanCsv).not.toHaveBeenCalled();
  });
});
