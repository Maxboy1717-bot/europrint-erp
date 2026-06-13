/**
 * @module card-folder.repository
 * @description Data-access for the card's 6-section folder (`card_folders`, 1:1 with org_functions).
 *   Mirrors the card/razryad pattern. Upsert keyed on UNIQUE(card_id). Returns Result<T>.
 */

import { Ok, Err, Result, safeCall } from '@common/result';
import { Injectable } from '@nestjs/common';
import { runQuery } from '@shared/db';
import { SQL, SQLWrapper, sql } from 'drizzle-orm';

type Row = Record<string, unknown>;

export interface FolderInput {
  vazifa?: string | null;
  javobgarlik?: string | null;
  gsd?: string | null;
  reglament?: string | null;
  jarayon?: string | null;
  talim?: string | null;
}

@Injectable()
export class CardFolderRepository {
  private exec(q: SQL | SQLWrapper): Promise<Result<Row[]>> {
    return safeCall(async () => (await runQuery<Row>(q)).rows as Row[]);
  }

  async getByCard(cardId: number): Promise<Result<Row | null>> {
    const r = await this.exec(sql`SELECT * FROM card_folders WHERE card_id = ${cardId} AND is_active = true`);
    return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);
  }

  /** Upsert the 6 sections (PUT semantics) keyed on UNIQUE(card_id). */
  async upsert(cardId: number, dto: FolderInput): Promise<Result<Row | null>> {
    const r = await this.exec(sql`
      INSERT INTO card_folders
        (card_id, vazifa, javobgarlik, gsd, reglament, jarayon, talim, is_active, created_at, updated_at)
      VALUES
        (${cardId}, ${dto.vazifa ?? null}, ${dto.javobgarlik ?? null}, ${dto.gsd ?? null},
         ${dto.reglament ?? null}, ${dto.jarayon ?? null}, ${dto.talim ?? null}, true, NOW(), NOW())
      ON CONFLICT (card_id) DO UPDATE SET
        vazifa      = EXCLUDED.vazifa,
        javobgarlik = EXCLUDED.javobgarlik,
        gsd         = EXCLUDED.gsd,
        reglament   = EXCLUDED.reglament,
        jarayon     = EXCLUDED.jarayon,
        talim       = EXCLUDED.talim,
        is_active   = true,
        updated_at  = NOW()
      RETURNING *
    `);
    return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);
  }
}
