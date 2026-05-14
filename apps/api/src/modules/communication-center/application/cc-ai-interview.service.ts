/**
 * Communication Center — AI hujjat to'ldirish (Claude intervyu)
 *
 * Jarayon:
 *   1. start(templateId, language) → sessiya yaratiladi, birinchi savolni qaytaradi
 *   2. answer(sessionId, value)    → joriy javob saqlanadi, keyingi savolni qaytaradi
 *      → barcha savollar tugagach { isCompleted: true, draftReady: true }
 *   3. finalize(sessionId)         → Claude rasmiy hujjat matnini yaratadi va qoralama saqlaydi
 *
 * Test mode:
 *   shablonda test_mode=true bo'lsa, AI savolini chaqirmaymiz — sun'iy javoblar bilan
 *   intervyu o'tkaziladi va yakuniy hujjat ko'rinishi qaytariladi.
 */

import {
  Injectable, Logger, BadRequestException, ForbiddenException, NotFoundException, InternalServerErrorException,
} from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { isOk } from '@common/result';
import { AiRouterCallService } from '../../ai/application/services/ai-router-call.service';
import { CcDocumentsRepository } from '../infrastructure/repositories/cc-documents.repo';
import { CcDocumentNumberService } from './cc-document-number.service';
import type { Language } from '../domain/types';

interface AiQuestion {
  key: string;
  qUz: string;
  qRu: string;
  required: boolean;
  type: 'text' | 'choice' | 'date' | 'number';
  choices?: string[];
}

interface SessionRow {
  id:                 string;
  user_id:            number;
  template_id:        string;
  channel:            'web' | 'telegram';
  current_question_idx: number;
  answers:            Record<string, unknown>;
  language:           Language;
  is_completed:       boolean;
  draft_document_id:  string | null;
  expires_at:         string | null;
}

@Injectable()
export class CcAiInterviewService {
  private readonly logger = new Logger(CcAiInterviewService.name);

  constructor(
    private readonly ai:      AiRouterCallService,
    private readonly docs:    CcDocumentsRepository,
    private readonly numbers: CcDocumentNumberService,
  ) {}

  // ─────────────────────────────────────────────────────────────────────
  // START — sessiya yaratish, birinchi savol
  // ─────────────────────────────────────────────────────────────────────
  async start(args: {
    userId: number;
    templateId: string;
    language?: Language;
    channel?: 'web' | 'telegram';
  }): Promise<{ sessionId: string; question: AiQuestion | null; total: number }> {
    const tmplRes = await this.docs.getTemplate(args.templateId);
    if (!isOk(tmplRes) || !tmplRes.data) throw new NotFoundException('Hujjat shabloni topilmadi');
    if (!tmplRes.data.isActive) throw new BadRequestException('Bu shablon faol emas');

    // Mavjud tugatilmagan sessiya bo'lsa qayta foydalanish (faqat muddati o'tmagan)
    const existing = await runQuery<SessionRow>(sql`
      SELECT id::text, user_id, template_id::text, channel, current_question_idx,
             answers, language, is_completed, draft_document_id::text
      FROM cc_ai_sessions
      WHERE user_id = ${args.userId}
        AND template_id = ${args.templateId}
        AND is_completed = false
        AND expires_at > NOW()
      ORDER BY started_at DESC LIMIT 1
    `);

    let sessionId: string;
    let questionIdx: number;

    if (existing.rows[0]) {
      sessionId = existing.rows[0].id;
      questionIdx = existing.rows[0].current_question_idx;
    } else {
      const r = await runQuery<{ id: string }>(sql`
        INSERT INTO cc_ai_sessions
          (user_id, template_id, channel, current_question_idx, answers, language, expires_at)
        VALUES
          (${args.userId}, ${args.templateId}, ${args.channel ?? 'web'},
           0, '{}'::jsonb, ${args.language ?? 'uz'},
           NOW() + INTERVAL '2 hours')
        RETURNING id::text AS id
      `);
      sessionId = r.rows[0].id;
      questionIdx = 0;
    }

    const questions = await this.loadQuestions(args.templateId);
    const q = questions[questionIdx] ?? null;
    return { sessionId, question: q, total: questions.length };
  }

  // ─────────────────────────────────────────────────────────────────────
  // ANSWER — joriy savolga javob, keyingisini qaytar
  // ─────────────────────────────────────────────────────────────────────
  async answer(args: {
    sessionId: string;
    userId: number;
    value: unknown;
  }): Promise<{ question: AiQuestion | null; isCompleted: boolean; total: number; index: number }> {
    const sess = await this.getSession(args.sessionId, args.userId);
    if (sess.is_completed) throw new BadRequestException('Sessiya allaqachon yakunlangan');

    const questions = await this.loadQuestions(sess.template_id);
    const cur = questions[sess.current_question_idx];
    if (!cur) throw new InternalServerErrorException('Joriy savol topilmadi');

    // Validate required + type
    if (cur.required && (args.value === null || args.value === undefined || args.value === '')) {
      throw new BadRequestException(`"${cur.qUz}" maydon majburiy`);
    }
    if (cur.type === 'number' && args.value !== null && args.value !== '' && Number.isNaN(Number(args.value))) {
      throw new BadRequestException(`"${cur.qUz}" raqam bo'lishi kerak`);
    }
    if (cur.type === 'choice' && cur.choices && cur.choices.length > 0
        && !cur.choices.includes(String(args.value))) {
      throw new BadRequestException(`Tanlangan qiymat ruxsat etilgan ro'yxatda yo'q`);
    }

    // Save answer + advance index
    const newAnswers = { ...sess.answers, [cur.key]: args.value };
    const newIdx     = sess.current_question_idx + 1;
    const completed  = newIdx >= questions.length;

    await runQuery(sql`
      UPDATE cc_ai_sessions
      SET answers              = ${JSON.stringify(newAnswers)}::jsonb,
          current_question_idx = ${newIdx},
          is_completed         = ${completed},
          completed_at         = ${completed ? new Date() : null}
      WHERE id = ${args.sessionId}
    `);

    return {
      question:    completed ? null : questions[newIdx],
      isCompleted: completed,
      total:       questions.length,
      index:       newIdx,
    };
  }

  // ─────────────────────────────────────────────────────────────────────
  // FINALIZE — Claude orqali rasmiy hujjat matnini yaratish + draft saqlash
  // ─────────────────────────────────────────────────────────────────────
  async finalize(args: {
    sessionId: string;
    userId: number;
    senderName?: string;
    senderPosition?: string;
  }): Promise<{ sessionId: string; draftDocumentId: string; aiBody: string; subject: string }> {
    const sess = await this.getSession(args.sessionId, args.userId);
    if (!sess.is_completed) {
      throw new BadRequestException('Avval barcha savollarga javob bering');
    }
    if (sess.draft_document_id) {
      // Allaqachon yaratilgan — qaytaramiz
      const docRes = await this.docs.getById(sess.draft_document_id);
      if (isOk(docRes) && docRes.data) {
        return {
          sessionId:       sess.id,
          draftDocumentId: docRes.data.id,
          aiBody:          docRes.data.aiBody,
          subject:         docRes.data.subject,
        };
      }
    }

    const tmplRes = await this.docs.getTemplate(sess.template_id);
    if (!isOk(tmplRes) || !tmplRes.data) throw new NotFoundException('Shablon topilmadi');
    const tmpl = tmplRes.data;

    // ── Claude'ga so'rov ─────────────────────────────────────────────
    const language = sess.language;
    const langName = language === 'ru' ? 'rus tilida' : "o'zbek tilida";
    const orgName  = 'Europrint';

    const systemPrompt =
`Sen Europrint korxonasi ichki kommunikatsiya tizimining hujjat yordamchisi sen.
Vazifang — xodim bergan ma'lumotlar asosida rasmiy, professional uslubdagi
hujjat matnini yaratish. Matn ${langName} bo'lishi kerak.

Qoidalar:
- Faqat hujjat matnini ber, izoh yoki tushuntirish qo'shma.
- Sarlavha (mavzu) "MAVZU:" yorlig'i bilan birinchi qatorda bo'lsin.
- Bo'sh joylar va shablon yorliqlari yo'q (masalan {{ism}} kabi).
- Real ma'lumotlardan boshqa hech nima ixtiro qilma.
- 2-4 ta qisqa abzas bo'lsin, paragrafda 5 dan oshmagan jumla.`;

    const answersList = Object.entries(sess.answers)
      .map(([k, v]) => `- ${k}: ${JSON.stringify(v)}`)
      .join('\n');

    const userPrompt =
`Hujjat turi: ${tmpl.nameUz} (kod: ${tmpl.code})
Tashkilot: ${orgName}
Xodim ismi: ${args.senderName ?? '(belgilanmagan)'}
Lavozimi:   ${args.senderPosition ?? '(belgilanmagan)'}

Xodimning javoblari:
${answersList}

Endi shu ma'lumotlar asosida ${tmpl.nameUz} hujjatini ${langName} yoz.
Birinchi qatorda "MAVZU: <qisqa mavzu>" formatida sarlavha bo'lsin.`;

    let aiText: string;
    if (tmpl.numberFormat.includes('TEST') || (tmpl as { testMode?: boolean }).testMode) {
      // Test rejim
      aiText = `MAVZU: TEST — ${tmpl.nameUz}\n\n[Test rejimida AI chaqirilmadi]\n\nJavoblar:\n${answersList}`;
    } else {
      const r = await this.ai.callClaude({
        taskType:     'cc.generate_document',
        systemPrompt,
        prompt:       userPrompt,
        temperature:  0.4,
        maxTokens:    1500,
        userId:       args.userId,
        sessionId:    sess.id,
        metadata:     { templateCode: tmpl.code, language },
      });
      if (!isOk(r)) {
        throw new InternalServerErrorException(`Claude xatosi: ${r.error.message}`);
      }
      aiText = r.data.text.trim();
    }

    // Sarlavhani matndan ajratib olish
    const subjectMatch = aiText.match(/^MAVZU:\s*(.+?)$/im);
    const subject = subjectMatch?.[1]?.trim()?.slice(0, 500) || tmpl.nameUz;
    const body = aiText.replace(/^MAVZU:.+\n+/im, '').trim() || aiText;

    // ── Draft yaratamiz ─────────────────────────────────────────────
    const documentNumber = await this.numbers.generate(tmpl.id, tmpl.numberFormat);
    const draftRes = await this.docs.createDraft({
      templateId:      tmpl.id,
      templateVersion: tmpl.version,
      senderUserId:    args.userId,
      branchId:        null,
      subject,
      aiBody:          body,
      aiAnswers:       sess.answers,
      senderComment:   null,
      priority:        tmpl.defaultPriority,
      language,
      documentNumber,
    });
    if (!isOk(draftRes)) throw new InternalServerErrorException(draftRes.error.message);

    await runQuery(sql`
      UPDATE cc_ai_sessions
      SET draft_document_id = ${draftRes.data.id}, completed_at = NOW()
      WHERE id = ${sess.id}
    `);

    return {
      sessionId:       sess.id,
      draftDocumentId: draftRes.data.id,
      aiBody:          body,
      subject,
    };
  }

  // ─────────────────────────────────────────────────────────────────────
  // GET — joriy sessiya holati (Telegram va frontend uchun)
  // ─────────────────────────────────────────────────────────────────────
  async getSessionState(sessionId: string, userId: number) {
    const sess = await this.getSession(sessionId, userId);
    const questions = await this.loadQuestions(sess.template_id);
    return {
      sessionId: sess.id,
      templateId: sess.template_id,
      language: sess.language,
      index: sess.current_question_idx,
      total: questions.length,
      isCompleted: sess.is_completed,
      draftDocumentId: sess.draft_document_id,
      currentQuestion: questions[sess.current_question_idx] ?? null,
      answers: sess.answers,
    };
  }

  // ─────────────────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────────────────
  private async getSession(sessionId: string, userId: number): Promise<SessionRow> {
    const r = await runQuery<SessionRow>(sql`
      SELECT id::text, user_id, template_id::text, channel, current_question_idx,
             answers, language, is_completed, draft_document_id::text, expires_at
      FROM cc_ai_sessions WHERE id = ${sessionId} LIMIT 1
    `);
    const row = r.rows[0];
    if (!row) throw new NotFoundException('AI sessiyasi topilmadi');
    if (row.user_id !== userId) throw new ForbiddenException('Sizning sessiyangiz emas');
    if (row.expires_at && new Date(row.expires_at) < new Date()) {
      throw new BadRequestException('Sessiya muddati tugagan');
    }
    return row;
  }

  private async loadQuestions(templateId: string): Promise<AiQuestion[]> {
    const r = await runQuery<{ ai_questions: AiQuestion[] }>(sql`
      SELECT ai_questions FROM cc_document_templates WHERE id = ${templateId} LIMIT 1
    `);
    return Array.isArray(r.rows[0]?.ai_questions) ? r.rows[0].ai_questions : [];
  }
}
