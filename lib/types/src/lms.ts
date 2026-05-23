/**
 * @module @workspace/types/lms
 * @description Canonical LMS types — Course, Lesson, Certificate.
 */

export interface Course {
  id: number | string;
  title: string;
  title_ru?: string | null;
  description?: string | null;
  description_ru?: string | null;
  category_id?: number | string | null;
  duration_hours?: number | null;
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | string;
  is_published?: boolean;
  thumbnail_url?: string | null;
  created_by?: number | string | null;
  created_at?: string | Date | null;
  updated_at?: string | Date | null;
}

export interface Lesson {
  id: number | string;
  course_id: number | string;
  title: string;
  content?: string | null;
  video_url?: string | null;
  duration_minutes?: number | null;
  order_index?: number | null;
  is_published?: boolean;
}

export interface Certificate {
  id: number | string;
  user_id: number | string;
  course_id?: number | string | null;
  certificate_number?: string | null;
  issued_date?: string | Date | null;
  expires_date?: string | Date | null;
  status?: 'active' | 'expired' | 'revoked' | string;
}
