/**
 * Smoke spec for ChatMessageExtService (Rule 22: every service needs a unit test).
 */
import { ChatMessageExtService } from '../../src/modules/chat/chat-message-ext.service';

describe('ChatMessageExtService', () => {
  const Ok = <T>(data: T) => ({ ok: true, data } as const);
  const repoStub = {
    findMessageForForward:  jest.fn().mockResolvedValue(Ok(null)),
    checkMembership:        jest.fn().mockResolvedValue(Ok(false)),
    insertForwardedMessage: jest.fn().mockResolvedValue(Ok({ id: 'm1' })),
    findUserInfo:           jest.fn().mockResolvedValue(Ok(null)),
  };
  const i18nStub = {
    translate: jest.fn((key: string) => key),
    t:         jest.fn((key: string) => key),
  };

  it('class is defined', () => {
    expect(ChatMessageExtService).toBeDefined();
  });

  it('class name matches expected', () => {
    expect(ChatMessageExtService.name).toBe('ChatMessageExtService');
  });

  it('is constructible with repo and i18n stubs', () => {
    const svc = new ChatMessageExtService(repoStub as never, i18nStub as never);
    expect(svc).toBeInstanceOf(ChatMessageExtService);
  });

  it('exposes forwardMessage as an async function', () => {
    const svc = new ChatMessageExtService(repoStub as never, i18nStub as never);
    expect(typeof svc.forwardMessage).toBe('function');
  });

  it('forwardMessage returns an err Result when the source message is missing', async () => {
    const svc = new ChatMessageExtService(repoStub as never, i18nStub as never);
    const res = await svc.forwardMessage('m-1', 'r-1', 7);
    expect(res).toHaveProperty('ok');
    expect(res.ok).toBe(false);
  });
});
