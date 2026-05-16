/**
 * test/notifications/mark-notification-read.handler.spec.ts
 * Unit tests for MarkNotificationReadHandler. No external deps.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { MarkNotificationReadHandler } from '../../src/modules/notifications/application/commands/mark-notification-read.handler';
import { MarkNotificationReadCommand } from '../../src/modules/notifications/application/commands/mark-notification-read.command';

describe('MarkNotificationReadHandler', () => {
  let handler: MarkNotificationReadHandler;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [MarkNotificationReadHandler],
    }).compile();
    handler = moduleRef.get(MarkNotificationReadHandler);
  });

  it('returns Ok with notificationId when invoked', async () => {
    const r = await handler.execute(new MarkNotificationReadCommand('notif-1'));

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toBe('notif-1');
  });

  it('passes through arbitrary string ids when constructed with UUID-like values', async () => {
    const r = await handler.execute(new MarkNotificationReadCommand('abc-123-xyz'));

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toBe('abc-123-xyz');
  });

  it('returns Ok with empty string when notificationId is empty', async () => {
    const r = await handler.execute(new MarkNotificationReadCommand(''));

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toBe('');
  });

  it('returns distinct ids across two invocations when called with different ids', async () => {
    const r1 = await handler.execute(new MarkNotificationReadCommand('n-1'));
    const r2 = await handler.execute(new MarkNotificationReadCommand('n-2'));

    expect(r1.ok && r2.ok).toBe(true);
    if (r1.ok && r2.ok) {
      expect(r1.data).toBe('n-1');
      expect(r2.data).toBe('n-2');
    }
  });
});
