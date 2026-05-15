/**
 * test/auth/change-password.handler.spec.ts
 *
 * Unit tests for ChangePasswordHandler.
 */

import { ChangePasswordHandler } from '../../src/modules/auth/application/commands/change-password.handler';

function makeI18n() {
  return {
    t: jest.fn().mockImplementation(async (key: string) => key),
    translate: jest.fn().mockImplementation(async (key: string) => key),
  } as unknown as import('nestjs-i18n').I18nService;
}

function makeUser(canChange: boolean) {
  return {
    changePassword: jest.fn().mockResolvedValue(canChange),
  };
}

function makeRepo(user: ReturnType<typeof makeUser> | null) {
  return {
    findById: jest.fn().mockResolvedValue(user),
    save: jest.fn().mockResolvedValue(undefined),
  };
}

describe('ChangePasswordHandler', () => {
  const cmd = {
    userId: 42,
    oldPassword: 'oldPass123!',
    newPassword: 'NewSecure!Pass2026',
  };

  it('returns NOT_FOUND when user is missing', async () => {
    const repo = makeRepo(null);
    const handler = new ChangePasswordHandler(repo as never, makeI18n());

    const r = await handler.execute(cmd);

    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.code).toBe('NOT_FOUND');
      expect(r.error.message).toMatch(/userNotFound|not found/i);
    }
  });

  it('returns VALIDATION on weak new password', async () => {
    const user = makeUser(true);
    const repo = makeRepo(user);
    const handler = new ChangePasswordHandler(repo as never, makeI18n());

    const r = await handler.execute({ ...cmd, newPassword: '123' }); // too short

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('VALIDATION');
  });

  it('returns VALIDATION when old password is wrong', async () => {
    const user = makeUser(false); // changePassword returns false
    const repo = makeRepo(user);
    const handler = new ChangePasswordHandler(repo as never, makeI18n());

    const r = await handler.execute(cmd);

    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.code).toBe('VALIDATION');
      expect(r.error.message).toMatch(/currentPasswordIncorrect|old password/i);
    }
  });

  it('succeeds and persists user on valid input', async () => {
    const user = makeUser(true);
    const repo = makeRepo(user);
    const handler = new ChangePasswordHandler(repo as never, makeI18n());

    const r = await handler.execute(cmd);

    expect(r.ok).toBe(true);
    expect(user.changePassword).toHaveBeenCalledWith(cmd.oldPassword, expect.any(Object));
    expect(repo.save).toHaveBeenCalledWith(user);
  });
});
