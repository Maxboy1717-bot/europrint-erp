/**
 * test/sd/create-invoice.handler.spec.ts
 *
 * Unit tests for sd CreateInvoiceHandler. The shared db module (runQuery + db)
 * is mocked so no real DB is touched. Math + business rules are real.
 */

jest.mock('@shared/db', () => {
  const insert = jest.fn().mockReturnValue({ values: jest.fn().mockResolvedValue(undefined) });
  return {
    runQuery: jest.fn(),
    db: { insert },
    invoices: { id: 'invoices.id' },
  };
});

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { runQuery, db } from '@shared/db';
import { CreateInvoiceHandler } from '../../src/modules/sd/application/commands/create-invoice.handler';
import {
  CreateInvoiceCommand,
  InvoiceItem,
} from '../../src/modules/sd/application/commands/create-invoice.command';

function makeBus(): jest.Mocked<EventBus> {
  return { publish: jest.fn() } as unknown as jest.Mocked<EventBus>;
}

async function buildHandler(bus: EventBus): Promise<CreateInvoiceHandler> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      CreateInvoiceHandler,
      { provide: EventBus, useValue: bus },
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
  beforeEach(() => {
    (runQuery as jest.Mock).mockReset();
    ((db.insert as jest.Mock)).mockClear();
  });

  it('throws BadRequest when sales order is not found', async () => {
    (runQuery as jest.Mock).mockResolvedValue({ rows: [] });
    const handler = await buildHandler(makeBus());
    const cmd = new CreateInvoiceCommand(
      '500', 'Acme', items(), new Date('2026-06-01'), null, 'user-1',
    );

    await expect(handler.execute(cmd)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws BadRequest when sales order is in draft status', async () => {
    (runQuery as jest.Mock).mockResolvedValue({
      rows: [{ status: 'draft', deleted_at: null }],
    });
    const handler = await buildHandler(makeBus());

    await expect(
      handler.execute(new CreateInvoiceCommand(
        '500', 'Acme', items(), new Date('2026-06-01'), null, 'user-1',
      )),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws BadRequest when sales order is soft-deleted', async () => {
    (runQuery as jest.Mock).mockResolvedValue({
      rows: [{ status: 'approved', deleted_at: new Date() }],
    });
    const handler = await buildHandler(makeBus());

    await expect(
      handler.execute(new CreateInvoiceCommand(
        '500', 'Acme', items(), new Date('2026-06-01'), null, 'user-1',
      )),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('computes subtotal, tax and total in draft status when order is approved', async () => {
    (runQuery as jest.Mock).mockResolvedValue({
      rows: [{ status: 'approved', deleted_at: null }],
    });
    const handler = await buildHandler(makeBus());

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
    (runQuery as jest.Mock).mockResolvedValue({
      rows: [{ status: 'in_production', deleted_at: null }],
    });
    const handler = await buildHandler(makeBus());

    const result = await handler.execute(new CreateInvoiceCommand(
      '500', 'Acme', items(), new Date('2026-06-01'), null, 'user-1',
    ));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(String(result.data.invoice_number)).toMatch(/^INV-\d+$/);
    }
  });
});
