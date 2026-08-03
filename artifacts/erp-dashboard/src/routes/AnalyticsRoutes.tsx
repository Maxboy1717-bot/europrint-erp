/**
 * @module AnalyticsRoutes
 * @description Frontend route definition.
 */

import { lazy } from "react";

const ForecastAnalytics = lazy(() => import("@/pages/ForecastAnalytics"));
const LMSDashboard = lazy(() => import("@/pages/LMSDashboard"));
const Courses = lazy(() => import("@/pages/Courses"));
const LMSCourseCardBinding = lazy(() => import("@/pages/LMSCourseCardBinding"));
const CourseDetail = lazy(() => import("@/pages/CourseDetail"));
const LessonPlayer = lazy(() => import("@/pages/LessonPlayer"));
const Tests = lazy(() => import("@/pages/Tests"));
const TestDetail = lazy(() => import("@/pages/TestDetail"));
const AIExams = lazy(() => import("@/pages/AIExams"));
const AIFitScores = lazy(() => import("@/pages/AIFitScores"));
const AllExams = lazy(() => import("@/pages/AllExams"));
const Certificates = lazy(() => import("@/pages/Certificates"));
const GoalsKPI = lazy(() => import("@/pages/GoalsKPI"));
const KnowledgeBase = lazy(() => import("@/pages/KnowledgeBase"));
const KanbanBoard = lazy(() => import("@/pages/KanbanBoard"));
const KanbanStatusColumnMap = lazy(() => import("@/pages/KanbanStatusColumnMap"));
const RecruitingKanban = lazy(() => import("@/pages/RecruitingKanban"));
const Analytics = lazy(() => import("@/pages/Analytics"));
const NotificationCenter = lazy(() => import("@/pages/NotificationCenter"));
const NotificationSettings = lazy(() => import("@/pages/NotificationSettings"));

export const ANALYTICS_ROUTES: [string, React.ComponentType][] = [
  ['/analytics',                      Analytics],
  ['/notifications',                  NotificationCenter],
  // Moved from ADMIN_ROUTES (was admin-only, unreachable from any nav — HR sidebar's
  // "Bildirishnomalar" needs it): this is a personal per-type notification-channel
  // preferences form (Save persists to notification_type_preferences, scoped to
  // @CurrentUser()), not an admin-only company setting — any authenticated user
  // manages their own preferences here.
  ['/settings/notifications',         NotificationSettings],
  ['/ai/forecast',                    ForecastAnalytics],
  ['/lms-dashboard',                  LMSDashboard],
  ['/courses',                        Courses],
  ['/lms/course-card-binding',        LMSCourseCardBinding],
  ['/lessons',                        Courses],
  ['/courses/:id',                    CourseDetail],
  ['/courses/:id/lessons',            LessonPlayer],
  ['/courses/:id/lessons/:lessonId',  LessonPlayer],
  ['/tests',                          Tests],
  ['/tests/:id',                      TestDetail],
  ['/ai-exams',                       AIExams],
  ['/ai/fit-scores',                  AIFitScores],
  ['/all-exams',                      AllExams],
  ['/certificates',                   Certificates],
  ['/goals',                          GoalsKPI],
  ['/knowledge-base',                 KnowledgeBase],
  ['/kanban',                         KanbanBoard],
  ['/kanban/status-column-map',       KanbanStatusColumnMap],
  ['/hr/recruiting-kanban',           RecruitingKanban],
];
