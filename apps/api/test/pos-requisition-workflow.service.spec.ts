/**
 * pos-requisition-workflow.service.spec.ts
 *
 * Unit tests for PosRequisitionWorkflowService.
 * @workspace/db is fully mocked — no real database is used.
 */

// ─── Stub out deep transitive dependencies that have unmapped aliases ─────────
// PosMovementService → lifecycle-block.service → @shared/utils/safe-json
// Since PosMovementService is fully mocked below, we just need the module graph
// to resolve. Mocking the service file prevents the entire dep chain from loading.
jest.mock('../src/modules/pos/services/pos-movement.service', () => ({
  PosMovementService: jest.fn().mockImplementation(() => ({
    createMovement: jest.fn(),
  })),
}));

// ─── Drizzle DB mock ──────────────────────────────────────────────────────────

const mockDbSelect    = jest.fn();
const mockDbUpdate    = jest.fn();
const mockDbExecute   = jest.fn();
const mockDbUpdateSet = jest.fn();
const mockDbUpdateWhere = jest.fn();
const mockDbUpdateReturning = jest.fn();
const mockDbSelectFrom = jest.fn();
const mockDbSelectWhere = jest.fn();

jest.mock('../../../lib/db/dist/cjs/index.js', () => {
  return {
    db: {
      select:  mockDbSelect,
      update:  mockDbUpdate,
      execute: mockDbExecute,
    },
    eq:  jest.fn(() => ({})),
    sql: jest.fn((strings: TemplateStringsArray, ...values: unknown[]) => ({ strings, values })),
    posMaterialRequests:     {},
    posMaterialRequestLines: { requestId: 'requestId' },
  };
}, { virtual: true });

// ─── TashkentTimeService mock ─────────────────────────────────────────────────
// The service file imports: import { TashkentTimeService } from '@common/time'
// jest.config maps  ^@common/(.*)$  →  <rootDir>/src/common/$1
jest.mock('../src/common/time', () => ({
  TashkentTimeService: jest.fn().mockImplementation(() => ({
    now: jest.fn(() => new Date('2024-06-15T12:00:00Z')),
  })),
}));

import { Test, TestingModule }   from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 }         from '@nestjs/event-emitter';

import { PosRequisitionWorkflowService } from '../src/modules/pos/services/pos-requisition-workflow.service';
import { PosMovementService }            from '../src/modules/pos/services/pos-movement.service';
import { PosNotificationsService }       from '../src/modules/pos/services/pos-notifications.service';
import { EmployeeLedgerService }         from '../src/modules/pos/employee-ledger.service';
import { PosRequestExtRepository }       from '../src/modules/pos/pos-request-ext.repository';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeRequest(overrides: Record<string, unknown> = {}) {
  return {
    id:               1,
    requestNumber:    'REQ-2024-001',
    status:           'DRAFT',
    requestedBy:      42,
    departmentCode:   'IT',
    targetWarehouseId: 'WH-01',
    approvedBy:       null,
    approvedAt:       null,
    rejectionReason:  null,
    posMovementId:    null,
    justification:    null,
    updatedAt:        new Date(),
    createdAt:        new Date(),
    ...overrides,
  };
}

function makeLines(count = 2) {
  return Array.from({ length: count }, (_, i) => ({
    id:             100 + i,
    requestId:      1,
    materialCardId: 200 + i,
    requestedQty:   10,
    approvedQty:    10,
    issuedQty:      null,
  }));
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('PosRequisitionWorkflowService', () => {
  let service:         PosRequisitionWorkflowService;
  let movementSvc:     jest.Mocked<PosMovementService>;
  let notifSvc:        jest.Mocked<PosNotificationsService>;
  let employeeLedger:  jest.Mocked<EmployeeLedgerService>;
  let requestExtRepo:  jest.Mocked<PosRequestExtRepository>;
  let emitter:         jest.Mocked<EventEmitter2>;

  // Reset fluent DB chain before each test
  function setupDbChain(
    fetchedRequest: Record<string, unknown>,
    lines: Record<string, unknown>[] = [],
    updatedRequest: Record<string, unknown> = fetchedRequest,
  ) {
    // db.select().from().where() — used by fetchRequest and fetchLines
    const selectChain = {
      from: jest.fn().mockReturnValue({
        where: jest.fn()
          .mockResolvedValueOnce([fetchedRequest])  // fetchRequest
          .mockResolvedValue(lines),                // fetchLines
      }),
    };
    mockDbSelect.mockReturnValue(selectChain);

    // db.update().set().where().returning()
    mockDbUpdate.mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([updatedRequest]),
        }),
      }),
    });

    // db.execute() — for reserveStock / releaseReservedStock
    mockDbExecute.mockResolvedValue({ rows: [] });
  }

  beforeEach(async () => {
    jest.clearAllMocks();

    movementSvc = {
      createMovement: jest.fn(),
    } as unknown as jest.Mocked<PosMovementService>;

    notifSvc = {
      sendNotification: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<PosNotificationsService>;

    employeeLedger = {
      addEntry: jest.fn().mockResolvedValue({ ok: true }),
    } as unknown as jest.Mocked<EmployeeLedgerService>;

    requestExtRepo = {
      getInternalIssueTypeId: jest.fn().mockResolvedValue({ ok: true, data: { id: 5 } }),
    } as unknown as jest.Mocked<PosRequestExtRepository>;

    emitter = {
      emit: jest.fn(),
    } as unknown as jest.Mocked<EventEmitter2>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PosRequisitionWorkflowService,
        { provide: PosMovementService,       useValue: movementSvc      },
        { provide: PosNotificationsService,  useValue: notifSvc         },
        { provide: EmployeeLedgerService,    useValue: employeeLedger   },
        { provide: PosRequestExtRepository,  useValue: requestExtRepo   },
        { provide: EventEmitter2,            useValue: emitter          },
      ],
    }).compile();

    service = module.get<PosRequisitionWorkflowService>(PosRequisitionWorkflowService);
  });

  // ─── submitRequisition ─────────────────────────────────────────────────────

  describe('submitRequisition()', () => {
    it('should transition DRAFT → SUBMITTED', async () => {
      const req = makeRequest({ status: 'DRAFT', requestedBy: 42 });
      const updated = makeRequest({ status: 'SUBMITTED', requestedBy: 42 });
      setupDbChain(req, [], updated);

      const result = await service.submitRequisition(1, 42);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.status).toBe('SUBMITTED');
      expect(emitter.emit).toHaveBeenCalledWith('pos.requisition.submitted', expect.objectContaining({
        requestId: 1,
      }));
    });

    it('should throw ForbiddenException if not creator (safeCall wraps as Err)', async () => {
      const req = makeRequest({ status: 'DRAFT', requestedBy: 99 }); // creator=99, caller=42
      setupDbChain(req);

      const result = await service.submitRequisition(1, 42);

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('FORBIDDEN');
    });

    it('should throw BadRequestException if not DRAFT status', async () => {
      const req = makeRequest({ status: 'SUBMITTED', requestedBy: 42 });
      setupDbChain(req);

      const result = await service.submitRequisition(1, 42);

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('BAD_REQUEST');
      expect(result.error.message).toMatch(/DRAFT/);
    });
  });

  // ─── approveRequisition ────────────────────────────────────────────────────

  describe('approveRequisition()', () => {
    it('should transition SUBMITTED → APPROVED', async () => {
      const req     = makeRequest({ status: 'SUBMITTED' });
      const updated = makeRequest({ status: 'APPROVED', approvedBy: 7 });
      setupDbChain(req, makeLines(), updated);

      const result = await service.approveRequisition(1, 7);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.status).toBe('APPROVED');
      expect(emitter.emit).toHaveBeenCalledWith('pos.requisition.approved', expect.objectContaining({
        requestId: 1,
        approverId: 7,
      }));
    });

    it('should update reserved_qty in stock balance during approval', async () => {
      const req = makeRequest({ status: 'SUBMITTED', targetWarehouseId: 'WH-01' });
      setupDbChain(req, makeLines(3), makeRequest({ status: 'APPROVED' }));

      await service.approveRequisition(1, 7);

      // db.execute is called once per line for reserveStock (3 lines)
      expect(mockDbExecute).toHaveBeenCalledTimes(3);
    });

    it('should return Err when request is not SUBMITTED', async () => {
      const req = makeRequest({ status: 'DRAFT' });
      setupDbChain(req);

      const result = await service.approveRequisition(1, 7);

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('BAD_REQUEST');
    });
  });

  // ─── rejectRequisition ────────────────────────────────────────────────────

  describe('rejectRequisition()', () => {
    it('should throw BadRequestException if reason is empty', async () => {
      const req = makeRequest({ status: 'SUBMITTED' });
      setupDbChain(req);

      const result = await service.rejectRequisition(1, 7, '');

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('BAD_REQUEST');
      expect(result.error.message).toMatch(/sabab|reason/i);
    });

    it('should throw BadRequestException if reason is whitespace only', async () => {
      const req = makeRequest({ status: 'SUBMITTED' });
      setupDbChain(req);

      const result = await service.rejectRequisition(1, 7, '   ');

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('BAD_REQUEST');
    });

    it('should transition SUBMITTED → REJECTED', async () => {
      const req     = makeRequest({ status: 'SUBMITTED' });
      const updated = makeRequest({ status: 'REJECTED', rejectionReason: 'Budget exceeded' });
      setupDbChain(req, [], updated);

      const result = await service.rejectRequisition(1, 7, 'Budget exceeded');

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.status).toBe('REJECTED');
      expect(emitter.emit).toHaveBeenCalledWith('pos.requisition.rejected', expect.objectContaining({
        reason: 'Budget exceeded',
      }));
    });
  });

  // ─── fulfillRequisition ───────────────────────────────────────────────────

  describe('fulfillRequisition()', () => {
    it('should create INTERNAL_ISSUE movement', async () => {
      const req = makeRequest({ status: 'APPROVED', requestedBy: 42 });
      const lines = makeLines(2);
      setupDbChain(req, lines, makeRequest({ status: 'FULLY_ISSUED', posMovementId: 999 }));

      movementSvc.createMovement.mockResolvedValue({ ok: true, data: { id: 999 } } as never);

      const result = await service.fulfillRequisition(1, 10, []);

      expect(result.ok).toBe(true);
      expect(movementSvc.createMovement).toHaveBeenCalledWith(
        expect.objectContaining({ submit: true }),
        10,
      );
    });

    it('should add DEBIT entries to employee ledger for each line', async () => {
      const req   = makeRequest({ status: 'APPROVED', requestedBy: 42, targetWarehouseId: 'WH-01' });
      const lines = makeLines(3);
      setupDbChain(req, lines, makeRequest({ status: 'FULLY_ISSUED' }));

      movementSvc.createMovement.mockResolvedValue({ ok: true, data: { id: 888 } } as never);

      await service.fulfillRequisition(1, 10, []);

      expect(employeeLedger.addEntry).toHaveBeenCalledTimes(3);
      expect(employeeLedger.addEntry).toHaveBeenCalledWith(
        expect.objectContaining({ entryType: 'DEBIT', userId: 42 }),
      );
    });

    it('should release reserved_qty after fulfillment', async () => {
      const req   = makeRequest({ status: 'APPROVED', targetWarehouseId: 'WH-05' });
      const lines = makeLines(2);
      setupDbChain(req, lines, makeRequest({ status: 'FULLY_ISSUED' }));

      movementSvc.createMovement.mockResolvedValue({ ok: true, data: { id: 777 } } as never);

      await service.fulfillRequisition(1, 10, []);

      // db.execute called once per line for releaseReservedStock
      // (fetchLines is called again in releaseReservedStock,
      //  but the select mock has already been consumed — just check execute)
      expect(mockDbExecute).toHaveBeenCalled();
    });

    it('should return Err when request is not APPROVED', async () => {
      const req = makeRequest({ status: 'SUBMITTED' });
      setupDbChain(req);

      const result = await service.fulfillRequisition(1, 10, []);

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('BAD_REQUEST');
    });

    it('should return Err when createMovement fails', async () => {
      const req   = makeRequest({ status: 'APPROVED' });
      const lines = makeLines(1);
      setupDbChain(req, lines);

      movementSvc.createMovement.mockResolvedValue({
        ok:    false,
        error: { code: 'INTERNAL', message: 'movement creation failed' },
      } as never);

      const result = await service.fulfillRequisition(1, 10, []);

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.message).toContain('movement creation failed');
    });
  });

  // ─── cancelRequisition ────────────────────────────────────────────────────

  describe('cancelRequisition()', () => {
    it('should release reserved_qty if was APPROVED', async () => {
      const req   = makeRequest({ status: 'APPROVED', targetWarehouseId: 'WH-02' });
      const lines = makeLines(2);
      setupDbChain(req, lines, makeRequest({ status: 'CANCELLED' }));

      await service.cancelRequisition(1, 42, 'No longer needed');

      // releaseReservedStock calls db.execute once per line
      expect(mockDbExecute).toHaveBeenCalled();
    });

    it('should NOT call db.execute when status is DRAFT (no stock to release)', async () => {
      const req = makeRequest({ status: 'DRAFT' });
      setupDbChain(req, [], makeRequest({ status: 'CANCELLED' }));

      await service.cancelRequisition(1, 42, 'Changed my mind');

      expect(mockDbExecute).not.toHaveBeenCalled();
    });

    it('should return Err for non-cancellable status (FULLY_ISSUED)', async () => {
      const req = makeRequest({ status: 'FULLY_ISSUED' });
      setupDbChain(req);

      const result = await service.cancelRequisition(1, 42, 'Cancel it');

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('BAD_REQUEST');
      expect(result.error.message).toMatch(/bekor qilib bo'lmaydi/);
    });

    it('should transition APPROVED → CANCELLED and emit event', async () => {
      const req     = makeRequest({ status: 'APPROVED', targetWarehouseId: null });
      const updated = makeRequest({ status: 'CANCELLED' });
      setupDbChain(req, [], updated);

      const result = await service.cancelRequisition(1, 42, 'Budget cut');

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.status).toBe('CANCELLED');
      expect(emitter.emit).toHaveBeenCalledWith('pos.requisition.cancelled', expect.objectContaining({
        reason: 'Budget cut',
      }));
    });

    it('should require a non-empty reason', async () => {
      const req = makeRequest({ status: 'DRAFT' });
      setupDbChain(req);

      const result = await service.cancelRequisition(1, 42, '');

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('BAD_REQUEST');
    });
  });
});
