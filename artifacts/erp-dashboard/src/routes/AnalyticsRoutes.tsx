/**
 * @module AnalyticsRoutes
 * @description Frontend route definition.
 */

import { lazy } from "react";const LMSDashboard = lazy(() => import("@/pages/LMSDashboard"));
const Courses = lazy(() => import("@/pages/Courses"));
const CourseDetail = lazy(() => import("@/pages/CourseDetail"));
const Tests = lazy(() => import("@/pages/Tests"));
const TestDetail = lazy(() => import("@/pages/TestDetail"));
const AIExams = lazy(() => import("@/pages/AIExams"));
const AllExams = lazy(() => import("@/pages/AllExams"));
const Certificates = lazy(() => import("@/pages/Certificates"));
const GoalsKPI = lazy(() => import("@/pages/GoalsKPI"));
const KanbanBoard = lazy(() => import("@/pages/KanbanBoard"));
const RecruitingKanban = lazy(() => import("@/pages/RecruitingKanban"));
const Analytics = lazy(() => import("@/pages/Analytics"));

export const ANALYTICS_ROUTES: [string, React.ComponentType][] = [
  ['/analytics',                      Analytics],

  ['/lms-dashboard',                  LMSDashboard],
  ['/courses',                        Courses],
  ['/lessons',                        Courses],
  ['/courses/:id',                    CourseDetail],

  ['/tests',                          Tests],
  ['/tests/:id',                      TestDetail],
  ['/ai-exams',                       AIExams],
  ['/all-exams',                      AllExams],
  ['/certificates',                   Certificates],
  ['/goals',                          GoalsKPI],

  ['/kanban',                         KanbanBoard],
  ['/hr/recruiting-kanban',           RecruitingKanban],
];
