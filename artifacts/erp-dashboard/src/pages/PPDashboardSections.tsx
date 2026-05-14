/**
 * @module PPDashboardSections
 * @description Major section components for PPDashboard:
 *   - KpiBar         — production KPI cards
 *   - OrdersTable    — recent papka orders table
 *   - MachineTasksTable — machine tasks table
 *   - QuickActionsSection — quick-action buttons grid
 */

import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import {
  Factory,
  Cog,
  ClipboardList,
  TrendingUp,
  Clock,
  CheckCircle,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import type { KpiItem, PapkaOrder, MachineTask, QuickAction } from "./PPDashboardTypes";

// ─── KPI Bar ────────────────────────────────────────────────────────────────

interface KpiBarProps {
  kpiItems: KpiItem[];
  isLoading: boolean;
  ordersLoading: boolean;
}

export function KpiBar({ kpiItems, isLoading, ordersLoading }: KpiBarProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
      {isLoading || ordersLoading ? (
        ([0, 1, 2, 3]).map((i) => (
          <div key={`k-${i}`} className="bg-card rounded-lg p-5">
            <Skeleton className="h-3 w-24 mb-4 rounded-lg" />
            <Skeleton className="h-9 w-28 rounded-lg" />
          </div>
        ))
      ) : (
        (Array.isArray(kpiItems) ? kpiItems : []).map((item, i) => (
          <Link key={`k-${i}`} href={item.href}>
            <div
              className="bg-card rounded-lg p-5 hover:bg-muted/40 transition-colors cursor-pointer"
              data-testid={`kpi-pp-${i}`}
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {item.label}
              </p>
              <p className="text-4xl font-bold tracking-tight text-foreground mt-1">
                {item.value}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <item.icon className={cn("w-3.5 h-3.5", item.accent)} />
                <span className="text-xs text-muted-foreground">{item.desc}</span>
              </div>
            </div>
          </Link>
        ))
      )}
    </div>
  );
}

// ─── Orders Table ────────────────────────────────────────────────────────────

interface OrdersTableProps {
  orders: PapkaOrder[];
  ordersLoading: boolean;
}

export function OrdersTable({ orders, ordersLoading }: OrdersTableProps) {
  const { t } = useTranslation("production");

  return (
    <div className="bg-card rounded-xl p-6">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-4">
        <ClipboardList className="h-4 w-4 text-primary" />
        So'nggi Buyurtmalar
      </h3>
      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6 text-left">
                Order
              </th>
              <th className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6 text-right">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {ordersLoading ? (
              ([1, 2, 3, 4, 5]).map((i) => (
                <tr key={`k-${i}`} className="border-t border-border">
                  <td className="py-4 px-6"><Skeleton className="h-4 w-32 rounded-lg" /></td>
                  <td className="py-4 px-6 text-right"><Skeleton className="h-4 w-16 ml-auto rounded-lg" /></td>
                </tr>
              ))
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={2} className="text-center py-10">
                  <Factory className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">{t("noOrders")}</p>
                </td>
              </tr>
            ) : (
              (Array.isArray(orders) ? orders : []).slice(0, 5).map((order) => (
                <tr
                  key={order.id}
                  className="hover:bg-muted/40 transition-colors border-t border-border"
                  data-testid={`row-order-${order.id}`}
                >
                  <td className="py-4 px-6">
                    <div className="flex flex-col gap-0.5">
                      <p className="text-sm font-semibold text-foreground leading-none">
                        {order.orderNumber || order.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{order.clientName}</p>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <Badge className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                      order.status === "tayyor"
                        ? "bg-green-100 text-green-800"
                        : order.status === "ishlab_chiqarishda"
                        ? "bg-amber-100 text-amber-800"
                        : order.status === "rejalashtirilgan"
                        ? "bg-primary/10 text-primary"
                        : order.status === "kutilmoqda"
                        ? "bg-muted/60 text-muted-foreground"
                        : order.status === "bloklangan"
                        ? "bg-red-100 text-red-800"
                        : "bg-primary/10 text-primary"
                    )}>
                      {order.status === "tayyor"
                        ? t("ready")
                        : order.status === "ishlab_chiqarishda"
                        ? t("inProcess")
                        : t("new")}
                    </Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Machine Tasks Table ─────────────────────────────────────────────────────

interface MachineTasksTableProps {
  machineTasks: MachineTask[];
  tasksLoading: boolean;
}

export function MachineTasksTable({ machineTasks, tasksLoading }: MachineTasksTableProps) {
  const { t } = useTranslation("production");

  return (
    <div className="bg-card rounded-xl p-6">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-4">
        <Cog className="h-4 w-4 text-primary" />
        {t("machineTasks")}
      </h3>
      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6 text-left">
                Task
              </th>
              <th className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6 text-right">
                Progress
              </th>
            </tr>
          </thead>
          <tbody>
            {tasksLoading ? (
              ([1, 2, 3, 4, 5]).map((i) => (
                <tr key={`k-${i}`} className="border-t border-border">
                  <td className="py-4 px-6"><Skeleton className="h-4 w-32 rounded-lg" /></td>
                  <td className="py-4 px-6 text-right"><Skeleton className="h-4 w-16 ml-auto rounded-lg" /></td>
                </tr>
              ))
            ) : machineTasks.length === 0 ? (
              <tr>
                <td colSpan={2} className="text-center py-10">
                  <Cog className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">{t("noTasks")}</p>
                </td>
              </tr>
            ) : (
              (Array.isArray(machineTasks) ? machineTasks : []).slice(0, 5).map((task) => (
                <tr
                  key={task.id}
                  className="hover:bg-muted/40 transition-colors border-t border-border"
                  data-testid={`row-task-${task.id}`}
                >
                  <td className="py-4 px-6">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {task.operationName}
                      </p>
                      <p className="text-xs text-muted-foreground">{task.machineName}</p>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {task.status === "in_progress" && (
                        <Clock className="h-3.5 w-3.5 text-[var(--ep-yellow)]" />
                      )}
                      {task.status === "completed" && (
                        <CheckCircle className="h-3.5 w-3.5 text-[var(--ep-green)]" />
                      )}
                      <span className="text-sm font-bold text-foreground">
                        {task.progress || 0}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Quick Actions Section ───────────────────────────────────────────────────

interface QuickActionsSectionProps {
  quickActions: QuickAction[];
}

export function QuickActionsSection({ quickActions }: QuickActionsSectionProps) {
  const { t } = useTranslation("production");

  return (
    <div className="bg-card rounded-xl p-6">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-4">
        <TrendingUp className="h-4 w-4 text-primary" />
        {t("quickActions")}
      </h3>
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
        {(Array.isArray(quickActions) ? quickActions : []).map((action) => (
          <Button
            key={action.href}
            variant="outline"
            className="bg-muted/60 text-foreground rounded-lg px-4 py-6 text-sm font-medium hover:bg-muted border-none justify-start"
            asChild
            data-testid={`button-quick-${action.href.replace(/\//g, "-").slice(1)}`}
          >
            <Link href={action.href}>
              <action.icon className="h-4 w-4 mr-3 text-primary shrink-0" />
              <span className="text-sm font-medium">{action.title}</span>
            </Link>
          </Button>
        ))}
      </div>
    </div>
  );
}
