/**
 * test/integration/triggers/three-checkpoint-to-pp.spec.ts
 *
 * Trigger 5: design.order.approved / qc.lab.passed -> DesignLabCompletedListener
 * checks both flags on sales_orders, flips master_status, and emits
 * `sd.order.design_lab_completed` so the technologist queue picks it up.
 * The db is mocked so the listener exercise stays hermetic.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';

type Row = Record<string, unknown>;
const dbExecute = jest.fn();

jest.mock('@shared/db', () => ({
  db: { execute: (...args: unknown[]) => dbExecute(...args) },
}));

import { DesignLabCompletedListener } from '../../../src/modules/pp/infrastructure/event-handlers/design-lab-completed.listener';
import { ERP_EVENTS } from '../../../src/common/constants/erp-events.constants';

type EmitterMock = { emit: jest.Mock };

function wrap(rows: Row[]): { rows: Row[] } {
  return { rows };
}

describe('Trigger 5: Design + Lab -> PP technologist signal', () => {
  let listener: DesignLabCompletedListener;
  let emitter: EmitterMock;

  beforeEach(async () => {
    dbExecute.mockReset();
    emitter = { emit: jest.fn() };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        DesignLabCompletedListener,
        { provide: EventEmitter2, useValue: emitter },
      ],
    }).compile();

    listener = moduleRef.get(DesignLabCompletedListener);
  });

  it('emits DesignAndLabCompleted when both design and lab are approved', async () => {
    dbExecute
      .mockResolvedValueOnce(wrap([{
        id: 7,
        design_flag: true,
        sample_flag: true,
        design_status: 'approved',
        lab_status: 'passed',
        master_status: 'pending_design',
      }]))
      .mockResolvedValueOnce(wrap([{ id: 7 }]));

    await listener.onDesignApproved({ orderId: 7 });

    expect(emitter.emit).toHaveBeenCalledTimes(1);
    const [name, payload] = emitter.emit.mock.calls[0];
    expect(name).toBe(ERP_EVENTS.DESIGN_AND_LAB_COMPLETED);
    expect((payload as { orderId: number }).orderId).toBe(7);
  });

  it('skips emission when lab still pending while design is approved', async () => {
    dbExecute.mockResolvedValueOnce(wrap([{
      id: 8,
      design_flag: true,
      sample_flag: true,
      design_status: 'approved',
      lab_status: 'pending',
      master_status: 'pending_design',
    }]));

    await listener.onDesignApproved({ orderId: 8 });

    expect(emitter.emit).not.toHaveBeenCalled();
  });

  it('treats sample_flag=false as lab-ready when lab event arrives early', async () => {
    dbExecute
      .mockResolvedValueOnce(wrap([{
        id: 9,
        design_flag: true,
        sample_flag: false,
        design_status: 'approved',
        lab_status: null,
        master_status: 'pending_design',
      }]))
      .mockResolvedValueOnce(wrap([{ id: 9 }]));

    await listener.onLabPassed({ orderId: 9 });

    expect(emitter.emit).toHaveBeenCalledTimes(1);
    expect(emitter.emit.mock.calls[0][0]).toBe(ERP_EVENTS.DESIGN_AND_LAB_COMPLETED);
  });

  it('does not re-emit when master_status was already advanced', async () => {
    dbExecute
      .mockResolvedValueOnce(wrap([{
        id: 10,
        design_flag: true,
        sample_flag: true,
        design_status: 'approved',
        lab_status: 'passed',
        master_status: 'pending_technology',
      }]))
      .mockResolvedValueOnce(wrap([])); // UPDATE matched 0 rows -> already done

    await listener.onLabPassed({ orderId: 10 });

    expect(emitter.emit).not.toHaveBeenCalled();
  });

  it('skips work when orderId is not finite in incoming payload', async () => {
    await listener.onDesignApproved({ orderId: Number.NaN });

    expect(dbExecute).not.toHaveBeenCalled();
    expect(emitter.emit).not.toHaveBeenCalled();
  });
});
