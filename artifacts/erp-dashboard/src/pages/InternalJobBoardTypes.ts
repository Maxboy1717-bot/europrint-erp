/**
 * @module InternalJobBoardTypes
 * @description Types for InternalJobBoard.
 */

export interface InternalVacancy {
  id: number;
  title: string;
  description?: string;
  requirements?: string;
  salary_min?: number;
  salary_max?: number;
  vacancy_type: string;
  deadline_working_days?: number;
  created_at: string;
  is_urgent?: boolean;
  department_name?: string;
  applicant_count?: number;
  portret?: Record<string, unknown> | null;
}
