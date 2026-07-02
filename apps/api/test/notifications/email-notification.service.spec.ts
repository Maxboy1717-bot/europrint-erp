/**
 * Unit tests for EmailNotificationService.
 *
 * The service has zero injected dependencies (no repos/DB/network client),
 * so it is directly constructible — this is a behavioral test, not a smoke
 * test: it instantiates the real class and asserts real outputs of the
 * public API's current (stub) contract. If the stub is later wired to a
 * real email provider, these assertions on the resolved value / call
 * signature will guide the update instead of silently rotting.
 */
import { EmailNotificationService } from '../../src/modules/notifications/domain/services/email-notification.service';

describe('EmailNotificationService', () => {
  let service: EmailNotificationService;

  beforeEach(() => {
    service = new EmailNotificationService();
  });

  it('is directly constructible with no dependencies', () => {
    expect(service).toBeInstanceOf(EmailNotificationService);
  });

  it('sendNotification resolves to undefined (no return value) with all args', async () => {
    const result = await service.sendNotification(
      'user@example.com',
      'Subject',
      'Body text',
      'https://example.com/link',
    );

    expect(result).toBeUndefined();
  });

  it('sendNotification resolves to undefined when the optional link is omitted', async () => {
    const result = await service.sendNotification('user@example.com', 'Subject', 'Body text');

    expect(result).toBeUndefined();
  });

  it('sendNotification does not throw for empty-string arguments', async () => {
    await expect(service.sendNotification('', '', '')).resolves.toBeUndefined();
  });

  it('sendNotification returns a Promise (async contract)', () => {
    const returned = service.sendNotification('user@example.com', 'Subject', 'Body text');

    expect(returned).toBeInstanceOf(Promise);
    // Avoid an unhandled-rejection warning if this promise were ever to reject.
    return returned;
  });
});
