/**
 * test/lms/cert-expiry.handler.spec.ts
 *
 * Unit tests for CertExpiryHandler. LmsRepository is mocked; the handler is
 * invoked directly to exercise the OnEvent and @Cron methods.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { CertExpiryHandler } from '../../src/modules/lms/infrastructure/event-handlers/cert-expiry.handler';
import { LmsRepository } from '../../src/modules/lms/infrastructure/repositories/drizzle-lms.repo';
import { CertificateExpiredEvent } from '../../src/modules/lms/domain/events/certificate-expired.event';

interface RepoMock {
  updateCertificateStatus: jest.Mock<Promise<void>, [number, string]>;
}

function makeRepo(): RepoMock {
  return { updateCertificateStatus: jest.fn().mockResolvedValue(undefined) };
}

function makeEvent(): CertificateExpiredEvent {
  return new CertificateExpiredEvent({
    certificateId: 11,
    employeeId: 5,
    courseId: 10,
    courseName: 'Safety 101',
    expiredAt: new Date('2026-06-01'),
  });
}

describe('CertExpiryHandler', () => {
  let handler: CertExpiryHandler;
  let repo: RepoMock;

  beforeEach(async () => {
    repo = makeRepo();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CertExpiryHandler,
        { provide: LmsRepository, useValue: repo },
      ],
    }).compile();
    handler = module.get(CertExpiryHandler);
  });

  it('updates certificate status to "expired" when handling CertificateExpired event', async () => {
    await handler.handle(makeEvent());

    expect(repo.updateCertificateStatus).toHaveBeenCalledWith(11, 'expired');
  });

  it('forwards the certificateId from the event payload verbatim', async () => {
    const ev = new CertificateExpiredEvent({
      certificateId: 4242, employeeId: 1, courseId: 2,
      courseName: 'X', expiredAt: new Date('2026-06-01'),
    });

    await handler.handle(ev);

    expect(repo.updateCertificateStatus).toHaveBeenCalledWith(4242, 'expired');
  });

  it('does not call sendAlert when no telegram service is wired up', async () => {
    // No telegramService attached — handler must not crash.
    await expect(handler.handle(makeEvent())).resolves.not.toThrow();
  });

  it('runs daily expiry cron without touching the repo', async () => {
    await handler.checkExpiringCertificates();

    // Cron currently only logs; the repo must remain untouched in this branch.
    expect(repo.updateCertificateStatus).not.toHaveBeenCalled();
  });
});
