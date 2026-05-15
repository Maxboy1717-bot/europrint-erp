/**
 * @module CRMRoutes
 * @description Frontend route definition.
 */

import { lazy } from "react";

const AiCrmPage = lazy(() => import("@/pages/AiCrmPage"));
const CRMWorkspace = lazy(() => import("@/pages/CRMWorkspace"));
const SDDashboard = lazy(() => import("@/pages/SDDashboard"));
const SDCustomers = lazy(() => import("@/pages/SDCustomers"));
const SDSalesQuotes = lazy(() => import("@/pages/SDSalesQuotes"));
const SDSalesOrders = lazy(() => import("@/pages/SDSalesOrders"));
const SDSalesPayments = lazy(() => import("@/pages/SDSalesPayments"));
const SDKpi = lazy(() => import("@/pages/SDKpi"));
const SDContracts = lazy(() => import("@/pages/SDContracts"));
const SDSettings = lazy(() => import("@/pages/SDSettings"));
const SDDebitors = lazy(() => import("@/pages/SDDebitors"));
const SDExtended = lazy(() => import("@/pages/SDExtended"));
const MarketingDashboard = lazy(() => import("@/pages/MarketingDashboard"));
const MarketingCampaigns = lazy(() => import("@/pages/MarketingCampaigns"));
const MarketingContent = lazy(() => import("@/pages/MarketingContent"));
const MarketingLeads = lazy(() => import("@/pages/MarketingLeads"));
const MarketingCalendar = lazy(() => import("@/pages/MarketingCalendar"));
const MarketingExhibitions = lazy(() => import("@/pages/MarketingExhibitions"));
const MarketingPR = lazy(() => import("@/pages/MarketingPR"));
const MarketingBudget = lazy(() => import("@/pages/MarketingBudget"));
const MarketingSettings = lazy(() => import("@/pages/MarketingSettings"));
const MarketingSocialInbox = lazy(() => import("@/pages/MarketingSocialInbox"));
const MarketingWebsiteCMS = lazy(() => import("@/pages/MarketingWebsiteCMS"));
const MarketingExtended = lazy(() => import("@/pages/MarketingExtended"));

export const SALES_ROUTES: [string, React.ComponentType][] = [
  ['/ai/crm',                  AiCrmPage],

  ['/crm-workspace',           CRMWorkspace],

  ['/sd/dashboard',            SDDashboard],
  ['/sd/customers',            SDCustomers],
  ['/sd/sales-quotes',         SDSalesQuotes],
  ['/sd/sales-orders',         SDSalesOrders],
  ['/sd/sales-payments',       SDSalesPayments],

  ['/sd/kpi',                  SDKpi],
  ['/sd/contracts',            SDContracts],
  ['/sd/settings',             SDSettings],
  ['/sd/debitors',             SDDebitors],

  ['/sd/manager-panel',        SDExtended],
  ['/sd/warehouse-rental',     SDExtended],
  ['/sd/advance-control',      SDExtended],
];

export const MARKETING_ROUTES: [string, React.ComponentType][] = [
  ['/marketing/dashboard',    MarketingDashboard],
  ['/marketing/campaigns',    MarketingCampaigns],
  ['/marketing/content',      MarketingContent],
  ['/marketing/leads',        MarketingLeads],
  ['/marketing/calendar',     MarketingCalendar],
  ['/marketing/exhibitions',  MarketingExhibitions],
  ['/marketing/pr',           MarketingPR],
  ['/marketing/budget',       MarketingBudget],
  ['/marketing/settings',     MarketingSettings],
  ['/marketing/social-inbox', MarketingSocialInbox],
  ['/marketing/website-cms',  MarketingWebsiteCMS],
  ['/marketing/analytics',    MarketingExtended],
  ['/marketing/seo',          MarketingExtended],
  ['/marketing/ab-testing',   MarketingExtended],
  ['/marketing/competitors',  MarketingExtended],
  ['/marketing/nps-churn',    MarketingExtended],
];
