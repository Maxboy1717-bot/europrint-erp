/**
 * @module AdminRoutes
 * @description Frontend route definition.
 */

import { lazy } from "react";

const KaizenPage = lazy(() => import("@/pages/KaizenPage"));
const Settings = lazy(() => import("@/pages/Settings"));
const NotificationSettings = lazy(() => import("@/pages/NotificationSettings"));
const SuperAdminPanel = lazy(() => import("@/pages/SuperAdminPanel"));
const TelegramBotAdmin = lazy(() => import("@/pages/TelegramBotAdmin"));
const ExceptionLog = lazy(() => import("@/pages/ExceptionLog"));
const QueueMonitor = lazy(() => import("@/pages/QueueMonitor"));
const ExpenseManagement = lazy(() => import("@/pages/ExpenseManagement"));
const MRODashboard = lazy(() => import("@/pages/MRODashboard"));
const VendorPerformance = lazy(() => import("@/pages/VendorPerformance"));
const EmployeeRating = lazy(() => import("@/pages/EmployeeRating"));
const HRLMSSkills = lazy(() => import("@/pages/HRLMSSkills"));
const SaaSExtended = lazy(() => import("@/pages/SaaSExtended"));
const LMSExtended = lazy(() => import("@/pages/LMSExtended"));
const KnowledgeBase = lazy(() => import("@/pages/KnowledgeBase"));
const AIAgentsPage = lazy(() => import("@/pages/AIAgentsPage"));
export const ADMIN_ROUTES: [string, React.ComponentType][] = [
  ['/settings',                Settings],
  ['/settings/notifications',  NotificationSettings],
  ['/super-admin',             SuperAdminPanel],

  ['/telegram/admin',          TelegramBotAdmin],

  ['/admin/exceptions',        ExceptionLog],
  ['/admin/queues',            QueueMonitor],

];

export const INTEGRATION_ROUTES: [string, React.ComponentType][] = [

  ['/integration/expense-management',   ExpenseManagement],
  ['/integration/mro',                  MRODashboard],
  ['/integration/vendor-performance',   VendorPerformance],
  ['/integration/employee-rating',      EmployeeRating],
  ['/integration/hr-lms',               HRLMSSkills],
];

export const SAAS_ROUTES: [string, React.ComponentType][] = [
  ['/saas/tenant-management', SaaSExtended],
  ['/saas/onboarding',        SaaSExtended],
  ['/saas/licensing',         SaaSExtended],
  ['/saas/module-control',    SaaSExtended],
  ['/saas/monitoring',        SaaSExtended],
  ['/saas/error-log',         SaaSExtended],
];

export const LMS_ADMIN_ROUTES: [string, React.ComponentType][] = [
  ['/lms/test-management',        LMSExtended],
  ['/lms/course-author',          LMSExtended],
  ['/lms/operator-certification', LMSExtended],
  ['/lms/learning-budget',        LMSExtended],
];

export const LMS_LEARNER_ROUTES: [string, React.ComponentType][] = [
  ['/lms/leaderboard',    LMSExtended],
  ['/lms/knowledge-base', KnowledgeBase],
  ['/lms/micro-learning', LMSExtended],

];

export const KAIZEN_ROUTES: [string, React.ComponentType][] = [
  ['/kaizen', KaizenPage],
];

export const ORDERS_REGISTRY_ROUTES: [string, React.ComponentType][] = [

];

// ARCHITECTURE.md §40 — Yetishmagan modullar uchun yangi sahifalar
export const ARCHITECTURE_GAP_ROUTES: [string, React.ComponentType][] = [
  ['/ai/agents',          AIAgentsPage],

];
