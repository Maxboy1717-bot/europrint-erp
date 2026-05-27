/**
 * test/integration/pos-sales-persistence.spec.ts
 *
 * A.2 (P0): Asserts that POST /pos/sales (legacy stub URL hit by POSDashboard.tsx
 * and pos-sync.ts) now persists a row in `retail_pos_transactions` via the real
 * CashRegisterService instead of echoing fake data.
 *
 * Strategy: mount PosStubController + CashRegisterService in a Nest testing
 * module with a mocked CashRegisterRepository. The mock records inserts into an
 * in-memory `retail_pos_transactions` array so we can assert persistence shape
 * without spinning up Postgres.
 */

import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { RolesGuard } from '../../src/common/guards/roles.guard';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditInterceptor } from '../../src/common/interceptors/audit.interceptor';
import { PosStubController } from '../../src/modules/pos/presentation/pos-stub.controller';
import { CashRegisterService } from '../../src/modules/pos/application/services/cash-register.service';
import {
  CashRegisterRepository,
  type CreateTransactionInput,
  type RetailProduct,
  type RetailTransaction,
} from '../../src/modules/pos/infrastructure/repositories/cash-register.repository';
import { Ok } from '../../src/common/result';

interface PersistenceState {
  products: Map<string, RetailProduct>;
  retail_pos_transactions: RetailTransaction[];
  decrementCalls: { productId: string; quantity: number }[];
}

function makeProduct(id: string, name: string, unitPrice: number, stock: number): RetailProduct {
  return {
    id,
    barcode:        `BC-${id}`,
    name,
    name_ru:        null,
    category:       null,
    unit_price:     String(unitPrice),
    unit:           'dona',
    stock_quantity: String(stock),
    min_stock:      '0',
    is_active:      true,
    image_url:      null,
    created_by:     null,
    created_at:     new Date('2026-05-17T00:00:00Z'),
    updated_at:     new Date('2026-05-17T00:00:00Z'),
  } as RetailProduct;
}

function makeRepoMock(state: PersistenceState): jest.Mocked<CashRegisterRepository> {
  const makeTx = (data: CreateTransactionInput, cashierId?: string): RetailTransaction => ({
    id:                 `tx-${state.retail_pos_transactions.length + 1}`,
    transaction_number: `TXN-TEST-${state.retail_pos_transactions.length + 1}`,
    receipt_number:     `REC-TEST-${state.retail_pos_transactions.length + 1}`,
    cashier_id:         cashierId ?? data.cashierId ?? null,
    customer_name:      data.customerName ?? null,
    customer_id:        data.customerId ?? null,
    items:              data.items,
    subtotal:           String(data.subtotal),
    discount_amount:    String(data.discountAmount ?? 0),
    tax_rate:           String(data.taxRate ?? 12),
    tax_amount:         String(data.taxAmount ?? 0),
    total_amount:       String(data.totalAmount),
    payment_method:     data.paymentMethod,
    payment_details:    data.paymentDetails ?? {},
    status:             'completed',
    notes:              data.notes ?? null,
    refunded_at:        null,
    refunded_by:        null,
    created_at:         new Date('2026-05-17T12:00:00Z'),
  } as RetailTransaction);

  const mock: Partial<jest.Mocked<CashRegisterRepository>> = {
    findProductById: jest.fn(async (id: string) => Ok(state.products.get(id) ?? null)),
    findProductByBarcode: jest.fn(),
    findProducts: jest.fn(),
    insertProduct: jest.fn(),
    findTransactions: jest.fn(),
    findTransactionById: jest.fn(),
    refundTransaction: jest.fn(),
    getDashboard: jest.fn(),
    incrementStock: jest.fn(async () => Ok(undefined as unknown as void)),
    decrementStock: jest.fn(async (productId: string, quantity: number) => {
      state.decrementCalls.push({ productId, quantity });
      return Ok(undefined as unknown as void);
    }),
    insertTransaction: jest.fn(async (data: CreateTransactionInput, cashierId?: string) => {
      const tx = makeTx(data, cashierId);
      state.retail_pos_transactions.push(tx);
      return Ok(tx);
    }),
    // POS-1: CashRegisterService.createTransaction now uses insertTransactionAtomic
    // for atomic insert + stock decrement. The mock replicates the same persistence
    // behaviour as insertTransaction so existing assertions continue to hold.
    insertTransactionAtomic: jest.fn(async (
      data: CreateTransactionInput,
      items: { productId: string; quantity: number }[],
      cashierId?: string,
    ) => {
      const tx = makeTx(data, cashierId);
      state.retail_pos_transactions.push(tx);
      // Mirror the decrementStock side-effect so state.decrementCalls assertions pass.
      for (const item of items) {
        state.decrementCalls.push({ productId: item.productId, quantity: item.quantity });
      }
      return Ok(tx);
    }),
  };
  return mock as jest.Mocked<CashRegisterRepository>;
}

async function buildController(repo: CashRegisterRepository): Promise<PosStubController> {
  const moduleRef: TestingModule = await Test.createTestingModule({
    controllers: [PosStubController],
    providers: [
      CashRegisterService,
      { provide: CashRegisterRepository, useValue: repo },
      // Stub interceptor — AuditInterceptor pulls in DB-backed deps we don't
      // need for this controller-level integration test.
      { provide: APP_INTERCEPTOR, useValue: { intercept: (_ctx: unknown, next: { handle: () => unknown }) => next.handle() } },
    ],
  })
    // RolesGuard depends on I18nService; we're testing persistence behaviour,
    // not authz, so short-circuit the guard.
    .overrideGuard(RolesGuard)
    .useValue({ canActivate: () => true })
    .overrideInterceptor(AuditInterceptor)
    .useValue({ intercept: (_ctx: unknown, next: { handle: () => unknown }) => next.handle() })
    .compile();
  return moduleRef.get(PosStubController);
}

describe('A.2 (P0): POST /pos/sales persists to retail_pos_transactions', () => {
  let state: PersistenceState;
  let repo: jest.Mocked<CashRegisterRepository>;
  let controller: PosStubController;

  beforeEach(async () => {
    state = {
      products: new Map([
        ['prod-1', makeProduct('prod-1', 'Test Item A', 10000, 100)],
        ['prod-2', makeProduct('prod-2', 'Test Item B', 25000, 50)],
      ]),
      retail_pos_transactions: [],
      decrementCalls: [],
    };
    repo = makeRepoMock(state);
    controller = await buildController(repo);
  });

  it('persists a row in retail_pos_transactions when the frontend POSTs to /pos/sales', async () => {
    const body = {
      items: [
        { productId: 'prod-1', quantity: 2 },
        { productId: 'prod-2', quantity: 1 },
      ],
      paymentMethod: 'cash',
      customerName:  'Test Customer',
      discountAmount: 0,
    };

    const result = await controller.createSale(body, { id: 7, role: 'cashier' } as never);

    // Assert persistence side-effect — the row exists in retail_pos_transactions.
    // CashRegisterService uses insertTransactionAtomic (POS-1: atomic insert + stock).
    expect(state.retail_pos_transactions).toHaveLength(1);
    expect(repo.insertTransactionAtomic).toHaveBeenCalledTimes(1);

    const persisted = state.retail_pos_transactions[0];
    expect(persisted.customer_name).toBe('Test Customer');
    expect(persisted.cashier_id).toBe('7');
    expect(persisted.payment_method).toBe('cash');
    expect(persisted.status).toBe('completed');
    // 2 * 10000 + 1 * 25000 = 45000
    expect(Number(persisted.total_amount)).toBe(45000);
    expect(Number(persisted.subtotal)).toBe(45000);

    // Wire-compatible response shape: { saleNumber, sale }
    expect(result).toHaveProperty('saleNumber');
    expect(result).toHaveProperty('sale');
    expect(typeof result.saleNumber).toBe('string');

    // Stock decremented for each line
    expect(state.decrementCalls).toEqual([
      { productId: 'prod-1', quantity: 2 },
      { productId: 'prod-2', quantity: 1 },
    ]);
  });

  it('accepts the offline-sync payload shape from pos-sync.ts and persists', async () => {
    const offlinePayload = {
      items: [{ productId: 'prod-1', quantity: 3 }],
      paymentMethod: 'card',
      customerName: undefined,
      discountAmount: 1000,
      offlineLocalId: 'local-42',
      offlineCreatedAt: '2026-05-17T11:00:00Z',
    };

    await controller.createSale(offlinePayload, { id: 1, role: 'cashier' } as never);

    expect(state.retail_pos_transactions).toHaveLength(1);
    const persisted = state.retail_pos_transactions[0];
    expect(persisted.payment_method).toBe('card');
    // subtotal = 3 * 10000 = 30000, discount = 1000 => total 29000
    expect(Number(persisted.subtotal)).toBe(30000);
    expect(Number(persisted.discount_amount)).toBe(1000);
    expect(Number(persisted.total_amount)).toBe(29000);
  });

  it('maps legacy bank_transfer payment method to canonical transfer enum', async () => {
    await controller.createSale(
      {
        items: [{ productId: 'prod-1', quantity: 1 }],
        paymentMethod: 'bank_transfer',
      },
      { id: 1, role: 'cashier' } as never,
    );

    expect(state.retail_pos_transactions).toHaveLength(1);
    expect(state.retail_pos_transactions[0].payment_method).toBe('transfer');
  });

  it('rejects payloads with no items', async () => {
    await expect(
      controller.createSale({ items: [], paymentMethod: 'cash' }, { id: 1, role: 'cashier' } as never),
    ).rejects.toThrow();
    expect(state.retail_pos_transactions).toHaveLength(0);
  });

  it('rejects payloads referencing an unknown product', async () => {
    await expect(
      controller.createSale(
        { items: [{ productId: 'prod-nonexistent', quantity: 1 }], paymentMethod: 'cash' },
        { id: 1, role: 'cashier' } as never,
      ),
    ).rejects.toThrow();
    expect(state.retail_pos_transactions).toHaveLength(0);
  });
});
