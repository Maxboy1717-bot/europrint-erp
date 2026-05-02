import { SECONDS_PER_HOUR, POLL_INTERVAL_MS, MS_PER_SECOND } from '@common/constants/app.constants';
import { castTo } from '@common/db-rows';
/**
 * POS — Barcode Service
 *
 * EAN-13 barcode skanerlash va material kartochka topish:
 *  1. Redis cache tekshiruv (< 5ms)
 *  2. DB topilmasa → AI kartochka taklif
 *  3. EAN-13 generatsiya (GS1 algoritmiga ko'ra)
 *  4. Label chop etish navbati
 */

import {
  Injectable, Logger, NotFoundException, BadRequestException,
  OnModuleInit, OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { safeCall, Ok, Result, AppError } from '@common/result';
import { PosBarcodeRepository } from '../pos-barcode.repository';
import { materialCards, barcodeMap, posBarcodePrintQueue, materialCardSuggestions, db, eq, sql } from '@workspace/db';

import { PosAuditService } from './pos-audit.service';
import { PosBarcodeExtService } from './pos-barcode-ext.service';
import { safeJsonParse } from '@shared/utils/safe-json';
import {
  ScanBarcodeDto,
  ScanBarcodeResultDto,
  AssignBarcodeDto,
  PrintLabelDto,
  ReviewAiSuggestionDto,
  GenerateEan13Dto,
} from '../dto/barcode.dto';

const BARCODE_CACHE_TTL = SECONDS_PER_HOUR; // 1 soat
const BARCODE_CACHE_KEY = (barcode: string) => `barcode:${barcode}`;

type RedisLike = {
  get(key: string): Promise<string | null>;
  setex(key: string, ttl: number, value: string): Promise<unknown>;
  del(key: string): Promise<number>;
  connect?(): Promise<void>;
  quit(): Promise<unknown>;
};

interface CacheEntry {
  data: string;
  expiresAt: number;
}

@Injectable()
export class PosBarcodeService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PosBarcodeService.name);
  private redisClient: RedisLike | null = null;
  private readonly memCache = new Map<string, CacheEntry>();

  constructor(
    private readonly configService: ConfigService,
    private readonly auditService:  PosAuditService,
    private readonly extSvc:        PosBarcodeExtService,
    private readonly barcodeRepo:   PosBarcodeRepository,
  ) {}

  onModuleInit(): void { this._initBackground().catch((e) => this.logger.warn('[pos-barcode.service] init failed: ' + e)); }
  private async _initBackground(): Promise<void> {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    if (!redisUrl) return Ok();
    const r = await safeCall(async () => {
      const { default: Redis } = await import('ioredis');
      this.redisClient = new Redis(redisUrl, {
        maxRetriesPerRequest: 2,
        connectTimeout: POLL_INTERVAL_MS,
        lazyConnect: true,
      }) as RedisLike;
      await (this.redisClient)?.connect?.();
      this.logger.log('[POS Barcode] Redis ulanish muvaffaqiyatli');
    });
    if (!r.ok) {
      this.logger.warn(`[POS Barcode] Redis ulanmadi — in-memory cache. Sabab: ${r.error.message}`);
      this.redisClient = null;
    }
    return r;
  }

  async onModuleDestroy(): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.quit().catch((e: unknown) => { this.logger.warn('Redis quit error', String(e)); });
    }
  }

  // ─── Cache Yordamchi ──────────────────────────────────────────────────────

  private async cacheGet(key: string): Promise<string | null | undefined> {
    if (this.redisClient) {
      return this.redisClient.get(key);
    }
    const entry = this.memCache.get(key);
    if (!entry) return;
    if (entry.expiresAt < Date.now()) {
      this.memCache.delete(key);
      return;
    }
    return entry.data;
  }

  private async cacheSet(key: string, value: string, ttl: number): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.setex(key, ttl, value);
    } else {
      this.memCache.set(key, { data: value, expiresAt: Date.now() + ttl * MS_PER_SECOND });
    }
  }

  private async cacheDel(key: string): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.del(key);
    } else {
      this.memCache.delete(key);
    }
  }

  // ─── Barcode Skanerlash ───────────────────────────────────────────────────

  async scanBarcode(dto: ScanBarcodeDto, userId: number): Promise<ScanBarcodeResultDto> {
    const startTime = Date.now();

    // 1. Cache
    const cached = await this.cacheGet(BARCODE_CACHE_KEY(dto.barcode));
    if (cached) {
      const card = safeJsonParse<Record<string, unknown> | null>(cached, null);
      if (!card) return Object.assign(new ScanBarcodeResultDto(), { found: false });
      this.logger.debug(`Barcode cache hit: ${dto.barcode} (${Date.now() - startTime}ms)`);

      const stockInfo = dto.warehouseId
        ? await this.extSvc.getStockInfo(Number(card['id']), dto.warehouseId)
        : undefined;

      return { found: true, materialCard: { ...card, ...stockInfo } as ScanBarcodeResultDto['materialCard'] };
    }

    // 2. DB qidirish
    const cardRow = await this.barcodeRepo.findByBarcode(dto.barcode);

    if (cardRow) {
      const card: Record<string, unknown> = castTo<Record<string, unknown>>(cardRow);

      await this.cacheSet(
        BARCODE_CACHE_KEY(dto.barcode),
        JSON.stringify({
          id:              card['id'],
          xomAshyo:        card['xom_ashyo'],
          xomAshyoRu:      card['xom_ashyo_ru'],
          barcode:         card['barcode'],
          unitOfMeasure:   card['unit_of_measure'],
          isConsumable:    card['is_consumable'],
          isIndivisible:   card['is_indivisible'],
          minIntervalDays: card['min_interval_days'],
          maxQtyPerIssue:  card['max_qty_per_issue'],
        }),
        BARCODE_CACHE_TTL,
      );

      const stockInfo = dto.warehouseId
        ? await this.extSvc.getStockInfo(card['id'] as number, dto.warehouseId)
        : undefined;

      this.logger.debug(`Barcode DB hit: ${dto.barcode} → id=${card['id']} (${Date.now() - startTime}ms)`);

      return {
        found: true,
        materialCard: {
          id:              card['id'] as number,
          xomAshyo:        card['xom_ashyo'] as string,
          xomAshyoRu:      card['xom_ashyo_ru'] as string,
          barcode:         card['barcode'] as string,
          unitOfMeasure:   card['unit_of_measure'] as string,
          isConsumable:    card['is_consumable'] as boolean,
          isIndivisible:   card['is_indivisible'] as boolean,
          minIntervalDays: Number(card['min_interval_days']),
          maxQtyPerIssue:  Number(card['max_qty_per_issue']),
          ...stockInfo,
        },
      };
    }

    // 3. Topilmadi → AI taklif
    this.logger.warn(`Barcode topilmadi: ${dto.barcode} — AI taklif boshlanmoqda`);
    const suggestion = await this.extSvc.requestAiSuggestion(dto.barcode, userId);

    const suggestionData = (suggestion?.ok ? suggestion.data as { id?: number; suggestedName?: string; suggestedNameRu?: string; suggestedUnit?: string; aiConfidence?: number; aiReasoning?: string } : null);
    return {
      found: false,
      aiSuggestionId: suggestionData?.id,
      aiSuggestion: suggestionData
        ? {
            suggestedName:   suggestionData.suggestedName ?? '',
            suggestedNameRu: suggestionData.suggestedNameRu ?? '',
            suggestedUnit:   suggestionData.suggestedUnit ?? '',
            confidence:      Number(suggestionData.aiConfidence ?? 0),
            reasoning:       suggestionData.aiReasoning ?? '',
          }
        : undefined,
    };
  }

  // ─── Barcode Biriktirish ──────────────────────────────────────────────────

  async assignBarcode(dto: AssignBarcodeDto, userId: number) {
    const [card] = await db
      .select({ id: materialCards.id, barcode: sql<string>`''` })
      .from(materialCards)
      .where(eq(materialCards.id, dto.materialCardId));

    if (!card) throw new NotFoundException(`Material topilmadi: ${dto.materialCardId}`);

    const barcodeExists = await this.barcodeRepo.checkBarcodeExists(dto.barcode);

    if (barcodeExists) {
      throw new BadRequestException(`Barcode allaqachon ishlatilgan: ${dto.barcode}`);
    }

    if (dto.isPrimary) {
      await this.barcodeRepo.clearPrimaryBarcode(String(dto.materialCardId));
    }

    const rawType = (dto.barcodeType ?? 'EAN13').toUpperCase();
    const barcodeTypeVal = (['EAN13', 'CODE128', 'QR'].includes(rawType)
      ? rawType : 'EAN13') as 'EAN13' | 'CODE128' | 'QR';

    const [assigned] = await db
      .insert(barcodeMap)
      .values({
        materialCardId: dto.materialCardId,
        barcode: dto.barcode,
        barcodeType: barcodeTypeVal,
        isPrimary: dto.isPrimary ?? false,
      })
      .returning();

    await this.cacheDel(BARCODE_CACHE_KEY(dto.barcode));

    await this.auditService.log({
      userId,
      action: 'pos.barcode.assigned',
      entityType: 'pos_barcode_map',
      entityId: assigned.id,
      newValue: { materialCardId: dto.materialCardId, barcode: dto.barcode },
    });

    return assigned;
  }

  // ─── Label Chop Etish (delegate) ─────────────────────────────────────────

  async queuePrint(dto: PrintLabelDto, userId: number) {
    return this.extSvc.queuePrint(dto, userId);
  }

  // ─── AI Taklif Ko'rib Chiqish (delegate) ──────────────────────────────────

  async reviewAiSuggestion(dto: ReviewAiSuggestionDto, reviewerId: number) {
    return this.extSvc.reviewAiSuggestion(dto, reviewerId);
  }

  // ─── EAN-13 Generatsiya (delegate) ───────────────────────────────────────

  generateEan13(dto: GenerateEan13Dto): string {
    return this.extSvc.generateEan13(dto);
  }
}
