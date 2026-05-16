/**
 * test/mro/stop-machine.handler.spec.ts
 * Unit tests for StopMachineHandler. EventBus is mocked.
 */

let _uuidCnt = 0;
jest.mock('uuid', () => ({
  v4: () => {
    const n = (++_uuidCnt).toString(16).padStart(8, '0');
    return `${n}-0000-4000-8000-000000000000`;
  },
}));

import { Test, TestingModule } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import { StopMachineHandler } from '../../src/modules/mro/application/commands/stop-machine.handler';
import { StopMachineCommand } from '../../src/modules/mro/application/commands/stop-machine.command';
import { MroMaintenanceStopEvent } from '../../src/modules/mro/domain/events';

interface BusMock { publish: jest.Mock }
function makeBus(): BusMock { return { publish: jest.fn() }; }

describe('StopMachineHandler', () => {
  let handler: StopMachineHandler;
  let bus: BusMock;

  beforeEach(async () => {
    bus = makeBus();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        StopMachineHandler,
        { provide: EventBus, useValue: bus },
      ],
    }).compile();
    handler = moduleRef.get(StopMachineHandler);
  });

  it('returns Ok with the maintenanceId when invoked', async () => {
    const r = await handler.execute(new StopMachineCommand('m-1', 'machine-7'));

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toBe('m-1');
  });

  it('publishes MroMaintenanceStopEvent with both ids when invoked', async () => {
    await handler.execute(new StopMachineCommand('m-1', 'machine-7'));

    expect(bus.publish).toHaveBeenCalledTimes(1);
    const ev = bus.publish.mock.calls[0][0] as MroMaintenanceStopEvent;
    expect(ev).toBeInstanceOf(MroMaintenanceStopEvent);
    expect(ev.maintenanceId).toBe('m-1');
    expect(ev.machineId).toBe('machine-7');
  });

  it('publishes a fresh event per invocation when called twice', async () => {
    await handler.execute(new StopMachineCommand('m-1', 'machine-a'));
    await handler.execute(new StopMachineCommand('m-2', 'machine-b'));

    expect(bus.publish).toHaveBeenCalledTimes(2);
    const e1 = bus.publish.mock.calls[0][0] as MroMaintenanceStopEvent;
    const e2 = bus.publish.mock.calls[1][0] as MroMaintenanceStopEvent;
    expect(e1.machineId).toBe('machine-a');
    expect(e2.machineId).toBe('machine-b');
  });

  it('passes through command values verbatim when constructed by caller', async () => {
    const cmd = new StopMachineCommand('uuid-xx', 'PRESS-12');

    const r = await handler.execute(cmd);

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toBe('uuid-xx');
    const ev = bus.publish.mock.calls[0][0] as MroMaintenanceStopEvent;
    expect(ev.machineId).toBe('PRESS-12');
  });
});
