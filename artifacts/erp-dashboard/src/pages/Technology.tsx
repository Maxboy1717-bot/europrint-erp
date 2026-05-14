/**
 * @module Technology
 * @description React page component. Route-level UI.
 */

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import {
  Clock, CheckCircle, XCircle, BarChart3,
  FileText, Layers, ArrowRight, Cpu, Package,
  AlertTriangle, RefreshCw,
} from "lucide-react";
import { EPStatusPill } from "@/components/ep";

interface DashboardStats {
  pendingCount: number;
  approvedToday: number;
  rejectedToday: number;
  avgProcessingHours: number;
}

interface TechOrder {
  id: string;
  papkaNo: string;
  mijozNomi: string;
  mahsulotNomi: string;
  mahsulotTuri: string;
  tiraj: number;
  formatA: number;
  formatB: number;
  tayyorBolishSanasi: string | null;
  status: string;
}

const STATUS_LABELS: Record<string, string> = {
  pending_tech: "Texnolog tasdiqini kutmoqda",
  approved: "Tasdiqlandi",
  rejected: "Rad etildi",
  in_progress: "Jarayonda",
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending_tech: "secondary",
  approved: "default",
  rejected: "destructive",
  in_progress: "outline",
};

function KpiCard({
  title, value, sub, icon: Icon, color, loading, error,
}: {
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  color: string;
  loading?: boolean;
  error?: boolean;
}) {
  return (
    <Card className="border-border/50">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground font-medium truncate">{title}</p>
            {loading ? (
              <Skeleton className="h-8 w-20 mt-1 rounded-lg" />
            ) : error ? (
              <p className="text-2xl font-bold mt-1 text-muted-foreground">—</p>
            ) : (
              <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
            )}
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </div>
          <div className="p-2 rounded-lg bg-muted/50 shrink-0">
            <Icon className={`w-5 h-5 ${error ? "text-muted-foreground" : color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function InlineError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-3">
      <AlertTriangle className="w-8 h-8 text-destructive/60" />
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">Ma'lumotlarni yuklashda xatolik</p>
        <p className="text-xs mt-1 opacity-70">{message}</p>
      </div>
      {onRetry && (
        <Button size="sm" variant="outline" onClick={onRetry} className="gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" />
          Qayta urinish
        </Button>
      )}
    </div>
  );
}

const QUICK_LINKS = [
  { label: "Texnolog Tasdiq", path: "/tech-approval", icon: CheckCircle, desc: "Buyurtmalar tasdiqlash jarayoni" },
  { label: "Texnologik Kartalar", path: "/tech-cards", icon: FileText, desc: "Mahsulot texnologik kartalari" },
  { label: "Dashboard", path: "/tech/dashboard-home", icon: BarChart3, desc: "Umumiy statistika va ko'rsatkichlar" },
  { label: "Material Alternativlari", path: "/tech/material-alternatives", icon: Package, desc: "Xarajat optimizatsiyasi" },
  { label: "Narx va Vaqt", path: "/tech/time-cost", icon: Clock, desc: "Vaqt va narx tahlili" },
  { label: "Buyurtma Parallelizm", path: "/tech/parallel-orders", icon: Layers, desc: "Parallel buyurtmalar boshqaruvi" },
];

export default function Technology() {
  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
    refetch: refetchStats,
  } = useQuery<DashboardStats>({
    queryKey: ["/api/technology/dashboard"],
    retry: 1,
  });

  const {
    data: orders,
    isLoading: ordersLoading,
    isError: ordersError,
    refetch: refetchOrders,
  } = useQuery<TechOrder[]>({
    queryKey: ["/api/technology/orders", "pending_tech"],
    queryFn: async () => {
      const res = await apiRequest('GET', "/api/technology/orders?status=pending_tech");
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? `Server xatosi: ${res.status}`);
      }
      const data: unknown = await res.json();
      if (typeof data === "object" && data !== null && "success" in data && !(data as { success: boolean }).success) {
        const err = (data as { error?: string }).error ?? "Server xatosi";
        throw new Error(err);
      }
      if (!Array.isArray(data)) throw new Error("Kutilmagan javob formati");
      return data as TechOrder[];
    },
    retry: false,
  });

  const orderList: TechOrder[] = Array.isArray(orders) ? orders : [];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Texnologiya Bo'limi</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Buyurtmalar texnologik nazorat, texnologik kartalar va material tahlili
          </p>
        </div>
        <Link href="/tech-approval">
          <Button className="gap-2">
            <Cpu className="w-4 h-4" />
            Tasdiqlash Paneli
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard
          title="Kutayotgan Buyurtmalar"
          value={stats?.pendingCount ?? 0}
          sub="Texnolog tasdig'ini kutmoqda"
          icon={Clock}
          color="text-[var(--ep-yellow)]"
          loading={statsLoading}
          error={statsError}
        />
        <KpiCard
          title="Bugun Tasdiqlangan"
          value={stats?.approvedToday ?? 0}
          sub="Bugungi ish kuni"
          icon={CheckCircle}
          color="text-[var(--ep-green)]"
          loading={statsLoading}
          error={statsError}
        />
        <KpiCard
          title="Bugun Rad Etilgan"
          value={stats?.rejectedToday ?? 0}
          sub="Qayta ishlashga qaytarildi"
          icon={XCircle}
          color="text-[var(--ep-red)]"
          loading={statsLoading}
          error={statsError}
        />
        <KpiCard
          title="O'rtacha Ishlash Vaqti"
          value={`${stats?.avgProcessingHours ?? 0}h`}
          sub="Bir buyurtma uchun"
          icon={BarChart3}
          color="text-[var(--ep-blue)]"
          loading={statsLoading}
          error={statsError}
        />
      </div>

      {statsError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 flex items-center gap-3 text-sm text-destructive">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Dashboard statistikalarini yuklab bo'lmadi.</span>
          <Button size="sm" variant="ghost" onClick={() => refetchStats()} className="ml-auto gap-1.5 text-destructive hover:text-destructive">
            <RefreshCw className="w-3.5 h-3.5" />
            Qayta
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-[var(--ep-yellow)]" />
                Kutayotgan Buyurtmalar
                {!ordersLoading && !ordersError && orderList.length > 0 && (
                  <EPStatusPill tone="neutral" className="ml-auto">{orderList.length}</EPStatusPill>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {ordersLoading && (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-lg" />
                  ))}
                </div>
              )}

              {!ordersLoading && ordersError && (
                <InlineError
                  message="Buyurtmalar ro'yxatini yuklab bo'lmadi. Ma'lumotlar bazasi migratsiyasi talab qilinishi mumkin."
                  onRetry={() => refetchOrders()}
                />
              )}

              {!ordersLoading && !ordersError && orderList.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                  <CheckCircle className="w-10 h-10 mb-3 opacity-20" />
                  <p className="text-sm font-medium">Kutayotgan buyurtmalar yo'q</p>
                  <p className="text-xs mt-1 opacity-70">Barcha buyurtmalar ko'rib chiqilgan</p>
                </div>
              )}

              {!ordersLoading && !ordersError && orderList.length > 0 && (
                <div className="space-y-2">
                  {orderList.slice(0, 8).map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between rounded-lg border border-border/50 px-4 py-3 hover:bg-muted/30 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold font-mono text-primary">
                            #{order.papkaNo}
                          </span>
                          <Badge variant={STATUS_VARIANT[order.status] ?? "outline"} className="text-xs">
                            {STATUS_LABELS[order.status] ?? order.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {order.mijozNomi} — {order.mahsulotNomi} ({order.tiraj} dona)
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        {order.tayyorBolishSanasi && (
                          <span className="text-xs text-muted-foreground">
                            {new Date(order.tayyorBolishSanasi).toLocaleDateString("uz-UZ")}
                          </span>
                        )}
                        <Link href="/tech-approval">
                          <Button size="sm" variant="ghost" className="h-7 px-2">
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                  {orderList.length > 8 && (
                    <Link href="/tech-approval">
                      <Button variant="outline" className="w-full mt-2" size="sm">
                        Barcha {orderList.length} ta buyurtmani ko'rish
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Tezkor Havolalar</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {QUICK_LINKS.map(({ label, path, icon: Icon, desc }) => (
                  <Link key={path} href={path}>
                    <div className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors cursor-pointer group">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium leading-none">{label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{desc}</p>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
