/**
 * Behavioural spec for WeeklyPlanService (Rule 22: every service needs a unit test).
 *
 * Covers the pure `getMondayOfWeek` helper plus the service's real business
 * rules (manager-vs-employee visibility, submit-for-self guard, required-field
 * validation, snake_case→camelCase normalisation, delete/approve permission
 * gates, and the Friday-18:00 approval-deadline rule) against a jest.fn() repo
 * stub — no live DB required.
 *
 * Result<T> shape: business-rule rejections are thrown as NestJS HttpExceptions
 * *inside* the `safeCall(async () => {...})` callback, so `safeCall`'s catch
 * block turns them into a top-level `Err({code, message})` — `res.ok` is
 * `false` and `res.error.message` carries the human-readable reason. (Earlier
 * revisions of this service used `return Err(...)` instead of `throw`, which
 * `safeCall` — designed to catch *thrown* errors — silently re-wrapped as
 * `Ok(...)`, so the controller's `assertOk()`/`unwrapOrThrow()` never saw the
 * failure and the HTTP response came back 200/201 with an error-shaped body.
 * Fixed: every rejection below now throws, so it surfaces as a proper
 * 400/403/404/409 at the HTTP layer.)
 */
import { WeeklyPlanService, getMondayOfWeek, MANAGER_ROLES } from '../../src/modules/remaining/weekly-plan.service';

type Row = Record<string, unknown>;
const Ok = <T>(data: T) => ({ ok: true, data } as const);
const Err = (message: string) => ({ ok: false, error: { code: 'INTERNAL', message } } as const);

/** Asserts a rejected Result: top-level `ok === false` with the expected message. */
function expectRejected(res: { ok: boolean; error?: { message: string } }, matcher: (message: string) => void) {
  expect(res.ok).toBe(false);
  matcher(res.error?.message ?? '');
}

describe('WeeklyPlanService', () => {
  const makeRepo = () => ({
    getStatsSummary:          jest.fn(),
    getAllForManager:         jest.fn(),
    getAllForManagerByEmployee: jest.fn(),
    getAllForEmployee:        jest.fn(),
    findExisting:             jest.fn(),
    updatePlan:               jest.fn(),
    createPlan:               jest.fn(),
    getOne:                   jest.fn(),
    approve:                  jest.fn(),
    updatePlanById:           jest.fn(),
    deletePlan:               jest.fn(),
  });

  it('class is defined', () => {
    expect(WeeklyPlanService).toBeDefined();
  });

  it('class name matches expected', () => {
    expect(WeeklyPlanService.name).toBe('WeeklyPlanService');
  });

  it('is constructible with a repo stub', () => {
    const svc = new WeeklyPlanService(makeRepo() as never);
    expect(svc).toBeInstanceOf(WeeklyPlanService);
  });

  describe('getMondayOfWeek (pure)', () => {
    it('rolls a mid-week Wednesday back to that week\'s Monday', () => {
      expect(getMondayOfWeek('2026-07-01T12:00:00')).toBe('2026-06-29');
    });

    it('returns the same date when given a Monday', () => {
      expect(getMondayOfWeek('2026-06-29T12:00:00')).toBe('2026-06-29');
    });

    it('rolls a Sunday back to the Monday that started that week (day===0 branch)', () => {
      expect(getMondayOfWeek('2026-07-05T12:00:00')).toBe('2026-06-29');
    });

    it('is stable regardless of the host process timezone (explicit Asia/Tashkent via TZDate)', () => {
      // Regression guard for the root-cause timezone bug: this must not depend on
      // process.env.TZ / the OS default zone the way plain `new Date()` arithmetic would.
      const original = process.env.TZ;
      process.env.TZ = 'UTC';
      try {
        expect(getMondayOfWeek('2026-07-01T12:00:00')).toBe('2026-06-29');
      } finally {
        process.env.TZ = original;
      }
    });
  });

  it('MANAGER_ROLES includes the expected manager-tier roles', () => {
    expect(MANAGER_ROLES).toEqual(
      expect.arrayContaining(['director', 'super_admin', 'department_head', 'manager', 'admin']),
    );
    expect(MANAGER_ROLES).not.toContain('employee');
  });

  describe('getAll', () => {
    it('normalises snake_case repo rows to camelCase for a manager (all employees)', async () => {
      const repo = makeRepo();
      repo.getAllForManager.mockResolvedValue(Ok<Row[]>([
        {
          id: 1, employee_id: 42, week_start: '2026-06-29', week_end: '2026-07-03',
          gsd_target: 'Ship order X', top5_tasks: ['a', 'b'], success_factors: 'focus',
          resources_needed: 'none', status: 'submitted', approved_by: null, approved_at: null,
          created_at: '2026-06-29T00:00:00Z',
        },
      ]));
      const svc = new WeeklyPlanService(repo as never);
      const res = await svc.getAll({ id: 1, role: 'manager' }, '2026-07-01');
      expect(res.ok).toBe(true);
      expect(repo.getAllForManager).toHaveBeenCalledWith('2026-06-29');
      if (res.ok) {
        const data = res.data as { plans: Row[]; weekStart: string };
        expect(data.weekStart).toBe('2026-06-29');
        expect(data.plans[0]).toMatchObject({
          id: 1, employeeId: 42, weekStart: '2026-06-29', weekEnd: '2026-07-03',
          gsdTarget: 'Ship order X', top5Tasks: ['a', 'b'], status: 'submitted',
        });
      }
    });

    it('scopes a manager query to one employee when employeeId is passed', async () => {
      const repo = makeRepo();
      repo.getAllForManagerByEmployee.mockResolvedValue(Ok<Row[]>([]));
      const svc = new WeeklyPlanService(repo as never);
      await svc.getAll({ id: 1, role: 'director' }, '2026-07-01', '42');
      expect(repo.getAllForManagerByEmployee).toHaveBeenCalledWith(42, '2026-06-29');
      expect(repo.getAllForManager).not.toHaveBeenCalled();
    });

    it('routes a non-manager to getAllForEmployee scoped to their own id', async () => {
      const repo = makeRepo();
      repo.getAllForEmployee.mockResolvedValue(Ok<Row[]>([]));
      const svc = new WeeklyPlanService(repo as never);
      await svc.getAll({ id: 7, role: 'employee' }, '2026-07-01');
      expect(repo.getAllForEmployee).toHaveBeenCalledWith(7, '2026-06-29');
      expect(repo.getAllForManager).not.toHaveBeenCalled();
    });

    it('defaults to an empty plans array when the repo call fails', async () => {
      const repo = makeRepo();
      repo.getAllForEmployee.mockResolvedValue(Err('db down'));
      const svc = new WeeklyPlanService(repo as never);
      const res = await svc.getAll({ id: 7, role: 'employee' }, '2026-07-01');
      expect(res.ok).toBe(true);
      if (res.ok) expect((res.data as { plans: Row[] }).plans).toEqual([]);
    });
  });

  describe('create', () => {
    it('rejects a non-manager submitting on behalf of another employee', async () => {
      const repo = makeRepo();
      const svc = new WeeklyPlanService(repo as never);
      const res = await svc.create(
        { id: 7, role: 'employee' },
        { employee_id: 99, gsd_target: 'x', top5_tasks: ['a'] },
      );
      expectRejected(res, (msg) => expect(msg).toBe('Boshqa xodim uchun reja topshira olmaysiz'));
      expect(repo.createPlan).not.toHaveBeenCalled();
    });

    it('lets a manager submit a plan for a named employee', async () => {
      const repo = makeRepo();
      repo.findExisting.mockResolvedValue(Ok<Row[]>([]));
      repo.createPlan.mockResolvedValue(Ok<Row>({ id: 5, employee_id: 99 }));
      const svc = new WeeklyPlanService(repo as never);
      const res = await svc.create(
        { id: 1, role: 'manager' },
        { employee_id: 99, gsd_target: 'x', top5_tasks: ['a'], week: '2026-07-01' },
      );
      expect(res.ok).toBe(true);
      expect(repo.createPlan).toHaveBeenCalledWith(99, '2026-06-29', 'x', ['a'], expect.any(Object));
    });

    it('requires gsd_target', async () => {
      const repo = makeRepo();
      const svc = new WeeklyPlanService(repo as never);
      const res = await svc.create({ id: 7, role: 'employee' }, { top5_tasks: ['a'] });
      expectRejected(res, (msg) => expect(msg).toBe('gsd_target talab qilinadi'));
    });

    it('requires a non-empty top5_tasks array', async () => {
      const repo = makeRepo();
      const svc = new WeeklyPlanService(repo as never);
      const res = await svc.create({ id: 7, role: 'employee' }, { gsd_target: 'x', top5_tasks: [] });
      expectRejected(res, (msg) => expect(msg).toBe('top5_tasks array talab qilinadi'));
    });

    it('updates the existing plan for the week instead of creating a duplicate', async () => {
      const repo = makeRepo();
      repo.findExisting.mockResolvedValue(Ok<Row[]>([{ id: 3 }]));
      repo.updatePlan.mockResolvedValue(Ok<Row>({ id: 3 }));
      const svc = new WeeklyPlanService(repo as never);
      const res = await svc.create({ id: 7, role: 'employee' }, { gsd_target: 'x', top5_tasks: ['a'] });
      expect(res.ok).toBe(true);
      if (res.ok) expect((res.data as { updated: boolean }).updated).toBe(true);
      expect(repo.updatePlan).toHaveBeenCalledWith(3, 'x', ['a'], expect.any(Object));
      expect(repo.createPlan).not.toHaveBeenCalled();
    });
  });

  describe('getOne', () => {
    it('lets an employee read their own plan', async () => {
      const repo = makeRepo();
      repo.getOne.mockResolvedValue(Ok<Row>({ id: 1, employee_id: 7 }));
      const svc = new WeeklyPlanService(repo as never);
      const res = await svc.getOne('1', { id: 7, role: 'employee' });
      expect(res.ok).toBe(true);
    });

    it('blocks an employee from reading someone else\'s plan', async () => {
      const repo = makeRepo();
      repo.getOne.mockResolvedValue(Ok<Row>({ id: 1, employee_id: 99 }));
      const svc = new WeeklyPlanService(repo as never);
      const res = await svc.getOne('1', { id: 7, role: 'employee' });
      expectRejected(res, (msg) => expect(msg).toBe("Ruxsat yo'q"));
    });

    it('lets a manager read any employee\'s plan', async () => {
      const repo = makeRepo();
      repo.getOne.mockResolvedValue(Ok<Row>({ id: 1, employee_id: 99 }));
      const svc = new WeeklyPlanService(repo as never);
      const res = await svc.getOne('1', { id: 1, role: 'manager' });
      expect(res.ok).toBe(true);
    });

    it('rejects a non-numeric id', async () => {
      const repo = makeRepo();
      const svc = new WeeklyPlanService(repo as never);
      const res = await svc.getOne('abc', { id: 1, role: 'manager' });
      expectRejected(res, (msg) => expect(msg).toBe("Noto'g'ri ID"));
      expect(repo.getOne).not.toHaveBeenCalled();
    });

    it('reports not-found (not a silent 200) when the repo row is null', async () => {
      const repo = makeRepo();
      repo.getOne.mockResolvedValue(Ok<Row | null>(null));
      const svc = new WeeklyPlanService(repo as never);
      const res = await svc.getOne('999', { id: 1, role: 'manager' });
      expectRejected(res, (msg) => expect(msg).toBe('Reja topilmadi'));
    });
  });

  describe('deletePlan', () => {
    it('blocks a non-manager from deleting', async () => {
      const repo = makeRepo();
      repo.getOne.mockResolvedValue(Ok<Row>({ id: 1, employee_id: 7 }));
      const svc = new WeeklyPlanService(repo as never);
      const res = await svc.deletePlan('1', { id: 7, role: 'employee' });
      expectRejected(res, (msg) => expect(msg).toBe("Faqat menejer reja o'chira oladi"));
      expect(repo.deletePlan).not.toHaveBeenCalled();
    });

    it('lets a manager delete an existing plan', async () => {
      const repo = makeRepo();
      repo.getOne.mockResolvedValue(Ok<Row>({ id: 1, employee_id: 7 }));
      repo.deletePlan.mockResolvedValue(Ok<boolean>(true));
      const svc = new WeeklyPlanService(repo as never);
      const res = await svc.deletePlan('1', { id: 1, role: 'manager' });
      expect(res.ok).toBe(true);
      if (res.ok) expect(res.data).toEqual({ deleted: true, id: 1 });
    });
  });

  describe('approve', () => {
    it('blocks a non-manager from approving (self-approval gap closed)', async () => {
      const repo = makeRepo();
      const svc = new WeeklyPlanService(repo as never);
      const res = await svc.approve('1', { id: 7, role: 'employee' });
      expectRejected(res, (msg) => expect(msg).toBe('Faqat menejer reja tasdiqlay oladi'));
      expect(repo.getOne).not.toHaveBeenCalled();
    });

    it('rejects re-approving an already-approved plan', async () => {
      const repo = makeRepo();
      repo.getOne.mockResolvedValue(Ok<Row>({ id: 1, status: 'approved', week_start: '2026-06-29' }));
      const svc = new WeeklyPlanService(repo as never);
      const res = await svc.approve('1', { id: 1, role: 'manager' });
      expectRejected(res, (msg) => expect(msg).toBe('Reja allaqachon tasdiqlangan'));
      expect(repo.approve).not.toHaveBeenCalled();
    });

    it('rejects approval once the Friday-18:00 deadline for that week has passed', async () => {
      const repo = makeRepo();
      // Week from 2020 is guaranteed to be in the past regardless of when this runs.
      repo.getOne.mockResolvedValue(Ok<Row>({ id: 1, status: 'submitted', week_start: '2020-01-06' }));
      const svc = new WeeklyPlanService(repo as never);
      const res = await svc.approve('1', { id: 1, role: 'manager' });
      expectRejected(res, (msg) => expect(msg).toContain('tasdiqlash muddati'));
      expect(repo.approve).not.toHaveBeenCalled();
    });

    it('approves a submitted plan whose deadline has not passed yet', async () => {
      const repo = makeRepo();
      // Monday of a week far in the future — deadline is guaranteed not to have passed.
      repo.getOne.mockResolvedValue(Ok<Row>({ id: 1, status: 'submitted', week_start: '2099-01-05' }));
      repo.approve.mockResolvedValue(Ok<Row>({ id: 1, status: 'approved' }));
      const svc = new WeeklyPlanService(repo as never);
      const res = await svc.approve('1', { id: 3, role: 'manager' });
      expect(res.ok).toBe(true);
      expect(repo.approve).toHaveBeenCalledWith(1, 3);
    });

    it('is not fooled by the host process timezone when checking the deadline', async () => {
      // Regression guard for the 5h double-conversion bug: on a UTC-TZ host, the old
      // "new Date + setHours + manual -5h" code computed the wrong instant. Force TZ=UTC
      // here and confirm a week whose Tashkent deadline has clearly not passed is still
      // approvable, and a week whose Tashkent deadline has clearly passed is still blocked.
      const original = process.env.TZ;
      process.env.TZ = 'UTC';
      try {
        const repo = makeRepo();
        repo.getOne.mockResolvedValue(Ok<Row>({ id: 1, status: 'submitted', week_start: '2099-01-05' }));
        repo.approve.mockResolvedValue(Ok<Row>({ id: 1, status: 'approved' }));
        const svc = new WeeklyPlanService(repo as never);
        const res = await svc.approve('1', { id: 3, role: 'manager' });
        expect(res.ok).toBe(true);
      } finally {
        process.env.TZ = original;
      }
    });
  });
});
