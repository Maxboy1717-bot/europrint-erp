/**
 * TechPPExtendedTypes.ts
 * Interfaces, types, constants and tab metadata for TechPPExtended.
 */
import {
  Cpu, GitBranch, Clock, DollarSign, Users, History, Copy,
  Zap, TrendingUp, AlertTriangle, BarChart3, Target, Calendar,
  Activity, RefreshCw, Brain, Package, Calculator,
  type LucideIcon,
} from "lucide-react";

export const URL_TAB_MAP: Record<string, string> = {
  "/tech/material-alternatives": "tech-materials",
  "/tech/machine-selection": "tech-machines",
  "/tech/time-cost": "tech-time",
  "/tech/cost-optimization": "tech-cost",
  "/tech/client-requirements": "tech-clients",
  "/tech/change-history": "tech-history",
  "/tech/parallel-orders": "tech-parallel",
  "/pp/shift-management": "pp-shifts",
  "/pp/parallel-processes": "pp-parallel",
  "/pp/rush-orders": "pp-rush",
  "/pp/bottleneck": "pp-bottleneck",
  "/pp/demand-forecast": "pp-demand",
  "/pp/what-if": "pp-whatif",
  "/pp/delivery-calculator": "pp-delivery",
  "/pp/energy-optimization": "pp-energy",
  "/pp/oee-monitor": "pp-oee",
  "/pp/kpi-deviation": "pp-kpi",
  "/pp/realtime-progress": "pp-realtime",
};

export const tabMeta: Record<string, { title: string; icon: LucideIcon }> = {
  "tech-materials": { title: "Material Muqobili",     icon: Package },
  "tech-machines":  { title: "Stanoq Tanlash",        icon: Cpu },
  "tech-time":      { title: "Vaqt va Tannarx",       icon: Clock },
  "tech-cost":      { title: "Xarajat Optimizatsiya", icon: DollarSign },
  "tech-clients":   { title: "Mijoz Talablari",       icon: Users },
  "tech-history":   { title: "O'zgarishlar Tarixi",   icon: History },
  "tech-parallel":  { title: "Parallel Buyurtmalar",  icon: Copy },
  "pp-shifts":      { title: "Smena Boshqaruvi",      icon: Calendar },
  "pp-parallel":    { title: "Parallel Jarayonlar",   icon: GitBranch },
  "pp-rush":        { title: "Rush Order",            icon: Zap },
  "pp-bottleneck":  { title: "Bottleneck",            icon: AlertTriangle },
  "pp-demand":      { title: "Demand Forecast",       icon: TrendingUp },
  "pp-whatif":      { title: "What-if Tahlil",        icon: Brain },
  "pp-delivery":    { title: "Yetkazish Kalk.",       icon: Calculator },
  "pp-energy":      { title: "Energiya Optim.",       icon: Zap },
  "pp-oee":         { title: "OEE Monitor",           icon: Activity },
  "pp-kpi":         { title: "KPI Og'ish",            icon: Target },
  "pp-realtime":    { title: "Real-time Monitor",     icon: RefreshCw },
};

export const TECH_TABS = [
  { v: "tech-materials", label: "Material Muqobili",     icon: Package },
  { v: "tech-machines",  label: "Stanoq Tanlash",        icon: Cpu },
  { v: "tech-time",      label: "Vaqt va Tannarx",       icon: Clock },
  { v: "tech-cost",      label: "Xarajat Optimizatsiya", icon: DollarSign },
  { v: "tech-clients",   label: "Mijoz Talablari",       icon: Users },
  { v: "tech-history",   label: "O'zgarishlar Tarixi",   icon: History },
  { v: "tech-parallel",  label: "Parallel Buyurtmalar",  icon: Copy },
];

export const PP_TABS = [
  { v: "pp-shifts",     label: "Smena Boshqaruvi",      icon: Calendar },
  { v: "pp-parallel",   label: "Parallel Jarayonlar",   icon: GitBranch },
  { v: "pp-rush",       label: "Rush Order",            icon: Zap },
  { v: "pp-bottleneck", label: "Bottleneck",            icon: AlertTriangle },
  { v: "pp-demand",     label: "Demand Forecast",       icon: TrendingUp },
  { v: "pp-whatif",     label: "What-if Tahlil",        icon: Brain },
  { v: "pp-delivery",   label: "Yetkazish Kalk.",       icon: Calculator },
  { v: "pp-energy",     label: "Energiya Optim.",       icon: Zap },
  { v: "pp-oee",        label: "OEE Monitor",           icon: Activity },
  { v: "pp-kpi",        label: "KPI Og'ish",            icon: Target },
  { v: "pp-realtime",   label: "Real-time",             icon: RefreshCw },
];

export const REMAINING_PP_TABS = ["pp-parallel", "pp-whatif", "pp-delivery", "pp-energy", "pp-kpi", "pp-realtime"] as const;

export const REMAINING_TAB_TITLES: Record<string, string> = {
  "pp-parallel":  "Parallel Jarayonlar Monitoringi",
  "pp-whatif":    "What-if Stsenariy Tahlili",
  "pp-delivery":  "Yetkazish Muddati Kalkulyatori",
  "pp-energy":    "Energiya Optimizatsiya",
  "pp-kpi":       "KPI va Og'ish Tahlili",
  "pp-realtime":  "Real-time Progress",
};

export interface TechCard {
  id: string;
  card_no?: string;
  product_name?: string;
  material?: string;
  flute_type?: string;
  layers?: number;
  notes?: string;
  papka_order_id?: string | null;
  created_at?: string;
}

export interface ProductionOrder {
  id: string;
  orderNumber?: string;
  priority?: string;
  plannedEndDate?: string;
  status?: string;
  productName?: string;
  salesOrderId?: string;
  clientName?: string;
}

export interface OeeData {
  overall: { oee: number; availability: number; performance: number; quality: number };
  byMachine: Array<{
    machineId: string; machineName: string;
    oee: number; availability: number; performance: number; quality: number; sessions: number;
  }>;
}

export interface ShiftRequirement {
  id: string;
  department?: string;
  shiftType?: string;
  requiredCount?: number;
  isActive?: boolean;
}
