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
import { AiDailyReportRepository, type PrimaryCardCkpMeta, type CkpChatTurn, type MachinelessCkpCard } from '../../infrastructure/repositories/ai-daily-report.repository';
import { CkpFactService } from '../../../org-structure/ckp-fact.service';

// Kunlik ЦКП-hisoboti = xodim ish-natijasi tahlili → mavjud
// 'hr.performance_review' task-turidan o'tkaziladi (analiz-sinfi). Yangi
// AiTaskType qo'shilmaydi (additiv, mavjud yo'nalish).
const DAILY_REPORT_TASK_TYPE: AiTaskType = 'hr.performance_review';
const DAILY_REPORT_MAX_TOKENS = 500;

/**
 * T18-C2 — AI-answer bilan yozilgan ЦКП-fakt `source` tegi. CkpController
 * FactSchema.source enum'idagi 'AI_CHAT' bilan AYNAN bir xil (magic-string emas,
 * Qoida 12) — shu manba AI-chatdan kelgan kunlik hisobotni belgilaydi.
 */
const CKP_AI_CHAT_SOURCE = 'AI_CHAT';

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

/**
 * T18-C2 — AI-answer (bir-qadam) natijasi. `submit` ajratadi-yu yozmaydi; bu yo'l
 * AI/qo'lda topilgan qiymat BOR bo'lsa kanonik `CkpFactService.recordFact` orqali
 * ЦКП-faktni source='AI_CHAT' bilan DARHOL yozadi (FE qayta-POST shart emas).
 */
export interface DailyReportAnswerResult extends DailyReportResult {
  /** ЦКП-fakt yozildimi (true = ckp_fact_values ga source=AI_CHAT yozildi). */
  recorded: boolean;
  /** Yozilgan fakt (CkpFactService qaytargan qator) yoki null (qiymat yo'q → yozilmadi). */
  fact: Record<string, unknown> | null;
}

/** T12-08 — kunlik AI-savol cron yakuni (telemetriya/log uchun). */
export interface DailyQuestionPushResult {
  factDate: string;
  /** Mashinasiz, savol kutayotgan kartalar soni. */
  candidates: number;
  /** ai_ckp_chat_logs'ga yozilgan savol (assistant navbati) soni. */
  questionsLogged: number;
  /** AI-kalit bor edimi (false → statik savol ishlatildi, fabrikatsiya YO'Q). */
  aiAvailable: boolean;
}

@Injectable()
export class AiDailyReportService {
  private readonly logger = new Logger(AiDailyReportService.name);

  constructor(
    private readonly aiRouter: AiRouterService,
    private readonly repo: AiDailyReportRepository,
    // T18-C2 — kanonik ЦКП-fakt yozish (formula + deadline + VERTIKAL kaskad).
    // Bu servis faktni O'ZI yozmaydi (modul chegarasi); CkpFactService orqali yozadi.
    private readonly ckpFact: CkpFactService,
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
   * ⭐ T18-C2 — AI-ANSWER (bir-qadam): xodimning kunlik ЦКП-hisobotini chatdan
   * qabul qiladi, AI tarkibiy faktni ajratadi VA qiymat BOR bo'lsa kanonik
   * `CkpFactService.recordFact` orqali ЦКП-faktni source='AI_CHAT' bilan DARHOL
   * yozadi. Bu `submit`'dan farqi: submit faqat ajratadi (FE qayta-POST qiladi);
   * bu yo'l golden-thread'ni bir chaqiruvda yopadi → ckp_fact_values + cascade.
   *
   * FABRIKATSIYA YO'Q (Q-40): AI-kalit yo'q/aniq son topilmasa (extracted.actualValue
   * == null) — fakt YOZILMAYDI (recorded=false, needsManualValue=true). Soxta son
   * hech qachon yozilmaydi; xodim qo'lda qiymat berib qayta yuboradi (manualActualValue).
   * recordFact ichida formula (achievement%) + deadline + VERTIKAL kaskad ishlaydi.
   */
  async submitAndRecord(userId: number, dto: DailyReportSubmitDto): Promise<Result<DailyReportAnswerResult>> {
    const baseR = await this.submit(userId, dto);
    if (!baseR.ok) return Err(baseR.error);
    const base = baseR.data;

    // Qiymat yo'q (AI-kalit yo'q / aniq son topilmadi) → fakt yozilmaydi (fabrikatsiya yo'q).
    if (base.extracted.actualValue == null) {
      return Ok({ ...base, recorded: false, fact: null });
    }

    // Kartani egallagan xodim (audit izi) — meta.employeeId orqali (chat-log kaliti bilan bir xil).
    const cardR = await this.repo.resolvePrimaryCard(userId);
    const employeeId = cardR.ok && cardR.data ? cardR.data.employeeId : null;

    const recR = await this.ckpFact.recordFact({
      cardId: base.cardId,
      employeeId,
      productId: null,
      factDate: base.factDate,
      actualValue: base.extracted.actualValue,
      source: CKP_AI_CHAT_SOURCE,
      notes: base.extracted.summary,
      recordedBy: userId,
    });
    if (!recR.ok) {
      // Fakt yozilmadi (DB xato) — ajratilgan tarkibni baribir qaytaramiz (recorded=false).
      this.logger.warn(`[T18-C2] AI-answer fakt yozilmadi (user=${userId}, card=${base.cardId}): ${recR.error.message}`);
      return Ok({ ...base, recorded: false, fact: null });
    }
    return Ok({ ...base, recorded: true, fact: recR.data });
  }

  /**
   * T12-08 — Kunlik AI-savol cron DVIGATELI: o'sha kun (factDate) hali savol
   * yo'llanmagan, mashinasiz xodimga biriktirilgan ЦКП-kartalarga "Bugun qancha
   * bajardingiz?" degan ЦКП-savolni yo'llaydi va `ai_ckp_chat_logs`'ga 'assistant'
   * navbati sifatida yozadi. Xodim keyin shu sessiyada javob beradi (submit()).
   *
   * GRACEFUL (Q-40): AI-kalit yo'q bo'lsa — SOXTA fakt EMAS, faqat STATIK ЦКП-savol
   * ishlatiladi (savol matni fabrikatsiya emas; hech qanday actualValue to'qilmaydi).
   * Shu sababli AI-kalit yo'q bo'lsa ham cron skip QILMAYDI — savol baribir yo'llanadi.
   *
   * Idempotent: repository o'sha kun session_id'i bor kartalarni chiqarib tashlaydi.
   */
  async runDailyQuestionPush(factDate: string): Promise<Result<DailyQuestionPushResult>> {
    const cardsR = await this.repo.findMachinelessCardsNeedingQuestion(factDate);
    if (!cardsR.ok) return Err(cardsR.error);
    const cards = Array.isArray(cardsR.data) ? cardsR.data : [];

    let questionsLogged = 0;
    let aiAvailable = false;

    for (const card of cards) {
      const gen = await this.generateQuestion(card);
      if (gen.aiUsed) aiAvailable = true;
      const sessionId = `ckp-${card.cardId}-${factDate}`;
      // Savol = 'assistant' navbati (AI/bot xodimga savol berdi). Fakt EMAS.
      const r = await this.repo.logChatTurns(card.employeeId, sessionId, [
        { role: 'assistant', content: gen.question },
      ]);
      if (r.ok && r.data > 0) {
        questionsLogged += 1;
      } else if (!r.ok) {
        this.logger.warn(`[T12-08] ЦКП-savol yozilmadi (card=${card.cardId}): ${r.error.message}`);
      }
    }

    return Ok({ factDate, candidates: cards.length, questionsLogged, aiAvailable });
  }

  /**
   * Bitta karta uchun ЦКП-savol matnini tayyorlaydi. AI-kalit bor bo'lsa AI
   * tabiiy/kontekstli savol yozadi; yo'q (yoki xato) bo'lsa — statik shablon savol.
   * Savol matni — FAKT EMAS, hech qanday son to'qilmaydi (Q-40).
   */
  private async generateQuestion(card: MachinelessCkpCard): Promise<{ question: string; aiUsed: boolean }> {
    const fallback = this.staticQuestion(card);
    const aiResult = await this.aiRouter.call(this.buildQuestionRequest(card));
    if (!isOk(aiResult)) {
      // AI yo'q/xato → statik savol (graceful, fabrikatsiya yo'q).
      return { question: fallback, aiUsed: false };
    }
    const text = (aiResult.data.text ?? '').trim();
    return { question: text.length > 0 ? text.slice(0, 1000) : fallback, aiUsed: true };
  }

  /** AI yo'q bo'lganda ishlatiladigan statik ЦКП-savol (kontekstli, lekin son-to'qima yo'q). */
  private staticQuestion(card: MachinelessCkpCard): string {
    const ckpLine = card.ckp ? ` ЦКП: "${card.ckp}".` : '';
    const normaLine = card.tskpTarget != null
      ? ` Kunlik norma: ${card.tskpTarget} ${card.measurementUnit ?? ''}`.trimEnd() + '.'
      : '';
    return `Assalomu alaykum! Bugungi ish natijangizni yozing.${ckpLine}${normaLine} ` +
      'Bugun qancha bajardingiz va qanday muammolar (brak/kechikish) bo\'ldi?';
  }

  private buildQuestionRequest(card: MachinelessCkpCard): AiRequest {
    const normaLine = card.tskpTarget != null
      ? `Kunlik norma: ${card.tskpTarget} ${card.measurementUnit ?? ''}`.trim()
      : 'Kunlik norma: belgilanmagan';
    const prompt = [
      'Sen ishlab chiqarish ЦКП-yordamchisisan. Mashinasiz (qo\'l mehnati) xodimdan',
      'kunlik natijasini so\'rab, qisqa, samimiy SAVOL yoz (1-2 gap, o\'zbekcha).',
      'Savol bugun qancha bajardi va qanday muammo (brak/kechikish) bo\'lganini so\'rasin.',
      'Son TO\'QIMA QILMA — faqat savol matnini qaytar (markdown yo\'q).',
      '',
      `Karta (lavozim): ${card.cardName ?? '—'}`,
      `ЦКП (kutilgan natija): ${card.ckp ?? '—'}`,
      `O'lchov birligi: ${card.measurementUnit ?? '—'}`,
      normaLine,
    ].join('\n');

    return {
      taskType: DAILY_REPORT_TASK_TYPE,
      prompt,
      systemPrompt: 'Sen samimiy ЦКП-yordamchisan. Faqat qisqa savol matnini chiqar. Son to\'qima qilma.',
      maxTokens: 200,
      temperature: 0.4,
      metadata: { feature: 'ai-daily-report-question', cardId: card.cardId },
    } as AiRequest;
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
