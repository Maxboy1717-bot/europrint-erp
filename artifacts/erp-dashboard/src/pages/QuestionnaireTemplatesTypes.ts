/**
 * @module QuestionnaireTemplatesTypes
 * @description Shared TypeScript interfaces, Zod validation schemas, form type
 * aliases, and the TEMPLATE_PRESETS constant for the QuestionnaireTemplates
 * feature. No JSX — safe to import from both .ts and .tsx files.
 */

import { z } from "zod";
import type { QuestionnaireTemplate } from "@shared/schema";

// ---------------------------------------------------------------------------
// Domain interfaces
// ---------------------------------------------------------------------------

export interface Position {
  id: string;
  name: string;
}

export interface TemplateWithPosition extends QuestionnaireTemplate {
  positionName?: string;
}

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

export const templateSchema = z.object({
  name: z.string().min(1, "Nomi majburiy"),
  nameRu: z.string().min(1, "Nomi (RU) majburiy"),
  description: z.string().optional(),
  descriptionRu: z.string().optional(),
  positionId: z.string().optional(),
});

export const questionSchema = z.object({
  question: z.string().min(1, "Savol majburiy"),
  questionRu: z.string().min(1, "Savol (RU) majburiy"),
  questionType: z.string().min(1, "Tur majburiy"),
  order: z.number().min(1, "Tartib raqami majburiy"),
  isRequired: z.boolean().default(true),
});

// ---------------------------------------------------------------------------
// Derived form types
// ---------------------------------------------------------------------------

export type TemplateFormData = z.infer<typeof templateSchema>;
export type QuestionFormData = z.infer<typeof questionSchema>;

// ---------------------------------------------------------------------------
// Preset templates (Tayyor shablonlar)
// ---------------------------------------------------------------------------

export interface PresetQuestion {
  question: string;
  questionRu: string;
  order: number;
  questionType: string;
  isRequired: boolean;
}

export interface Preset {
  name: string;
  nameRu: string;
  description: string;
  descriptionRu: string;
  questions: PresetQuestion[];
}

export const TEMPLATE_PRESETS: Record<string, Preset> = {
  reception: {
    name: "Qabulxona xodimi anketasi",
    nameRu: "Анкета сотрудника reception",
    description: "Mehmonlarni qabul qilish, telefon qo'ng'iroqlari, vaziyatlarni hal qilish",
    descriptionRu: "Прием гостей, телефонные звонки, решение ситуаций",
    questions: [
      { question: "Ismingiz va familiyangiz?", questionRu: "Ваше имя и фамилия?", order: 1, questionType: "text", isRequired: true },
      { question: "Telefon raqamingiz?", questionRu: "Ваш номер телефона?", order: 2, questionType: "text", isRequired: true },
      { question: "Tajribangiz necha yil?", questionRu: "Сколько лет опыта?", order: 3, questionType: "text", isRequired: true },
      { question: "Ingliz tilini bilas izmi?", questionRu: "Знаете ли вы английский?", order: 4, questionType: "yes_no", isRequired: true },
      { question: "Kompyuter dasturlarida qanday tajribangiz bor?", questionRu: "Какой у вас опыт работы с компьютерными программами?", order: 5, questionType: "text", isRequired: false },
    ],
  },
  marketing: {
    name: "Marketing xodimi anketasi",
    nameRu: "Анкета сотрудника маркетинга",
    description: "SMM, content yaratish, kampaniya boshqarish",
    descriptionRu: "SMM, создание контента, управление кампаниями",
    questions: [
      { question: "Ismingiz va familiyangiz?", questionRu: "Ваше имя и фамилия?", order: 1, questionType: "text", isRequired: true },
      { question: "Telefon raqamingiz?", questionRu: "Ваш номер телефона?", order: 2, questionType: "text", isRequired: true },
      { question: "Marketing sohasida tajribangiz?", questionRu: "Опыт в маркетинге?", order: 3, questionType: "text", isRequired: true },
      { question: "Qaysi ijtimoiy tarmoqlarda ishlagan sizmi?", questionRu: "С какими соц. сетями работали?", order: 4, questionType: "text", isRequired: true },
      { question: "Grafik dizayn dasturlarini bilas izmi?", questionRu: "Знаете ли графические программы?", order: 5, questionType: "yes_no", isRequired: false },
    ],
  },
  developer: {
    name: "Dasturchi anketasi",
    nameRu: "Анкета программиста",
    description: "Texnik ko'nikmalar, tajriba, loyihalar",
    descriptionRu: "Технические навыки, опыт, проекты",
    questions: [
      { question: "Ismingiz va familiyangiz?", questionRu: "Ваше имя и фамилия?", order: 1, questionType: "text", isRequired: true },
      { question: "Telefon raqamingiz?", questionRu: "Ваш номер телефона?", order: 2, questionType: "text", isRequired: true },
      { question: "Qaysi dasturlash tillarini bilasiz?", questionRu: "Какие языки программирования знаете?", order: 3, questionType: "text", isRequired: true },
      { question: "Ishlagan loyihalaringiz (GitHub)?", questionRu: "Ваши проекты (GitHub)?", order: 4, questionType: "text", isRequired: false },
      { question: "Jamoada ishlash tajribangiz?", questionRu: "Опыт работы в команде?", order: 5, questionType: "text", isRequired: true },
    ],
  },
  sales: {
    name: "Sotuvchi anketasi",
    nameRu: "Анкета продавца",
    description: "Mijozlar bilan ishlash, mahsulot bilimi, sotish tajribasi",
    descriptionRu: "Работа с клиентами, знание продукта, опыт продаж",
    questions: [
      { question: "Ismingiz va familiyangiz?", questionRu: "Ваше имя и фамилия?", order: 1, questionType: "text", isRequired: true },
      { question: "Telefon raqamingiz?", questionRu: "Ваш номер телефона?", order: 2, questionType: "text", isRequired: true },
      { question: "Sotish tajribangiz?", questionRu: "Опыт продаж?", order: 3, questionType: "text", isRequired: true },
      { question: "Kunlik/oylik maqsadlarga erishgans izmi?", questionRu: "Достигали ли ежедневных/месячных целей?", order: 4, questionType: "yes_no", isRequired: true },
      { question: "CRM dasturlari bilan ishlagans izmi?", questionRu: "Работали ли с CRM системами?", order: 5, questionType: "yes_no", isRequired: false },
    ],
  },
};
