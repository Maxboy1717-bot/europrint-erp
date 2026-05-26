/**
 * test/sd/create-invoice.handler.spec.ts
 *
 * Unit tests for sd CreateInvoiceHandler. ISdInvoicesRepository is mocked
 * via SD_INVOICES_REPO token. Math + business rules are real.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import { CreateInvoiceHandler } from '../../src/modules/sd/application/commands/create-invoice.handler';
import {
  CreateInvoiceCommand,
  InvoiceItem,
} from '../../src/modules/sd/application/commands/create-invoice.command';
import {
  ISdInvoicesRepository,
  SD_INVOICES_REPO,
  OrderForInvoice,
  InvoiceRow,
} from '../../src/modules/sd/invoices/i-sd-invoices.repo';
import { Ok, Err, AppErr } from '../../src/common/result';

function makeBus(): jest.Mocked<EventBus> {
  return { publish: jest.fn() } as unknown as jest.Mocked<EventBus>;
}

/** Build a repo mock whose withTransaction runs the work fn directly */
function makeRepo(orderResult: OrderForInvoice | null | 'not_found', invoiceRow?: Partial<InvoiceRow>): jest.Mocked<ISdInvoicesRepository> {
  const resolvedInvoiceRow: InvoiceRow = {
    invoiceNumber: `INV-${Date.now()}`,
    subtotal: '900000',
    taxAmount: '108000',
    totalAmount: '1008000',
    status: 'draft',
    ...invoiceRow,
  };

  return {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByInvoiceNumber: jest.fn(),
    create: jest.fn(),
    findOrderForInvoicing: jest.fn().mockResolvedValue(
      orderResult === 'not_found'
        ? Ok(null)
        : orderResult === null
          ? Err(AppErr('NOT_FOUND', 'not found'))
          : Ok(orderResult),
    ),
    createInvoice: jest.fn().mockResolvedValue(Ok(resolvedInvoiceRow)),
    withTransaction: jest.fn().mockImplementation(async (work) => work(null)),
  } as unknown as jest.Mocked<ISdInvoicesRepository>;
}

async function buildHandler(repo: ISdInvoicesRepository): Promise<CreateInvoiceHandler> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      CreateInvoiceHandler,
      { provide: EventBus, useValue: makeBus() },
      { provide: SD_INVOICES_REPO, useValue: repo },
    ],
  }).compile();
  return module.get(CreateInvoiceHandler);
}

function items(): InvoiceItem[] {
  return [
    { name: 'Karton A4', quantity: 10, unitPrice: 50_000, taxRate: 12 },
    { name: 'Karton A3', quantity: 5,  unitPrice: 80_000, taxRate: 12 },
  ];
}

describe('CreateInvoiceHandler (sd)', () => {
  it('returns BAD_REQUEST when sales order is not found', async () => {
    const handler = await buildHandler(makeRepo('not_found'));
    const cmd = new CreateInvoiceCommand(
      '500', 'Acme', items(), new Date('2026-06-01'), null, 'user-1',
    );

    const result = await handler.execute(cmd);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('BAD_REQUEST');
  });

  it('returns BAD_REQUEST when sales order is in draft status', async () => {
    const handler = await buildHandler(makeRepo({ id: '500', status: 'draft', deletedAt: null }));

    const result = await handler.execute(new CreateInvoiceCommand(
      '500', 'Acme', items(), new Date('2026-06-01'), null, 'user-1',
    ));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('BAD_REQUEST');
  });

  it('returns BAD_REQUEST when sales order is soft-deleted', async () => {
    const handler = await buildHandler(makeRepo({ id: '500', status: 'approved', deletedAt: new Date() }));

    const result = await handler.execute(new CreateInvoiceCommand(
      '500', 'Acme', items(), new Date('2026-06-01'), null, 'user-1',
    ));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('BAD_REQUEST');
  });

  it('computes subtotal, tax and total in draft status when order is approved', async () => {
    const handler = await buildHandler(makeRepo({ id: '500', status: 'approved', deletedAt: null }));

    const result = await handler.execute(new CreateInvoiceCommand(
      '500', 'Acme', items(), new Date('2026-06-01'), null, 'user-1',
    ));

    expect(result.ok).toBe(true);
    if (result.ok) {
      // subtotal = 10*50000 + 5*80000 = 900000; tax = 12% = 108000
      expect(result.data.subtotal).toBe(900_000);
      expect(result.data.tax_amount).toBe(108_000);
      expect(result.data.total_amount).toBe(1_008_000);
      expect(result.data.status).toBe('draft');
    }
  });

  it('returns generated invoice number with INV- prefix', async () => {
    const handler = await buildHandler(makeRepo({ id: '500', status: 'in_production', deletedAt: null }));

    const result = await handler.execute(new CreateInvoiceCommand(
      '500', 'Acme', items(), new Date('2026-06-01'), null, 'user-1',
    ));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(String(result.data.invoice_number)).toMatch(/^INV-\d+$/);
    }
  });
});
