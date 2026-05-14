/**
 * @module MachineOperatorTabTypes
 * @description Types and constants for MachineOperatorTab.
 */

export interface MachineOperatorTabProps {
  employeeId: string;
}

export interface KpiCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon: React.ElementType;
  color: string;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
}

export const STOPPAGE_COLORS = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#84cc16",
  "#22d3ee",
  "#8b5cf6",
  "#ec4899",
];
