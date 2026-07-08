/**
 * test/qc/qc-stage-enum-consistency.spec.ts
 *
 * VISION-3340 #42: the "stage" value written into qc_defects disagreed
 * between the two HTTP write paths:
 *   - QcNewController.createCheckpoint (POST /qc/checkpoints) enforced the
 *     enum ['incoming', 'in_process', 'final', 'dispatch'].
 *   - QcDefectsExtendedController.createBrak (POST /qc/braks) accepted
 *     arbitrary free text and defaulted to the literal 'production', which
 *     is NOT a member of that enum.
 *
 * Fix: QcNewController now exports the canonical schema (QcStageSchema /
 * QcStage) and QcDefectsExtendedController imports and validates against
 * that SAME schema instance — no second, driftable enum copy — defaulting
 * to 'in_process' (the shop-floor/production stage) instead of the invalid
 * 'production' literal.
 *
 * Strategy: instantiate both controllers directly (no NestJS testing module
 * / no HTTP layer), same style as test/qc/qc-aql-endpoints.spec.ts — mock
 * @workspace/db, @shared/db, @shared/db/schema-rbac and drizzle-orm so the
 * modules import cleanly without a live DB connection.
 */

// ── Mock DB layer (must precede any import that transitively touches DB) ─────
jest.mock('@workspace/db', () => ({
  drizzle: jest.fn(),
  pgTable: jest.fn(),
}));

jest.mock('@shared/db', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    execute: jest.fn(),
    delete: jest.fn(),
    transaction: jest.fn(),
  },
  qc_inspections: { id: 'id', items_checked: 'items_checked', status: 'status' },
  qc_checkpoints: {},
  qc_certificates: {},
  qc_lab_tests: {},
  qc_spc_data: {},
  qc_parameters: {},
  qc_defects: {},
  qc_supplier_quality: {},
  mm_vendors: {},
  auditLogs: {},
  runQuery: jest.fn(),
  sql: jest.fn(),
}));

// Also mock the schema-rbac re-export that audit.interceptor imports directly
jest.mock('@shared/db/schema-rbac', () => ({
  auditLogs: {},
  users: {},
}));

// Mock drizzle-orm so eq / desc / sql don't blow up on the mocked tables
jest.mock('drizzle-orm', () => ({
  eq: jest.fn().mockReturnValue({}),
  ne: jest.fn().mockReturnValue({}),
  desc: jest.fn().mockReturnValue({}),
  sql: jest.fn().mockReturnValue({}),
  and: jest.fn().mockReturnValue({}),
  or: jest.fn().mockReturnValue({}),
  gte: jest.fn().mockReturnValue({}),
  isNull: jest.fn().mockReturnValue({}),
}));

// ─────────────────────────────────────────────────────────────────────────────

import { BadRequestException } from '@nestjs/common';
import type { CommandBus } from '@nestjs/cqrs';
import type { I18nService } from 'nestjs-i18n';
import { ZodError } from 'zod';
import { QcNewController, QcStageSchema } from '../../src/modules/qc/presentation/qc-new.controller';
import { QcDefectsExtendedController } from '../../src/modules/qc/presentation/qc-defects-extended.controller';
import type { QcNewService } from '../../src/modules/qc/application/qc-new.service';
import type { SpcService } from '../../src/modules/qc/domain/services/spc.service';
import type { QcAqlService } from '../../src/modules/qc/domain/services/qc-aql.service';
import type { QcCertificatePdfService } from '../../src/modules/qc/application/qc-certificate-pdf.service';
import type { QcDefectsExtendedService } from '../../src/modules/qc/application/qc-defects-extended.service';

describe('QcStageSchema — single canonical enum (VISION-3340 #42)', () => {
  it('exposes exactly the 4 documented stages', () => {
    expect(QcStageSchema.options).toEqual(['incoming', 'in_process', 'final', 'dispatch']);
  });

  it('rejects the legacy free-text default "production"', () => {
    expect(QcStageSchema.safeParse('production').success).toBe(false);
  });
});

describe('QcNewController.createCheckpoint (POST /qc/checkpoints) — existing write path', () => {
  function makeController(createCheckpoint: jest.Mock): QcNewController {
    const svc = { createCheckpoint } as unknown as QcNewService;
    return new QcNewController(
      svc,
      null as unknown as SpcService,
      null as unknown as QcAqlService,
      null as unknown as QcCertificatePdfService,
    );
  }

  it('defaults stage to in_process when omitted (unchanged behavior)', async () => {
    const createCheckpoint = jest.fn().mockResolvedValue({ ok: true, data: { id: 1 } });
    const ctrl = makeController(createCheckpoint);

    await ctrl.createCheckpoint({ name: 'Visual check' });

    expect(createCheckpoint).toHaveBeenCalledWith(expect.objectContaining({ stage: 'in_process' }));
  });

  it('accepts an explicit valid stage', async () => {
    const createCheckpoint = jest.fn().mockResolvedValue({ ok: true, data: { id: 1 } });
    const ctrl = makeController(createCheckpoint);

    await ctrl.createCheckpoint({ name: 'Dispatch check', stage: 'dispatch' });

    expect(createCheckpoint).toHaveBeenCalledWith(expect.objectContaining({ stage: 'dispatch' }));
  });

  it('still rejects an invalid stage (e.g. the legacy "production" literal)', async () => {
    const ctrl = makeController(jest.fn());
    // createCheckpoint is async — CheckpointDto.parse() throws synchronously inside it,
    // which surfaces as a rejected Promise, not a synchronous throw.
    await expect(ctrl.createCheckpoint({ name: 'Bad', stage: 'production' })).rejects.toThrow(ZodError);
  });
});

describe('QcDefectsExtendedController.createBrak (POST /qc/braks) — VISION-3340 #42 fix', () => {
  function makeController(commandBus: { execute: jest.Mock }): QcDefectsExtendedController {
    return new QcDefectsExtendedController(
      {} as QcDefectsExtendedService,
      commandBus as unknown as CommandBus,
      { t: jest.fn().mockResolvedValue('quantity required') } as unknown as I18nService,
    );
  }

  it('defaults the stage to in_process (NOT the invalid "production") when omitted', async () => {
    const commandBus = { execute: jest.fn().mockResolvedValue({ ok: true, data: { id: 1 } }) };
    const ctrl = makeController(commandBus);

    await ctrl.createBrak({ quantity: 5 } as Parameters<QcDefectsExtendedController['createBrak']>[0]);

    expect(commandBus.execute).toHaveBeenCalledTimes(1);
    const cmd = commandBus.execute.mock.calls[0][0] as { brakExtras: { stage: string } };
    expect(cmd.brakExtras.stage).toBe('in_process');
  });

  it('passes through an explicit valid stage unchanged', async () => {
    const commandBus = { execute: jest.fn().mockResolvedValue({ ok: true, data: { id: 1 } }) };
    const ctrl = makeController(commandBus);

    await ctrl.createBrak({ quantity: 5, stage: 'dispatch' } as Parameters<QcDefectsExtendedController['createBrak']>[0]);

    const cmd = commandBus.execute.mock.calls[0][0] as { brakExtras: { stage: string } };
    expect(cmd.brakExtras.stage).toBe('dispatch');
  });

  it('rejects the old free-text default "production" — no longer silently accepted', async () => {
    const commandBus = { execute: jest.fn() };
    const ctrl = makeController(commandBus);

    await expect(
      ctrl.createBrak({ quantity: 5, stage: 'production' } as Parameters<QcDefectsExtendedController['createBrak']>[0]),
    ).rejects.toThrow(BadRequestException);
    expect(commandBus.execute).not.toHaveBeenCalled();
  });

  it('rejects arbitrary free-text stage values', async () => {
    const commandBus = { execute: jest.fn() };
    const ctrl = makeController(commandBus);

    await expect(
      ctrl.createBrak({ quantity: 5, stage: 'not-a-real-stage' } as Parameters<QcDefectsExtendedController['createBrak']>[0]),
    ).rejects.toThrow(BadRequestException);
    expect(commandBus.execute).not.toHaveBeenCalled();
  });

  it('accepts each of the 4 canonical stage values used by QcNewController', async () => {
    for (const stage of QcStageSchema.options) {
      const commandBus = { execute: jest.fn().mockResolvedValue({ ok: true, data: { id: 1 } }) };
      const ctrl = makeController(commandBus);

      await ctrl.createBrak({ quantity: 1, stage } as Parameters<QcDefectsExtendedController['createBrak']>[0]);

      const cmd = commandBus.execute.mock.calls[0][0] as { brakExtras: { stage: string } };
      expect(cmd.brakExtras.stage).toBe(stage);
    }
  });
});
