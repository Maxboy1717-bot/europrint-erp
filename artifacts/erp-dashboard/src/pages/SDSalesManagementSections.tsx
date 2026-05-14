/**
 * @module SDSalesManagementSections
 * @description Re-exports all major section components for SDSalesManagement.
 * Sections are split into two files to stay under the 300-line limit:
 *   - SDSalesManagementSectionsA.tsx — InvoicesSection, ForecastSection
 *   - SDSalesManagementSectionsB.tsx — AnalyticsSection, CommissionSection
 */

export { InvoicesSection, ForecastSection } from "./SDSalesManagementSectionsA";
export { AnalyticsSection, CommissionSection } from "./SDSalesManagementSectionsB";
