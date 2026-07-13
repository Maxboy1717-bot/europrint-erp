/**
 * @module DesignOrders
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Package, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { useTranslation } from "@/lib/i18n";
import { EPErrorState, EPPageHeader } from "@/components/ep";
interface DesignOrder {
  order: {
    id: string;
    orderNumber: string;
    dealId: string | null;
    clientName: string;
    clientCompany: string | null;
    productType: string;
    productName: string;
    brandName: string | null;
    quantity: number;
    status: string;
    priority: string;
    deadline: string | null;
    createdAt: Date;
  };
  designer: {
    id: string;
    fullName: string;
  } | null;
}

export default function DesignOrders() {
  const { t } = useTranslation('common');
  const [searchTerm, setSearchTerm] = useState("");

  // Owner decision 2026-07-13 (chat) — "buyurtma yaratish ... sahifalarini yo'qotish kerak
  // to'liq": this page's own "Create design order" button posted to POST /api/design/orders,
  // which is a permanent 501 stub (design.controller.ts) — it never worked. The real path is
  // automatic: an order created at /order-create with designFlag=true fires DesignRequired ->
  // design_orders gets a row via so-design-requested.listener.ts. A standalone "create a
  // design order with no originating sales order" button was also the wrong workflow under
  // that chain, not just a broken one — removed rather than repaired. This page now only
  // lists/links the design_orders the real chain produces.
  const { data: orders = [], isLoading, isError, error, refetch} = useQuery<DesignOrder[]>({
    queryKey: ["/api/design/orders"],
  });

  const filteredOrders = (Array.isArray(orders) ? orders : []).filter(item =>
    item.order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.order.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.order.productName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const STATUS_LABELS: Record<string, string> = {
    new: "Yangi",
    ai_generated: "AI Generatsiya",
    designer_review: "Dizayner ko'rmoqda",
    waiting_customer_approval: "Mijoz tasdig'i",
    revision_requested: "Tahrirlash",
    approved: "Tasdiqlangan",
    rejected: "Rad etilgan",
    archived: "Arxiv",
    // Eski UZ statuses (backward compat)
    yangi: "Yangi",
    jarayonda: "Jarayonda",
    "tasdiq-kutilmoqda": "Tasdiq kutilmoqda",
    tasdiqlangan: "Tasdiqlangan",
    "ishlab-chiqarish": "Ishlab chiqarish",
    yakunlangan: "Yakunlangan",
    "rad-etilgan": "Rad etilgan",
  };
  const STATUS_CLASSES: Record<string, string> = {
    new: "bg-slate-100 text-slate-700",
    ai_generated: "bg-purple-100 text-[var(--ep-purple)]",
    designer_review: "bg-blue-100 text-[var(--ep-blue)]",
    waiting_customer_approval: "bg-yellow-100 text-[var(--ep-yellow)]",
    revision_requested: "bg-orange-100 text-[var(--ep-primary)]",
    approved: "bg-green-100 text-[var(--ep-green)]",
    rejected: "bg-red-100 text-[var(--ep-red)]",
    archived: "bg-gray-100 text-gray-500",
    yangi: "bg-slate-100 text-slate-700",
    jarayonda: "bg-amber-100 text-[var(--ep-yellow)]",
    "tasdiq-kutilmoqda": "bg-yellow-100 text-[var(--ep-yellow)]",
    tasdiqlangan: "bg-green-100 text-[var(--ep-green)]",
    "ishlab-chiqarish": "bg-blue-100 text-[var(--ep-blue)]",
    yakunlangan: "bg-green-100 text-[var(--ep-green)]",
    "rad-etilgan": "bg-red-100 text-[var(--ep-red)]",
  };
  const getStatusBadge = (status: string) => {
    return `${STATUS_CLASSES[status] || 'bg-muted text-muted-foreground'} rounded-full px-2.5 py-0.5 text-xs font-semibold`;
  };
  const getStatusLabel = (status: string) => STATUS_LABELS[status] || status;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    );
  }


  if (isError) {
    return <EPErrorState onRetry={refetch}  error={error} />;
  }
  return (
    <div className="space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <EPPageHeader
        breadcrumb={<>{t("dashboard9")}<b className="text-foreground">{t("dizaynBuyurtmalari")}</b></>}
        title={t("dizaynBuyurtmalari")}
        subtitle={t("barchaDizaynBuyurtmalariniBoshqarishVa")}
      />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("buyurtmaRaqamiMijozYokiMahsulot")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
              data-testid="input-search"
            />
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <Card className="bg-card rounded-xl border-none shadow-none">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">{t('noResults')}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {(Array.isArray(filteredOrders) ? filteredOrders : []).map((item) => (
              <Link key={item.order.id} href={`/design-orders/${item.order.id}`}>
                <Card className="bg-card rounded-xl border-none shadow-none hover:bg-muted/40 transition-colors cursor-pointer" data-testid={`card-order-${item.order.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-[14px] font-semibold text-foreground">{item.order.orderNumber}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">{item.order.clientName}</p>
                        {item.order.clientCompany && (
                          <p className="text-xs text-muted-foreground">{item.order.clientCompany}</p>
                        )}
                      </div>
                      <span className={getStatusBadge(item.order.status)}>
                        {getStatusLabel(item.order.status)}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                  <div className="space-y-2 text-sm text-foreground">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("mahsulot")}</span>
                      <span className="font-medium">{item.order.productName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('type')}:</span>
                      <span className="capitalize">{item.order.productType}</span>
                    </div>
                    {item.order.brandName && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("brend1")}</span>
                        <span>{item.order.brandName}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('quantity')}:</span>
                      <span>{item.order.quantity.toLocaleString()}</span>
                    </div>
                    {item.designer && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("dizayner")}</span>
                        <span>{item.designer.fullName}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('priority')}:</span>
                      <Badge variant="outline" className="capitalize text-xs">{item.order.priority}</Badge>
                    </div>
                    {item.order.deadline && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("muddat1")}</span>
                        <span>{item.order.deadline}</span>
                      </div>
                    )}
                    {item.order.dealId && (
                      <div className="flex justify-between items-center pt-2 border-t border-surface-container">
                        <span className="text-muted-foreground">{t('crmDeal')}</span>
                        <Badge variant="outline" className="text-xs">
                          <ExternalLink className="h-3 w-3" />
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
