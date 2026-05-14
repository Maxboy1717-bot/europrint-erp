/**
 * @module get-invoice.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { AppErr, Err, Ok, Result } from '@common/result';
import { GetInvoiceQuery } from './get-invoice.query';
import { db, invoices } from '@shared/db';
import { eq } from 'drizzle-orm';

@Injectable()
@QueryHandler(GetInvoiceQuery)
export class GetInvoiceHandler implements IQueryHandler<GetInvoiceQuery> {
  private readonly logger = new Logger(GetInvoiceHandler.name);

  constructor() {}

  async execute(query: GetInvoiceQuery): Promise<Result<Record<string, unknown>>> {
      const [result] = await db.select().from(invoices).where(eq(invoices.id, query.invoiceId)).limit(1);

      if (!result) {
        this.logger.warn('Invoice not found');
        return Err(AppErr('NOT_FOUND', 'Invoice not found'));
      }

      return Ok(result);
  }
}
