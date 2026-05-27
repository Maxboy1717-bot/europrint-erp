/**
 * @module europrint-compat
 * @description Source module. See exports for details.
 */

export * from './schema';
export { db, pool } from './schema';

export {
  users, crmLeads, crmDeals, crmContacts, crmCompanies, crmPipelines, crmStages,
  candidates, vacancies, hrCandidateFunnels, hrFunnelHistory, hrReferencesChecks,
  hrToolTestResults, hrOnboardingPlans, hrEmployeeOnboardings, hrJobDescriptions,
  hrJobOffers, hrMotivationPlans, hrProductivityInterviews,
} from './schema-compat-1';

export { salaryHistory } from './schema-compat-5';

export {
  payrollPeriods, payrollRows, attendance, leaveRequests, departments, positions,
  positionPermissions, budgets, glDocuments, accounts, salesInvoices, documentSequences,
  salesOrders, sdLeads, purchaseOrders, purchaseOrderItems, vendors, warehouses,
  warehouseZones, warehouseStock, materials, posMovements, posMovementTypes,
} from './schema-compat-2';

export {
  mroInventory, productionOrders, routings, routingOperations, bomHeaders, bomItems,
  workCenters, downtimeEvents, downtimeReasonCodes, machineCrews, equipmentMaintenance,
  qcReclamations, qcBraks, notifications, marketingCampaigns, marketingLeads,
  productCategories, websiteBanners, websiteSettings, securityAccess, securityAttendance,
} from './schema-compat-3';

export {
  logisticsRoutes, iotSensors, designLibraryItems, hitlApprovals, customerOrders,
  customerAccounts, publicProducts, websitePages, portfolioItems, modules, tests,
  assignments, courses, mmDeliveries, sdOrders, productionSessions, aiUsageLogs,
  approvalRequests, designOrders, stockTransferLines,
} from './schema-compat-4';

export {
  insertCustomerOrderSchema, insertWebsitePageSchema, insertWebsiteBannerSchema,
  insertPortfolioItemSchema, insertWebsiteSettingSchema, insertProductCategorySchema,
  insertPublicProductSchema,
} from './schema-compat-zod';

export {
  aiExamAttempts, aiInsights, aiPlanningPlans, aiPlanningConfig,
  aiReservationRequests, aiReservationBatches, aiHrInterviews,
} from './schema-ai';

export {
  marketingContentPosts, marketingSocialAccounts, marketingSocialPosts,
  marketingEmailTemplates,
} from './schema-marketing-ext';

export {
  guidelines, contactSettings, systemSettings, adminFilters,
  calendarEvents, assetItems, assetMaintenance, assetDisposals, assetTransfers,
  saasTenants,
} from './schema-admin-ext';

