/**
 * @module camera-heatmap-sections
 * @description Re-export barrel for all Camera Heatmap tab-section components.
 *              Import individual tabs from their dedicated modules, or use this
 *              file as a single-entry convenience import.
 */

export { GeneralTabContent }  from "./camera-heatmap-general";
export { EmployeeTabContent } from "./camera-heatmap-employee";
export { ZoneTabContent }     from "./camera-heatmap-zone";

export type { GeneralTabContentProps }  from "./camera-heatmap-general";
export type { EmployeeTabContentProps } from "./camera-heatmap-employee";
export type { ZoneTabContentProps }     from "./camera-heatmap-zone";
