/**
 * test/lms/enroll-course.handler.spec.ts
 *
 * Unit tests for EnrollCourseHandler. LmsRepository and EventEmitter2 are
 * mocked; the handler is plain orchestration over them.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EnrollCourseHandler, EnrollCourseCommand } from '../../src/modules/lms/application/commands/enroll-course.handler';
import { LmsRepository } from '../../src/modules/lms/infrastructure/repositories/drizzle-lms.repo';
import { Ok, Err } from '../../src/common/result';
import type { Enrollment } from '../../src/modules/lms/domain/repositories/i-lms.repo';

interface LmsRepoMock {
  findEnrollment: jest.Mock;
  saveEnrollment: jest.Mock;
}

function makeRepo(): LmsRepoMock {
  return {
    findEnrollment: jest.fn().mockResolvedValue(null),
    saveEnrollment: jest.fn(),
  };
}

function makeEnrollment(): Enrollment {
  return {
    id: '1', course_id: '10', user_id: '5', status: 'enrolled', created_at: new Date('2026-01-01'),
  };
}

describe('EnrollCourseHandler', () => {
  let handler: EnrollCourseHandler;
  let repo: LmsRepoMock;
  let emitter: EventEmitter2;
  let emitSpy: jest.SpyInstance;

  beforeEach(async () => {
    repo = makeRepo();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnrollCourseHandler,
        { provide: LmsRepository, useValue: repo },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
      ],
    }).compile();
    handler = module.get(EnrollCourseHandler);
    emitter = module.get(EventEmitter2);
    emitSpy = jest.spyOn(emitter, 'emit');
  });

  const cmd = new EnrollCourseCommand(5, 10, 'Safety 101', 1);

  it('returns Err when an enrollment already exists', async () => {
    repo.findEnrollment.mockResolvedValue({ id: 99 });

    const r = await handler.execute(cmd);

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toMatch(/allaqachon/i);
    expect(repo.saveEnrollment).not.toHaveBeenCalled();
    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('returns Err when saveEnrollment fails', async () => {
    repo.saveEnrollment.mockResolvedValue(Err('db gone'));

    const r = await handler.execute(cmd);

    expect(r.ok).toBe(false);
    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('returns Ok and emits lms.course.enrolled when save succeeds', async () => {
    repo.saveEnrollment.mockResolvedValue(Ok(makeEnrollment()));

    const r = await handler.execute(cmd);

    expect(r.ok).toBe(true);
    expect(emitSpy).toHaveBeenCalledTimes(1);
    expect(emitSpy.mock.calls[0][0]).toBe('lms.course.enrolled');
    const payload = emitSpy.mock.calls[0][1] as { employeeId: number; courseId: number };
    expect(payload.employeeId).toBe(5);
    expect(payload.courseId).toBe(10);
  });

  it('persists enrollment with the command-supplied identifiers', async () => {
    repo.saveEnrollment.mockResolvedValue(Ok(makeEnrollment()));

    await handler.execute(cmd);

    expect(repo.saveEnrollment).toHaveBeenCalledTimes(1);
    const saved = repo.saveEnrollment.mock.calls[0][0] as Enrollment;
    expect(saved.user_id).toBe('5');
    expect(saved.course_id).toBe('10');
    expect(saved.status).toBe('enrolled');
  });
});
