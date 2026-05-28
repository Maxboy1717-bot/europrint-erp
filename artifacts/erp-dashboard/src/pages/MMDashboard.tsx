/**
 * @module MMDashboard
 * @description React page component. Route-level UI.
 */

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard, StatsCardSkeleton } from "@/components/ui/stats-card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Package,
  Truck,
  ShoppingCart,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Box,
  Plus,
  PackageX,
  Loader2,
} from "lucide-react";
import { Link } from "wouter";
import { useTranslation } from '@/lib/i18n';
import {
  EPPageHeader, EPErrorState, EPEmptyState, EPSkeletonKpiRow,
} from "@/components/ep";

interface Material {
  id: string;
  name: string;
  quantity: number;
  minStock?: number;
  unit?: string;
}

interface Transaction {
  id: string;
  type: string;
  materialName?: string;
  notes?: string;
  date?: string;
  createdAt?: string;
  quantity: number;
  unit?: string;
}

interface Vendor {
  id: string;
  name: string;
  isActive: boolean;
}

interface PurchaseOrder {
  id: string;
  status: string;
}

export default function MMDashboard() {
  const { t } = useTranslation("common");
  const { data: materialsData, isLoading, error, isError, refetch} = useQuery<Material[]>({
    queryKey: ["/api/warehouse/materials"],
  });

  const { data: transactionsData } = useQuery<Transaction[]>({
    queryKey: ["/api/wms/transactions"],
  });

  const { data: vendorsData } = useQuery<Vendor[]>({
    queryKey: ["/api/mm/vendors"],
  });

  const { data: purchaseOrdersData } = useQuery<PurchaseOrder[]>({
    queryKey: ["/api/mm/purchase-orders"],
  });

  if (isLoading) {
    return (
      <div className="flex flex-col h-full p-5 lg:p-6 gap-5" data-testid="loading-spinner">
        <EPPageHeader
          breadcrumb={<>{t("dashboardMm")}<b className="text-foreground">{t("Materiallar")}</b></>}
          title={t("materiallarBoshqaruvi")}
          subtitle={t("materiallarVaZaxiralarniBoshqaring")}
        />
        <EPSkeletonKpiRow count={4} />
      </div>
    );
  }

  if (isError || error) {
    return (
      <div className="flex flex-col p-5 lg:p-6 gap-5">
        <EPPageHeader
          breadcrumb={<>{t("dashboardMm")}<b className="text-foreground">{t("Materiallar")}</b></>}
          title={t("materiallarBoshqaruvi")}
          subtitle={t("materiallarVaZaxiralarniBoshqaring")}
        />
        <EPErrorState onRetry={refetch}  error={error} />
      </div>
    );
  }

  const materials = Array.isArray(materialsData) ? materialsData : [];
  const transactions = Array.isArray(transactionsData) ? transactionsData : [];
  const vendors = Array.isArray(vendorsData) ? vendorsData : [];
  const purchaseOrders = Array.isArray(purchaseOrdersData) ? purchaseOrdersData : [];

  const lowStockMaterials = (Array.isArray(materials) ? materials : []).filter(
    (m: Material) => m.quantity <= (m.minStock || 0)
  ).length;

  const totalMaterials = materials.length;
  const activeVendors = (Array.isArray(vendors) ? vendors : []).filter((v: Vendor) => v.isActive).length;
  const pendingOrders = (Array.isArray(purchaseOrders) ? purchaseOrders : []).filter((po: PurchaseOrder) => po.status === "pending").length;

  const recentInbound = (Array.isArray(transactions) ? transactions : []).filter((t: Transaction) => t.type === "inbound").slice(0, 5);
  const recentOutbound = (Array.isArray(transactions) ? transactions : []).filter((t: Transaction) => t.type === "outbound").slice(0, 5);

  const statCards = [
    {
      title: "Jami Materiallar",
      value: totalMaterials,
      change: `${lowStockMaterials} kam qoldi`,
      icon: Package,
      href: "/warehouse-management",
    },
    {
      title: "Kam Zaxira",
      value: lowStockMaterials,
      change: "ogohlantirish",
      icon: AlertTriangle,
      href: "/warehouse-management",
    },
    {
      title: "Yetkazuvchilar",
      value: activeVendors,
      change: `${vendors.length} jami`,
      icon: Truck,
      href: "/mm/vendors",
    },
    {
      title: "Xarid Buyurtmalari",
      value: pendingOrders,
      change: "kutilmoqda",
      icon: ShoppingCart,
      href: "/mm/purchase-orders",
    },
  ];

  const quickActions = [
    { title: "Material qo'shish", href: "/warehouse-management", icon: Plus },
    { title: "Kirim qilish", href: "/warehouse-management", icon: ArrowDownRight },
    { title: "Chiqim qilish", href: "/warehouse-management", icon: ArrowUpRight },
    { title: "Xarid buyurtmasi", href: "/mm/purchase-orders", icon: ShoppingCart },
  ];

  if (materials.length === 0 && vendors.length === 0 && purchaseOrders.length === 0) {
    return (
      <div className="flex flex-col p-5 lg:p-6 gap-5">
        <EPPageHeader
          breadcrumb={<>{t("dashboardMm")}<b className="text-foreground">{t("Materiallar")}</b></>}
          title={t("materiallarBoshqaruvi")}
          subtitle={t("materiallarVaZaxiralarniBoshqaring")}
          data-testid="text-mm-dashboard-title"
        />
        <EPEmptyState
          icon={PackageX}
          title={t("haliMaterialYoq")}
          description={t("birinchiMaterialniQoshingOmborSahifasiga")}
          action={
            <Link href="/warehouse-management">
              <Button className="ep-btn-primary-shimmer gap-1.5">
                <Plus className="h-4 w-4" />
                {t("yangiMaterialQoshish")}
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col p-5 lg:p-6 gap-5">
      <EPPageHeader
        breadcrumb={<>{t("dashboardMm")}<b className="text-foreground">{t("Materiallar")}</b></>}
        title={t("materiallarBoshqaruvi")}
        subtitle={t("materiallarVaZaxiralarniBoshqaring")}
        data-testid="text-mm-dashboard-title"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {(Array.isArray(statCards) ? statCards : []).map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <div className="bg-card rounded-lg p-5 hover-elevate transition-all" data-testid={`card-stat-${stat.title.toLowerCase().replace(/\s/g, "-")}`}>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{stat.title}</p>
              <p className="text-4xl font-bold tracking-tight text-foreground">{stat.value}</p>
              <p className={`text-xs mt-2 font-medium ${stat.title === "Kam Zaxira" ? "text-[var(--ep-red)]" : "text-primary"}`}>{stat.change}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-card border-none rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <ArrowDownRight className="h-4 w-4 text-primary" />
              {t("oxirgiKirimlar")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(Array.isArray(recentInbound) ? recentInbound : []).map((tx: Transaction) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/40 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{tx.materialName || tx.notes}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date((tx.date || tx.createdAt)!).toLocaleDateString("uz-UZ")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">+{tx.quantity} {tx.unit || "dona"}</p>
                  </div>
                </div>
              ))}
              {recentInbound.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  {t("kirimlarMavjudEmas")}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-none rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <ArrowUpRight className="h-5 w-5 text-[var(--ep-red)]" />
              {t("oxirgiChiqimlar")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(Array.isArray(recentOutbound) ? recentOutbound : []).map((tx: Transaction) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/40 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{tx.materialName || tx.notes}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date((tx.date || tx.createdAt)!).toLocaleDateString("uz-UZ")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[var(--ep-red)]">-{tx.quantity} {tx.unit || "dona"}</p>
                  </div>
                </div>
              ))}
              {recentOutbound.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  {t("chiqimlarMavjudEmas")}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {lowStockMaterials > 0 && (
        <Card className="bg-[var(--ep-red)]/10/20 border-l-4 border-error rounded-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[var(--ep-red)] text-sm font-bold">
              <AlertTriangle className="h-5 w-5" />
              Kam Zaxiradagi Materiallar ({lowStockMaterials})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {(Array.isArray(materials) ? materials : []).filter((m: Material) => m.quantity <= (m.minStock || 0))
                .slice(0, 6)
                .map((m: Material) => (
                  <div
                    key={m.id}
                    className="p-3 rounded-lg bg-card shadow-sm"
                  >
                    <p className="text-sm font-medium text-foreground">{m.name}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">
                        {m.quantity} / {m.minStock || 0}
                      </span>
                      <Progress
                        value={(m.quantity / (m.minStock || 1)) * 100}
                        className="w-20 h-1.5 bg-muted/60"
                      />
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-card border-none rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <TrendingUp className="h-5 w-5 text-primary" />
            {t("tezkorHarakatlar")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            {(Array.isArray(quickActions) ? quickActions : []).map((action) => (
              <Button
                key={action.title}
                variant="outline"
                className="bg-muted/60 text-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-muted border-none justify-start h-auto p-4"
                asChild
                data-testid={`button-quick-${action.title.toLowerCase().replace(/\s/g, "-")}`}
              >
                <Link href={action.href}>
                  <action.icon className="h-4 w-4 mr-3 text-primary" />
                  <span>{action.title}</span>
                </Link>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
