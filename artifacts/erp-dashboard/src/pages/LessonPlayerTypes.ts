/**
 * @module LessonPlayerTypes
 * @description TypeScript interfaces, types, and helper functions for LessonPlayer.
 * No JSX — pure TypeScript.
 */

// ---------------------------------------------------------------------------
// Domain interfaces
// ---------------------------------------------------------------------------

export interface Lesson {
  id: number;
  moduleId: string;
  title: string;
  titleRu?: string;
  type: string;
  content?: string;
  contentRu?: string;
  filePath?: string;
  videoUrl?: string;
  duration?: number;
  order: number;
}

export interface Module {
  id: number;
  courseId: number;
  title: string;
  titleRu?: string;
  order: number;
  lessons: Lesson[];
  lessonCount?: number;
}

export interface Course {
  id: number;
  title: string;
  titleRu?: string;
  description?: string;
  level?: string;
  duration?: number;
  modules: Module[];
}

export interface ProgressData {
  completedLessonIds: string[];
  totalLessons: number;
  completedLessons: number;
  progressPercent: number;
}
