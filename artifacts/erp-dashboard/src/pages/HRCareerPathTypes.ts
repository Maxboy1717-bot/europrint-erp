/**
 * @module HRCareerPathTypes
 * @description Types for HRCareerPath page.
 */

export interface CareerPlan {
  id: string;
  employee_name?: string;
  target_position_title?: string;
  current_position_title?: string;
  status?: string;
  target_date?: string;
  progress_percent?: number;
  mentor_name?: string;
  notes?: string;
}
