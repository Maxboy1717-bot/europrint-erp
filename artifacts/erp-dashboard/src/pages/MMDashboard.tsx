import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard, StatsCardSkeleton } from "@/components/ui/stats-card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
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
import { EmptyState } from "@/components/ui/empty-state";
import { Link } from "wouter";
import { ErrorState } from "@/components/ui/error-state";

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
  const { data: materialsData, isLoading, error, isError, refetch} = useQuery<Material[]>({
    queryKey: ["/api/warehouse/materials"],
  });

  const { data: transactionsData } = useQuery<Transaction[]>({
    queryKey: ["/api/warehouse/transactions"],
  });

  const { data: vendorsData } = useQuery<Vendor[]>({
    queryKey: ["/api/mm/vendors"],
  });

  const { data: purchaseOrdersData } = useQuery<PurchaseOrder[]>({
    queryKey: ["/api/mm/purchase-orders"],
  });

  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="loading-spinner">
        <PageHeader title="Materiallar" boldWord="Boshqaruvi" subtitle="Materiallar va zaxiralarni boshqaring" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {([1,2,3,4]).map(i => <div key={`k-${i}`} className="h-28 rounded-xl bg-surface-container-lowest animate-pulse" />)}
        </div>
      </div>
    );
  }


  if (isError) {
    return (
      <div className="flex-1 overflow-auto bg-surface p-6">
        <ErrorState onRetry={refetch} />
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2" data-testid="error-state">
        <AlertTriangle className="h-8 w-8 text-error" />
        <p className="text-on-surface-variant">Ma'lumotlarni yuklashda xatolik yuz berdi</p>
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
      <div className="space-y-6">
        <PageHeader title="Materiallar" boldWord="Boshqaruvi" subtitle="Materiallar va zaxiralarni boshqaring" data-testid="text-mm-dashboard-title" />
        <div className="bg-surface-container-lowest rounded-xl p-6">
          <EmptyState
            icon={PackageX}
            title="Materiallar topilmadi"
            description="Hozircha hech qanday material mavjud emas. Ombor sahifasiga o'tib yangi materiallar qo'shing."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Materiallar"
        boldWord="Boshqaruvi"
        subtitle="Materiallar va zaxiralarni boshqaring"
        data-testid="text-mm-dashboard-title"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {(Array.isArray(statCards) ? statCards : []).map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <div className="bg-surface-container-lowest rounded-lg p-5 hover-elevate transition-all" data-testid={`card-stat-${stat.title.toLowerCase().replace(/\s/g, "-")}`}>
              <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">{stat.title}</p>
              <p className="text-4xl font-bold tracking-tight text-on-surface">{stat.value}</p>
              <p className={`text-xs mt-2 font-medium ${stat.title === "Kam Zaxira" ? "text-error" : "text-primary"}`}>{stat.change}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-surface-container-lowest border-none rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-on-surface-variant">
              <ArrowDownRight className="h-5 w-5 text-primary" />
              Oxirgi Kirimlar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(Array.isArray(recentInbound) ? recentInbound : []).map((tx: Transaction) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-container-low transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-on-surface">{tx.materialName || tx.notes}</p>
                    <p className="text-[11px] text-on-surface-variant">
                      {new Date((tx.date || tx.createdAt)!).toLocaleDateString("uz-UZ")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">+{tx.quantity} {tx.unit || "dona"}</p>
                  </div>
                </div>
              ))}
              {recentInbound.length === 0 && (
                <p className="text-center text-on-surface-variant py-4">
                  Kirimlar mavjud emas
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-surface-container-lowest border-none rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-on-surface-variant">
              <ArrowUpRight className="h-5 w-5 text-error" />
              Oxirgi Chiqimlar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(Array.isArray(recentOutbound) ? recentOutbound : []).map((tx: Transaction) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-container-low transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-on-surface">{tx.materialName || tx.notes}</p>
                    <p className="text-[11px] text-on-surface-variant">
                      {new Date((tx.date || tx.createdAt)!).toLocaleDateString("uz-UZ")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-error">-{tx.quantity} {tx.unit || "dona"}</p>
                  </div>
                </div>
              ))}
              {recentOutbound.length === 0 && (
                <p className="text-center text-on-surface-variant py-4">
                  Chiqimlar mavjud emas
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {lowStockMaterials > 0 && (
        <Card className="bg-error-container/20 border-l-4 border-error rounded-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-error text-sm font-bold">
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
                    className="p-3 rounded-lg bg-surface-container-lowest shadow-sm"
                  >
                    <p className="text-sm font-medium text-on-surface">{m.name}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-on-surface-variant">
                        {m.quantity} / {m.minStock || 0}
                      </span>
                      <Progress
                        value={(m.quantity / (m.minStock || 1)) * 100}
                        className="w-20 h-1.5 bg-surface-container"
                      />
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-surface-container-lowest border-none rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-on-surface-variant">
            <TrendingUp className="h-5 w-5 text-primary" />
            Tezkor Harakatlar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            {(Array.isArray(quickActions) ? quickActions : []).map((action) => (
              <Button
                key={action.title}
                variant="outline"
                className="bg-surface-container text-on-surface rounded-lg px-4 py-2 text-sm font-medium hover:bg-surface-container-high border-none justify-start h-auto p-4"
                asChild
                data-testid={`button-quick-${action.title.toLowerCase().replace(/\s/g, "-")}`}
              >
                <Link href={action.href}>
                  <action.icon className="h-5 w-5 mr-3 text-primary" />
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
