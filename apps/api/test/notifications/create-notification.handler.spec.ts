/**
 * test/notifications/create-notification.handler.spec.ts
 * Unit tests for CreateNotificationHandler. Repo + Telegram/Email/SMS services mocked.
 */

let _uuidCnt = 0;
jest.mock('uuid', () => ({
  v4: () => {
    const n = (++_uuidCnt).toString(16).padStart(8, '0');
    return `${n}-0000-4000-8000-000000000000`;
  },
}));

import { Test, TestingModule } from '@nestjs/testing';
import {
  CreateNotificationHandler,
  ExtendedCreateNotificationCommand,
} from '../../src/modules/notifications/application/commands/create-notification.handler';
import { CreateNotificationCommand } from '../../src/modules/notifications/application/commands/create-notification.command';
import { NOTIFICATION_REPO } from '../../src/modules/notifications/domain/repositories/i-notification.repo';
import { Notification } from '../../src/modules/notifications/domain/aggregates/notification.aggregate';
import { TelegramService } from '../../src/modules/notifications/domain/services/telegram.service';
import { EmailNotificationService } from '../../src/modules/notifications/domain/services/email-notification.service';
import { SmsService } from '../../src/modules/notifications/domain/services/sms.service';
import { Ok, Err, AppErr } from '../../src/common/result';

interface RepoMock {
  findById: jest.Mock; findByUserId: jest.Mock; findUnreadCount: jest.Mock;
  save: jest.Mock; markAsRead: jest.Mock; markAllAsRead: jest.Mock;
}
interface TgMock { sendMessage: jest.Mock; sendAlert?: jest.Mock }
interface EmailMock { sendNotification: jest.Mock }
interface SmsMock { send: jest.Mock }

function makeRepo(): RepoMock {
  return {
    findById: jest.fn(), findByUserId: jest.fn(), findUnreadCount: jest.fn(),
    save: jest.fn(), markAsRead: jest.fn(), markAllAsRead: jest.fn(),
  };
}
function makeTg(): TgMock { return { sendMessage: jest.fn().mockResolvedValue(undefined), sendAlert: jest.fn() }; }
function makeEmail(): EmailMock { return { sendNotification: jest.fn().mockResolvedValue(undefined) }; }
function makeSms(): SmsMock { return { send: jest.fn().mockResolvedValue(undefined) }; }

describe('CreateNotificationHandler', () => {
  let handler: CreateNotificationHandler;
  let repo: RepoMock;
  let tg: TgMock;
  let email: EmailMock;
  let sms: SmsMock;

  beforeEach(async () => {
    repo = makeRepo(); tg = makeTg(); email = makeEmail(); sms = makeSms();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        CreateNotificationHandler,
        { provide: NOTIFICATION_REPO, useValue: repo },
        { provide: TelegramService, useValue: tg },
        { provide: EmailNotificationService, useValue: email },
        { provide: SmsService, useValue: sms },
      ],
    }).compile();
    handler = moduleRef.get(CreateNotificationHandler);
  });

  it('returns Ok with saved notification when save succeeds', async () => {
    repo.save.mockImplementation(async (n: Notification) => Ok(n));

    const r = await handler.execute(new CreateNotificationCommand('u1', 'title', 'body', 'info'));

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.title).toBe('title');
  });

  it('propagates repo error when save fails', async () => {
    repo.save.mockResolvedValue(Err(AppErr('DB_ERROR', 'down')));

    const r = await handler.execute(new CreateNotificationCommand('u1', 't', 'b', 'info'));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('DB_ERROR');
  });

  it('delivers via telegram by default when no channels are specified', async () => {
    repo.save.mockImplementation(async (n: Notification) => Ok(n));

    await handler.execute(new CreateNotificationCommand('u1', 't', 'b', 'info'));

    expect(tg.sendMessage).toHaveBeenCalledTimes(1);
    expect(email.sendNotification).not.toHaveBeenCalled();
    expect(sms.send).not.toHaveBeenCalled();
  });

  it('delivers via email when email channel + recipientEmail are provided', async () => {
    repo.save.mockImplementation(async (n: Notification) => Ok(n));
    const cmd: ExtendedCreateNotificationCommand = Object.assign(
      new CreateNotificationCommand('u1', 't', 'b', 'info'),
      { recipientEmail: 'a@x.uz', channels: ['email' as const] },
    );

    await handler.execute(cmd);

    expect(email.sendNotification).toHaveBeenCalledTimes(1);
    expect(tg.sendMessage).not.toHaveBeenCalled();
  });

  it('truncates SMS body to 160 chars when sms channel is selected', async () => {
    repo.save.mockImplementation(async (n: Notification) => Ok(n));
    const longBody = 'x'.repeat(300);
    const cmd: ExtendedCreateNotificationCommand = Object.assign(
      new CreateNotificationCommand('u1', 'hello', longBody, 'info'),
      { recipientPhone: '+998901112233', channels: ['sms' as const] },
    );

    await handler.execute(cmd);

    expect(sms.send).toHaveBeenCalledTimes(1);
    const text = sms.send.mock.calls[0][1] as string;
    expect(text.length).toBe(160);
  });

  it('returns Ok even when Telegram delivery rejects (failure swallowed)', async () => {
    repo.save.mockImplementation(async (n: Notification) => Ok(n));
    tg.sendMessage.mockRejectedValueOnce(new Error('TG down'));

    const r = await handler.execute(new CreateNotificationCommand('u1', 't', 'b', 'info'));

    expect(r.ok).toBe(true);
  });
});
