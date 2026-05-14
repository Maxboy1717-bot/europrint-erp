/**
 * @module discipline-routes.spec
 * @description Jest / Vitest test suite.
 */

import { DisciplineV2Service } from '../src/modules/hr/discipline-v2/discipline-v2.service';

describe('DisciplineV2Service – migrated routes', () => {
  let service: DisciplineV2Service;
  let mockRepo: {
    getEmployeeViolations: jest.Mock;
    acknowledgeViolation: jest.Mock;
    approveViolation: jest.Mock;
    checkDisciplineStatus: jest.Mock;
    excuseAbsence: jest.Mock;
  };

  beforeEach(() => {
    mockRepo = {
      getEmployeeViolations: jest.fn(),
      acknowledgeViolation: jest.fn(),
      approveViolation: jest.fn(),
      checkDisciplineStatus: jest.fn(),
      excuseAbsence: jest.fn(),
    };
    service = new DisciplineV2Service(null as any, mockRepo as any);
    jest.clearAllMocks();
  });

  describe('getEmployeeViolations()', () => {
    it('returns violations for an employee', async () => {
      const mockRows = [
        { id: 1, employee_id: 10, catalog_code: 'LATE', catalog_name: 'Kechikish', status: 'pending_review' },
      ];
      mockRepo.getEmployeeViolations.mockResolvedValue({ ok: true, data: mockRows });
      const result = await service.getEmployeeViolations(10);
      expect(result).toEqual(mockRows);
    });

    it('returns empty array when employee has no violations', async () => {
      mockRepo.getEmployeeViolations.mockResolvedValue({ ok: true, data: [] });
      const result = await service.getEmployeeViolations(999);
      expect(result).toEqual([]);
    });
  });

  describe('acknowledgeViolation()', () => {
    it('updates status to acknowledged and returns updated record', async () => {
      const updated = { id: 5, status: 'acknowledged', acknowledged_at: new Date() };
      mockRepo.acknowledgeViolation.mockResolvedValue({ ok: true, data: updated });
      const result = await service.acknowledgeViolation(5);
      expect(result).toEqual(updated);
    });
  });

  describe('approveViolation()', () => {
    it('updates status to approved with approvedBy', async () => {
      const updated = { id: 3, status: 'approved', approved_by: 1 };
      mockRepo.approveViolation.mockResolvedValue({ ok: true, data: updated });
      const result = await service.approveViolation(3, 1);
      expect(result).toEqual(updated);
    });

    it('approves without specifying approvedBy', async () => {
      const updated = { id: 4, status: 'approved', approved_by: null as null };
      mockRepo.approveViolation.mockResolvedValue({ ok: true, data: updated });
      const result = await service.approveViolation(4);
      expect(result).toEqual(updated);
    });
  });

  describe('checkDisciplineStatus()', () => {
    it('returns block status for blocked employee', async () => {
      mockRepo.checkDisciplineStatus.mockResolvedValue({ is_blocked: true, blocked_reason: 'Test' });
      const result = await service.checkDisciplineStatus(10);
      expect(result.is_blocked).toBe(true);
    });

    it('returns { is_blocked: false } when employee not found', async () => {
      mockRepo.checkDisciplineStatus.mockResolvedValue({ is_blocked: false });
      const result = await service.checkDisciplineStatus(999);
      expect(result).toEqual({ is_blocked: false });
    });
  });

  describe('excuseAbsence()', () => {
    it('updates absence_tracking with excuse data', async () => {
      const updated = { id: 7, is_excused: true, excuse_reason: 'Kasallik' };
      mockRepo.excuseAbsence.mockResolvedValue({ ok: true, data: updated });
      const result = await service.excuseAbsence(7, { excuseReason: 'Kasallik' });
      expect(result.is_excused).toBe(true);
    });
  });
});
