/**
 * @module crm-custom-fields.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 * @layer Infrastructure (CRM)
 */

import { Injectable, Logger } from '@nestjs/common';
import { castTo } from '@common/db-rows';
import { db } from '@shared/db';
import { eq, sql } from 'drizzle-orm';
import { crm_custom_fields } from '@shared/db';
import { safeCall, Result } from '@common/result';
import type { ICrmCustomFieldsRepo } from '../../domain/repositories/i-crm-custom-fields.repo';

type Row = Record<string, unknown>;

@Injectable()
export class CrmCustomFieldsRepository implements ICrmCustomFieldsRepo {
  private readonly logger = new Logger(CrmCustomFieldsRepository.name);

  async list(entityType: string | null): Promise<Result<Row[]>> {
    return safeCall(async () => {
      try {
        return db.select().from(crm_custom_fields)
          .where(sql`${entityType ?? null}::text IS NULL OR ${crm_custom_fields.entity_type} = ${entityType ?? null}`)
          .orderBy(crm_custom_fields.order_index, crm_custom_fields.created_at).then(r => castTo<Row[]>(r));
      } catch (err) {
        this.logger.warn(`list: ${(err as Error).message}`);
        return [];
      }
      }, 'DB_ERROR');
  }

  async create(body: Row): Promise<Result<Row | null>> {
    return safeCall(async () => {
      // FE sends camelCase (fieldName, fieldLabel, fieldType, isRequired, entityType).
      // Accept both camelCase (FE) and snake_case (direct API) keys.
      const entityType  = ((body['entityType']  ?? body['entity_type'])  as string | undefined) ?? 'lead';
      const fieldName   = ((body['fieldName']   ?? body['field_name']  ?? body['name'])   as string | undefined) ?? '';
      const fieldLabel  = ((body['fieldLabel']  ?? body['field_label'] ?? body['label'])  as string | undefined) ?? '';
      const fieldType   = ((body['fieldType']   ?? body['field_type'])  as string | undefined) ?? 'text';
      const isRequired  = ((body['isRequired']  ?? body['is_required'] ?? body['required']) as boolean | undefined) ?? false;
      const rows = await db.insert(crm_custom_fields).values({
        field_name:  fieldName,
        field_label: fieldLabel,
        field_type:  fieldType,
        entity_type: entityType,
        is_required: isRequired,
        options:     (body['options'] as unknown) ?? null,
        order_index: sql`(SELECT COALESCE(MAX(order_index), 0) + 1 FROM crm_custom_fields WHERE entity_type = ${entityType})`,
      }).returning();
      return (rows[0] ?? null) as Row | null;
      }, 'DB_ERROR');
  }

  async update(id: number, body: Row): Promise<Result<Row | null>> {
    return safeCall(async () => {
      try {
        // Accept both camelCase (FE) and snake_case keys for label, required, options.
        const fieldLabel = (body['fieldLabel'] ?? body['field_label'] ?? body['label'] ?? null) as string | null;
        const isRequired = (body['isRequired'] ?? body['is_required'] ?? body['required'] ?? null) as boolean | null;
        const rows = await db.update(crm_custom_fields).set({
          field_label: sql`COALESCE(${fieldLabel}, ${crm_custom_fields.field_label})`,
          is_required: sql`COALESCE(${isRequired}, ${crm_custom_fields.is_required})`,
          options:     sql`COALESCE(${body['options'] ? JSON.stringify(body['options']) : null}::jsonb, ${crm_custom_fields.options})`,
        }).where(eq(crm_custom_fields.id, id)).returning();
        return (rows[0] ?? null) as Row | null;
      } catch (err) {
        this.logger.warn(`update: ${(err as Error).message}`);
        throw err;
      }
      }, 'DB_ERROR');
  }

  async reorder(items: Array<{ id: number; order_index: number }>): Promise<void> {
    for (const item of items) {
      await db.update(crm_custom_fields)
        .set({ order_index: item.order_index })
        .where(eq(crm_custom_fields.id, item.id));
    }
  }

  async remove(id: number): Promise<void> {
    await db.delete(crm_custom_fields).where(eq(crm_custom_fields.id, id));
  }
}
