/**
 * test/notifications/telegram.service.spec.ts
 *
 * Unit tests for TelegramSvc (apps/api/src/modules/notifications/telegram/telegram.service.ts).
 *
 * The service has exactly two injected dependencies (ITelegramSvcRepository,
 * ConfigService) and no direct DB/Nest wiring, so it is directly constructible
 * with a hand-built fake repo + a minimal ConfigService stub — this is a
 * behavioral test, not a smoke test: it exercises the real branching logic
 * (invalid userId, DB-insert failure, missing chat_id, missing bot token,
 * Telegram API success/failure/network-error, bulk aggregation, status probe)
 * and asserts the real `Result<T>` outputs, including the exact `status` /
 * `reason` strings the frontend depends on.
 */
import { ConfigService } from '@nestjs/config';
import { TelegramSvc } from '../../src/modules/notifications/telegram/telegram.service';
import type { ITelegramSvcRepository } from '../../src/modules/notifications/telegram/i-telegram-svc.repo';
import { Ok, Err } from '../../src/common/result';

function makeRepo(overrides: Partial<ITelegramSvcRepository> = {}): ITelegramSvcRepository {
  return {
    insertNotification: jest.fn().mockResolvedValue(Ok({ id: 1 })),
    countAll: jest.fn().mockResolvedValue(Ok(0)),
    getUserChatId: jest.fn().mockResolvedValue(Ok(null)),
    ...overrides,
  };
}

function makeConfig(botToken: string | undefined): ConfigService {
  return { get: jest.fn().mockReturnValue(botToken) } as unknown as ConfigService;
}

describe('TelegramSvc', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  describe('sendMessage', () => {
    it('rejects an invalid (non-numeric) userId without touching the repo', async () => {
      const repo = makeRepo();
      const svc = new TelegramSvc(repo, makeConfig('token-123'));

      const r = await svc.sendMessage({ userId: 'abc', message: 'hi' });

      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.code).toBe('BAD_REQUEST');
      expect(repo.insertNotification).not.toHaveBeenCalled();
    });

    it('rejects a zero/negative userId', async () => {
      const repo = makeRepo();
      const svc = new TelegramSvc(repo, makeConfig('token-123'));

      const r = await svc.sendMessage({ userId: '0', message: 'hi' });

      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.code).toBe('BAD_REQUEST');
    });

    it('propagates the repository error when the DB insert fails', async () => {
      const repo = makeRepo({
        insertNotification: jest.fn().mockResolvedValue(Err({ code: 'DB_ERROR', message: 'insert boom' })),
      });
      const svc = new TelegramSvc(repo, makeConfig('token-123'));

      const r = await svc.sendMessage({ userId: '5', message: 'hi' });

      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.message).toBe('insert boom');
    });

    it('returns pending when the user has no linked telegram_chat_id', async () => {
      const repo = makeRepo({
        getUserChatId: jest.fn().mockResolvedValue(Ok(null)),
      });
      const svc = new TelegramSvc(repo, makeConfig('token-123'));

      const r = await svc.sendMessage({ userId: '5', message: 'hello' });

      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data.status).toBe('pending');
        expect(r.data.reason).toBe('no telegram_chat_id linked');
        expect(r.data.recipient).toBe('5');
      }
    });

    it('returns pending (DB-only mode) when TELEGRAM_BOT_TOKEN is not configured, even with a chat_id', async () => {
      const repo = makeRepo({
        getUserChatId: jest.fn().mockResolvedValue(Ok('chat-999')),
      });
      const svc = new TelegramSvc(repo, makeConfig(undefined));

      const r = await svc.sendMessage({ userId: '5', message: 'hello' });

      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data.status).toBe('pending');
        expect(r.data.reason).toBe('bot token not configured');
      }
    });

    it('returns delivered when Telegram responds 2xx', async () => {
      const repo = makeRepo({
        getUserChatId: jest.fn().mockResolvedValue(Ok('chat-999')),
      });
      global.fetch = jest.fn().mockResolvedValue({ ok: true }) as unknown as typeof fetch;
      const svc = new TelegramSvc(repo, makeConfig('token-123'));

      const r = await svc.sendMessage({ userId: '5', message: 'hello', groupId: 'g1' });

      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data.status).toBe('delivered');
        expect(r.data.groupId).toBe('g1');
        expect(r.data.messageId).toMatch(/^tg_/);
      }
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.telegram.org/bottoken-123/sendMessage',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('returns failed with the HTTP status when Telegram responds non-2xx', async () => {
      const repo = makeRepo({
        getUserChatId: jest.fn().mockResolvedValue(Ok('chat-999')),
      });
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 403,
        text: () => Promise.resolve('Forbidden: bot was blocked by the user'),
      }) as unknown as typeof fetch;
      const svc = new TelegramSvc(repo, makeConfig('token-123'));

      const r = await svc.sendMessage({ userId: '5', message: 'hello' });

      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data.status).toBe('failed');
        expect(r.data.reason).toBe('Telegram 403');
      }
    });

    it('returns failed with the error message when the network call throws', async () => {
      const repo = makeRepo({
        getUserChatId: jest.fn().mockResolvedValue(Ok('chat-999')),
      });
      global.fetch = jest.fn().mockRejectedValue(new Error('ECONNRESET')) as unknown as typeof fetch;
      const svc = new TelegramSvc(repo, makeConfig('token-123'));

      const r = await svc.sendMessage({ userId: '5', message: 'hello' });

      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data.status).toBe('failed');
        expect(r.data.reason).toBe('ECONNRESET');
      }
    });
  });

  describe('getStatus', () => {
    it('reports inactive/unconfigured when there is no bot token', async () => {
      const repo = makeRepo({ countAll: jest.fn().mockResolvedValue(Ok(7)) });
      const svc = new TelegramSvc(repo, makeConfig(undefined));

      const r = await svc.getStatus();

      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data).toEqual({ isActive: false, connectedUsers: 7, tokenConfigured: false });
      }
    });

    it('reports active/configured when a bot token is present', async () => {
      const repo = makeRepo({ countAll: jest.fn().mockResolvedValue(Ok(3)) });
      const svc = new TelegramSvc(repo, makeConfig('token-123'));

      const r = await svc.getStatus();

      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data).toEqual({ isActive: true, connectedUsers: 3, tokenConfigured: true });
      }
    });

    it('propagates a repository failure', async () => {
      const repo = makeRepo({ countAll: jest.fn().mockResolvedValue(Err({ code: 'DB_ERROR', message: 'count boom' })) });
      const svc = new TelegramSvc(repo, makeConfig('token-123'));

      const r = await svc.getStatus();

      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.message).toBe('count boom');
    });
  });

  describe('sendNotification', () => {
    it('delegates to sendMessage with the given title', async () => {
      const repo = makeRepo({ getUserChatId: jest.fn().mockResolvedValue(Ok(null)) });
      const svc = new TelegramSvc(repo, makeConfig(undefined));

      const r = await svc.sendNotification(42, 'Reminder', 'Body text');

      expect(r.ok).toBe(true);
      expect(repo.insertNotification).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 42, title: 'Reminder', message: 'Body text' }),
      );
    });
  });

  describe('sendBulk', () => {
    it('counts every recipient as sent when each delivery is pending/delivered', async () => {
      const repo = makeRepo({ getUserChatId: jest.fn().mockResolvedValue(Ok(null)) });
      const svc = new TelegramSvc(repo, makeConfig(undefined));

      const r = await svc.sendBulk([1, 2, 3], 'broadcast');

      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ sent: 3, failed: 0, total: 3 });
    });

    it('counts DB-insert failures as failed', async () => {
      const repo = makeRepo({
        insertNotification: jest
          .fn()
          .mockResolvedValueOnce(Ok({ id: 1 }))
          .mockResolvedValueOnce(Err({ code: 'DB_ERROR', message: 'boom' })),
      });
      const svc = new TelegramSvc(repo, makeConfig(undefined));

      const r = await svc.sendBulk([1, 2], 'broadcast');

      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ sent: 1, failed: 1, total: 2 });
    });

    it('treats an undeliverable Telegram response as failed, not sent', async () => {
      const repo = makeRepo({ getUserChatId: jest.fn().mockResolvedValue(Ok('chat-1')) });
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        text: () => Promise.resolve('bad request'),
      }) as unknown as typeof fetch;
      const svc = new TelegramSvc(repo, makeConfig('token-123'));

      const r = await svc.sendBulk([1], 'broadcast');

      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ sent: 0, failed: 1, total: 1 });
    });

    it('handles an empty recipient list', async () => {
      const repo = makeRepo();
      const svc = new TelegramSvc(repo, makeConfig(undefined));

      const r = await svc.sendBulk([], 'broadcast');

      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ sent: 0, failed: 0, total: 0 });
    });
  });
});
