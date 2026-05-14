/**
 * @module QuestionsPageTypes
 * @description Interfaces, types, and constants for the QuestionsPage. No JSX.
 */

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface Question {
  id: string | number;
  test_id?: string | number;
  testId?: string | number;
  question_text?: string;
  questionText?: string;
  text?: string;
  question_type?: string;
  questionType?: string;
  points?: number;
  options?: unknown[];
  correct_answer?: string | number;
  correctAnswer?: string | number;
  difficulty?: string;
  order?: number;
}

export type QuestionFormState = {
  test_id: string;
  question_text: string;
  question_type: string;
  points: string;
  difficulty: string;
};

// ─── Constants ───────────────────────────────────────────────────────────────

export const TYPE_LABELS: Record<string, string> = {
  multiple_choice: "Ko'p tanlov",
  true_false: "To'g'ri/Noto'g'ri",
  short_answer: "Qisqa javob",
  essay: "Insho",
  matching: "Moslashtirish",
};

export const DIFFICULTY_MAP: Record<string, { label: string; cls: string }> = {
  easy: { label: "Oson", cls: "text-[var(--ep-green)]" },
  medium: { label: "O'rtacha", cls: "text-[var(--ep-yellow)]" },
  hard: { label: "Qiyin", cls: "text-[var(--ep-red)]" },
};

export const QUERY_KEY = ["/api/questions"];

export const DEFAULT_FORM: QuestionFormState = {
  test_id: "",
  question_text: "",
  question_type: "multiple_choice",
  points: "1",
  difficulty: "medium",
};
