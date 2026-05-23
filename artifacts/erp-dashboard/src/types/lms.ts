/**
 * @module types/lms
 * @description Canonical shared interfaces for the LMS (Learning Management System) domain.
 *
 * Merges 7 duplicate Course definitions found across:
 * AdvancedFilters.types.ts, AdvancedFilters.tsx, AddTestDialog.tsx,
 * AddCourseDialog.tsx, CertificatesTypes.ts, LessonPlayerTypes.ts,
 * MentorshipTypes.ts
 *
 * IMPORTANT: Do NOT redefine Course in individual page/component files.
 * Import from here instead:
 *   import type { Course } from '@/types/lms';
 *
 * NOTE: LMSDashboard.tsx uses a completely different shape
 * (enrolledCount, completionRate) — that is a LMSCourseStat, not Course.
 * NOTE: LessonPlayerTypes uses id: number (not string). The canonical id is
 * string | number to cover both cases.
 */

// ---------------------------------------------------------------------------
// Course
// ---------------------------------------------------------------------------

/**
 * Canonical Course interface.
 *
 * Required: id, title
 * All other fields are optional — presence depends on API endpoint.
 *
 * id is string | number because:
 *   - Most consumers (AdvancedFilters, AddCourseDialog, CertificatesTypes,
 *     MentorshipTypes) use string
 *   - LessonPlayerTypes uses number
 */
export interface Course {
  id: string | number;
  title: string;

  // Extended identifiers
  code?: string;

  // Bilingual content
  titleRu?: string;
  description?: string;
  descriptionRu?: string;

  // Classification
  level?: 'beginner' | 'intermediate' | 'advanced' | string;
  isRequired?: boolean;

  // Scheduling
  startDate?: string | null;
  endDate?: string | null;

  // Relations
  departmentId?: string | null;
  mentorId?: string | null;

  // Lesson player fields
  duration?: number;
  modules?: unknown[];
}

// ---------------------------------------------------------------------------
// LMSCourseStat (LMSDashboard-specific shape — NOT a Course entity)
// ---------------------------------------------------------------------------

/**
 * Aggregated statistics for a course displayed in the LMS dashboard.
 * This is a read-model, not the same as the Course entity.
 */
export interface LMSCourseStat {
  id: string;
  name: string;
  enrolledCount: number;
  completionRate: number;
}
