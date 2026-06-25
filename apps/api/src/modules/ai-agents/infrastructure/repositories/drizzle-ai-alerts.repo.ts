/**
 * @module drizzle-ai-alerts.repo
 * @description DB queries uchun repo — AiAlertsService dan db.* ajratish (Qoida-15).
 *   Barcha metod Result<T> qaytaradi; throw taqiq.
 * @layer Infrastructure (ai-agents)
 */

import { Injectable, Logger } from '@nestjs/common';
import { DrizzleService } from '@common/services/drizzle.service';
import { sql } from 'drizzle-orm';
import { safeCall, Result } from '@common/result';

// type (interface emas) — db.execute<T> ning `Record<string, unknown>` constraint'ini qondiradi
// (interface implicit index-signature olmaydi, type oladi). Xulq o'zgarmaydi.
export type RecipientRow = {
  telegram_chat_id: string;
};

export type CustomerContactRow = {
  email: string | null;
  name:  string | null;
};

export interface IAiAlertsRepo {
  findSupervisors(): Promise<Result<RecipientRow[]>>;
  findSalesManagers(): Promise<Result<RecipientRow[]>>;
  findDirectors(): Promise<Result<RecipientRow[]>>;
  findCustomerByOrderNumber(orderNumber: string): Promise<Result<CustomerContactRow | null>>;
}

export const AI_ALERTS_REPO = Symbol('AI_ALERTS_REPO');

@Injectable()
export class DrizzleAiAlertsRepo implements IAiAlertsRepo {
  private readonly logger = new Logger(DrizzleAiAlertsRepo.name);

  constructor(private readonly drizzle: DrizzleService) {}

  async findSupervisors(): Promise<Result<RecipientRow[]>> {
    return safeCall(async () => {
      const result = await this.drizzle.db.execute<RecipientRow>(sql`
        SELECT e.telegram_chat_id
        FROM employees e
        WHERE LOWER(e.status) = 'active'
          AND e.telegram_chat_id IS NOT NULL
          AND LOWER(e.role) IN ('production_manager', 'shift_supervisor', 'director')
        LIMIT 5
      `);
      return Array.isArray(result.rows) ? result.rows : [];
    }, 'DB_ERROR');
  }

  async findSalesManagers(): Promise<Result<RecipientRow[]>> {
    return safeCall(async () => {
      const result = await this.drizzle.db.execute<RecipientRow>(sql`
        SELECT e.telegram_chat_id
        FROM employees e
        WHERE LOWER(e.status) = 'active'
          AND e.telegram_chat_id IS NOT NULL
          AND LOWER(e.role) IN ('sales_manager', 'sales_head', 'director')
        LIMIT 3
      `);
      return Array.isArray(result.rows) ? result.rows : [];
    }, 'DB_ERROR');
  }

  async findDirectors(): Promise<Result<RecipientRow[]>> {
    return safeCall(async () => {
      const result = await this.drizzle.db.execute<RecipientRow>(sql`
        SELECT e.telegram_chat_id
        FROM employees e
        WHERE LOWER(e.status) = 'active'
          AND e.telegram_chat_id IS NOT NULL
          AND LOWER(e.role) = 'director'
        LIMIT 3
      `);
      return Array.isArray(result.rows) ? result.rows : [];
    }, 'DB_ERROR');
  }

  async findCustomerByOrderNumber(orderNumber: string): Promise<Result<CustomerContactRow | null>> {
    return safeCall(async () => {
      const result = await this.drizzle.db.execute<CustomerContactRow>(sql`
        SELECT ca.email, ca.name
        FROM customer_orders co
        LEFT JOIN customer_accounts ca ON ca.id::text = co.customer_id
        WHERE co.order_number = ${orderNumber}
        LIMIT 1
      `);
      return result.rows[0] ?? null;
    }, 'DB_ERROR');
  }
}
