/**
 * @module i-gl-posting.repo
 * @description Domain repository interface for GL journal entry insertion.
 * @layer Domain (Finance)
 */

import type { Result } from '@common/result';

export interface IGlPostingRepository {
  insertEntry(data: {
    entryNumber: string;
    entryDate: string;
    documentType: string;
    documentId?: string;
    debitAccountId: string;
    creditAccountId: string;
    amount: number;
    description?: string;
    createdBy?: number;
  }): Promise<Result<number>>;
}

export const GL_POSTING_REPO = Symbol('IGlPostingRepository');
