/**
 * @module CRMRoutes
 * @description Frontend route definition.
 */

import { lazy } from "react";

const AiCrmPage = lazy(() => import("@/pages/AiCrmPage"));
const CrmFunnelAnalytics = lazy(() => import("@/pages/CrmFunnelAnalytics"));
const CrmRfmClusters    = lazy(() => import("@/pages/CrmRfmClusters"));
const CrmCohortAnalysis = lazy(() => import("@/pages/CrmCohortAnalysis"));
const CRMActivities = lazy(() => import("@/pages/CRMActivities"));
const CRMSettings = lazy(() => import("@/pages/CRMSettings"));
const CRMWorkspace = lazy(() => import("@/pages/CRMWorkspace"));
const SalesOrders = lazy(() => import("@/pages/SalesOrders"));
const SDEuroprint = lazy(() => import("@/pages/SDEuroprint"));
const SDDashboard = lazy(() => import("@/pages/SDDashboard"));
const SDCustomers = lazy(() => import("@/pages/SDCustomers"));
const Customer360Page = lazy(() => import("@/pages/Customer360Page"));
const SDSalesQuotes = lazy(() => import("@/pages/SDSalesQuotes"));
const SDSalesOrders = lazy(() => import("@/pages/SDSalesOrders"));
const SDOrderDetail = lazy(() => import("@/pages/SDOrderDetail"));
const SDSalesPayments = lazy(() => import("@/pages/SDSalesPayments"));
const SDSalesManagement = lazy(() => import("@/pages/SDSalesManagement"));
const SDKpi = lazy(() => import("@/pages/SDKpi"));
const SDContracts = lazy(() => import("@/pages/SDContracts"));
const SDSettings = lazy(() => import("@/pages/SDSettings"));
const SDLeads = lazy(() => import("@/pages/SDLeads"));
const SDDeliveries = lazy(() => import("@/pages/SDDeliveries"));
const SDLostOrders = lazy(() => import("@/pages/SDLostOrders"));
const SDDebitors = lazy(() => import("@/pages/SDDebitors"));
const SDOverviewDashboard = lazy(() => import("@/pages/SDOverviewDashboard"));
const SDQuotaDashboard = lazy(() => import("@/pages/SDQuotaDashboard"));
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
  ['/ai-crm',                  AiCrmPage],
  ['/crm-workspace',           CRMWorkspace],
  ['/crm/funnel',              CrmFunnelAnalytics],
  ['/crm/rfm',                 CrmRfmClusters],
  ['/crm/cohort',              CrmCohortAnalysis],
  ['/crm/activities',          CRMActivities],
  ['/crm/settings',            CRMSettings],
  ['/erp/sales',               SalesOrders],
  // STEP 2: legacy /sd/quotations now renders the canonical SDSalesQuotes page
  // (sd_quotations was a duplicate FE page over the SAME `quotations` table; sidebar uses sd/sales-quotes).
  ['/sd/quotations',           SDSalesQuotes],
  ['/sd/crm',                  SDEuroprint],
  ['/sd/dashboard',            SDDashboard],
  ['/sd/customers',            SDCustomers],
  ['/sd/customers/:id',        Customer360Page],
  ['/crm/customer/:id',        Customer360Page],
  ['/sd/sales-quotes',         SDSalesQuotes],
  ['/sd/sales-orders',         SDSalesOrders],
  ['/sd/orders/:id',           SDOrderDetail],
  ['/sd/sales-payments',       SDSalesPayments],
  ['/sd/sales-management',     SDSalesManagement],
  ['/sd/invoices',             SDSalesManagement],
  ['/sd/forecast',             SDSalesManagement],
  ['/sd/analytics',            SDSalesManagement],
  ['/sd/commission',           SDSalesManagement],
  ['/sd/kpi',                  SDKpi],
  ['/sd/contracts',            SDContracts],
  ['/sd/settings',             SDSettings],
  ['/sd/debitors',             SDDebitors],
  ['/sd/dashboard/overview',   SDOverviewDashboard],
  ['/sd/dashboard/quota',      SDQuotaDashboard],
  ['/sd/manager-panel',        SDExtended],
  ['/sd/warehouse-rental',     SDExtended],
  ['/sd/advance-control',      SDExtended],
  ['/sd/leads',                SDLeads],
  ['/sd/deliveries',           SDDeliveries],
  ['/sd/lost-orders',          SDLostOrders],
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
