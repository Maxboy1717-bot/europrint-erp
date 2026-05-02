/**
 * DIZAYN-NEW: Barrel export
 * Barcha qayta ishlangan komponentlar uchun markaziy import nuqtasi
 *
 * Foydalanish:
 *   import { LoginRedesign, AppSidebarRedesign, DashboardStatsRedesign } from "@/dizayn-new";
 *   import { EmptyState, TableSkeleton, NotificationBell, AppHeader } from "@/dizayn-new";
 */

// ─── Login ────────────────────────────────────────────────────────────────────
export { LoginRedesign } from "./Login";

// ─── Sidebar ──────────────────────────────────────────────────────────────────
export { AppSidebarRedesign } from "./AppSidebar";

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
export { DashboardStatsRedesign } from "./DashboardStats";

// ─── Data Table ───────────────────────────────────────────────────────────────
export { DataTableRedesign, EmployeeTable, StatusBadge, STATUS_CONFIG } from "./DataTable";
export type { TableColumn, DataTableProps, EmployeeRow } from "./DataTable";

// ─── Empty State + Skeletons ──────────────────────────────────────────────────
export {
  EmptyState,
  TableSkeleton,
  CardSkeleton,
  StatsGridSkeleton,
  PageSkeleton,
} from "./EmptyState";

// ─── Notification Bell + Header ───────────────────────────────────────────────
export { NotificationBell, AppHeader } from "./NotificationBell";
export type { Notification } from "./NotificationBell";
