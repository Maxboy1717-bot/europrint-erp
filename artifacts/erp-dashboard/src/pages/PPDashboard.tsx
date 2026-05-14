/**
 * @module PPDashboard
 * @description React page component. Route-level UI.
 * State management, hooks, and orchestration only.
 * Sections: PPDashboardSections.tsx | Types: PPDashboardTypes.ts
 */

import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  Factory,
  Package,
  ClipboardList,
  Target,
  CheckCircle,
  Cog,
  Plus,
  RefreshCw,
  Calendar,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { queryClient } from "@/lib/queryClient";
import type { ProductionStats, PapkaOrder, MachineTask, KpiItem, QuickAction } from "./PPDashboardTypes";
import { KpiBar, OrdersTable, MachineTasksTable, QuickActionsSection } from "./PPDashboardSections";
import { EPErrorState, EPPageHeader } from "@/components/ep";

export default function PPDashboard() {
  const { t } = useTranslation("production");

  const { data: stats, isLoading, isError, refetch } = useQuery<ProductionStats>({
    queryKey: ["/api/production/stats"],
  });
  const { data: ordersData, isLoading: ordersLoading } = useQuery<Record<string, unknown>>({
    queryKey: ["/api/papka-orders"],
  });
  const { data: machineTasksData, isLoading: tasksLoading } = useQuery<MachineTask[]>({
    queryKey: ["/api/machine-tasks"],
  });

  const orders: PapkaOrder[] = Array.isArray(ordersData)
    ? ordersData
    : (Array.isArray(ordersData?.items)
        ? ordersData.items
        : Array.isArray(ordersData?.data)
        ? ordersData.data
        : Array.isArray(ordersData?.orders)
        ? ordersData.orders
        : []);
  const machineTasks = Array.isArray(machineTasksData) ? machineTasksData : [];

  const activeOrders = orders.filter((o) => o.status === "ishlab_chiqarishda").length;
  const completedOrders = orders.filter((o) => o.status === "tayyor").length;
  const pendingTasks = machineTasks.filter((t) => t.status === "pending").length;
  const inProgressTasks = machineTasks.filter((t) => t.status === "in_progress").length;

  const planningPct = Math.round(
    (Number(stats?.orders?.byStatus?.completed || 0) /
      Math.max(Number(stats?.orders?.total) || 1, 1)) *
      100
  );

  const kpiItems: KpiItem[] = [
    {
      label: "Faol Buyurtmalar",
      value: isLoading || ordersLoading ? "—" : activeOrders,
      desc: `${orders.length} ta jami buyurtma`,
      icon: Factory,
      accent: "text-[var(--ep-yellow)]",
      href: "/papka-orders",
    },
    {
      label: "Bajarilgan",
      value: isLoading || ordersLoading ? "—" : completedOrders,
      desc: "Bu hafta tayyor bo'lgan",
      icon: CheckCircle,
      accent: "text-[var(--ep-green)]",
      href: "/papka-orders",
    },
    {
      label: "Stanoq Vazifalari",
      value: isLoading || tasksLoading ? "—" : inProgressTasks,
      desc: `${pendingTasks} ta kutmoqda`,
      icon: Cog,
      accent: "text-[var(--ep-blue)]",
      href: "/machine-tasks",
    },
    {
      label: "Rejalashtirish",
      value: isLoading || ordersLoading ? "—" : `${planningPct}%`,
      desc: "Bajarilgan/jami buyurtmalar",
      icon: Target,
      accent: "text-[var(--ep-purple)]",
      href: "/planning",
    },
  ];

  const quickActions: QuickAction[] = [
    { title: t("newOrder"), href: "/order-wizard", icon: Plus },
    { title: t("scheduling"), href: "/planning", icon: Calendar },
    { title: t("createBom"), href: "/erp/pp/bom", icon: Package },
    { title: t("runMrp"), href: "/erp/pp/mrp", icon: ClipboardList },
  ];

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/production/stats"] });
    queryClient.invalidateQueries({ queryKey: ["/api/papka-orders"] });
    queryClient.invalidateQueries({ queryKey: ["/api/machine-tasks"] });
  };

  if (isError) return <EPErrorState onRetry={refetch} />;

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      {/* ─── Page Header ─── */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Factory className="h-8 w-8 text-primary" />
          </div>
          <div>
            <EPPageHeader
        breadcrumb={<>Dashboard · <b className="text-foreground">Ishlab Chiqarish Rejasi</b></>}
        title="Ishlab Chiqarish Rejasi"
        subtitle="Buyurtmalar, stanoq vazifalari va ishlab chiqarish rejasi"
      />
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="bg-muted/60 text-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-muted border-none"
            onClick={handleRefresh}
            data-testid="button-refresh-pp"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Yangilash
          </Button>
          <Button
            size="sm"
            className="bg-primary text-white rounded-lg px-5 py-2.5 text-sm font-semibold"
            asChild
            data-testid="button-new-order-pp"
          >
            <Link href="/order-wizard">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Yangi Buyurtma
            </Link>
          </Button>
        </div>
      </div>

      {/* ─── Dashboard Body ─── */}
      <div className="space-y-6">
        <KpiBar
          kpiItems={kpiItems}
          isLoading={isLoading}
          ordersLoading={ordersLoading}
        />

        <div className="grid gap-5 md:grid-cols-2">
          <OrdersTable orders={orders} ordersLoading={ordersLoading} />
          <MachineTasksTable machineTasks={machineTasks} tasksLoading={tasksLoading} />
        </div>

        <QuickActionsSection quickActions={quickActions} />
      </div>
    </div>
  );
}
