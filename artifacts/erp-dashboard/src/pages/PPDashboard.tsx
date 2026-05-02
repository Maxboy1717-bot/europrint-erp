import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import { ErrorState } from "@/components/ui/error-state";
import { Badge } from "@/components/ui/badge";
import {
  Factory,
  Package,
  ClipboardList,
  Target,
  TrendingUp,
  Calendar,
  Cog,
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  RefreshCw,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { queryClient } from "@/lib/queryClient";

interface ProductionStats {
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
interface PapkaOrder {
  id: string;
  orderNumber?: string;
  name?: string;
  clientName?: string;
  status: string;
}
interface MachineTask {
  id: string;
  operationName: string;
  machineName: string;
  status: string;
  progress?: number;
}

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
    : (Array.isArray(ordersData?.items) ? ordersData.items : Array.isArray(ordersData?.data) ? ordersData.data : Array.isArray(ordersData?.orders) ? ordersData.orders : []);
  const machineTasks = Array.isArray(machineTasksData) ? machineTasksData : [];

  const activeOrders = (Array.isArray(orders) ? orders : []).filter((o) => o.status === "ishlab_chiqarishda").length;
  const completedOrders = (Array.isArray(orders) ? orders : []).filter((o) => o.status === "tayyor").length;
  const pendingTasks = (Array.isArray(machineTasks) ? machineTasks : []).filter((t) => t.status === "pending").length;
  const inProgressTasks = (Array.isArray(machineTasks) ? machineTasks : []).filter((t) => t.status === "in_progress").length;

  const kpiItems = [
    {
      label: "Faol Buyurtmalar",
      value: isLoading || ordersLoading ? "—" : activeOrders,
      desc: `${orders.length} ta jami buyurtma`,
      icon: Factory,
      accent: "text-amber-500",
      href: "/papka-orders",
    },
    {
      label: "Bajarilgan",
      value: isLoading || ordersLoading ? "—" : completedOrders,
      desc: "Bu hafta tayyor bo'lgan",
      icon: CheckCircle,
      accent: "text-green-500",
      href: "/papka-orders",
    },
    {
      label: "Stanoq Vazifalari",
      value: isLoading || tasksLoading ? "—" : inProgressTasks,
      desc: `${pendingTasks} ta kutmoqda`,
      icon: Cog,
      accent: "text-blue-500",
      href: "/machine-tasks",
    },
    {
      label: "Rejalashtirish",
      value: isLoading || ordersLoading ? "—" : `${Math.round((Number(stats?.orders?.byStatus?.completed || 0) / Math.max(Number(stats?.orders?.total) || 1, 1)) * 100)}%`,
      desc: "Bajarilgan/jami buyurtmalar",
      icon: Target,
      accent: "text-purple-500",
      href: "/planning",
    },
  ];

  const quickActions = [
    { title: t("newOrder"), href: "/order-wizard", icon: Plus },
    { title: t("scheduling"), href: "/planning", icon: Calendar },
    { title: t("createBom"), href: "/erp/pp/bom", icon: Package },
    { title: t("runMrp"), href: "/erp/pp/mrp", icon: ClipboardList },
  ];

  if (isError) return <ErrorState onRetry={refetch} />;

  return (
    <div className="flex-1 overflow-auto bg-surface p-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Factory className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-4xl font-light tracking-tight text-on-surface">
              Ishlab Chiqarish <span className="font-bold text-primary">Rejasi</span>
            </h1>
            <p className="text-on-surface-variant">Buyurtmalar, stanoq vazifalari va ishlab chiqarish rejasi</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="bg-surface-container text-on-surface rounded-lg px-4 py-2 text-sm font-medium hover:bg-surface-container-high border-none"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ["/api/production/stats"] });
              queryClient.invalidateQueries({ queryKey: ["/api/papka-orders"] });
              queryClient.invalidateQueries({ queryKey: ["/api/machine-tasks"] });
            }}
            data-testid="button-refresh-pp"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Yangilash
          </Button>
          <Button
            size="sm"
            className="bg-gradient-to-br from-primary to-primary-dim text-white rounded-lg px-5 py-2.5 text-sm font-semibold"
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

      <div className="space-y-6">
        {/* ─── Unified KPI Bar ─── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {isLoading || ordersLoading ? (
            ([0, 1, 2, 3]).map((i) => (
              <div key={`k-${i}`} className="bg-surface-container-lowest rounded-lg p-5">
                <Skeleton className="h-3 w-24 mb-4" />
                <Skeleton className="h-9 w-28" />
              </div>
            ))
          ) : (
            (kpiItems ?? []).map((item, i) => (
              <Link key={`k-${i}`} href={item.href}>
                <div className="bg-surface-container-lowest rounded-lg p-5 hover:bg-surface-container-low transition-colors cursor-pointer" data-testid={`kpi-pp-${i}`}>
                  <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                    {item.label}
                  </p>
                  <p className="text-4xl font-bold tracking-tight text-on-surface mt-1">
                    {item.value}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <item.icon className={cn("w-3.5 h-3.5", item.accent)} />
                    <span className="text-xs text-on-surface-variant">{item.desc}</span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>

        {/* ─── Content Grid ─── */}
        <div className="grid gap-5 md:grid-cols-2">
          {/* Buyurtmalar */}
          <div className="bg-surface-container-lowest rounded-xl p-6">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-on-surface mb-4">
              <ClipboardList className="h-4 w-4 text-primary" />
              So'nggi Buyurtmalar
            </h3>
            <div className="overflow-hidden rounded-lg border border-outline-variant">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6 text-left">Order</th>
                    <th className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {ordersLoading ? (
                    ([1, 2, 3, 4, 5]).map((i) => (
                      <tr key={`k-${i}`} className="border-t border-outline-variant">
                        <td className="py-4 px-6"><Skeleton className="h-4 w-32" /></td>
                        <td className="py-4 px-6 text-right"><Skeleton className="h-4 w-16 ml-auto" /></td>
                      </tr>
                    ))
                  ) : orders.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="text-center py-10">
                        <Factory className="h-8 w-8 mx-auto mb-2 text-on-surface-variant/30" />
                        <p className="text-sm text-on-surface-variant">{t("noOrders")}</p>
                      </td>
                    </tr>
                  ) : (Array.isArray(orders) ? orders : []).slice(0, 5).map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-surface-container-low transition-colors border-t border-outline-variant"
                      data-testid={`row-order-${order.id}`}
                    >
                      <td className="py-4 px-6">
                        <div className="flex flex-col gap-0.5">
                          <p className="text-sm font-semibold text-on-surface leading-none">
                            {order.orderNumber || order.name}
                          </p>
                          <p className="text-xs text-on-surface-variant">{order.clientName}</p>
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
                            ? "bg-primary-container text-on-primary-container"
                            : order.status === "kutilmoqda"
                            ? "bg-surface-container text-on-surface-variant"
                            : order.status === "bloklangan"
                            ? "bg-red-100 text-red-800"
                            : "bg-primary-container text-on-primary-container"
                        )}>
                          {order.status === "tayyor" ? t("ready") : order.status === "ishlab_chiqarishda" ? t("inProcess") : t("new")}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Stanoq vazifalari */}
          <div className="bg-surface-container-lowest rounded-xl p-6">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-on-surface mb-4">
              <Cog className="h-4 w-4 text-primary" />
              {t("machineTasks")}
            </h3>
            <div className="overflow-hidden rounded-lg border border-outline-variant">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6 text-left">Task</th>
                    <th className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6 text-right">Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {tasksLoading ? (
                    ([1, 2, 3, 4, 5]).map((i) => (
                      <tr key={`k-${i}`} className="border-t border-outline-variant">
                        <td className="py-4 px-6"><Skeleton className="h-4 w-32" /></td>
                        <td className="py-4 px-6 text-right"><Skeleton className="h-4 w-16 ml-auto" /></td>
                      </tr>
                    ))
                  ) : machineTasks.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="text-center py-10">
                        <Cog className="h-8 w-8 mx-auto mb-2 text-on-surface-variant/30" />
                        <p className="text-sm text-on-surface-variant">{t("noTasks")}</p>
                      </td>
                    </tr>
                  ) : (Array.isArray(machineTasks) ? machineTasks : []).slice(0, 5).map((task) => (
                    <tr
                      key={task.id}
                      className="hover:bg-surface-container-low transition-colors border-t border-outline-variant"
                      data-testid={`row-task-${task.id}`}
                    >
                      <td className="py-4 px-6">
                        <div>
                          <p className="text-sm font-semibold text-on-surface">
                            {task.operationName}
                          </p>
                          <p className="text-xs text-on-surface-variant">{task.machineName}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {task.status === "in_progress" && <Clock className="h-3.5 w-3.5 text-amber-500" />}
                          {task.status === "completed" && <CheckCircle className="h-3.5 w-3.5 text-green-500" />}
                          <span className="text-sm font-bold text-on-surface">
                            {task.progress || 0}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ─── Quick Actions ─── */}
        <div className="bg-surface-container-lowest rounded-xl p-6">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-on-surface mb-4">
            <TrendingUp className="h-4 w-4 text-primary" />
            {t("quickActions")}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            {(Array.isArray(quickActions) ? quickActions : []).map((action) => (
              <Button
                key={action.href}
                variant="outline"
                className="bg-surface-container text-on-surface rounded-lg px-4 py-6 text-sm font-medium hover:bg-surface-container-high border-none justify-start"
                asChild
                data-testid={`button-quick-${action.href.replace(/\//g, "-").slice(1)}`}
              >
                <Link href={action.href}>
                  <action.icon className="h-5 w-5 mr-3 text-primary shrink-0" />
                  <span className="text-sm font-medium">{action.title}</span>
                </Link>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
