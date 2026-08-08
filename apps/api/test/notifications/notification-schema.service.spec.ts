/**
 * Unit tests for NotificationSchemaService.
 *
 * The service has a single injected dependency (NotificationSchemaRepository)
 * and no DB/network access of its own, so it is directly constructible with a
 * fake repo — this is a behavioral test, not a smoke test: it exercises the
 * real onModuleInit() lifecycle hook and asserts real, observable outcomes
 * (repo call count, and that failures are swallowed rather than crashing
 * application bootstrap).
 */
import { Logger } from '@nestjs/common';
import { Ok, Err } from '@common/result';
import { NotificationSchemaService } from '../../src/modules/notifications/infrastructure/notification-schema.service';
import type { NotificationSchemaRepository } from '../../src/modules/notifications/infrastructure/notification-schema.repository';

function flushMicrotasks(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}

describe('NotificationSchemaService', () => {
  it('is directly constructible with a fake repo', () => {
    const repo = { ensurePreferencesTables: jest.fn().mockResolvedValue(Ok(undefined)) };
    const service = new NotificationSchemaService(repo as unknown as NotificationSchemaRepository);

    expect(service).toBeInstanceOf(NotificationSchemaService);
  });

  it('onModuleInit calls repo.ensurePreferencesTables() exactly once', async () => {
    const ensurePreferencesTables = jest.fn().mockResolvedValue(Ok(undefined));
    const service = new NotificationSchemaService({ ensurePreferencesTables } as unknown as NotificationSchemaRepository);

    service.onModuleInit();
    await flushMicrotasks();

    expect(ensurePreferencesTables).toHaveBeenCalledTimes(1);
  });

  it('onModuleInit does not throw when the repo resolves Ok', async () => {
    const ensurePreferencesTables = jest.fn().mockResolvedValue(Ok(undefined));
    const service = new NotificationSchemaService({ ensurePreferencesTables } as unknown as NotificationSchemaRepository);

    expect(() => service.onModuleInit()).not.toThrow();
    await flushMicrotasks();
  });

  it('onModuleInit does not throw when the repo resolves Err (Result failure is not unwrapped)', async () => {
    const ensurePreferencesTables = jest.fn().mockResolvedValue(Err('DDL failed'));
    const service = new NotificationSchemaService({ ensurePreferencesTables } as unknown as NotificationSchemaRepository);

    expect(() => service.onModuleInit()).not.toThrow();
    await flushMicrotasks();

    expect(ensurePreferencesTables).toHaveBeenCalledTimes(1);
  });

  it('onModuleInit swallows a rejected promise and logs a warning instead of crashing startup', async () => {
    const ensurePreferencesTables = jest.fn().mockRejectedValue(new Error('connection refused'));
    const service = new NotificationSchemaService({ ensurePreferencesTables } as unknown as NotificationSchemaRepository);
    const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);

    expect(() => service.onModuleInit()).not.toThrow();
    await flushMicrotasks();

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(String(warnSpy.mock.calls[0][0])).toContain('notification schema init');

    warnSpy.mockRestore();
  });
});
