/**
 * @module stat-regulation.repository
 * @description Repository / data-access layer for stat_regulations (versioned
 *   master-data). Uses typedExecute raw SQL because the table is created by the
 *   gated P30 migration and is not yet in the Drizzle schema barrel (per
 *   directive QADAM 2 — do not touch lib/db strategic-ext-schema.ts).
 * @layer Infrastructure (Director)
 */

import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { typedExecute } from '@shared/db/typed-execute';
import { safeCall, Result } from '@common/result';
import type {
  IStatRegulationRepo,
  IStatRegRow,
  StatRegCreateInput,
  StatRegUpdateInput,
} from '../../domain/repositories/i-stat-regulation.repo';

@Injectable()
export class StatRegulationRepository implements IStatRegulationRepo {
  async list(activeOnly: boolean): Promise<Result<IStatRegRow[]>> {
    return safeCall(async () => {
      if (activeOnly) {
        return typedExecute<IStatRegRow>(
          sql`SELECT * FROM stat_regulations WHERE is_active = TRUE ORDER BY name_uz ASC`,
        );
      }
      return typedExecute<IStatRegRow>(
        sql`SELECT * FROM stat_regulations ORDER BY name_uz ASC, version DESC`,
      );
    }, 'DB_ERROR');
  }

  async getById(id: number): Promise<Result<IStatRegRow | null>> {
    return safeCall(async () => {
      const rows = await typedExecute<IStatRegRow>(
        sql`SELECT * FROM stat_regulations WHERE id = ${id}`,
      );
      return rows[0] ?? null;
    }, 'DB_ERROR');
  }

  async getHistory(nameUz: string): Promise<Result<IStatRegRow[]>> {
    return safeCall(
      async () =>
        typedExecute<IStatRegRow>(
          sql`SELECT * FROM stat_regulations WHERE name_uz = ${nameUz} ORDER BY version DESC`,
        ),
      'DB_ERROR',
    );
  }

  async create(dto: StatRegCreateInput): Promise<Result<IStatRegRow>> {
    return safeCall(async () => {
      const rows = await typedExecute<IStatRegRow>(sql`
        INSERT INTO stat_regulations
          (name_uz, name_ru, definition, formula, unit, frequency,
           source_module, owner_card_id, target_value)
        VALUES
          (${dto.name_uz}, ${dto.name_ru ?? null}, ${dto.definition ?? null},
           ${dto.formula ?? null}, ${dto.unit ?? null}, ${dto.frequency},
           ${dto.source_module ?? null}, ${dto.owner_card_id ?? null},
           ${dto.target_value ?? null})
        RETURNING *
      `);
      if (!rows[0]) throw new Error('INSERT_FAILED');
      return rows[0];
    }, 'DB_ERROR');
  }

  /**
   * VERSIYALASH: mavjud (is_active) qatorni o'zgartirmasdan saqlaymiz —
   * is_active=false qilamiz va yangi versiyani INSERT qilamiz. Eski versiya
   * (history) hech qachon mutate qilinmaydi (vizyon EP-DIR-022).
   */
  async update(id: number, dto: StatRegUpdateInput): Promise<Result<IStatRegRow>> {
    return safeCall(async () => {
      const existing = await typedExecute<IStatRegRow>(
        sql`SELECT * FROM stat_regulations WHERE id = ${id} AND is_active = TRUE`,
      );
      if (!existing[0]) throw new Error('NOT_FOUND');
      const old = existing[0];

      // 1. Eski (joriy) versiyani is_active=false qil — qator o'chmaydi, saqlanadi.
      await typedExecute<unknown>(
        sql`UPDATE stat_regulations SET is_active = FALSE, updated_at = NOW() WHERE id = ${id}`,
      );

      // 2. Yangi versiya INSERT — har maydon dto'dan, bo'lmasa eskidan ko'chiriladi.
      const rows = await typedExecute<IStatRegRow>(sql`
        INSERT INTO stat_regulations
          (name_uz, name_ru, definition, formula, unit, frequency,
           source_module, owner_card_id, target_value, version, valid_from)
        VALUES
          (${dto.name_uz ?? old.name_uz}, ${dto.name_ru ?? old.name_ru ?? null},
           ${dto.definition ?? old.definition ?? null},
           ${dto.formula ?? old.formula ?? null}, ${dto.unit ?? old.unit ?? null},
           ${dto.frequency ?? old.frequency},
           ${dto.source_module ?? old.source_module ?? null},
           ${dto.owner_card_id ?? old.owner_card_id ?? null},
           ${dto.target_value ?? old.target_value ?? null},
           ${old.version + 1}, CURRENT_DATE)
        RETURNING *
      `);
      if (!rows[0]) throw new Error('VERSION_INSERT_FAILED');
      return rows[0];
    }, 'DB_ERROR');
  }

  async deactivate(id: number): Promise<Result<void>> {
    return safeCall(async () => {
      await typedExecute<unknown>(
        sql`UPDATE stat_regulations SET is_active = FALSE, updated_at = NOW() WHERE id = ${id}`,
      );
    }, 'DB_ERROR');
  }
}
