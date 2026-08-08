/**
 * @module card-folder.service
 * @description Business logic for the card's 6-section folder. Computes completeness%
 *   (filled/6*100, NOT stored — avoids staleness, EP-ORG-007). Returns Result<T>.
 */

import { Injectable } from '@nestjs/common';
import { Ok, Err, Result } from '@common/result';
import { CardFolderRepository, FolderInput } from './card-folder.repository';

type Row = Record<string, unknown>;
const SECTIONS = ['vazifa', 'javobgarlik', 'gsd', 'reglament', 'jarayon', 'talim'] as const;

export interface FolderView {
  cardId: number;
  vazifa: string | null;
  javobgarlik: string | null;
  gsd: string | null;
  reglament: string | null;
  jarayon: string | null;
  talim: string | null;
  filledSections: number;
  totalSections: number;
  completeness: number;
}

function toView(cardId: number, row: Row | null): FolderView {
  const get = (k: string): string | null => {
    const v = row?.[k];
    return typeof v === 'string' ? v : null;
  };
  const filled = SECTIONS.filter((k) => {
    const v = get(k);
    return v != null && v.trim() !== '';
  }).length;
  return {
    cardId,
    vazifa: get('vazifa'),
    javobgarlik: get('javobgarlik'),
    gsd: get('gsd'),
    reglament: get('reglament'),
    jarayon: get('jarayon'),
    talim: get('talim'),
    filledSections: filled,
    totalSections: SECTIONS.length,
    completeness: Math.round((filled / SECTIONS.length) * 100),
  };
}

@Injectable()
export class CardFolderService {
  constructor(private readonly repo: CardFolderRepository) {}

  /** Returns the folder for a card; if none exists yet, returns an empty folder (completeness 0). */
  async getFolder(cardId: number): Promise<Result<FolderView>> {
    const r = await this.repo.getByCard(cardId);
    if (!r.ok) return Err(r.error);
    return Ok(toView(cardId, r.data));
  }

  async upsertFolder(cardId: number, dto: FolderInput): Promise<Result<FolderView>> {
    const r = await this.repo.upsert(cardId, dto);
    if (!r.ok) return Err(r.error);
    return Ok(toView(cardId, r.data));
  }
}
