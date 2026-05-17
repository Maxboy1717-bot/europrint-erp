/**
 * onboarding-checklists.controller.spec.ts — Phase 4 Task 4.5
 *
 * Covers the new dedicated controller that replaces the stub in
 * `hr-dashboard.controller.ts`:
 *   - GET    /api/hr/onboarding-checklists
 *   - POST   /api/hr/onboarding-checklists
 *   - PATCH  /api/hr/onboarding-checklists/:id
 *   - GET    /api/hr/onboarding-checklists/:id
 */

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OnboardingChecklistsController } from '../../src/modules/hr/onboarding-checklists/onboarding-checklists.controller';
import { OnboardingChecklistsService } from '../../src/modules/hr/onboarding-checklists/onboarding-checklists.service';
import { Ok as ok, Err as err, AppErr } from '../../src/common/result';

describe('OnboardingChecklistsController — Phase 4 Task 4.5', () => {
  let controller: OnboardingChecklistsController;
  let svc: jest.Mocked<OnboardingChecklistsService>;

  beforeEach(() => {
    svc = {
      list: jest.fn(),
      getById: jest.fn(),
      createForUser: jest.fn(),
      updateProgress: jest.fn(),
    } as unknown as jest.Mocked<OnboardingChecklistsService>;
    controller = new OnboardingChecklistsController(svc);
  });

  describe('list', () => {
    it('returns all rows when no type filter', async () => {
      const rows = [
        { id: 1, userId: 10, type: 'onboarding', completedItems: 3, totalItems: 12 },
        { id: 2, userId: 11, type: 'offboarding', completedItems: 5, totalItems: 8 },
      ];
      svc.list.mockResolvedValue(ok(rows));
      const out = await controller.list(undefined);
      expect(svc.list).toHaveBeenCalledWith(undefined);
      expect(out).toEqual(rows);
    });

    it('filters by type=onboarding', async () => {
      svc.list.mockResolvedValue(ok([]));
      await controller.list('onboarding');
      expect(svc.list).toHaveBeenCalledWith('onboarding');
    });

    it('propagates DB errors as HTTP exceptions', async () => {
      svc.list.mockResolvedValue(err(AppErr('INTERNAL', 'db down')));
      await expect(controller.list(undefined)).rejects.toThrow();
    });
  });

  describe('create', () => {
    it('persists with parsed numeric userId', async () => {
      const created = { id: 5, userId: 42, type: 'onboarding', completedItems: 0, totalItems: 12 };
      svc.createForUser.mockResolvedValue(ok(created));

      const out = await controller.create({
        userId: 42,
        type: 'onboarding',
      } as never);

      expect(svc.createForUser).toHaveBeenCalledWith({
        userId: 42,
        type: 'onboarding',
        totalItems: undefined,
      });
      expect(out).toEqual(created);
    });

    it('coerces string userId to number', async () => {
      svc.createForUser.mockResolvedValue(ok({ id: 6 }));
      await controller.create({ userId: '99', type: 'onboarding' } as never);
      expect(svc.createForUser).toHaveBeenCalledWith({
        userId: 99,
        type: 'onboarding',
        totalItems: undefined,
      });
    });

    it('rejects non-numeric userId string with BadRequest', async () => {
      await expect(
        controller.create({ userId: 'abc', type: 'onboarding' } as never),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(svc.createForUser).not.toHaveBeenCalled();
    });

    it('rejects zero/negative userId with BadRequest', async () => {
      await expect(
        controller.create({ userId: 0, type: 'onboarding' } as never),
      ).rejects.toBeInstanceOf(BadRequestException);
      await expect(
        controller.create({ userId: -3, type: 'onboarding' } as never),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('updateProgress', () => {
    it('updates the row with the new counter', async () => {
      const updated = { id: 5, userId: 42, type: 'onboarding', completedItems: 7, totalItems: 12 };
      svc.updateProgress.mockResolvedValue(ok(updated));
      const out = await controller.updateProgress(5, { completedItems: 7 } as never);
      expect(svc.updateProgress).toHaveBeenCalledWith(5, 7);
      expect(out).toEqual(updated);
    });

    it('returns NotFound when row does not exist', async () => {
      svc.updateProgress.mockResolvedValue(err(AppErr('NOT_FOUND', 'Checklist #5 not found')));
      await expect(
        controller.updateProgress(5, { completedItems: 1 } as never),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('returns BadRequest when service rejects negative counter', async () => {
      svc.updateProgress.mockResolvedValue(err(AppErr('VALIDATION', 'completedItems must be >= 0')));
      await expect(
        controller.updateProgress(5, { completedItems: -1 } as never),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('getOne', () => {
    it('returns the row when found', async () => {
      const row = { id: 5, userId: 42, type: 'onboarding', completedItems: 3, totalItems: 12 };
      svc.getById.mockResolvedValue(ok(row));
      const out = await controller.getOne(5);
      expect(out).toEqual(row);
    });

    it('throws NotFound when row is missing', async () => {
      svc.getById.mockResolvedValue(ok(null));
      await expect(controller.getOne(999)).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
