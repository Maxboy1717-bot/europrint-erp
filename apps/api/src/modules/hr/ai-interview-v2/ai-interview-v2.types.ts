/**
 * @module ai-interview-v2.types
 * @description Type-only exports (interfaces, type aliases, enums). No runtime code.
 */

export interface InterviewQuestion {
  id: string | number;
  question: string;
  max_score?: number;
  [key: string]: unknown;
}

export interface ScoredAnswer {
  question: string;
  answer: string;
  score: number;
}

export interface SessionData {
  sessionId: number;
  candidateName: string;
  candidateLanguage: string;
  jobTitle?: string;
  status: string;
  questionCount: number;
  answeredCount: number;
  answers: ScoredAnswer[];
  cameraRejections: number;
}
