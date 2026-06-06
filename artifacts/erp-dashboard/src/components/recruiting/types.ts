/**
 * @module types
 * @description React UI component.
 */

export type FunnelStage =
  | "NEW" | "QUESTIONNAIRE_SENT" | "PHONE_SCREENING" | "INTERVIEW_SCHEDULED"
  | "INTERVIEWED" | "TEST_SENT" | "REFERENCES" | "OFFER_SENT"
  | "HIRED" | "PROBATION" | "SINOV_COMPLETE" | "REJECTED";

export interface PipelineEntry {
  id: number;
  funnel_stage: FunnelStage;
  vacancy_id: number | null;
  candidate_id: number;
  candidate_name: string;
  candidate_phone: string;
  candidate_email?: string | null;
  candidate_source?: string | null;
  vacancy_title?: string | null;
  vacancy_type?: string | null;
  deadline_working_days?: number | null;
  days_remaining?: number | null;
  deadline_percent?: number | null;
  days_in_stage?: number | null;
  recruiter_name?: string | null;
  created_at: string;
  tool_test_score?: number | null;
  tool_test_results?: Record<string, number> | null;
  recommendation?: "qabul" | "kutish" | "rad" | "hech_qachon" | null;
  screening_score?: number | null;
  worker_type?: string | null;
  probation_started_at?: string | null;
  probation_start_date?: string | null;
  probation_end_date?: string | null;
}

export interface Vacancy {
  id: number;
  title: string;
  status: string;
  department_name?: string;
  vacancy_type?: string;
  candidate_count?: number;
  deadline_working_days?: number;
  is_urgent?: boolean;
  channels?: Record<string, { active: boolean; views?: number; applications?: number }> | null;
  portret?: {
    main_purpose?: string;
    problem_solved?: string;
    reports_to?: string;
    age_min?: number;
    age_max?: number;
    main_duties?: string;
    expected_result?: string;
    salary_min?: number | null;
    salary_max?: number | null;
    danger_candidate?: string;
    probation_months?: number;
    candidate_presentation?: {
      sinov_maosh_min?: number;
      sinov_maosh_max?: number;
      kompaniya_taqdimoti?: string;
      ish_tartibi?: string;
      instrumentlar?: string;
      guruh_javob?: string;
      xizmat_safari?: string;
      sinov_muddat?: string;
      asosiy_maosh?: string;
      martaba?: string;
      tatil_kun?: string;
      ish_rejimi?: string;
      shartnoma_tur?: string;
      sotsial_paket?: string;
      oqutish?: string;
      jalb_qiluvchi?: string;
    } | null;
    [key: string]: unknown;
  } | null;
  tool_test_requirements?: { traits: Record<string, number>; iq_min?: number } | null;
}

export interface CreateVacancyResponse {
  data: { id: number; title: string; [key: string]: unknown };
}

export interface AIInterviewSession {
  id: number;
  token: string;
  candidate_name: string | null;
  candidate_language: string;
  pipeline_entry_id: number | null;
  status: string;
  expires_at: string;
  created_at: string;
  communication_score: number | null;
  confidence_score: number | null;
  problem_solving_score: number | null;
  body_language_score: number | null;
  emotional_state_score: number | null;
  professional_appearance_score: number | null;
  overall_score: number | null;
  recommendation: string | null;
  ai_summary: string | null;
  transcript: string | null;
  recruiter_notes: string | null;
}
