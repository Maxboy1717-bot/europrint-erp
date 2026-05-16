/**
 * test/security/report-incident.handler.spec.ts
 * Unit tests for ReportIncidentHandler. EventBus is mocked; SecurityIncident is real.
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
import { ReportIncidentHandler } from '../../src/modules/security/application/commands/report-incident.handler';
import { ReportIncidentCommand } from '../../src/modules/security/application/commands/report-incident.command';
import { SecurityIncidentDetectedEvent } from '../../src/modules/security/domain/events';
import { IncidentSeverity, IncidentType } from '../../src/modules/security/domain/enums/incident-severity.enum';

interface BusMock { publish: jest.Mock }
function makeBus(): BusMock { return { publish: jest.fn() }; }

function makeCmd(over: Partial<{ type: string; severity: string; reportedBy: number }> = {}): ReportIncidentCommand {
  return new ReportIncidentCommand(
    over.type ?? IncidentType.UNAUTHORIZED_ACCESS,
    over.severity ?? IncidentSeverity.HIGH,
    'Unusual login pattern',
    'Multiple failed attempts from 192.168.1.50',
    over.reportedBy ?? 1,
  );
}

describe('ReportIncidentHandler', () => {
  let handler: ReportIncidentHandler;
  let bus: BusMock;

  beforeEach(async () => {
    bus = makeBus();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        ReportIncidentHandler,
        { provide: EventBus, useValue: bus },
      ],
    }).compile();
    handler = moduleRef.get(ReportIncidentHandler);
  });

  it('returns Ok with a generated UUID when incident is created', async () => {
    const r = await handler.execute(makeCmd());

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('publishes SecurityIncidentDetectedEvent carrying the new id when reported', async () => {
    const r = await handler.execute(makeCmd({ severity: IncidentSeverity.CRITICAL }));

    expect(bus.publish).toHaveBeenCalledTimes(1);
    const ev = bus.publish.mock.calls[0][0] as SecurityIncidentDetectedEvent;
    expect(ev).toBeInstanceOf(SecurityIncidentDetectedEvent);
    if (r.ok) expect(ev.incidentId).toBe(r.data);
  });

  it('returns different UUIDs across two separate reports when invoked twice', async () => {
    const r1 = await handler.execute(makeCmd());
    const r2 = await handler.execute(makeCmd());

    expect(r1.ok && r2.ok).toBe(true);
    if (r1.ok && r2.ok) expect(r1.data).not.toBe(r2.data);
  });

  it('publishes event carrying the persisted aggregate id (string) when invoked', async () => {
    await handler.execute(makeCmd({ type: IncidentType.DATA_BREACH }));

    const ev = bus.publish.mock.calls[0][0] as SecurityIncidentDetectedEvent;
    expect(typeof ev.incidentId).toBe('string');
    expect(ev.incidentId.length).toBeGreaterThan(0);
  });
});
