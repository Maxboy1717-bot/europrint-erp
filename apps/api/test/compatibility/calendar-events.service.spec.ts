/**
 * Smoke spec for CalendarEventsService (Rule 22: every service needs a unit test).
 */
import { CalendarEventsService } from '../../src/modules/compatibility/calendar-events.service';

describe('CalendarEventsService', () => {
  const Ok = <T>(data: T) => ({ ok: true, data } as const);
  const repoStub = {
    findAll:      jest.fn().mockResolvedValue(Ok([{ id: 'a', eventType: 'holiday' }, { id: 'b', eventType: 'meeting' }])),
    findUpcoming: jest.fn().mockResolvedValue(Ok([])),
    findById:     jest.fn().mockResolvedValue(Ok({ id: 'a', eventType: 'holiday' })),
  };

  it('class is defined', () => {
    expect(CalendarEventsService).toBeDefined();
  });

  it('class name matches expected', () => {
    expect(CalendarEventsService.name).toBe('CalendarEventsService');
  });

  it('is constructible with a repo stub', () => {
    const svc = new CalendarEventsService(repoStub as never);
    expect(svc).toBeInstanceOf(CalendarEventsService);
  });

  it('getAll returns all rows when no eventType filter', async () => {
    const svc = new CalendarEventsService(repoStub as never);
    const res = await svc.getAll();
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.data).toHaveLength(2);
  });

  it('getAll filters by eventType when provided', async () => {
    const svc = new CalendarEventsService(repoStub as never);
    const res = await svc.getAll('meeting');
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data).toHaveLength(1);
      expect((res.data[0] as { eventType: string }).eventType).toBe('meeting');
    }
  });

  it('getUpcoming delegates to repo.findUpcoming', async () => {
    const svc = new CalendarEventsService(repoStub as never);
    const res = await svc.getUpcoming();
    expect(res.ok).toBe(true);
    expect(repoStub.findUpcoming).toHaveBeenCalled();
  });
});
