/**
 * @module index
 * @description Barrel re-export file. Surfaces the public API of this folder.
 */

export * from "./core-schema";
export * from "./crm-schema";
export * from "./design-schema";
export * from "./ecommerce-schema";
export * from "./fi-schema";
export * from "./hr-schema";
export * from "./hr-recruiter";
export * from "./iot-schema";
export * from "./kanban-schema";
export * from "./kanban-extended";
export * from "./lms-schema";
export * from "./lms-extended";
export * from "./website-extended";
export {
  posMovementTypes,
  insertPosMovementTypeSchema,
  posWarehouseAccess,
  insertPosWarehouseAccessSchema,
  roleMovementPermissions,
  insertRoleMovementPermissionSchema,
  posTelegramRoutes,
  insertPosTelegramRouteSchema,
  inventoryPassports,
  insertInventoryPassportSchema,
  inventoryBarcodeAssignments,
  insertInventoryBarcodeAssignmentSchema,
  insertPosMovementLineSchema,
  posPdfTemplates,
  insertPosPdfTemplateSchema,
} from "./pos-schema";
export * from "./pos-schema-v2";
export * from "./pos-schema-extensions";
export * from "./mm-material-cards";
export * from "./marketing-schema";
export * from "./mm-schema";
export * from "./pp-schema";
export * from "./qc-schema";
export * from "./saas-schema";
export * from "./sd-europrint-schema";
export * from "./sd-schema";
export * from "./security-ops-schema";
export * from "./strategic-ext-schema";
export * from "./wms-schema";
export * from "./ai-providers-schema";
export * from "./numeric-money";
export * from "./master-config";
export * from "./position-permissions";
export * from "./hr-v2-schema";
export * from "./weekly-plans-schema";
export * from "./ideal-rasm-schema";
export * from "./kaizen-schema";
export * from "./orders-registry-schema";
export * from "./hr-tz2-schema";
export * from "./order-workflow-schema";
export {
  // Selectively re-export from hr-architecture-additions to avoid duplicate symbols
  // (aiCvScreenings, jobTemplates, questionnaireQuestions, questionnaireTemplates
  //  are defined elsewhere — they're the authoritative copies).
} from "./hr-architecture-additions";
export * from "./pos-retail";
export {
  // Re-export ONLY symbols unique to admin-assets; AssetDisposal/AssetTransfer
  // etc. are the authoritative copies in pp/pp-enhanced.
  assetItems, insertAssetItemSchema, assetMaintenance,
} from "./admin-assets";
export type { AssetItem, InsertAssetItem, AssetMaintenance } from "./admin-assets";
export * from "./fi-financial-reports";
export * from "./communication-center";
export * from "./sd-customer-relations";
