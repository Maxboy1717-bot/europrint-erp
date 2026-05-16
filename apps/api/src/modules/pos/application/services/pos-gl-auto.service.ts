/**
 * POS — GL Auto-Posting Service
 *
 * 'pos.movement.data.completed' eventini tinglaydi va harakat turiga qarab
 * GL yozuvlarini avtomatik hisoblaydi, so'ng gl_posting_log ga yozadi.
 * Finance qo'lda tasdiqlashi kerak (status = AWAITING_REVIEW).
 */
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { db, eq } from '@workspace/db';
import { posMovementLines, posMovements } from '@workspace/db';

import { GlPostingLogRepository } from '../../infrastructure/repositories/gl-posting-log.repository';

interface MovementCompletedPayload {
  movementId:     number;
  movementNumber: string;
  oldStatus:      string;
  newStatus:      string;
  updatedById:    number;
}

interface GlEntry {
  accountCode: string;
  accountName: string;
  debit:       number;
  credit:      number;
}

// Har bir harakat turi uchun hisob juftliklari
const GL_PAIRS: Record<string, (totalValue: number, movementCode: string) => GlEntry[]> = {

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
  private readonly logger = new Logger(PosGlAutoService.name);

  constructor(
    private readonly glRepo:        GlPostingLogRepository,
    private readonly eventEmitter:  EventEmitter2,
  ) {}

  @OnEvent('pos.movement.data.completed')
  async onMovementCompleted(payload: MovementCompletedPayload): Promise<void> {
    const { movementId, movementNumber } = payload;
    this.logger.log(`[GL-AUTO] Harakat yakunlandi: id=${movementId} number=${movementNumber} — GL avtomatik hisoblanadi`);

    try {
      // 1. Harakat ma'lumotlarini olish
      const [movement] = await db
        .select({ movementType: posMovements.movementType })
        .from(posMovements)
        .where(eq(posMovements.id, movementId));

      if (!movement) {
        this.logger.warn(`[GL-AUTO] Harakat topilmadi: id=${movementId}`);
        return;
      }

      const movType = movement.movementType as string;

      // 2. Harakat qatorlarini olish va umumiy qiymatni hisoblash
      const lines = await db
        .select({
          quantity:  posMovementLines.quantity,
          unitPrice: posMovementLines.unitPrice,
        })
        .from(posMovementLines)
        .where(eq(posMovementLines.movementId, movementId));

      const totalValue = lines.reduce((sum, line) => {
        const qty   = Number(line.quantity  ?? 0);
        const price = Number(line.unitPrice ?? 0);
        return sum + qty * price;
      }, 0);

      // 3. Hisob juftliklarini tanlash
      const pairFn = GL_PAIRS[movType];
      if (!pairFn) {
        this.logger.warn(`[GL-AUTO] "${movType}" turi uchun GL juftligi topilmadi`);
        return;
      }

      const glEntries = pairFn(totalValue, movType);

      // 4. gl_posting_log ga yozish
      const result = await this.glRepo.insertLog({
        movementId,
        stage:       5,
        stageName:   'POST',
        status:      'AWAITING_REVIEW',
        glEntries,
        aiConfidence: null,
        processedAt: new Date(),
      });

      if (!result.ok) {
        this.logger.error(`[GL-AUTO] GL yozishda xato (movementId=${movementId}): ${result.error}`);
        return;
      }

      this.logger.log(
        `[GL-AUTO] GL yozildi: movementId=${movementId} type=${movType} ` +
        `total=${totalValue.toFixed(2)} entries=${glEntries.length} logId=${result.data.id}`,
      );

      // 5. Muvaffaqiyatli event emit qilish
      this.eventEmitter.emit('pos.gl.auto_posted', {
        movementId,
        movementNumber,
        movementType: movType,
        totalValue,
        glLogId: result.data.id,
      });

    } catch (err: unknown) {
      // Async, non-blocking — xatoni log qilamiz lekin throw qilmaymiz
      this.logger.error(
        `[GL-AUTO] Kutilmagan xato (movementId=${movementId}): ${(err as Error).message}`,
        (err as Error).stack,
      );
    }
  }
}
