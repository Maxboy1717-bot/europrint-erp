/**
 * test/finance/finance-invoices.controller.ai-event.spec.ts
 *
 * AI-INVOICE-CLASSIFY (2026-07-07): AiInvoiceClassifyHandler (@EventsHandler(FinanceInvoiceCreatedEvent))
 * was fully built but nothing ever published FinanceInvoiceCreatedEvent — a dead-letter handler.
 * FinanceInvoicesController.createInvoiceRoot()/createInvoice() now publish it via the injected
 * EventBus right after a successful saveInvoice(). This proves:
 *   1. Both creation endpoints call eventBus.publish() with a FinanceInvoiceCreatedEvent exactly
 *      once, carrying the freshly-created invoice id, amount, description/notes and userId.
 *   2. Neither endpoint publishes when saveInvoice() fails (result.ok === false) — the controller
 *      throws before reaching the publish call.
 */

import { FinanceInvoicesController } from '../../src/modules/finance/presentation/finance-invoices.controller';
import { FinanceInvoiceCreatedEvent } from '../../src/modules/ai/domain/events/finance-invoice-created.event';
import type { FinanceInvoiceRepo } from '../../src/modules/finance/infrastructure/repositories/drizzle-finance-invoice.repo';
import type { GlPostingService } from '../../src/modules/finance/domain/services/gl-posting.service';
import type { CommandBus, QueryBus, EventBus } from '@nestjs/cqrs';
import type { I18nService } from 'nestjs-i18n';

function makeController(saveInvoiceImpl: jest.Mock, publish: jest.Mock): FinanceInvoicesController {
  const invoiceRepo = { saveInvoice: saveInvoiceImpl } as unknown as FinanceInvoiceRepo;
  const eventBus = { publish } as unknown as EventBus;
  const i18n = { t: jest.fn().mockResolvedValue('error') } as unknown as I18nService;
  return new FinanceInvoicesController(
    {} as CommandBus,
    {} as QueryBus,
    eventBus,
    invoiceRepo,
    {} as GlPostingService,
    i18n,
  );
}

const user = { id: 5, sub: 5 };

describe('FinanceInvoicesController — AI invoice-classify event wiring', () => {
  describe('createInvoiceRoot() (POST /finance/invoices)', () => {
    it('publishes FinanceInvoiceCreatedEvent once, after a successful save', async () => {
      const saveInvoice = jest.fn().mockResolvedValue({
        ok: true,
        data: { id: 42, invoice_number: 'INV-2026-000042', customer_id: 7 },
      });
      const publish = jest.fn();
      const ctrl = makeController(saveInvoice, publish);

      await ctrl.createInvoiceRoot(
        { customerId: 7, amount: 1500, notes: 'Karton yetkazib berish' },
        user,
      );

      expect(publish).toHaveBeenCalledTimes(1);
      const event = publish.mock.calls[0][0];
      expect(event).toBeInstanceOf(FinanceInvoiceCreatedEvent);
      expect(event.props).toEqual({
        invoiceId: 42,
        description: 'Karton yetkazib berish',
        amount: 1500,
        vendor: '7',
        userId: 5,
      });
    });

    it('does NOT publish when saveInvoice fails', async () => {
      const saveInvoice = jest.fn().mockResolvedValue({ ok: false, error: 'db down' });
      const publish = jest.fn();
      const ctrl = makeController(saveInvoice, publish);

      await expect(
        ctrl.createInvoiceRoot({ customerId: 7, amount: 1500 }, user),
      ).rejects.toThrow();
      expect(publish).not.toHaveBeenCalled();
    });
  });

  describe('createInvoice() (POST /finance/invoices/create)', () => {
    it('publishes FinanceInvoiceCreatedEvent once, after a successful save', async () => {
      const saveInvoice = jest.fn().mockResolvedValue({
        ok: true,
        data: { id: 99, invoice_number: 'INV-2026-000099' },
      });
      const publish = jest.fn();
      const ctrl = makeController(saveInvoice, publish);

      await ctrl.createInvoice(
        { customerId: 11, amount: 3000, dueDate: '2026-08-01', description: 'Ofset bosma', createdBy: 5 },
        user,
      );

      expect(publish).toHaveBeenCalledTimes(1);
      const event = publish.mock.calls[0][0];
      expect(event).toBeInstanceOf(FinanceInvoiceCreatedEvent);
      expect(event.props).toEqual({
        invoiceId: 99,
        description: 'Ofset bosma',
        amount: 3000,
        vendor: '11',
        userId: 5,
      });
    });

    it('does NOT publish when saveInvoice fails', async () => {
      const saveInvoice = jest.fn().mockResolvedValue({ ok: false, error: 'db down' });
      const publish = jest.fn();
      const ctrl = makeController(saveInvoice, publish);

      await expect(
        ctrl.createInvoice(
          { customerId: 11, amount: 3000, dueDate: '2026-08-01', description: 'Ofset bosma', createdBy: 5 },
          user,
        ),
      ).rejects.toThrow();
      expect(publish).not.toHaveBeenCalled();
    });
  });
});
