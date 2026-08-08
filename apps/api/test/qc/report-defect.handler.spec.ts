/**
 * test/qc/report-defect.handler.spec.ts
 *
 * Unit tests for ReportDefectHandler. Repo + EventBus mocked.
 * Real Defect aggregate is produced by the handler.
 *
 * VISION-3340 #43: the handler now routes each defect's FMEA RPN (real
 * FmeaService.calculateRpn — its math is untouched) into a real stop-production
 * action. A critical defect (RPN 250 > 200 → requiresStopProduction) UPDATEs the
 * linked production_orders row to `qc_hold`; major/minor (RPN ≤ 200) do NOT. The
 * `@shared/db` `db.execute` is mocked so the conditional UPDATE can be asserted
 * without touching the database (repo-test convention).
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
jest.mock('@shared/db', () => ({
  db: { execute: jest.fn() },
  qc_defects: {},
}));

import { Test } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import { ReportDefectHandler } from '../../src/modules/qc/application/commands/report-defect.handler';
import { ReportDefectCommand } from '../../src/modules/qc/application/commands/report-defect.command';
import {
  Defect,
  DefectSeverity,
  DefectStatus,
} from '../../src/modules/qc/domain/aggregates/defect.aggregate';
import { Ok, Err, AppErr, Result } from '../../src/common/result';
import { IQcDefectRepository, QC_DEFECT_REPO } from '../../src/modules/qc/infrastructure/repositories/drizzle-defect.repo';
import { FmeaService } from '../../src/modules/qc/domain/services/fmea.service';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { db: mockDb } = require('@shared/db') as { db: { execute: jest.Mock } };

type RepoMock = Partial<Record<keyof IQcDefectRepository, jest.Mock>> & {
  saveDefect: jest.Mock<Promise<Result<Defect>>, [Defect]>;
};

function makeRepo(): RepoMock {
  return {
    findDefectById: jest.fn(),
    findDefects: jest.fn(),
    saveDefect: jest.fn().mockImplementation((d: Defect) => Promise.resolve(Ok(d))),
    updateDefect: jest.fn(),
    getDefectStats: jest.fn(),
    findReclamationById: jest.fn(),
    findReclamations: jest.fn(),
    saveReclamation: jest.fn(),
    updateReclamation: jest.fn(),
    getReclamationStats: jest.fn(),
  };
}

function mkCmd(severity: DefectSeverity): ReportDefectCommand {
  return new ReportDefectCommand('insp-1', 'po-1', 'wc-1', 'D-001', 'edge crease', severity, 3, 'pcs', 'user-1');
}

/** Command with a numeric production-order link (matches the live integer id shape
 *  the qc-rework listener relies on — verified live ids 48/49/50). */
function mkCmdWithOrder(severity: DefectSeverity, productionOrderId: string | null): ReportDefectCommand {
  return new ReportDefectCommand('insp-1', productionOrderId, 'wc-1', 'D-001', 'edge crease', severity, 3, 'pcs', 'user-1');
}

describe('ReportDefectHandler', () => {
  let handler: ReportDefectHandler;
  let repo: RepoMock;
  let eventBus: { publish: jest.Mock };

  beforeEach(async () => {
    repo = makeRepo();
    eventBus = { publish: jest.fn() };
    // Default: the conditional UPDATE matches one row (order put on qc_hold).
    mockDb.execute.mockReset();
    mockDb.execute.mockResolvedValue({ rows: [{ id: 48 }] });
    const moduleRef = await Test.createTestingModule({
      providers: [
        ReportDefectHandler,
        { provide: QC_DEFECT_REPO, useValue: repo },
        { provide: EventBus, useValue: eventBus },
        FmeaService,
      ],
    }).compile();
    handler = moduleRef.get(ReportDefectHandler);
  });

  it('returns ok with a Defect aggregate in OPEN status when save succeeds', async () => {
    const r = await handler.execute(mkCmd(DefectSeverity.MINOR));

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data).toBeInstanceOf(Defect);
      expect(r.data.status).toBe(DefectStatus.OPEN);
      expect(r.data.defectCode).toBe('D-001');
    }
  });

  it('does NOT publish QC_FAILED event for minor defects', async () => {
    await handler.execute(mkCmd(DefectSeverity.MINOR));

    expect(eventBus.publish).not.toHaveBeenCalled();
  });

  it('publishes QC_FAILED event when severity is critical', async () => {
    await handler.execute(mkCmd(DefectSeverity.CRITICAL));

    expect(eventBus.publish).toHaveBeenCalledTimes(1);
    const evt = eventBus.publish.mock.calls[0][0];
    expect(evt.severity).toBe('critical');
    expect(typeof evt.defectId).toBe('string');
  });

  it('returns err when repository save fails', async () => {
    repo.saveDefect.mockResolvedValueOnce(Err(AppErr('DB_ERROR', 'connection lost')));

    const r = await handler.execute(mkCmd(DefectSeverity.MAJOR));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('DB_ERROR');
    expect(eventBus.publish).not.toHaveBeenCalled();
  });

  it('persists exactly one defect per command', async () => {
    await handler.execute(mkCmd(DefectSeverity.MAJOR));

    expect(repo.saveDefect).toHaveBeenCalledTimes(1);
    const saved = repo.saveDefect.mock.calls[0][0];
    expect(saved.quantity).toBe(3);
    expect(saved.unit).toBe('pcs');
  });

  // ── VISION-3340 #43: FMEA RPN → real stop-production (qc_hold) ──────────────
  describe('FMEA stop-production wiring (VISION-3340 #43)', () => {
    function updateSqlText(): string {
      // The drizzle sql`` object is the first arg passed to db.execute — its static
      // chunks (table name, target status) survive JSON serialisation.
      return JSON.stringify(mockDb.execute.mock.calls[0]?.[0] ?? {});
    }

    it('critical defect (FMEA RPN 250 > 200) puts the linked production order on qc_hold', async () => {
      const r = await handler.execute(mkCmdWithOrder(DefectSeverity.CRITICAL, '48'));

      // Defect is still recorded...
      expect(r.ok).toBe(true);
      expect(repo.saveDefect).toHaveBeenCalledTimes(1);
      // ...and a stop-production UPDATE was issued against production_orders → qc_hold.
      expect(mockDb.execute).toHaveBeenCalledTimes(1);
      const text = updateSqlText();
      expect(text).toContain('production_orders');
      expect(text).toContain('qc_hold');
      // Notification reused (QC_FAILED) and flagged as stop-production.
      expect(eventBus.publish).toHaveBeenCalledTimes(1);
      expect(eventBus.publish.mock.calls[0][0].requiresStopProduction).toBe(true);
    });

    it('major defect (FMEA RPN 150 <= 200) does NOT stop production but still records the defect', async () => {
      const r = await handler.execute(mkCmdWithOrder(DefectSeverity.MAJOR, '48'));

      expect(r.ok).toBe(true);
      expect(repo.saveDefect).toHaveBeenCalledTimes(1);
      expect(mockDb.execute).not.toHaveBeenCalled();
      expect(eventBus.publish).not.toHaveBeenCalled();
    });

    it('minor defect (FMEA RPN 27 <= 200) does NOT stop production but still records the defect', async () => {
      const r = await handler.execute(mkCmdWithOrder(DefectSeverity.MINOR, '48'));

      expect(r.ok).toBe(true);
      expect(repo.saveDefect).toHaveBeenCalledTimes(1);
      expect(mockDb.execute).not.toHaveBeenCalled();
    });

    it('records the defect even when the stop-production UPDATE throws (best-effort, non-fatal)', async () => {
      mockDb.execute.mockRejectedValueOnce(new Error('db down'));

      const r = await handler.execute(mkCmdWithOrder(DefectSeverity.CRITICAL, '48'));

      // The recorded defect is NOT rolled back by a stop-production failure.
      expect(r.ok).toBe(true);
      expect(repo.saveDefect).toHaveBeenCalledTimes(1);
      expect(mockDb.execute).toHaveBeenCalledTimes(1);
      // QC_FAILED still published; stop flagged false because the hold did not apply.
      expect(eventBus.publish).toHaveBeenCalledTimes(1);
      expect(eventBus.publish.mock.calls[0][0].requiresStopProduction).toBe(false);
    });

    it('critical defect with no numeric production-order link records defect but issues no UPDATE (idempotent skip)', async () => {
      const r = await handler.execute(mkCmdWithOrder(DefectSeverity.CRITICAL, 'po-uuid-x'));

      expect(r.ok).toBe(true);
      expect(repo.saveDefect).toHaveBeenCalledTimes(1);
      expect(mockDb.execute).not.toHaveBeenCalled();
      // Still publishes QC_FAILED (critical), flagged not-stopped.
      expect(eventBus.publish).toHaveBeenCalledTimes(1);
      expect(eventBus.publish.mock.calls[0][0].requiresStopProduction).toBe(false);
    });
  });
});
