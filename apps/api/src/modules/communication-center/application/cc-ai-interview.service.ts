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

/**
 * NOTE: Raw SQL retained intentionally — Drizzle ORM query builder cannot
 *   express: `NOW() + INTERVAL '2 hours'` server-side timestamp expression for
 *   session expiry, `::jsonb` cast on JSON.stringify answers payload, multiple
 *   `::text` UUID column casts in SELECT projections, `RETURNING id::text`,
 *   and target tables (cc_ai_sessions, cc_document_templates) are not present
 *   in the Drizzle schema barrel.
 *   See ARCHITECTURE_RULES.md Rule 4: complex SQL is permitted with documentation.
 */

import {
  Injectable, Logger, BadRequestException, ForbiddenException, NotFoundException, InternalServerErrorException,
} from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { isOk } from '@common/result';
import { AiRouterCallService } from '../../ai/application/services/ai-router-call.service';
import { CcDocumentsRepository } from '../infrastructure/repositories/cc-documents.repo';
import type { TemplateRow } from '../infrastructure/repositories/cc-documents/types';
import { CcDocumentNumberService } from './cc-document-number.service';
import type { Language } from '../domain/types';
import { AiQuestion, SessionRow, buildFinalizePrompts, extractSubject } from './cc-ai-interview.types';

// Re-export the public types so existing imports keep working
export { AiQuestion } from './cc-ai-interview.types';

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

    const existing = await this.findExistingSession(args.userId, args.templateId);
    const { sessionId, questionIdx } = existing
      ? { sessionId: existing.id, questionIdx: existing.current_question_idx }
      : await this.createNewSession(args);

    const questions = await this.loadQuestions(args.templateId);
    const q = questions[questionIdx] ?? null;
    return { sessionId, question: q, total: questions.length };
  }

  private async findExistingSession(userId: number, templateId: string): Promise<SessionRow | undefined> {
    const existing = await runQuery<SessionRow>(sql`
      SELECT id::text, user_id, template_id::text, channel, current_question_idx,
             answers, language, is_completed, draft_document_id::text
      FROM cc_ai_sessions
      WHERE user_id = ${userId}
        AND template_id = ${templateId}
        AND is_completed = false
        AND expires_at > NOW()
      ORDER BY started_at DESC LIMIT 1
    `);
    return existing.rows[0];
  }

  private async createNewSession(args: {
    userId: number; templateId: string; language?: Language; channel?: 'web' | 'telegram';
  }): Promise<{ sessionId: string; questionIdx: number }> {
    const r = await runQuery<{ id: string }>(sql`
      INSERT INTO cc_ai_sessions
        (user_id, template_id, channel, current_question_idx, answers, language, expires_at)
      VALUES
        (${args.userId}, ${args.templateId}, ${args.channel ?? 'web'},
         0, '{}'::jsonb, ${args.language ?? 'uz'},
         NOW() + INTERVAL '2 hours')
      RETURNING id::text AS id
    `);
    const row = r.rows[0];
    if (!row) throw new InternalServerErrorException('Sessiya yaratilmadi');
    return { sessionId: row.id, questionIdx: 0 };
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

    this.validateAnswer(cur, args.value);

    const newAnswers = { ...sess.answers, [cur.key]: args.value };
    const newIdx     = sess.current_question_idx + 1;
    const completed  = newIdx >= questions.length;

    await this.persistAnswer(args.sessionId, newAnswers, newIdx, completed);

    return {
      question:    completed ? null : questions[newIdx],
      isCompleted: completed,
      total:       questions.length,
      index:       newIdx,
    };
  }

  private validateAnswer(cur: AiQuestion, value: unknown): void {
    if (cur.required && (value === null || value === undefined || value === '')) {
      throw new BadRequestException(`"${cur.qUz}" maydon majburiy`);
    }
    if (cur.type === 'number' && value !== null && value !== '' && Number.isNaN(Number(value))) {
      throw new BadRequestException(`"${cur.qUz}" raqam bo'lishi kerak`);
    }
    if (cur.type === 'choice' && cur.choices && cur.choices.length > 0
        && !cur.choices.includes(String(value))) {
      throw new BadRequestException(`Tanlangan qiymat ruxsat etilgan ro'yxatda yo'q`);
    }
  }

  private async persistAnswer(
    sessionId: string,
    newAnswers: Record<string, unknown>,
    newIdx: number,
    completed: boolean,
  ): Promise<void> {
    await runQuery(sql`
      UPDATE cc_ai_sessions
      SET answers              = ${JSON.stringify(newAnswers)}::jsonb,
          current_question_idx = ${newIdx},
          is_completed         = ${completed},
          completed_at         = ${completed ? new Date() : null}
      WHERE id = ${sessionId}
    `);
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
    if (!sess.is_completed) throw new BadRequestException('Avval barcha savollarga javob bering');

    const cached = await this.findCachedDraft(sess);
    if (cached) return cached;

    const tmplRes = await this.docs.getTemplate(sess.template_id);
    if (!isOk(tmplRes) || !tmplRes.data) throw new NotFoundException('Shablon topilmadi');
    const tmpl = tmplRes.data;

    const aiText = await this.generateAiText(sess, tmpl, args);
    const { subject, body } = extractSubject(aiText, tmpl.nameUz);

    const draftId = await this.persistDraft(sess, tmpl, subject, body);
    return { sessionId: sess.id, draftDocumentId: draftId, aiBody: body, subject };
  }

  private async findCachedDraft(sess: SessionRow): Promise<{
    sessionId: string; draftDocumentId: string; aiBody: string; subject: string;
  } | null> {
    if (!sess.draft_document_id) return null;
    const docRes = await this.docs.getById(sess.draft_document_id);
    if (!isOk(docRes) || !docRes.data) return null;
    return {
      sessionId:       sess.id,
      draftDocumentId: docRes.data.id,
      aiBody:          docRes.data.aiBody,
      subject:         docRes.data.subject,
    };
  }

  private async generateAiText(
    sess: SessionRow,
    tmpl: TemplateRow,
    args: { userId: number; senderName?: string; senderPosition?: string },
  ): Promise<string> {
    const language = sess.language;
    const { systemPrompt, userPrompt, answersList } = buildFinalizePrompts({
      language,
      tmplNameUz:     tmpl.nameUz,
      tmplCode:       tmpl.code,
      senderName:     args.senderName,
      senderPosition: args.senderPosition,
      answers:        sess.answers,
    });

    if (tmpl.numberFormat.includes('TEST') || (tmpl as { testMode?: boolean }).testMode) {
      return `MAVZU: TEST — ${tmpl.nameUz}\n\n[Test rejimida AI chaqirilmadi]\n\nJavoblar:\n${answersList}`;
    }
    const r = await this.ai.callClaude({
      taskType:    'cc.generate_document',
      systemPrompt, prompt: userPrompt,
      temperature: 0.4, maxTokens: 1500,
      userId:      args.userId, sessionId: sess.id,
      metadata:    { templateCode: tmpl.code, language },
    });
    if (!isOk(r)) throw new InternalServerErrorException(`Claude xatosi: ${r.error.message}`);
    return r.data.text.trim();
  }

  private async persistDraft(
    sess: SessionRow,
    tmpl: TemplateRow,
    subject: string,
    body: string,
  ): Promise<string> {
    const documentNumber = await this.numbers.generate(tmpl.id, tmpl.numberFormat);
    const draftRes = await this.docs.createDraft({
      templateId:      tmpl.id,
      templateVersion: tmpl.version,
      senderUserId:    sess.user_id,
      branchId:        null,
      subject,
      aiBody:          body,
      aiAnswers:       sess.answers,
      senderComment:   null,
      priority:        tmpl.defaultPriority,
      language:        sess.language,
      documentNumber,
    });
    if (!isOk(draftRes)) throw new InternalServerErrorException(draftRes.error.message);

    await runQuery(sql`
      UPDATE cc_ai_sessions
      SET draft_document_id = ${draftRes.data.id}, completed_at = NOW()
      WHERE id = ${sess.id}
    `);
    return draftRes.data.id;
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
