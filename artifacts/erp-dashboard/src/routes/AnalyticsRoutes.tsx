/**
 * @module AnalyticsRoutes
 * @description Frontend route definition.
 */

import { lazy } from "react";

const ForecastAnalytics = lazy(() => import("@/pages/ForecastAnalytics"));
const LMSDashboard = lazy(() => import("@/pages/LMSDashboard"));
const Courses = lazy(() => import("@/pages/Courses"));
const CourseDetail = lazy(() => import("@/pages/CourseDetail"));
const LessonPlayer = lazy(() => import("@/pages/LessonPlayer"));
const Tests = lazy(() => import("@/pages/Tests"));
const TestDetail = lazy(() => import("@/pages/TestDetail"));
const AIExams = lazy(() => import("@/pages/AIExams"));
const AllExams = lazy(() => import("@/pages/AllExams"));
const Certificates = lazy(() => import("@/pages/Certificates"));
const GoalsKPI = lazy(() => import("@/pages/GoalsKPI"));
const KnowledgeBase = lazy(() => import("@/pages/KnowledgeBase"));
const KanbanBoard = lazy(() => import("@/pages/KanbanBoard"));
const RecruitingKanban = lazy(() => import("@/pages/RecruitingKanban"));
const Analytics = lazy(() => import("@/pages/Analytics"));
const NotificationCenter = lazy(() => import("@/pages/NotificationCenter"));

export const ANALYTICS_ROUTES: [string, React.ComponentType][] = [
  ['/analytics',                      Analytics],
  ['/notifications',                  NotificationCenter],
  ['/ai/forecast',                    ForecastAnalytics],
  ['/lms-dashboard',                  LMSDashboard],
  ['/courses',                        Courses],
  ['/lessons',                        Courses],
  ['/courses/:id',                    CourseDetail],
  ['/courses/:id/lessons',            LessonPlayer],
  ['/courses/:id/lessons/:lessonId',  LessonPlayer],
  ['/tests',                          Tests],
  ['/tests/:id',                      TestDetail],
  ['/ai-exams',                       AIExams],
  ['/all-exams',                      AllExams],
  ['/certificates',                   Certificates],
  ['/goals',                          GoalsKPI],
  ['/knowledge-base',                 KnowledgeBase],
  ['/kanban',                         KanbanBoard],
  ['/hr/recruiting-kanban',           RecruitingKanban],
];
