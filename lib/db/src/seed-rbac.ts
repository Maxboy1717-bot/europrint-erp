/**
 * @module seed-rbac
 * @description Source module. See exports for details.
 */

import { db, pool } from "./index";
import { positionPermissions, positionFeatureFlags } from "./schema/position-permissions";
import { positions } from "./schema/positions";
import { eq } from "drizzle-orm";

const MODULES = ["CRM", "SD", "PP", "WMS", "FI", "HR", "QC", "MM", "LMS", "DESIGN", "LOGISTICS", "POS", "MDM"] as const;

type AccessLevel = "FULL" | "READ_PLUS" | "READ" | "LIMITED" | "NONE";

interface TierPermissions {
  default: AccessLevel;
  overrides?: Partial<Record<typeof MODULES[number], AccessLevel>>;
}

const TIER_MAP: Record<string, TierPermissions> = {
  owner: { default: "FULL" },
  "c-level": { default: "READ_PLUS", overrides: {} },
  director: { default: "READ", overrides: {} },
  manager: { default: "READ", overrides: {} },
  supervisor: { default: "LIMITED", overrides: {} },
  specialist: { default: "LIMITED", overrides: {} },
  operator: { default: "LIMITED", overrides: {} },
  standard: { default: "LIMITED", overrides: {} },
};

const POSITION_MODULE_MAP: Record<string, Partial<Record<typeof MODULES[number], AccessLevel>>> = {
  CEO: { CRM: "FULL", SD: "FULL", PP: "FULL", WMS: "FULL", FI: "FULL", HR: "FULL", QC: "FULL", MM: "FULL", LMS: "FULL", DESIGN: "FULL", LOGISTICS: "FULL", POS: "FULL", MDM: "FULL" },
  CFO: { FI: "FULL", HR: "READ_PLUS", SD: "READ_PLUS", MM: "READ_PLUS", POS: "READ_PLUS" },
  COO: { PP: "FULL", WMS: "FULL", QC: "FULL", LOGISTICS: "FULL", MM: "READ_PLUS", SD: "READ_PLUS" },
  CTO: { PP: "READ_PLUS", DESIGN: "FULL", LMS: "READ_PLUS", MDM: "FULL" },
  CMO: { CRM: "FULL", SD: "READ_PLUS", DESIGN: "READ_PLUS", POS: "READ_PLUS" },
  HR_DIRECTOR: { HR: "FULL", LMS: "FULL", CRM: "READ", FI: "READ" },
  HR_MANAGER: { HR: "FULL", LMS: "READ_PLUS" },
  HR_SPECIALIST: { HR: "FULL", LMS: "READ" },
  HR_RECRUITER: { HR: "FULL", LMS: "READ" },
  PROD_DIRECTOR: { PP: "FULL", QC: "FULL", WMS: "READ_PLUS", MM: "READ_PLUS", DESIGN: "READ" },
  PROD_MANAGER: { PP: "FULL", QC: "READ_PLUS", WMS: "READ" },
  SHIFT_SUPERVISOR: { PP: "FULL", QC: "READ", WMS: "READ" },
  PREPRESS_OPERATOR: { PP: "LIMITED", DESIGN: "READ" },
  OFFSET_OPERATOR: { PP: "LIMITED" },
  DIGITAL_OPERATOR: { PP: "LIMITED" },
  LARGEFORMAT_OPERATOR: { PP: "LIMITED" },
  POSTPRESS_OPERATOR: { PP: "LIMITED" },
  CUTTER_OPERATOR: { PP: "LIMITED" },
  LAMINATOR_OPERATOR: { PP: "LIMITED" },
  BINDING_OPERATOR: { PP: "LIMITED" },
  EMBOSSING_OPERATOR: { PP: "LIMITED" },
  FOILING_OPERATOR: { PP: "LIMITED" },
  QC_MANAGER: { QC: "FULL", PP: "READ", WMS: "READ" },
  QC_INSPECTOR: { QC: "FULL", PP: "READ" },
  QC_LAB_TECH: { QC: "LIMITED" },
  SALES_DIRECTOR: { SD: "FULL", CRM: "FULL", FI: "READ_PLUS", WMS: "READ", POS: "READ_PLUS" },
  SALES_MANAGER: { SD: "FULL", CRM: "FULL", FI: "READ", WMS: "READ" },
  SALES_REP: { SD: "LIMITED", CRM: "LIMITED" },
  KEY_ACCOUNT_MANAGER: { SD: "FULL", CRM: "FULL" },
  ORDER_MANAGER: { SD: "FULL", PP: "READ", WMS: "READ", LOGISTICS: "READ" },
  ESTIMATOR: { SD: "READ_PLUS", PP: "READ", MM: "READ" },
  FIN_MANAGER: { FI: "FULL", HR: "READ", SD: "READ" },
  CHIEF_ACCOUNTANT: { FI: "FULL", HR: "READ" },
  ACCOUNTANT: { FI: "FULL" },
  CASHIER: { FI: "LIMITED", POS: "LIMITED" },
  PAYROLL_SPECIALIST: { FI: "FULL", HR: "READ" },
  WAREHOUSE_MANAGER: { WMS: "FULL", MM: "READ_PLUS", LOGISTICS: "READ_PLUS", PP: "READ" },
  WAREHOUSE_KEEPER: { WMS: "FULL", MM: "READ" },
  WAREHOUSE_LOADER: { WMS: "LIMITED" },
  LOGISTICS_MANAGER: { LOGISTICS: "FULL", WMS: "READ_PLUS", SD: "READ" },
  DRIVER: { LOGISTICS: "LIMITED" },
  COURIER: { LOGISTICS: "LIMITED" },
  IT_MANAGER: { MDM: "FULL", LMS: "READ_PLUS" },
  SYSTEM_ADMIN: { MDM: "FULL" },
  DEVELOPER: { MDM: "FULL" },
  IT_SUPPORT: { MDM: "LIMITED" },
  MARKETING_MANAGER: { CRM: "READ_PLUS", SD: "READ", DESIGN: "READ_PLUS", POS: "READ" },
  MARKETING_SPECIALIST: { CRM: "READ", DESIGN: "READ" },
  SMM_SPECIALIST: { CRM: "READ", DESIGN: "READ" },
  CONTENT_MANAGER: { CRM: "READ", DESIGN: "READ" },
  DESIGNER_LEAD: { DESIGN: "FULL", PP: "READ", SD: "READ" },
  GRAPHIC_DESIGNER: { DESIGN: "FULL", PP: "READ" },
  LAYOUT_DESIGNER: { DESIGN: "FULL", PP: "READ" },
  "3D_DESIGNER": { DESIGN: "FULL" },
  LEGAL_MANAGER: { FI: "READ", HR: "READ", SD: "READ", CRM: "READ" },
  LAWYER: { FI: "READ", HR: "READ" },
  SECURITY_MANAGER: { HR: "READ" },
  SECURITY_GUARD: {},
  MAINTENANCE_MANAGER: { PP: "READ", WMS: "READ" },
  MAINTENANCE_TECH: { PP: "READ" },
  ELECTRICIAN: { PP: "READ" },
  MECHANIC: { PP: "READ" },
  PLUMBER: {},
  CANTEEN_MANAGER: { HR: "READ" },
  CHEF: {},
  CANTEEN_WORKER: {},
  RECEPTIONIST: { CRM: "READ" },
  OFFICE_MANAGER: { HR: "READ", WMS: "READ" },
  CLEANER: {},
  PURCHASING_MANAGER: { MM: "FULL", WMS: "READ_PLUS", FI: "READ" },
  PURCHASING_SPECIALIST: { MM: "FULL", WMS: "READ" },
  CRM_MANAGER: { CRM: "FULL", SD: "READ_PLUS" },
  CUSTOMER_SERVICE: { CRM: "LIMITED", SD: "READ" },
  CALL_CENTER_AGENT: { CRM: "LIMITED" },
  INVENTORY_SPECIALIST: { WMS: "FULL", MM: "READ" },
  PRODUCTION_PLANNER: { PP: "FULL", WMS: "READ", MM: "READ" },
  COLOR_SPECIALIST: { PP: "LIMITED", QC: "READ" },
  MACHINE_ADJUSTER: { PP: "LIMITED" },
  PACKAGING_OPERATOR: { PP: "LIMITED", WMS: "READ" },
  STACKER_OPERATOR: { WMS: "LIMITED" },
  FORKLIFT_OPERATOR: { WMS: "LIMITED" },
  SAFETY_OFFICER: { HR: "READ", PP: "READ", QC: "READ" },
  ENVIRONMENTAL_SPEC: { PP: "READ", QC: "READ" },
  TRAINING_MANAGER: { LMS: "FULL", HR: "READ" },
  TRAINER: { LMS: "FULL" },
  LMS_ADMIN: { LMS: "FULL" },
  INTERN: {},
  TEMP_WORKER: {},
  CONTRACTOR: {},
  CONSULTANT: { CRM: "READ", SD: "READ" },
  AUDITOR_INTERNAL: { FI: "READ", HR: "READ", SD: "READ", WMS: "READ", CRM: "READ", QC: "READ", PP: "READ", MM: "READ" },
  DATA_ENTRY: { CRM: "LIMITED", SD: "LIMITED" },
  ARCHIVE_SPECIALIST: { MDM: "READ" },
  DOCUMENT_CONTROL: { MDM: "READ" },
  POS_CASHIER: { POS: "LIMITED", SD: "LIMITED" },
  POS_MANAGER: { POS: "FULL", SD: "READ", WMS: "READ" },
  ECOMMERCE_MANAGER: { CRM: "READ_PLUS", SD: "FULL", POS: "READ_PLUS" },
  PHOTOGRAPHER: { DESIGN: "LIMITED" },
  COPYWRITER: { CRM: "READ", DESIGN: "LIMITED" },
  BRANCH_MANAGER: { POS: "FULL", SD: "READ_PLUS", WMS: "READ", CRM: "READ" },
  BRANCH_CASHIER: { POS: "LIMITED" },
  UV_PRINT_OPERATOR: { PP: "LIMITED" },
  SCREEN_PRINT_OPERATOR: { PP: "LIMITED" },
  ENGRAVING_OPERATOR: { PP: "LIMITED" },
  CNC_OPERATOR: { PP: "LIMITED" },
  SUBLIMATION_OPERATOR: { PP: "LIMITED" },
  DEPT_HEAD: { HR: "READ" },
  TEAM_LEAD: { PP: "READ" },
  SENIOR_SPECIALIST: {},
};

const FEATURE_FLAGS: Record<string, string[]> = {
  OWNER: ["crm.leads.export", "finance.approve_payment", "hr.view_salary", "hr.approve_hire", "hr.approve_dismiss", "sd.approve_discount", "sd.advance_exception", "purchase.approve_high_value", "mm.approve_new_vendor", "pp.modify_plan", "finance.change_bank_details", "crm.approve_credit_limit"],
  CEO: ["crm.leads.export", "finance.approve_payment", "hr.approve_hire", "hr.approve_dismiss", "sd.approve_discount", "crm.approve_credit_limit", "mm.approve_new_vendor"],
  CFO: ["finance.approve_payment", "finance.change_bank_details"],
  COO: ["pp.modify_plan", "purchase.approve_high_value"],
  HR_DIRECTOR: ["hr.view_salary", "hr.approve_hire", "hr.approve_dismiss"],
  HR_MANAGER: ["hr.view_salary", "hr.approve_hire"],
  SALES_DIRECTOR: ["sd.approve_discount", "sd.advance_exception", "crm.leads.export", "crm.approve_credit_limit"],
  SALES_MANAGER: ["crm.leads.export"],
  FIN_MANAGER: ["finance.approve_payment"],
  CHIEF_ACCOUNTANT: ["finance.approve_payment"],
  PURCHASING_MANAGER: ["purchase.approve_high_value", "mm.approve_new_vendor"],
  PROD_DIRECTOR: ["pp.modify_plan"],
  SYSTEM_ADMIN: ["crm.leads.export", "finance.approve_payment", "hr.view_salary", "hr.approve_hire", "hr.approve_dismiss", "sd.approve_discount", "pp.modify_plan"],
};

async function seedRbac() {
  console.log("🔐 Seeding RBAC permissions...");

  const allPositions = await db.select().from(positions);
  const permissionRows: { positionId: number; moduleCode: string; accessLevel: string }[] = [];

  for (const pos of allPositions) {
    const tier = pos.rbacTier || "standard";
    const tierConfig = TIER_MAP[tier] || TIER_MAP.standard;
    const posOverrides = POSITION_MODULE_MAP[pos.code] || {};

    for (const mod of MODULES) {
      const level = posOverrides[mod] || tierConfig.overrides?.[mod] || tierConfig.default;
      permissionRows.push({ positionId: pos.id, moduleCode: mod, accessLevel: level });
    }
  }

  const BATCH_SIZE = 200;
  for (let i = 0; i < permissionRows.length; i += BATCH_SIZE) {
    const batch = permissionRows.slice(i, i + BATCH_SIZE);
    await db.insert(positionPermissions).values(batch);
  }
  console.log(`✅ ${permissionRows.length} position_permissions inserted (${allPositions.length} positions × ${MODULES.length} modules)`);

  const flagRows: { positionId: number; featureKey: string; isAllowed: boolean }[] = [];
  for (const pos of allPositions) {
    const flags = FEATURE_FLAGS[pos.code] || [];
    for (const fk of flags) {
      flagRows.push({ positionId: pos.id, featureKey: fk, isAllowed: true });
    }
  }

  if (flagRows.length > 0) {
    for (let i = 0; i < flagRows.length; i += BATCH_SIZE) {
      const batch = flagRows.slice(i, i + BATCH_SIZE);
      await db.insert(positionFeatureFlags).values(batch);
    }
  }
  console.log(`✅ ${flagRows.length} position_feature_flags inserted`);

  console.log("\n🎉 RBAC seed completed!");
  await pool.end();
}

seedRbac().catch((err) => {
  console.error("❌ RBAC seed failed:", err);
  process.exit(1);
});
