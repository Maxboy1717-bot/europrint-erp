/**
 * Smoke spec for PushService (Rule 22: every service needs a unit test).
 */
import { PushService } from '../../src/modules/chat/push.service';

describe('PushService', () => {
  const Ok = <T>(data: T) => ({ ok: true, data } as const);
  const configStub = {
    get: jest.fn().mockReturnValue(undefined),
  };
  const pushRepoStub = {
    insert:           jest.fn().mockResolvedValue(Ok({ id: 'sub-1' })),
    findActiveByUser: jest.fn().mockResolvedValue(Ok([])),
    deactivate:       jest.fn().mockResolvedValue(Ok(undefined)),
  };

  it('class is defined', () => {
    expect(PushService).toBeDefined();
  });

  it('class name matches expected', () => {
    expect(PushService.name).toBe('PushService');
  });

  it('is constructible with config + repo stubs', () => {
    const svc = new PushService(configStub as never, pushRepoStub as never);
    expect(svc).toBeInstanceOf(PushService);
  });

  it('register delegates to pushRepo.insert with normalized channel payload', async () => {
    const svc = new PushService(configStub as never, pushRepoStub as never);
    const res = await svc.register('user-1', { channel: 'web', endpoint: 'https://e', p256dh: 'k', auth: 'a' });
    expect(res.ok).toBe(true);
    expect(pushRepoStub.insert).toHaveBeenCalledWith('user-1', expect.objectContaining({ channel: 'web', endpoint: 'https://e' }));
  });

  it('register normalizes optional fields to null when missing', async () => {
    const svc = new PushService(configStub as never, pushRepoStub as never);
    await svc.register('user-2', { channel: 'apns' });
    expect(pushRepoStub.insert).toHaveBeenCalledWith('user-2', expect.objectContaining({
      channel:    'apns',
      endpoint:   null,
      p256dh:     null,
      auth:       null,
      fcmToken:   null,
      apnsToken:  null,
      deviceInfo: null,
    }));
  });
});
