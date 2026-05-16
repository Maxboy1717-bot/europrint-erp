/**
 * test/lms/get-courses.handler.spec.ts
 *
 * Unit tests for GetCoursesHandler. LmsRepository is mocked; the handler is
 * a thin pass-through that forwards query filters to findAllCourses.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { GetCoursesHandler } from '../../src/modules/lms/application/queries/get-courses.handler';
import { GetCoursesQuery } from '../../src/modules/lms/application/queries/get-courses.query';
import { LmsRepository } from '../../src/modules/lms/infrastructure/repositories/drizzle-lms.repo';
import { Ok, Err } from '../../src/common/result';
import type { Course } from '../../src/modules/lms/domain/repositories/i-lms.repo';

function makeCourse(over: Partial<Course> = {}): Course {
  return {
    id: '1', title: 'Intro', is_mandatory: false, passing_score: 70,
    created_by: '1', created_at: new Date('2026-01-01'), ...over,
  };
}

interface RepoMock {
  findAllCourses: jest.Mock;
}

function makeRepo(): RepoMock {
  return { findAllCourses: jest.fn() };
}

describe('GetCoursesHandler', () => {
  let handler: GetCoursesHandler;
  let repo: RepoMock;

  beforeEach(async () => {
    repo = makeRepo();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetCoursesHandler,
        { provide: LmsRepository, useValue: repo },
      ],
    }).compile();
    handler = module.get(GetCoursesHandler);
  });

  it('returns Err when repository returns Err', async () => {
    repo.findAllCourses.mockResolvedValue(Err('boom'));

    const r = await handler.execute(new GetCoursesQuery());

    expect(r.ok).toBe(false);
  });

  it('returns Ok with items and total when repo succeeds', async () => {
    const items = [makeCourse({ id: '1' }), makeCourse({ id: '2' })];
    repo.findAllCourses.mockResolvedValue(Ok({ items, total: 2 }));

    const r = await handler.execute(new GetCoursesQuery());

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.items).toHaveLength(2);
      expect(r.data.total).toBe(2);
    }
  });

  it('forwards all four filters (isMandatory, category, page, limit) to the repo', async () => {
    repo.findAllCourses.mockResolvedValue(Ok({ items: [], total: 0 }));

    await handler.execute(new GetCoursesQuery(true, 'safety', 3, 50));

    expect(repo.findAllCourses).toHaveBeenCalledWith({
      isMandatory: true, category: 'safety', page: 3, limit: 50,
    });
  });

  it('uses default page=1, limit=20 when query has no overrides', async () => {
    repo.findAllCourses.mockResolvedValue(Ok({ items: [], total: 0 }));

    await handler.execute(new GetCoursesQuery());

    expect(repo.findAllCourses).toHaveBeenCalledWith({
      isMandatory: undefined, category: undefined, page: 1, limit: 20,
    });
  });
});
