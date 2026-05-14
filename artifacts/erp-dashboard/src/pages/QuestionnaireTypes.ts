/**
 * @module QuestionnaireTypes
 * @description TypeScript interfaces, types, and constants for the Questionnaire page.
 */

export type QuestionnaireQuestion = {
  id: string;
  question: string;
  questionRu: string;
  order: number;
  isActive: boolean;
  createdAt: string;
};

export type QuestionnaireResponse = {
  id: string;
  fullName: string;
  phone: string;
  telegramChatId: string;
  lang: string;
  responses: Array<{ questionId: string; question: string; answer: string }>;
  status: "pending" | "approved" | "rejected" | "hired" | "not_hired" | "interviewed" | "in_review";
  reviewedAt: string | null;
  createdAt: string;
};

export type NewQuestion = {
  question: string;
  questionRu: string;
  order: number;
  isActive: boolean;
};

export const DEFAULT_NEW_QUESTION: NewQuestion = {
  question: "",
  questionRu: "",
  order: 1,
  isActive: true,
};
