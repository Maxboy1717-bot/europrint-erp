/**
 * test/admin/update-settings.handler.spec.ts
 * Unit tests for UpdateSettingsService. The ISettingsRepo is mocked; SystemSettings is real.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { UpdateSettingsService, UpdateSettingsCommand } from '../../src/modules/admin/application/services/update-settings.service';
import { SETTINGS_REPO } from '../../src/modules/admin/admin.tokens';
import { SystemSettings } from '../../src/modules/admin/domain/entities/system-settings.entity';
import { UserRole } from '../../src/modules/admin/domain/aggregates/user.aggregate';

interface SettingsRepoMock {
  getSettings: jest.Mock;
  save:        jest.Mock;
}

function makeRepo(): SettingsRepoMock {
  return { getSettings: jest.fn(), save: jest.fn() };
}

function makeSettings(): SystemSettings {
  return new SystemSettings({
    id: 1, advancePercent: 50, freeStorageDays: 7,
    storageDailyRate: 100, maxUsers: 500, maintenanceMode: false,
    updatedAt: new Date('2026-01-01'), updatedBy: 1,
  });
}

function makeCmd(over: Partial<UpdateSettingsCommand> = {}): UpdateSettingsCommand {
  return {
    updatedBy: 1,
    userRole: UserRole.SUPER_ADMIN,
    ...over,
  };
}

describe('UpdateSettingsService', () => {
  let handler: UpdateSettingsService;
  let repo: SettingsRepoMock;

  beforeEach(async () => {
    repo = makeRepo();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateSettingsService,
        { provide: SETTINGS_REPO, useValue: repo },
      ],
    }).compile();
    handler = moduleRef.get(UpdateSettingsService);
  });

  it('returns FORBIDDEN when actor is not SUPER_ADMIN', async () => {
    const r = await handler.execute(makeCmd({ userRole: UserRole.EMPLOYEE }));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('FORBIDDEN');
    expect(repo.getSettings).not.toHaveBeenCalled();
  });

  it('returns NOT_FOUND when settings row is missing', async () => {
    repo.getSettings.mockResolvedValue(null);

    const r = await handler.execute(makeCmd({ advancePercent: 80 }));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
  });

  it('applies advancePercent change when value is provided in command', async () => {
    const settings = makeSettings();
    repo.getSettings.mockResolvedValue(settings);
    repo.save.mockResolvedValue(settings);

    const r = await handler.execute(makeCmd({ advancePercent: 80 }));

    expect(r.ok).toBe(true);
    expect(settings.getAdvancePercent()).toBe(80);
    expect(repo.save).toHaveBeenCalledWith(settings);
  });

  it('applies all three settings fields when each is provided in command', async () => {
    const settings = makeSettings();
    repo.getSettings.mockResolvedValue(settings);
    repo.save.mockResolvedValue(settings);

    await handler.execute(makeCmd({
      advancePercent: 75, freeStorageDays: 14, storageDailyRate: 250,
    }));

    expect(settings.getAdvancePercent()).toBe(75);
    expect(settings.getFreeStorageDays()).toBe(14);
    expect(settings.getStorageDailyRate()).toBe(250);
  });

  it('returns Ok and skips field changes when only updatedBy is provided', async () => {
    const settings = makeSettings();
    repo.getSettings.mockResolvedValue(settings);
    repo.save.mockResolvedValue(settings);

    const r = await handler.execute(makeCmd());

    expect(r.ok).toBe(true);
    expect(settings.getAdvancePercent()).toBe(50);
    expect(repo.save).toHaveBeenCalledTimes(1);
  });
});
