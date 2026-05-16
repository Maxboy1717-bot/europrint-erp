/**
 * test/lms/get-my-enrollments.handler.spec.ts
 *
 * Unit tests for GetMyEnrollmentsHandler. LmsRepository is mocked; the
 * handler delegates to findEnrollmentsByUser with the requesting userId.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { GetMyEnrollmentsHandler } from '../../src/modules/lms/application/queries/get-my-enrollments.handler';
import { GetMyEnrollmentsQuery } from '../../src/modules/lms/application/queries/get-my-enrollments.query';
import { LmsRepository } from '../../src/modules/lms/infrastructure/repositories/drizzle-lms.repo';
import { Ok, Err } from '../../src/common/result';
import type { Enrollment } from '../../src/modules/lms/domain/repositories/i-lms.repo';

function makeEnrollment(over: Partial<Enrollment> = {}): Enrollment {
  return {
    id: '1', course_id: '10', user_id: '5', status: 'enrolled',
    created_at: new Date('2026-01-01'), ...over,
  };
}

interface RepoMock {
  findEnrollmentsByUser: jest.Mock;
}

function makeRepo(): RepoMock {
  return { findEnrollmentsByUser: jest.fn() };
}

describe('GetMyEnrollmentsHandler', () => {
  let handler: GetMyEnrollmentsHandler;
  let repo: RepoMock;

  beforeEach(async () => {
    repo = makeRepo();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetMyEnrollmentsHandler,
        { provide: LmsRepository, useValue: repo },
      ],
    }).compile();
    handler = module.get(GetMyEnrollmentsHandler);
  });

  it('returns Err when repo returns Err', async () => {
    repo.findEnrollmentsByUser.mockResolvedValue(Err('boom'));

    const r = await handler.execute(new GetMyEnrollmentsQuery('5'));

    expect(r.ok).toBe(false);
  });

  it('returns Ok with items and total when repo succeeds', async () => {
    const items = [makeEnrollment({ id: '1' }), makeEnrollment({ id: '2' })];
    repo.findEnrollmentsByUser.mockResolvedValue(Ok({ items, total: 2 }));

    const r = await handler.execute(new GetMyEnrollmentsQuery('5'));

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.items).toHaveLength(2);
      expect(r.data.total).toBe(2);
    }
  });

  it('passes userId through as first argument', async () => {
    repo.findEnrollmentsByUser.mockResolvedValue(Ok({ items: [], total: 0 }));

    await handler.execute(new GetMyEnrollmentsQuery('42'));

    expect(repo.findEnrollmentsByUser).toHaveBeenCalledWith('42', expect.any(Object));
  });

  it('forwards status / page / limit filters when provided', async () => {
    repo.findEnrollmentsByUser.mockResolvedValue(Ok({ items: [], total: 0 }));

    await handler.execute(new GetMyEnrollmentsQuery('5', 'completed', 2, 30));

    expect(repo.findEnrollmentsByUser).toHaveBeenCalledWith('5', {
      status: 'completed', page: 2, limit: 30,
    });
  });

  it('uses default page=1, limit=20 when query has no overrides', async () => {
    repo.findEnrollmentsByUser.mockResolvedValue(Ok({ items: [], total: 0 }));

    await handler.execute(new GetMyEnrollmentsQuery('5'));

    expect(repo.findEnrollmentsByUser).toHaveBeenCalledWith('5', {
      status: undefined, page: 1, limit: 20,
    });
  });
});
