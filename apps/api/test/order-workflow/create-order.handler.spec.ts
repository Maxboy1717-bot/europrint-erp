/**
 * test/order-workflow/create-order.handler.spec.ts
 * Unit tests for CreateOrderHandler. The `db` (drizzle) module is mocked at the
 * transaction boundary; IOrderRepo is mocked; OrderAggregate is real.
 */

let _uuidCnt = 0;
jest.mock('uuid', () => ({
  v4: () => {
    const n = (++_uuidCnt).toString(16).padStart(8, '0');
    return `${n}-0000-4000-8000-000000000000`;
  },
}));

jest.mock('@shared/db', () => {
  const tx = { insert: jest.fn().mockReturnThis(), values: jest.fn().mockResolvedValue(undefined) };
  return {
    db: { transaction: jest.fn(async (fn: (t: typeof tx) => Promise<unknown>) => fn(tx)) },
    owOrders: { _name: 'owOrders' },
    owOrderStatusHistory: { _name: 'owOrderStatusHistory' },
    owPaymentPlanEntries: { _name: 'owPaymentPlanEntries' },
    owMaterialRequirements: { _name: 'owMaterialRequirements' },
    owMolds: { _name: 'owMolds' },
    owCliches: { _name: 'owCliches' },
    runQuery: jest.fn(),
  };
});

import { Test, TestingModule } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import { CreateOrderHandler, CreateOrderCommand } from '../../src/modules/order-workflow/application/commands/create-order.handler';
import { ORDER_WF_REPO } from '../../src/modules/order-workflow/infrastructure/repositories/i-order.repo';
import { Ok } from '../../src/common/result';
import { salesOrderFactory } from '../_fixtures/factories';

interface RepoMock {
  save: jest.Mock; findById: jest.Mock; findAll: jest.Mock;
  insertOrderWithInitialStatus: jest.Mock;
}
function makeRepo(): RepoMock {
  return {
    save: jest.fn(), findById: jest.fn(), findAll: jest.fn(),
    insertOrderWithInitialStatus: jest.fn().mockResolvedValue(Ok(undefined)),
  };
}

function makeCmd(over: Partial<CreateOrderCommand> = {}): CreateOrderCommand {
  const so = salesOrderFactory();
  return new CreateOrderCommand(
    over.customerId ?? so.companyId,
    over.totalAmount ?? so.totalAmount,
    over.currency ?? so.currency,
    over.assignedSalesManager ?? null,
    over.createdBy ?? so.createdBy,
    over.tenantId ?? null,
  );
}

describe('CreateOrderHandler', () => {
  let handler: CreateOrderHandler;
  let repo: RepoMock;
  let publishSpy: jest.SpyInstance;

  beforeEach(async () => {
    repo = makeRepo();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        CreateOrderHandler,
        { provide: ORDER_WF_REPO, useValue: repo },
        { provide: EventBus, useValue: { publish: jest.fn() } },
      ],
    }).compile();
    handler = moduleRef.get(CreateOrderHandler);
    publishSpy = jest.spyOn(moduleRef.get(EventBus), 'publish');
  });

  it('returns Ok with order in LEAD_INTAKE status when persistence succeeds', async () => {
    const r = await handler.execute(makeCmd({ totalAmount: 5_000_000 }));

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.getStatus()).toBe('LEAD_INTAKE');
      expect(r.data.getTotalAmount()).toBe(5_000_000);
    }
  });

  it('emits order.status_changed event from DRAFT to LEAD_INTAKE when order is created', async () => {
    await handler.execute(makeCmd());

    expect(publishSpy).toHaveBeenCalledWith(
      expect.objectContaining({ fromStatus: 'DRAFT', toStatus: 'LEAD_INTAKE' }),
    );
  });

  it('defaults currency to UZS and totalAmount to 0 when not provided in command', async () => {
    const r = await handler.execute(new CreateOrderCommand(7, undefined, undefined, null, 1, null));

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.getCurrency()).toBe('UZS');
      expect(r.data.getTotalAmount()).toBe(0);
    }
  });

  it('returns DB_ERROR when underlying db.transaction rejects', async () => {
    const { Err: mkErr, AppErr: mkAppErr } = jest.requireActual('../../src/common/result') as typeof import('../../src/common/result');
    repo.insertOrderWithInitialStatus.mockResolvedValueOnce(mkErr(mkAppErr('DB_ERROR', 'Buyurtma saqlanmadi')));

    const r = await handler.execute(makeCmd());

    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.code).toBe('DB_ERROR');
    }
  });

  it('uses createdBy as fallback when assignedSalesManager is null in command', async () => {
    const r = await handler.execute(makeCmd({ assignedSalesManager: null, createdBy: 99 }));

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.getSalesManager()).toBe(99);
  });
});
