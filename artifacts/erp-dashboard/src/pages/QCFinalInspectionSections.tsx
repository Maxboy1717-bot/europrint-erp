/**
 * @module QCFinalInspectionSections
 * @description Major section components for QCFinalInspection: stats panel,
 * pending-orders list, and recent-inspections list.
 */

import { UseMutationResult } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, ClipboardCheck } from "lucide-react";
import { PapkaOrder, FinalInspection, STATUS_MAP } from "./QCFinalInspectionTypes";
import { useTranslation } from '@/lib/i18n';

// ---------------------------------------------------------------------------
// Stats panel
// ---------------------------------------------------------------------------

interface StatsProps {
  ordersCount: number;
  inspections: FinalInspection[];
}

export function InspectionStats({ ordersCount, inspections }: StatsProps) {
  const { t } = useTranslation("common");
  const safeInspections = Array.isArray(inspections) ? inspections : [];
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="bg-card rounded-lg border-none shadow-none p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("Kutilmoqda")}</p>
        <p className="text-4xl font-bold tracking-tight text-foreground">{ordersCount}</p>
      </Card>
      <Card className="bg-card rounded-lg border-none shadow-none p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("otdi")}</p>
        <p className="text-4xl font-bold tracking-tight text-[var(--ep-green)]">
          {safeInspections.filter(i => i.status === "passed").length}
        </p>
      </Card>
      <Card className="bg-card rounded-lg border-none shadow-none p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("radEtildi")}</p>
        <p className="text-4xl font-bold tracking-tight text-[var(--ep-red)]">
          {safeInspections.filter(i => i.status === "failed").length}
        </p>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pending orders list
// ---------------------------------------------------------------------------

interface PendingOrdersProps {
  orders: PapkaOrder[];
  onInspect: (order: PapkaOrder) => void;
}

export function PendingOrdersList({ orders, onInspect }: PendingOrdersProps) {
  const { t } = useTranslation("common");
  const safeOrders = Array.isArray(orders) ? orders : [];
  return (
    <div>
      <h2 className="text-lg font-semibold mb-3 text-foreground">{t("tekshirishKutilmoqda")}</h2>
      {safeOrders.length === 0 ? (
        <Card className="bg-card rounded-lg border-none shadow-none">
          <CardContent className="py-10 text-center">
            <CheckCircle className="h-10 w-10 mx-auto text-[var(--ep-green)] mb-3" />
            <p className="font-medium text-foreground">{t("yakuniyTekshiruvKutayotganBuyurtmalarYoq")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {safeOrders.map(order => (
            <Card
              key={order.id}
              className="bg-card rounded-lg border-none shadow-none"
              data-testid={`final-order-${order.id}`}
            >
              <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
                <div>
                  <CardTitle className="text-base text-foreground">{order.papkaNo}</CardTitle>
                  <p className="text-sm text-muted-foreground">{order.mijozNomi}</p>
                </div>
                <Badge className="bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-semibold">
                  {STATUS_MAP[order.status]?.label || order.status}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {order.mahsulotNomi} · {order.tiraj?.toLocaleString()} dona
                  </div>
                  <Button
                    size="sm"
                    className="bg-primary text-white rounded-lg px-5 py-2.5 text-sm font-semibold"
                    onClick={() => onInspect(order)}
                    data-testid={`btn-inspect-${order.id}`}
                  >
                    <ClipboardCheck className="h-4 w-4 mr-1" />
                    {t("tekshiruvOtkazish")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Recent inspections list
// ---------------------------------------------------------------------------

interface RecentInspectionsProps {
  inspections: FinalInspection[];
  completeMutation: UseMutationResult<unknown, Error, string>;
}

export function RecentInspectionsList({ inspections, completeMutation }: RecentInspectionsProps) {
  const { t } = useTranslation("common");
  const safeInspections = Array.isArray(inspections) ? inspections : [];
  if (safeInspections.length === 0) return null;

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3 text-foreground">{t("songgiTekshiruvlar")}</h2>
      <div className="grid gap-2">
        {safeInspections.slice(0, 10).map(insp => (
          <Card
            key={insp.id}
            className="bg-card rounded-lg border-none shadow-none"
            data-testid={`inspection-${insp.id}`}
          >
            <CardContent className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {insp.status === "passed"
                  ? <CheckCircle className="h-4 w-4 text-[var(--ep-green)]" />
                  : <XCircle className="h-5 w-5 text-[var(--ep-red)]" />}
                <div>
                  <p className="text-sm font-medium text-foreground">{insp.papkaOrderId}</p>
                  <p className="text-xs text-muted-foreground">
                    Namuna: {insp.sampleQty} · Nuqson: {insp.defectQty} ({insp.defectRate?.toFixed(1)}%)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  className={
                    insp.status === "passed"
                      ? "bg-green-100 text-green-800 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                      : "bg-red-100 text-red-800 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                  }
                >
                  {insp.status === "passed" ? "O'tdi" : "Rad"}
                </Badge>
                {insp.status === "passed" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-muted/60 text-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-muted border-none"
                    onClick={() => completeMutation.mutate(insp.id)}
                    disabled={completeMutation.isPending}
                    data-testid={`btn-complete-${insp.id}`}
                  >
                    {t("tugatish")}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
