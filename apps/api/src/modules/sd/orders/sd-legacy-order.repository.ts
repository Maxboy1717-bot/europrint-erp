/**
 * @module sd-legacy-order.repository
 * @description Repository / data-access layer for the optional legacy 1C (Zakaz 1S) order
 *   number on the canonical sales_orders header. Parametrised raw SQL via the `sql` template
 *   + typedExecute — no Drizzle table-object import, so no @europrint/schemas dist rebuild.
 *   vision 06-sd#154.
 */

import { Injectable, Logger } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { typedExecute } from '@shared/db/typed-execute';
import { Result, safeCall } from '@common/result';

export interface LegacyOrderRow {
  id: number;
  legacy_order_number: string | null;
}

@Injectable()
export class SdLegacyOrderRepository {
  private readonly logger = new Logger(SdLegacyOrderRepository.name);

  async getLegacyNumber(id: number): Promise<Result<LegacyOrderRow | null>> {
    return safeCall(async () => {
      const rows = await typedExecute<LegacyOrderRow>(sql`
        SELECT id, legacy_order_number
        FROM sales_orders
        WHERE id = ${id} AND deleted_at IS NULL
        LIMIT 1
      `);
      return rows[0] ?? null;
    });
  }

  async updateLegacyNumber(id: number, legacyNumber: string | null): Promise<Result<LegacyOrderRow | null>> {
    return safeCall(async () => {
      const rows = await typedExecute<LegacyOrderRow>(sql`
        UPDATE sales_orders
        SET legacy_order_number = ${legacyNumber}, updated_at = NOW()
        WHERE id = ${id} AND deleted_at IS NULL
        RETURNING id, legacy_order_number
      `);
      return rows[0] ?? null;
    });
  }
}
