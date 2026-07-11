/**
 * @module AdminRoutes
 * @description Frontend route definition.
 */

import { lazy } from "react";

const KaizenPage = lazy(() => import("@/pages/KaizenPage"));
const OrdersRegistry = lazy(() => import("@/pages/OrdersRegistry"));

const Settings = lazy(() => import("@/pages/Settings"));
const NotificationSettings = lazy(() => import("@/pages/NotificationSettings"));
const SuperAdminPanel = lazy(() => import("@/pages/SuperAdminPanel"));
const SystemMonitor = lazy(() => import("@/pages/SystemMonitor"));
const TelegramBotAdmin = lazy(() => import("@/pages/TelegramBotAdmin"));
const ApprovalHub = lazy(() => import("@/pages/ApprovalHub"));
const IntegrationManagement = lazy(() => import("@/pages/IntegrationManagement"));
const CustomerPortalConfig = lazy(() => import("@/pages/CustomerPortalConfig"));
const ExceptionLog = lazy(() => import("@/pages/ExceptionLog"));
const QueueMonitor = lazy(() => import("@/pages/QueueMonitor"));
const GLPostingMonitor = lazy(() => import("@/pages/GLPostingMonitor"));
const InvoiceVerification = lazy(() => import("@/pages/InvoiceVerification"));
const ExpenseManagement = lazy(() => import("@/pages/ExpenseManagement"));
const MRODashboard = lazy(() => import("@/pages/MRODashboard"));
const VendorPerformance = lazy(() => import("@/pages/VendorPerformance"));
const EmployeeRating = lazy(() => import("@/pages/EmployeeRating"));
const HRLMSSkills = lazy(() => import("@/pages/HRLMSSkills"));
const SaaSExtended = lazy(() => import("@/pages/SaaSExtended"));
const LMSExtended = lazy(() => import("@/pages/LMSExtended"));
const LMSSupport = lazy(() => import("@/pages/LMSSupport"));
const KnowledgeBase = lazy(() => import("@/pages/KnowledgeBase"));
const AIAgentsPage = lazy(() => import("@/pages/AIAgentsPage"));
const ValidatePage = lazy(() => import("@/pages/ValidatePage"));
const ProgressPage = lazy(() => import("@/pages/ProgressPage"));
const EmployeesForFacePage = lazy(() => import("@/pages/EmployeesForFacePage"));
const AuditLogPage = lazy(() => import("@/pages/AuditLogPage"));
const BusinessSettings = lazy(() => import("@/pages/BusinessSettings"));
const TaxonomyManager = lazy(() => import("@/pages/TaxonomyManager"));

export const ADMIN_ROUTES: [string, React.ComponentType][] = [
  ['/settings',                Settings],
  ['/settings/notifications',  NotificationSettings],
  ['/admin/business-settings', BusinessSettings],
  ['/admin/taxonomy',          TaxonomyManager],
  ['/super-admin',             SuperAdminPanel],
  ['/system-monitor',          SystemMonitor],
  ['/telegram-bot',            TelegramBotAdmin],
  ['/telegram/admin',          TelegramBotAdmin],
  ['/approvals',               ApprovalHub],
  ['/integrations',            IntegrationManagement],
  ['/customer-portal',         CustomerPortalConfig],
  ['/admin/exceptions',        ExceptionLog],
  ['/admin/queues',            QueueMonitor],
  ['/admin/audit-log',         AuditLogPage],
];

export const INTEGRATION_ROUTES: [string, React.ComponentType][] = [
  ['/integration/gl-posting',           GLPostingMonitor],
  ['/integration/invoice-verification', InvoiceVerification],
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
  ['/lms/gamification',   LMSExtended],
  ['/lms/support',        LMSSupport],
];

export const KAIZEN_ROUTES: [string, React.ComponentType][] = [
  ['/kaizen', KaizenPage],
];

export const ORDERS_REGISTRY_ROUTES: [string, React.ComponentType][] = [
  ['/orders-registry', OrdersRegistry],
];

// ARCHITECTURE.md §40 — Yetishmagan modullar uchun yangi sahifalar
export const ARCHITECTURE_GAP_ROUTES: [string, React.ComponentType][] = [
  ['/ai/agents',          AIAgentsPage],
  ['/admin/validate',     ValidatePage],
  ['/dashboard/progress', ProgressPage],
  ['/hr/face-employees',  EmployeesForFacePage],
];
