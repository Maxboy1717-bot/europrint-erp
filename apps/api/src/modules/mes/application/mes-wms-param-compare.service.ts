/**
 * @module mes-wms-param-compare.service
 * @description 08-mes #24 — biznes-logika servisi. Result<T> qaytaradi (@common/result);
 * repo taqqoslashini o'raydi, sessiya/partiya topilmasa NOT_FOUND.
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { safeCall } from '@common/result';
import { MesWmsParamCompareRepository } from '../infrastructure/repositories/mes-wms-param-compare.repo';

@Injectable()
export class MesWmsParamCompareService {
  constructor(private readonly repo: MesWmsParamCompareRepository) {}

  /** Sessiya format/gramm ni WMS partiya material parametrlari bilan solishtiradi. */
  async compare(sessionId: number, batchLotId: number, checkedBy: number | null) {
    return safeCall(async () => {
      const res = await this.repo.compareSessionToBatch(sessionId, batchLotId, checkedBy);
      if (!res) throw new NotFoundException('Sessiya yoki WMS partiya topilmadi');
      return res;
    });
  }

  /** Sessiya uchun taqqoslash tarixini qaytaradi. */
  async listForSession(sessionId: number) {
    return safeCall(async () => this.repo.listChecksForSession(sessionId));
  }
}
