/**
 * @module ai-daily-report.service
 * @description A75 — Kunlik AI-chatbot STRUKTURA: mashinasiz (MES'siz) xodim
 *   o'zining kunlik ЦКП-hisobotini erkin matn (chat) orqali beradi; AI undan
 *   tarkibiy ЦКП-faktni (actualValue + qisqa xulosa) ajratib chiqaradi.
 *
 *   GOLDEN-THREAD: bu servis ЦКП-faktni O'ZI yozmaydi (modul chegarasi —
 *   ckp_fact_values egasi = org-structure moduli). Buning o'rniga AI ajratgan
 *   tarkibiy qiymatni qaytaradi; FE uni tasdiqlab kanonik
 *   `POST /api/org-structure/ckp/fact` endpointiga yuboradi (CkpFactService.recordFact
 *   formula + deadline + golden-thread'ni boshqaradi). Shu bilan duplikatsiya YO'Q.
 *
 *   FABRIKATSIYA TAQIQ (Q-40): AI-kalit (OPENAI/GEMINI/ANTHROPIC) yo'q bo'lsa
 *   AiRouter Err qaytaradi → bu servis SOXTA actualValue yozmaydi. U
 *   `aiAvailable=false`, `needsManualValue=true` bilan tarkibni qaytaradi;
 *   xodim qiymatni qo'lda kiritadi. Hech qachon to'qima son qaytarilmaydi.
 *
 * @layer Application (AI)
 */

import { Injectable, Logger } from '@nestjs/common';
import { Ok, Err, AppErr, isOk, Result } from '@common/result';
import { z } from 'zod';
import { AiRouterService } from './ai-router.service';
import type { AiRequest, AiTaskType } from '../../domain/types/ai.types';
import { AiDailyReportRepository, type PrimaryCardCkpMeta, type CkpChatTurn } from '../../infrastructure/repositories/ai-daily-report.repository';

// Kunlik ЦКП-hisoboti = xodim ish-natijasi tahlili → mavjud
// 'hr.performance_review' task-turidan o'tkaziladi (analiz-sinfi). Yangi
// AiTaskType qo'shilmaydi (additiv, mavjud yo'nalish).
const DAILY_REPORT_TASK_TYPE: AiTaskType = 'hr.performance_review';
const DAILY_REPORT_MAX_TOKENS = 500;

/** Foydalanuvchi chatda yuboradigan kunlik hisobot matni. */
export const DailyReportSubmitSchema = z.object({
  /** Kunlik hisobot kuni (YYYY-MM-DD). Bo'sh bo'lsa controller bugungi kunni beradi. */
  factDate: z.string().min(8).max(10),
  /** Xodim erkin matni — "bugun 120 ta quti yopdim, 2 ta brak chiqdi". */
  message: z.string().min(1).max(4000),
  /** Ixtiyoriy: xodim AI ajratgan qiymatni qo'lda ham kiritishi mumkin. */
  manualActualValue: z.number().optional(),
}).strict();

export type DailyReportSubmitDto = z.infer<typeof DailyReportSubmitSchema>;

/** Kartaning ЦКП-meta'si (norma/o'lchov) — promptga kontekst beradi. */
type CardCkpMeta = PrimaryCardCkpMeta;

/** AI ajratgan tarkibiy fakt. */
interface ExtractedFact {
  /** AI topgan son-qiymat (norma o'lchovida). null = topilmadi/AI yo'q → qo'lda. */
  actualValue: number | null;
  /** Qisqa xulosa (AI yoki, AI yo'q bo'lsa, xom matn). */
  summary: string;
  /** AI eslatgan muammolar/brak (ixtiyoriy). */
  issues: string[];
}

export interface DailyReportResult {
  cardId: number;
  cardName: string | null;
  factDate: string;
  /** AI-kalit bor va javob bergan-bermagani. false → fabrikatsiya YO'Q. */
  aiAvailable: boolean;
  aiProvider: string | null;
  /** AI/qo'lda topilgan qiymat null bo'lsa — xodim qo'lda kiritishi shart. */
  extracted: ExtractedFact;
  /** Qiymat yo'q → FE qo'lda kiritish maydonini ko'rsatadi. */
  needsManualValue: boolean;
  /** ЦКП norma konteksti (AI promptiga ham, FE ko'rsatuviga ham). */
  ckpContext: {
    ckp: string | null;
    targetValue: number | null;
    measurementUnit: string | null;
  };
  /**
   * Tasdiqdan keyin FE shu kanonik endpointga yuboradi (golden-thread egasi).
   * Bu servis ЦКП-faktni O'ZI yozmaydi (modul chegarasi).
   */
  recordEndpoint: '/api/org-structure/ckp/fact';
}

@Injectable()
export class AiDailyReportService {
  private readonly logger = new Logger(AiDailyReportService.name);

  constructor(
    private readonly aiRouter: AiRouterService,
    private readonly repo: AiDailyReportRepository,
  ) {}

  /**
   * Mashinasiz xodimning kunlik ЦКП-hisobotini chatdan qabul qiladi va tarkibiy
   * faktni ajratadi. ЦКП-faktni YOZMAYDI — tasdiqlangan qiymat kanonik
   * endpointga FE tomonidan yuboriladi. AI yo'q → graceful (fabrikatsiya yo'q).
   */
  async submit(userId: number, dto: DailyReportSubmitDto): Promise<Result<DailyReportResult>> {
    const cardR = await this.repo.resolvePrimaryCard(userId);
    if (!cardR.ok) return Err(cardR.error);
    const meta = cardR.data;
    if (!meta) {
      return Err(AppErr('NOT_FOUND', `Foydalanuvchi #${userId} uchun birlamchi karta topilmadi — kunlik ЦКП-hisobot kartaga bog'lanadi`));
    }

    // Har kunlik-hisobot = bitta chat-sessiya (karta + sana bo'yicha tartibli).
    const sessionId = `ckp-${meta.cardId}-${dto.factDate}`;

    // Xodim qiymatni qo'lda bersa — AI'siz ham tarkib to'liq.
    if (dto.manualActualValue != null) {
      // T8-12: faqat xodim navbati loglanadi (AI chaqirilmadi → assistant navbati YO'Q).
      await this.persistChat(meta, sessionId, dto.message, null);
      return Ok(this.buildResult(meta, dto.factDate, false, null, {
        actualValue: dto.manualActualValue,
        summary: dto.message.slice(0, 500),
        issues: [],
      }));
    }

    const aiResult = await this.aiRouter.call(this.buildRequest(meta, dto, userId));

    if (!isOk(aiResult)) {
      // FABRIKATSIYA YO'Q: AI-kalit yo'q yoki xato — soxta son qaytarilmaydi.
      this.logger.warn(`[A75] Kunlik hisobot: AI ishlamadi (user=${userId}, card=${meta.cardId}) — qo'lda qiymat so'raladi: ${aiResult.error}`);
      // T8-12: AI ishlamadi → faqat xodim navbati loglanadi (soxta assistant navbati YO'Q).
      await this.persistChat(meta, sessionId, dto.message, null);
      return Ok(this.buildResult(meta, dto.factDate, false, null, {
        actualValue: null,
        summary: dto.message.slice(0, 500),
        issues: [],
      }));
    }

    const extracted = this.parseAiResponse(aiResult.data.text, dto.message);
    // T8-12: AI ishladi → xodim navbati + AI xulosasi (haqiqiy javob) loglanadi.
    await this.persistChat(meta, sessionId, dto.message, aiResult.data.text);
    return Ok(this.buildResult(meta, dto.factDate, true, aiResult.data.provider, extracted));
  }

  /**
   * T8-12 — Kunlik AI-chat suhbatini `ai_ckp_chat_logs` ga BEST-EFFORT yozadi.
   * Hisobotni HECH QACHON bloklamaydi (log-yozish xatosi → ogohlantirish, davom).
   * aiText null bo'lsa (AI yo'q/qo'lda) — assistant navbati YOZILMAYDI (fabrikatsiya yo'q).
   */
  private async persistChat(
    meta: CardCkpMeta,
    sessionId: string,
    userMessage: string,
    aiText: string | null,
  ): Promise<void> {
    if (meta.employeeId == null) {
      // Chat-log employee_id NOT NULL kutadi; yo'q bo'lsa log o'tkazib yuboriladi.
      this.logger.debug(`[A75/T8-12] Chat-log o'tkazildi: card=${meta.cardId} uchun employee_id yo'q`);
      return;
    }
    const turns: CkpChatTurn[] = [{ role: 'user', content: userMessage }];
    if (aiText != null && aiText.trim().length > 0) {
      turns.push({ role: 'assistant', content: aiText });
    }
    const r = await this.repo.logChatTurns(meta.employeeId, sessionId, turns);
    if (!r.ok) {
      this.logger.warn(`[A75/T8-12] Chat-log yozilmadi (session=${sessionId}): ${r.error.message}`);
    }
  }

  private buildResult(
    meta: CardCkpMeta,
    factDate: string,
    aiAvailable: boolean,
    aiProvider: string | null,
    extracted: ExtractedFact,
  ): DailyReportResult {
    return {
      cardId: meta.cardId,
      cardName: meta.cardName,
      factDate,
      aiAvailable,
      aiProvider,
      extracted,
      needsManualValue: extracted.actualValue == null,
      ckpContext: {
        ckp: meta.ckp,
        targetValue: meta.tskpTarget,
        measurementUnit: meta.measurementUnit,
      },
      recordEndpoint: '/api/org-structure/ckp/fact',
    };
  }

  private buildRequest(meta: CardCkpMeta, dto: DailyReportSubmitDto, userId: number): AiRequest {
    const normaLine = meta.tskpTarget != null
      ? `Kunlik norma: ${meta.tskpTarget} ${meta.measurementUnit ?? ''}`.trim()
      : 'Kunlik norma: belgilanmagan';
    const prompt = [
      'Sen ishlab chiqarish ЦКП-yordamchisisan. Xodim kunlik hisobotini erkin matnda yozdi.',
      'Vazifang: matndan AYNAN bajarilgan miqdorni (son) va qisqa xulosani ajratib ol.',
      '',
      `Karta (lavozim): ${meta.cardName ?? '—'}`,
      `ЦКП (kutilgan natija): ${meta.ckp ?? '—'}`,
      `O'lchov birligi: ${meta.measurementUnit ?? '—'}`,
      normaLine,
      '',
      `Xodim matni: """${dto.message}"""`,
      '',
      'FAQAT QAT\'IY JSON qaytar (markdown emas), shakl:',
      '{"actualValue": <son yoki null agar matnda son yo\'q>, "summary": "<bir gap xulosa>", "issues": ["<brak/muammo>", ...]}',
      'Agar matnda aniq son bo\'lmasa actualValue=null qil — son TO\'QIMA QILMA.',
    ].join('\n');

    return {
      taskType: DAILY_REPORT_TASK_TYPE,
      prompt,
      systemPrompt: 'Sen aniq ЦКП-tahlil yordamchisisan. Faqat qat\'iy JSON chiqar. Son to\'qima qilma.',
      maxTokens: DAILY_REPORT_MAX_TOKENS,
      temperature: 0.2,
      userId,
      metadata: { feature: 'ai-daily-report', cardId: meta.cardId },
    } as AiRequest;
  }

  /** AI matnini himoyalangan tarzda parse qiladi; hech qachon throw qilmaydi. */
  private parseAiResponse(text: string, fallbackMessage: string): ExtractedFact {
    const fallback: ExtractedFact = {
      actualValue: null,
      summary: fallbackMessage.slice(0, 500),
      issues: [],
    };
    const json = this.extractJson(text);
    if (!json) return fallback;

    const actualValue = this.coerceNumber(json['actualValue'] ?? json['actual_value'] ?? json['value']);
    const summaryRaw = json['summary'] ?? json['xulosa'];
    const summary = typeof summaryRaw === 'string' && summaryRaw.trim().length > 0
      ? summaryRaw.slice(0, 500)
      : fallbackMessage.slice(0, 500);
    const issuesRaw = json['issues'] ?? json['muammolar'] ?? json['brak'];
    const issues = Array.isArray(issuesRaw)
      ? issuesRaw.filter((x): x is string => typeof x === 'string').slice(0, 20)
      : [];

    return { actualValue, summary, issues };
  }

  /** Shovqinli AI matnidan birinchi JSON obyektni ajratadi. */
  private extractJson(text: string): Record<string, unknown> | null {
    if (!text) return null;
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) return null;
    try {
      const parsed = JSON.parse(text.slice(start, end + 1));
      return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }

  private coerceNumber(val: unknown): number | null {
    if (typeof val === 'number' && Number.isFinite(val)) return val;
    if (typeof val === 'string') {
      const n = Number(val);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  }
}
