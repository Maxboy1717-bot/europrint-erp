/**
 * POS — GL Auto-Posting Service
 *
 * Wave 4 round-4 (PA2-18): the legacy `@OnEvent('pos.movement.data.completed')`
 * listener that lived here has been extracted into the canonical CQRS
 * `PosGlAutoListener` (see `../event-handlers/pos-gl-auto.listener.ts`). The
 * GL pair-table (`GL_PAIRS`) is re-exported so the listener reuses the same
 * accounting rules; the service itself is kept as a thin wrapper to preserve
 * downstream imports.
 *
 * 'pos.movement.data.completed' eventini tinglaydi va harakat turiga qarab
 * GL yozuvlarini avtomatik hisoblaydi, so'ng gl_posting_log ga yozadi.
 * Finance qo'lda tasdiqlashi kerak (status = AWAITING_REVIEW).
 */
import { Injectable } from '@nestjs/common';

import { GlPostingLogRepository } from '../../infrastructure/repositories/gl-posting-log.repository';

interface GlEntry {
  accountCode: string;
  accountName: string;
  debit:       number;
  credit:      number;
}

// Har bir harakat turi uchun hisob juftliklari
export const GL_PAIRS: Record<string, (totalValue: number, movementCode: string) => GlEntry[]> = {

  EXTERNAL_IN: (total) => [
    // Bosqich 1: Karantin omboriga kiradi
    { accountCode: '2110', accountName: 'Karantin Ombori',  debit: total,  credit: 0      },
    { accountCode: '6010', accountName: 'Kreditorlik',       debit: 0,      credit: total  },
    // Bosqich 2: QC → Asosiy Omborga
    { accountCode: '1410', accountName: 'Asosiy Ombor',      debit: total,  credit: 0      },
    { accountCode: '2110', accountName: 'Karantin Ombori',   debit: 0,      credit: total  },
  ],

  EXTERNAL_OUT: (total) => [
    { accountCode: '1210', accountName: "Xaridor qarzi",     debit: total,  credit: 0      },
    { accountCode: '9010', accountName: 'Daromad',            debit: 0,      credit: total  },
    { accountCode: '9110', accountName: 'COGS',               debit: total,  credit: 0      },
    { accountCode: '1410', accountName: 'Asosiy Ombor',       debit: 0,      credit: total  },
  ],

  INTERNAL_ISSUE: (total) => [
    { accountCode: '8100', accountName: "Bo'lim xarajati",   debit: total,  credit: 0      },
    { accountCode: '1410', accountName: 'Asosiy Ombor',       debit: 0,      credit: total  },
  ],

  INTERNAL_RETURN: (total) => [
    { accountCode: '1410', accountName: 'Asosiy Ombor',       debit: total,  credit: 0      },
    { accountCode: '8100', accountName: "Bo'lim xarajati",   debit: 0,      credit: total  },
  ],

  DAMAGE: (total) => [
    { accountCode: '8910', accountName: 'Zarar',              debit: total,  credit: 0      },
    { accountCode: '1410', accountName: 'Asosiy Ombor',       debit: 0,      credit: total  },
  ],

  INVENTORY_ADJ_PLUS: (total) => [
    { accountCode: '1410', accountName: 'Asosiy Ombor',       debit: total,  credit: 0      },
    { accountCode: '9910', accountName: 'Boshqa daromad',     debit: 0,      credit: total  },
  ],

  INVENTORY_ADJ_MINUS: (total) => [
    { accountCode: '8920', accountName: 'Inventar zarari',    debit: total,  credit: 0      },
    { accountCode: '1410', accountName: 'Asosiy Ombor',       debit: 0,      credit: total  },
  ],

  INTERNAL_TRANSFER: (total) => [
    { accountCode: '1410', accountName: 'Asosiy Ombor (chiqim)', debit: 0,   credit: total },
    { accountCode: '1410', accountName: 'Asosiy Ombor (kirim)',  debit: total, credit: 0   },
  ],
};

@Injectable()
export class PosGlAutoService {
  // Wave 4 round-4 (PA2-18): the @OnEvent('pos.movement.data.completed')
  // listener that previously lived here has been extracted into the canonical
  // CQRS `PosGlAutoListener` (../event-handlers/pos-gl-auto.listener.ts).
  // The service is kept as a marker so existing DI imports continue to
  // compile; remove it once all references to `PosGlAutoService` have been
  // updated to inject the listener (or simply rely on the CQRS bus).
  constructor(private readonly _glRepo: GlPostingLogRepository) {
    // glRepo retained on the constructor signature to preserve the existing
    // DI graph during the migration window.
    void this._glRepo;
  }
}
