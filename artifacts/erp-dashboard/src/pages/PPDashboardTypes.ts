/**
 * @module PPDashboardTypes
 * @description TypeScript interfaces, types, and constants for PPDashboard.
 * No JSX — pure types only.
 */

import type { LucideIcon } from "lucide-react";

export interface ProductionStats {
  planningRate?: number;
  orders?: {
    total?: number;
    byStatus?: {
      completed?: number;
      inProgress?: number;
      pending?: number;
    };
  };
}

export interface PapkaOrder {
  id: string;
  orderNumber?: string;
  name?: string;
  clientName?: string;
  status: string;
}

export interface MachineTask {
  id: string;
  operationName: string;
  machineName: string;
  status: string;
  progress?: number;
}

export interface KpiItem {
  label: string;
  value: string | number;
  desc: string;
  icon: LucideIcon;
  accent: string;
  href: string;
}

export interface QuickAction {
  title: string;
  href: string;
  icon: LucideIcon;
}
