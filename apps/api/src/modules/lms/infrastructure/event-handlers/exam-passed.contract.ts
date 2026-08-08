/**
 * @module lms/exam-passed.contract
 * @description Gap #2 (T20-A1) — IMTIHON→RAZRYAD AVTO-ZANJIR event shartnomasi.
 *   Imtihon O'TGANDA (lms_exam_attempts.passed = true) LmsExamsService.submitExam shu
 *   eventni emit qiladi; org-structure ExamPassedRazryadHandler (@OnEvent) uni qabul qilib
 *   kartaning navbatdagi razryadiga RazryadHistoryService.createRequest (ai_suggested=true)
 *   avto-chaqiradi. Literal + payload shu yerda e'lon qilinadi — emitter va listener bir
 *   manbadan import qiladi (cross-cutting constants fayl tahrirsiz, A72 naqshi).
 */

/** Canonical EventEmitter2 topic published when an exam attempt is graded as passed. */
export const EXAM_PASSED_EVENT = 'lms.exam.passed' as const;

/** Payload contract for {@link EXAM_PASSED_EVENT}. */
export interface ExamPassedPayload {
  /** lms_exams.id — exam that was passed (→ courses.card_id resolves the card). */
  examId: number;
  /** users.id of the test-taker (→ employees → current card). */
  userId: number;
  /** lms_exam_attempts.id (audit/idempotency). */
  attemptId: number;
  /** achieved score 0..100 (passed to razryad request as exam_score). */
  score: number;
  /** ISO timestamp of the pass (audit/log only). */
  passedAt?: string;
}
