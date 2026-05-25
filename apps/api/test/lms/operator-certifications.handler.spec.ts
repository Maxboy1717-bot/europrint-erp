/**
 * test/lms/operator-certifications.handler.spec.ts
 *
 * Unit tests for OperatorCertificationsHandler. LmsRepository is mocked;
 * `findByOperatorId` returns the plain row shape (id/courseId/expiresAt/status)
 * which the handler annotates with isValid + daysUntilExpiry.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { OperatorCertificationsHandler, OperatorCertificationsQuery } from '../../src/modules/lms/application/queries/operator-certifications.handler';
import { LmsRepository } from '../../src/modules/lms/infrastructure/repositories/drizzle-lms.repo';

interface CertRow {
  id: number; courseId: number; courseName: string;
  issuedAt: Date; expiresAt?: Date; status: string;
}

interface RepoMock {
  findByOperatorId: jest.Mock<Promise<CertRow[]>, [number]>;
}

function makeRepo(): RepoMock {
  return { findByOperatorId: jest.fn().mockResolvedValue([]) };
}

describe('OperatorCertificationsHandler', () => {
  let handler: OperatorCertificationsHandler;
  let repo: RepoMock;

  beforeEach(async () => {
    repo = makeRepo();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OperatorCertificationsHandler,
        { provide: LmsRepository, useValue: repo },
      ],
    }).compile();
    handler = module.get(OperatorCertificationsHandler);
  });

  it('returns Ok with empty list when operator has no certificates', async () => {
    const r = await handler.execute(new OperatorCertificationsQuery(7));

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toEqual([]);
  });

  it('marks active certificates with future expiry as valid', async () => {
    const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    repo.findByOperatorId.mockResolvedValue([
      { id: 1, courseId: 10, courseName: 'Safety', issuedAt: new Date('2026-01-01'), expiresAt: future, status: 'active' },
    ]);

    const r = await handler.execute(new OperatorCertificationsQuery(7));

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data[0].isValid).toBe(true);
      expect(r.data[0].daysUntilExpiry).toBeGreaterThan(0);
    }
  });

  it('marks expired certificates as invalid', async () => {
    const past = new Date(Date.now() - 24 * 60 * 60 * 1000);
    repo.findByOperatorId.mockResolvedValue([
      { id: 2, courseId: 10, courseName: 'Safety', issuedAt: new Date('2025-01-01'), expiresAt: past, status: 'active' },
    ]);

    const r = await handler.execute(new OperatorCertificationsQuery(7));

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data[0].isValid).toBe(false);
      expect(r.data[0].daysUntilExpiry).toBeLessThan(0);
    }
  });

  it('marks status=expired records as invalid even with future expiry', async () => {
    const future = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
    repo.findByOperatorId.mockResolvedValue([
      { id: 3, courseId: 10, courseName: 'Safety', issuedAt: new Date('2026-01-01'), expiresAt: future, status: 'expired' },
    ]);

    const r = await handler.execute(new OperatorCertificationsQuery(7));

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data[0].isValid).toBe(false);
  });

  it('passes the operatorId through to repo', async () => {
    await handler.execute(new OperatorCertificationsQuery(123));

    expect(repo.findByOperatorId).toHaveBeenCalledWith(123);
  });
});
