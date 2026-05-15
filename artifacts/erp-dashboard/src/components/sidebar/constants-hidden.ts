/** @module constants-hidden
 * @description 29 ta tasdiqlangan "yashirin" sahifa — IT direktor
 * tomonidan tanlangan, kelajakda asosiy modullarga ko'chirilishi kerak.
 * Qolgan 142 ta sahifa kod bilan birga butunlay o'chirildi.
 */

import {
  Eye, Users, Store, ShoppingCart, Warehouse, BrainCircuit, DollarSign,
  Factory, CheckSquare, FileText,
} from "lucide-react";
import { MenuGroup } from "./types";

export const menuGroupsHidden: Record<string, MenuGroup> = {
  hidden: {
    title: "🔍 Yashirin sahifalar",
    icon: Eye,
    defaultUrl: "hr/succession-planning",
    items: [
      { title: "HR — 3 ta", url: "", icon: Users, separator: true },
      { title: "H R Succession Planning", url: "hr/succession-planning", icon: Users },
      { title: "Inspection", url: "hr/inspection", icon: Users },
      { title: "H R Vacation Sick", url: "hr/leave", icon: Users },
      { title: "AI — 2 ta", url: "", icon: BrainCircuit, separator: true },
      { title: "A I Agents", url: "ai/agents", icon: BrainCircuit },
      { title: "Agents Hub", url: "ai", icon: BrainCircuit },
      { title: "QC — 2 ta", url: "", icon: CheckSquare, separator: true },
      { title: "Q C Dashboard", url: "qc/dashboard-home", icon: CheckSquare },
      { title: "Paper Parameters", url: "qc/paper-parameters", icon: CheckSquare },
      { title: "POS — 2 ta", url: "", icon: Store, separator: true },
      { title: "Pos Movements", url: "pos/movements", icon: Store },
      { title: "Pos Requests", url: "pos/requests", icon: Store },
      { title: "WMS — 2 ta", url: "", icon: Warehouse, separator: true },
      { title: "Wms Analytics", url: "wms/analytics", icon: Warehouse },
      { title: "Warehouse Reports All", url: "wms/reports-all", icon: Warehouse },
      { title: "SAVDO — 1 ta", url: "", icon: ShoppingCart, separator: true },
      { title: "S D Debitors", url: "sd/debitors", icon: ShoppingCart },
      { title: "ATTENDANCE-MONITOR — 1 ta", url: "", icon: FileText, separator: true },
      { title: "Attendance Monitor", url: "attendance-monitor", icon: FileText },
      { title: "SECURITY — 1 ta", url: "", icon: FileText, separator: true },
      { title: "Security Dashboard", url: "security", icon: FileText },
      { title: "MOLIYA — 1 ta", url: "", icon: DollarSign, separator: true },
      { title: "G L Chart Of Accounts", url: "finance/gl-chart-of-accounts", icon: DollarSign },
      { title: "TECH-APPROVAL — 1 ta", url: "", icon: FileText, separator: true },
      { title: "Tech Approval", url: "tech-approval", icon: FileText },
      { title: "TECH-CARDS — 1 ta", url: "", icon: FileText, separator: true },
      { title: "Tech Cards", url: "tech-cards", icon: FileText },
      { title: "IOT-ENHANCED — 1 ta", url: "", icon: FileText, separator: true },
      { title: "Io T Extended", url: "iot-enhanced", icon: FileText },
      { title: "3WAY-MATCH — 1 ta", url: "", icon: FileText, separator: true },
      { title: "Three Way Match", url: "3way-match", icon: FileText },
      { title: "EMPLOYEE-ZONE-HISTORY — 1 ta", url: "", icon: FileText, separator: true },
      { title: "Employee Zone History", url: "employee-zone-history", icon: FileText },
      { title: "GL — 1 ta", url: "", icon: FileText, separator: true },
      { title: "G L Documents", url: "gl", icon: FileText },
      { title: "IOT-SENSORS — 1 ta", url: "", icon: FileText, separator: true },
      { title: "Iot Sensors", url: "iot-sensors", icon: FileText },
      { title: "MACHINE-STATUS-CURRENT — 1 ta", url: "", icon: FileText, separator: true },
      { title: "Machine Status", url: "machine-status-current", icon: FileText },
      { title: "PRODUCTION-FACTS — 1 ta", url: "", icon: FileText, separator: true },
      { title: "Production Facts", url: "production-facts", icon: FileText },
      { title: "ISHLAB CHIQARISH — 1 ta", url: "", icon: Factory, separator: true },
      { title: "Shift Reports", url: "production/shift-reports", icon: Factory },
      { title: "QUALITY-DEFECTS-CAMERA — 1 ta", url: "", icon: FileText, separator: true },
      { title: "Quality Defects Camera", url: "quality-defects-camera", icon: FileText },
      { title: "USERS — 1 ta", url: "", icon: FileText, separator: true },
      { title: "Users", url: "users", icon: FileText },
      { title: "WASTE — 1 ta", url: "", icon: FileText, separator: true },
      { title: "Waste", url: "waste", icon: FileText },
      { title: "WEEKLY-PLANS — 1 ta", url: "", icon: FileText, separator: true },
      { title: "Weekly Plans", url: "weekly-plans", icon: FileText },
    ],
  },
};
