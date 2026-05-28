/**
 * @module QCDashboardAttention
 * @description "E'tibor kerak" and summary section components for the QC Dashboard:
 * AttentionSection (reclamations, brak analysis, supplier quality)
 * and SummarySection (quality KPI summary table).
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle, TrendingDown, CheckCircle, Truck,
} from "lucide-react";
import { cn } from "@/lib/utils";

import type { QcStats, QcBrak, QcReclamation, QcSupplierQuality } from "./QCDashboardTypes";
import { useTranslation } from '@/lib/i18n';
import { tLabel } from '@/lib/i18n/tLabel';

// ─── AttentionSection ─────────────────────────────────────────────────────────

interface AttentionSectionProps {
  recs: QcReclamation[];
  brakList: QcBrak[];
  suppliers: QcSupplierQuality[];
  rLoad: boolean;
  bLoad: boolean;
  suLoad: boolean;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  approveLoading?: boolean;
}

export function AttentionSection({
  recs, brakList, suppliers, rLoad, bLoad, suLoad, onApprove, onReject, approveLoading,
}: AttentionSectionProps) {
  const { t } = useTranslation("common");
  return (
    <section>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        {t("etiborKerak")}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Ochiq reklamatsiyalar */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[var(--ep-yellow)]" />
              {t("ochiqReklamatsiyalar")}
              <Badge variant="outline" className="ml-auto text-xs">
                {(Array.isArray(recs) ? recs : []).filter(r => r.status === "new").length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {rLoad ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <Skeleton key={`k-${i}`} className="h-8 w-full rounded-lg" />)}
              </div>
            ) : recs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">{t("reklamatsiyaYoq")}</p>
            ) : (
              <div className="space-y-2">
                {recs.slice(0, 5).map(r => (
                  <div key={r.id} className="flex items-center justify-between text-sm py-1 gap-2">
                    <span className="truncate max-w-[120px] text-muted-foreground flex-1">
                      {r.clientName || `#${r.id}`}
                    </span>
                    <Badge className={cn(
                      "text-xs shrink-0",
                      r.status === "new"           ? "bg-red-50 text-[var(--ep-red)]" :
                      r.status === "investigating" ? "bg-amber-50 text-[var(--ep-yellow)]" :
                                                    "bg-green-50 text-[var(--ep-green)]"
                    )}>
                      {r.status === "new"
                        ? "Yangi"
                        : r.status === "investigating"
                        ? "Ko'rilmoqda"
                        : r.status}
                    </Badge>
                    {r.status === "new" && onApprove && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-xs px-2 shrink-0 text-[var(--ep-green)]"
                        onClick={() => onApprove(r.id)}
                        disabled={approveLoading}
                        data-testid={`button-approve-rec-${r.id}`}
                      >
                        {tLabel('common.QCDashboard.tasdiqlash', "Tasdiqlash")}
                      </Button>
                    )}
                    {r.status === "new" && onReject && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-xs px-2 shrink-0 text-[var(--ep-red)]"
                        onClick={() => onReject(r.id)}
                        data-testid={`button-reject-rec-${r.id}`}
                      >
                        {tLabel('common.QCDashboard.rad', "Rad")}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Brak tahlili */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-[var(--ep-red)]" />
              {t("brakSabablari")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bLoad ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <Skeleton key={`k-${i}`} className="h-8 w-full rounded-lg" />)}
              </div>
            ) : brakList.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">{t("brakTopilmadi")}</p>
            ) : (
              <div className="space-y-2">
                {brakList.slice(0, 5).map((b, i) => (
                  <div key={b.id} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground truncate max-w-[180px]">
                      {b.reason || `Brak #${i + 1}`}
                    </span>
                    <span className="font-semibold text-[var(--ep-red)] ml-2">{b.quantity} dona</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Yetkazuvchi sifati */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Truck className="w-4 h-4 text-[var(--ep-purple)]" />
              {t("yetkazuvchiSifati")}
              <Badge variant="outline" className="ml-auto text-xs">{suppliers.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {suLoad ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <Skeleton key={`k-${i}`} className="h-8 w-full rounded-lg" />)}
              </div>
            ) : suppliers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">{t("malumotYoq")}</p>
            ) : (
              <div className="space-y-2">
                {suppliers.slice(0, 5).map(s => (
                  <div key={s.id} className="flex items-center justify-between text-sm py-1">
                    <span className="truncate max-w-[140px] text-muted-foreground">
                      {s.supplierName || `#${s.id}`}
                    </span>
                    <span className={cn(
                      "font-semibold text-xs ml-2",
                      (s.qualityScore || 0) >= 90 ? "text-[var(--ep-green)]" :
                      (s.qualityScore || 0) >= 70 ? "text-[var(--ep-yellow)]" : "text-[var(--ep-red)]"
                    )}>
                      {s.qualityScore !== undefined ? `${s.qualityScore}/100` : "—"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </section>
  );
}

// ─── SummarySection ───────────────────────────────────────────────────────────

interface SummarySectionProps {
  stats: QcStats | undefined;
  loading: boolean;
}

export function SummarySection({ stats, loading }: SummarySectionProps) {
  const { t } = useTranslation("common");
  const rows = [
    {
      label: "O'tish darajasi",
      value: `${stats?.tests?.passRate || 0}%`,
      target: "≥ 95%",
      ok: (stats?.tests?.passRate || 0) >= 95,
    },
    {
      label: "Ochiq reklamatsiyalar",
      value: stats?.reclamations?.open || 0,
      target: "= 0",
      ok: (stats?.reclamations?.open || 0) === 0,
    },
    {
      label: "Brak soni",
      value: stats?.braks?.count || 0,
      target: "< 5",
      ok: (stats?.braks?.count || 0) < 5,
    },
    {
      label: "Ochiq RCA",
      value: stats?.openRca || 0,
      target: "= 0",
      ok: (stats?.openRca || 0) === 0,
    },
  ];

  return (
    <section>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        {t("sifatKorsatkichlari")}
      </p>
      <Card>
        <CardContent className="p-5">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => <Skeleton key={`k-${i}`} className="h-5 w-full rounded-lg" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {rows.map(row => (
                <div key={row.label} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{row.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{row.value}</span>
                    <span className="text-xs text-muted-foreground">({row.target})</span>
                    {row.ok
                      ? <CheckCircle className="w-3.5 h-3.5 text-[var(--ep-green)]" />
                      : <AlertTriangle className="w-3.5 h-3.5 text-[var(--ep-yellow)]" />
                    }
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
