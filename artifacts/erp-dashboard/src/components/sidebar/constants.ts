/** @module constants @description Barrel re-export that combines all sidebar navigation constants from their individual module files into the single `menuGroups` map consumed by the sidebar component. */

import { menuGroupsSalesCrm }       from "./constants-sales-crm";
import { menuGroupsProduction }     from "./constants-production";
import { menuGroupsWarehouseSupply } from "./constants-warehouse-supply";
import { menuGroupsFinance }        from "./constants-finance";
import { menuGroupsHrLms }          from "./constants-hr-lms";
import { menuGroupsSecurityInfra }  from "./constants-security-infra";
import { menuGroupsAdminCoord }     from "./constants-admin-coord";
import { menuGroupsHidden }         from "./constants-hidden";

// ── Combined map (declaration order: tz01 → tz17 → kanban → coordination → chat → hidden) ──
export const menuGroups = {
  ...menuGroupsSalesCrm,        // tz01, tz02, tz03
  ...menuGroupsProduction,      // tz04, tz05, tz06, tz07
  ...menuGroupsWarehouseSupply, // tz08, tz09
  ...menuGroupsFinance,         // tz10
  ...menuGroupsHrLms,           // tz11, tz12
  ...menuGroupsSecurityInfra,   // tz13, tz14, tz15
  ...menuGroupsAdminCoord,      // tz16, tz17, kanban, coordination, chat
  ...menuGroupsHidden,          // hidden (171 routed-but-not-in-sidebar pages)
};

// ── Colour and permission maps ──
export { moduleColors, MODULE_PERMISSION_KEYS, moduleAccentColors } from "./constants-colors";

// ── Utility functions ──
export { getTranslatedMenuGroups, findModuleByPath } from "./constants-utils";
