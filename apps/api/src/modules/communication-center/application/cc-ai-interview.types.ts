/**
 * @module cc-ai-interview.types
 * @description Type definitions and prompt builders extracted from cc-ai-interview.service.ts
 *   to keep the service file <300 lines (Rule 16).
 */

import type { Language } from '../domain/types';

export interface AiQuestion {
  key: string;
  qUz: string;
  qRu: string;
  required: boolean;
  type: 'text' | 'choice' | 'date' | 'number';
  choices?: string[];
}

export interface SessionRow {
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

export interface FinalizePromptInput {
  language:  Language;
  tmplNameUz: string;
  tmplCode:   string;
  senderName?:     string;
  senderPosition?: string;
  answers:   Record<string, unknown>;
}

export interface BuiltPrompts {
  systemPrompt: string;
  userPrompt:   string;
  answersList:  string;
}

const ORG_NAME = 'Europrint';

export function buildFinalizePrompts(input: FinalizePromptInput): BuiltPrompts {
  const langName = input.language === 'ru' ? 'rus tilida' : "o'zbek tilida";

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

  const answersList = Object.entries(input.answers)
    .map(([k, v]) => `- ${k}: ${JSON.stringify(v)}`)
    .join('\n');

  const userPrompt =
`Hujjat turi: ${input.tmplNameUz} (kod: ${input.tmplCode})
Tashkilot: ${ORG_NAME}
Xodim ismi: ${input.senderName ?? '(belgilanmagan)'}
Lavozimi:   ${input.senderPosition ?? '(belgilanmagan)'}

Xodimning javoblari:
${answersList}

Endi shu ma'lumotlar asosida ${input.tmplNameUz} hujjatini ${langName} yoz.
Birinchi qatorda "MAVZU: <qisqa mavzu>" formatida sarlavha bo'lsin.`;

  return { systemPrompt, userPrompt, answersList };
}

/** Sarlavhani matndan ajratib olish */
export function extractSubject(aiText: string, fallback: string): { subject: string; body: string } {
  const subjectMatch = aiText.match(/^MAVZU:\s*(.+?)$/im);
  const subject = subjectMatch?.[1]?.trim()?.slice(0, 500) || fallback;
  const body = aiText.replace(/^MAVZU:.+\n+/im, '').trim() || aiText;
  return { subject, body };
}
