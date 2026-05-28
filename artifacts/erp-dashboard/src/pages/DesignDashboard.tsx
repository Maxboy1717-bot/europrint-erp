/**
 * @module DesignDashboard
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Package, CheckCircle, Palette, FileText, Zap, Clock } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { EPErrorState, EPPageHeader } from "@/components/ep";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

import { tLabel } from '@/lib/i18n/tLabel';
interface DesignStats {
  totalOrders: number;
  activeOrders: number;
  completedOrders: number;
  totalDesigns: number;
  approvedDesigns: number;
  totalTemplates: number;
  totalPrompts: number;
  ordersByStatus: Array<{ status: string; count: number }>;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    clientName: string;
    productName: string;
    productType: string;
    status: string;
  }>;
}

const STATUS_COLORS: Record<string, string> = {
  yangi: "#3b82f6",
  jarayonda: "#f59e0b",
  "tasdiq-kutilmoqda": "#8b5cf6",
  tasdiqlangan: "#10b981",
  "ishlab-chiqarish": "#06b6d4",
  yakunlangan: "#22c55e",
};

const STATUS_LABELS: Record<string, string> = {
  yangi: "Yangi",
  jarayonda: "Jarayonda",
  "tasdiq-kutilmoqda": "Tasdiq kutilmoqda",
  tasdiqlangan: "Tasdiqlangan",
  "ishlab-chiqarish": "Ishlab chiqarishda",
  yakunlangan: "Yakunlangan",
};

export default function DesignDashboard() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [pendingStatus, setPendingStatus] = useState<Record<string, string>>({});

  const { data: stats, isLoading, isError, error, refetch } = useQuery<DesignStats>({
    queryKey: ["/api/design/statistics"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiRequest("PATCH", `/api/design/${id}/status`, { status }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/design/statistics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/design"] });
      setPendingStatus(prev => { const n = { ...prev }; delete n[variables.id]; return n; });
      toast({ title: tLabel('common.DesignDashboard.statusYangilandi', "Status yangilandi") });
    },
    onError: () => toast({
      title: tLabel('common.DesignDashboard.serverXatosi', "Server xatosi"),
      description: tLabel('common.DesignDashboard.ushbuFunksiyaHaliSozlanmoqda', "Ushbu funksiya hali sozlanmoqda"),
      variant: "destructive",
    }),
  });

  const approvalRate = stats?.totalDesigns
    ? Math.round((stats.approvedDesigns / stats.totalDesigns) * 100)
    : 0;

  const statusData =
    stats?.ordersByStatus?.map((item) => ({
      name: STATUS_LABELS[item.status] || item.status,
      value: item.count,
      color: STATUS_COLORS[item.status] || "#6b7280",
    })) || [];

  const kpiItems = [
    { label: "Jami Buyurtmalar", value: stats?.totalOrders || 0, desc: `${stats?.activeOrders || 0} ta faol`, icon: Package, accent: "text-[var(--ep-primary)]", testId: "text-total-orders" },
    { label: "Bajarilgan", value: stats?.completedOrders || 0, desc: "Muvaffaqiyatli", icon: CheckCircle, accent: "text-[var(--ep-green)]", testId: "text-completed-orders" },
    { label: "AI Dizaynlar", value: stats?.totalDesigns || 0, desc: `${stats?.approvedDesigns || 0} ta tasdiqlangan`, icon: Palette, accent: "text-[var(--ep-purple)]", testId: "text-total-designs" },
    { label: "Brend Shablonlar", value: stats?.totalTemplates || 0, desc: "Faol shablonlar", icon: FileText, accent: "text-[var(--ep-blue)]", testId: "text-templates" },
  ];

  if (isError) return <EPErrorState onRetry={refetch}  error={error} />;

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <div className="flex items-center justify-between gap-4">
        <EPPageHeader
        breadcrumb={<>{t("dashboard9")}<b className="text-foreground">Dizayn {t('dashboard7')}</b></>}
        title="Dizayn {t('dashboard7')}"
      />
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          {t("refresh")}
        </Button>
      </div>

      {/* ─── Unified KPI Bar ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {isLoading ? (
          ([0, 1, 2, 3]).map((i) => (
            <div key={`k-${i}`} className="bg-card rounded-lg p-5 space-y-3">
              <Skeleton className="h-3 w-24 rounded-lg" />
              <Skeleton className="h-9 w-28 rounded-lg" />
            </div>
          ))
        ) : (
          (Array.isArray(kpiItems) ? kpiItems : []).map((item, i) => (
            <div key={`k-${i}`} className="bg-card rounded-lg p-5" data-testid={item.testId}>
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
          ))
        )}
      </div>

      {/* Qo'shimcha KPI mini qatori */}
      {!isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-card rounded-lg p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("aiPromptlar")}</p>
            <p className="text-4xl font-bold tracking-tight text-foreground mt-1" data-testid="text-prompts">{stats?.totalPrompts || 0}</p>
          </div>
          <div className="bg-card rounded-lg p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("tasdiqlashKorsatkichi")}</p>
            <p className="text-4xl font-bold tracking-tight text-foreground mt-1" data-testid="text-approval-rate">{approvalRate}%</p>
          </div>
          <div className="bg-card rounded-lg p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("tasdiqlanganDizaynlar")}</p>
            <p className="text-4xl font-bold tracking-tight text-foreground mt-1">{stats?.approvedDesigns || 0}</p>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-card rounded-xl p-6">
          <h3 className="text-sm font-semibold mb-4">{t("buyurtmalarStatusTaqsimoti")}</h3>
          <div className="h-[260px]">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                    outerRadius={90}
                    dataKey="value"
                  >
                    {(Array.isArray(statusData) ? statusData : []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, n]} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                {t("noData")}
              </div>
            )}
          </div>
        </div>

        <div className="bg-card rounded-xl p-6">
          <h3 className="text-sm font-semibold mb-4">{t("buyurtmalarStatistikasi")}</h3>
          <div className="h-[260px]">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.04)" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="value" name={tLabel('common.DesignDashboard.buyurtmalar', "Buyurtmalar")} radius={[4, 4, 0, 0]}>
                    {(Array.isArray(statusData) ? statusData : []).map((entry, index) => (
                      <Cell key={`cell-bar-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                {t("noData")}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-card rounded-xl p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">{t("songgiBuyurtmalar1")}</h3>
        <div className="space-y-2">
          {isLoading ? (
            ([1, 2, 3, 4, 5]).map((i) => <Skeleton key={`k-${i}`} className="h-12 w-full rounded-lg" />)
          ) : stats?.recentOrders && stats.recentOrders.length > 0 ? (
            stats.recentOrders?.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-muted/40 transition-colors gap-3"
                data-testid={`row-order-${order.id}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{order.orderNumber}</p>
                  <p className="text-xs text-muted-foreground">{order.clientName} — {order.productName}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Select
                    value={pendingStatus[order.id] ?? order.status}
                    onValueChange={(val) => setPendingStatus(prev => ({ ...prev, [order.id]: val }))}
                  >
                    <SelectTrigger className="h-7 text-xs w-36" data-testid={`select-status-${order.id}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_LABELS).map(([val, label]) => (
                        <SelectItem key={val} value={val} className="text-xs">{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {pendingStatus[order.id] && pendingStatus[order.id] !== order.status && (
                    <Button
                      size="sm"
                      className="h-7 text-xs px-2"
                      onClick={() => updateStatusMutation.mutate({ id: order.id, status: pendingStatus[order.id] })}
                      disabled={updateStatusMutation.isPending}
                      data-testid={`button-update-status-${order.id}`}
                    >
                      {tLabel('common.DesignDashboard.saqlash', "Saqlash")}
                    </Button>
                  )}
                  <p className="text-[10px] text-muted-foreground">{order.productType}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-muted-foreground py-10 text-sm">{t("noData")}</div>
          )}
        </div>
      </div>
    </div>
  );
}
