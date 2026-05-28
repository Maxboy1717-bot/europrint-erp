/**
 * test/hr/hr-api-regression.spec.ts
 *
 * Regression suite — guards the P0/P1 QA fixes from 2026-05-28.
 *
 * WHAT IT PROTECTS:
 *  - GetEmployeesHandler must project snake_case DB rows → camelCase EmployeeRow
 *    (first_name → fullName, hire_date → hireDate, phone_number → phone, etc.)
 *  - If anyone reverts the projection mapping, these tests FAIL before CI merges the change.
 *
 * PATTERN: unit test — no NestJS DI bootstrap, no DB.
 * IHrRepo is mocked with jest.fn(); only findAllEmployees is configured.
 */

import { GetEmployeesHandler } from '../../src/modules/hr/application/queries/get-employees.handler';
import { GetEmployeesQuery } from '../../src/modules/hr/application/queries/get-employees.query';
import { Ok } from '../../src/common/result';
import type { IHrRepo } from '../../src/modules/hr/domain/repositories/i-hr.repo';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRepo(overrides: Partial<IHrRepo> = {}): jest.Mocked<IHrRepo> {
  return {
    findAllEmployees: jest.fn().mockResolvedValue(
      Ok({
        items: [
          {
            id: 42,
            first_name: 'Ali',
            last_name: 'Karimov',
            employee_code: 'EMP-042',
            hire_date: '2024-01-15',
            phone_number: '+998901234567',
            total_points: 85,
            status: 'active',
            department_id: 3,
            department_name: 'Ishlab chiqarish',
            position_name: 'Operator',
            telegram_chat_id: '112233445',
            date_of_birth: '1990-05-20',
            photo_url: null,
          },
        ],
        total: 1,
      }),
    ),
    ...overrides,
  } as unknown as jest.Mocked<IHrRepo>;
}

function makeHandler(repo: jest.Mocked<IHrRepo> = makeRepo()) {
  return new GetEmployeesHandler(repo);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GetEmployeesHandler — camelCase projection regression (P1.1)', () => {
  it('maps first_name + last_name → fullName', async () => {
    const result = await makeHandler().execute(new GetEmployeesQuery({ page: 1, limit: 10 }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.items[0]['fullName']).toBe('Ali Karimov');
  });

  it('does NOT expose raw snake_case fields (first_name, last_name)', async () => {
    const result = await makeHandler().execute(new GetEmployeesQuery({ page: 1, limit: 10 }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const row = result.data.items[0];
    expect(row).not.toHaveProperty('first_name');
    expect(row).not.toHaveProperty('last_name');
  });

  it('maps hire_date → hireDate', async () => {
    const result = await makeHandler().execute(new GetEmployeesQuery({ page: 1, limit: 10 }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.items[0]['hireDate']).toBe('2024-01-15');
  });

  it('maps phone_number → phone', async () => {
    const result = await makeHandler().execute(new GetEmployeesQuery({ page: 1, limit: 10 }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.items[0]['phone']).toBe('+998901234567');
  });

  it('maps total_points → rating', async () => {
    const result = await makeHandler().execute(new GetEmployeesQuery({ page: 1, limit: 10 }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.items[0]['rating']).toBe(85);
  });

  it('maps telegram_chat_id → telegramChatId', async () => {
    const result = await makeHandler().execute(new GetEmployeesQuery({ page: 1, limit: 10 }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.items[0]['telegramChatId']).toBe('112233445');
  });

  it('maps date_of_birth → birthDate', async () => {
    const result = await makeHandler().execute(new GetEmployeesQuery({ page: 1, limit: 10 }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.items[0]['birthDate']).toBe('1990-05-20');
  });

  it('returns correct pagination metadata', async () => {
    const result = await makeHandler().execute(new GetEmployeesQuery({ page: 2, limit: 5 }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.total).toBe(1);
    expect(result.data.page).toBe(2);
    expect(result.data.limit).toBe(5);
  });

  it('returns empty items when repo returns no rows', async () => {
    const repo = makeRepo({
      findAllEmployees: jest.fn().mockResolvedValue(Ok({ items: [], total: 0 })),
    } as Partial<IHrRepo>);
    const result = await makeHandler(repo).execute(new GetEmployeesQuery({ page: 1, limit: 10 }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.items).toHaveLength(0);
    expect(result.data.total).toBe(0);
  });

  it('returns Err when repo rejects (DB error)', async () => {
    const repo = {
      findAllEmployees: jest.fn().mockRejectedValue(new Error('DB connection lost')),
    } as unknown as jest.Mocked<IHrRepo>;
    const result = await makeHandler(repo).execute(new GetEmployeesQuery({ page: 1, limit: 10 }));
    expect(result.ok).toBe(false);
  });

  it('status field defaults to "active" when row.status is missing', async () => {
    const repo = makeRepo({
      findAllEmployees: jest.fn().mockResolvedValue(
        Ok({ items: [{ id: 1, first_name: 'Test', last_name: 'User' }], total: 1 }),
      ),
    } as Partial<IHrRepo>);
    const result = await makeHandler(repo).execute(new GetEmployeesQuery({ page: 1, limit: 10 }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.items[0]['status']).toBe('active');
  });
});
