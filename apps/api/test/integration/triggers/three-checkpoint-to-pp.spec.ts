/**
 * test/integration/triggers/three-checkpoint-to-pp.spec.ts
 *
 * Trigger 5: DesignApprovedEvent / LabTestPassedEvent -> two split
 * canonical @EventsHandler listeners that share `DesignLabJoinService`.
 * The join service checks both flags on sales_orders, flips master_status,
 * and emits `sd.order.design_lab_completed` so the technologist queue
 * picks it up. The db is mocked so the listener exercise stays hermetic.
 *
 * Wave 4 round-2 (PA2-18): updated when `DesignLabCompletedListener`
 *   was split into `DesignApprovedTrigger5Listener` +
 *   `LabTestPassedTrigger5Listener` + `DesignLabJoinService`.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';

type Row = Record<string, unknown>;
const dbExecute = jest.fn();

jest.mock('@shared/db', () => ({
  db: { execute: (...args: unknown[]) => dbExecute(...args) },
}));

import { DesignApprovedTrigger5Listener } from '../../../src/modules/pp/infrastructure/event-handlers/design-approved-trigger5.listener';
import { LabTestPassedTrigger5Listener } from '../../../src/modules/pp/infrastructure/event-handlers/lab-test-passed-trigger5.listener';
import { DesignLabJoinService } from '../../../src/modules/pp/infrastructure/event-handlers/design-lab-join.service';
import { DesignApprovedEvent } from '../../../src/modules/design/domain/events';
import { LabTestPassedEvent } from '../../../src/modules/qc/domain/events';
import { ERP_EVENTS } from '../../../src/common/constants/erp-events.constants';

type EmitterMock = { emit: jest.Mock };

function wrap(rows: Row[]): { rows: Row[] } {
  return { rows };
}

describe('Trigger 5: Design + Lab -> PP technologist signal', () => {
  let designListener: DesignApprovedTrigger5Listener;
  let labListener: LabTestPassedTrigger5Listener;
  let emitter: EmitterMock;

  beforeEach(async () => {
    dbExecute.mockReset();
    emitter = { emit: jest.fn() };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        DesignApprovedTrigger5Listener,
        LabTestPassedTrigger5Listener,
        DesignLabJoinService,
        { provide: EventEmitter2, useValue: emitter },
      ],
    }).compile();

    designListener = moduleRef.get(DesignApprovedTrigger5Listener);
    labListener = moduleRef.get(LabTestPassedTrigger5Listener);
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

    await designListener.handle(new DesignApprovedEvent('design-7', 7));

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

    await designListener.handle(new DesignApprovedEvent('design-8', 8));

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

    await labListener.handle(new LabTestPassedEvent(9));

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

    await labListener.handle(new LabTestPassedEvent(10));

    expect(emitter.emit).not.toHaveBeenCalled();
  });

  it('skips work when orderId is not finite in incoming event', async () => {
    await designListener.handle(new DesignApprovedEvent('design-x', Number.NaN));

    expect(dbExecute).not.toHaveBeenCalled();
    expect(emitter.emit).not.toHaveBeenCalled();
  });
});
