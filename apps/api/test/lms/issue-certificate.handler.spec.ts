/**
 * test/lms/issue-certificate.handler.spec.ts
 *
 * Unit tests for IssueCertificateHandler. LmsRepository and EventEmitter2
 * are mocked; the handler computes expiry from validityMonths and emits a
 * lms.certificate.issued event on success.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IssueCertificateHandler, IssueCertificateCommand } from '../../src/modules/lms/application/commands/issue-certificate.handler';
import { LmsRepository } from '../../src/modules/lms/infrastructure/repositories/drizzle-lms.repo';
import { Ok, Err } from '../../src/common/result';

interface LmsRepoMock {
  saveCertificate: jest.Mock;
}

function makeRepo(): LmsRepoMock {
  return { saveCertificate: jest.fn() };
}

describe('IssueCertificateHandler', () => {
  let handler: IssueCertificateHandler;
  let repo: LmsRepoMock;
  let emitter: EventEmitter2;
  let emitSpy: jest.SpyInstance;

  beforeEach(async () => {
    repo = makeRepo();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IssueCertificateHandler,
        { provide: LmsRepository, useValue: repo },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
      ],
    }).compile();
    handler = module.get(IssueCertificateHandler);
    emitter = module.get(EventEmitter2);
    emitSpy = jest.spyOn(emitter, 'emit');
  });

  const cmd = new IssueCertificateCommand(5, 10, 'Safety 101', 12, 1);

  it('returns Err when saveCertificate fails', async () => {
    repo.saveCertificate.mockResolvedValue(Err('db gone'));

    const r = await handler.execute(cmd);

    expect(r.ok).toBe(false);
    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('returns Ok and emits lms.certificate.issued when save succeeds', async () => {
    repo.saveCertificate.mockResolvedValue(Ok({ id: 1 }));

    const r = await handler.execute(cmd);

    expect(r.ok).toBe(true);
    expect(emitSpy).toHaveBeenCalledWith('lms.certificate.issued', expect.objectContaining({
      employeeId: 5, courseId: 10,
    }));
  });

  it('saves a certificate with expiry advanced by validityMonths', async () => {
    repo.saveCertificate.mockResolvedValue(Ok({ id: 1 }));

    await handler.execute(new IssueCertificateCommand(5, 10, 'Safety', 6, 1));

    const cert = repo.saveCertificate.mock.calls[0][0] as { expiresAt: Date };
    const now = new Date();
    const diffMonths = (cert.expiresAt.getFullYear() - now.getFullYear()) * 12
      + (cert.expiresAt.getMonth() - now.getMonth());
    expect(diffMonths).toBe(6);
  });

  it('forwards issuedBy from the command to saveCertificate', async () => {
    repo.saveCertificate.mockResolvedValue(Ok({ id: 1 }));

    await handler.execute(new IssueCertificateCommand(5, 10, 'Safety', 6, 77));

    expect(repo.saveCertificate).toHaveBeenCalledWith(expect.any(Object), 77);
  });
});
