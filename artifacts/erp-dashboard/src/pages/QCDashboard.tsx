/**
 * @module QCDashboard
 * @description React page component. Route-level UI.
 * State management, hooks, and section orchestration only.
 * See QCDashboardTypes.ts, QCDashboardSections.tsx, QCDashboardDialogs.tsx
 * for the split-out pieces.
 */

import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

import type { QcStats, QcFlowData, QcBrak, QcReclamation, QcSupplierQuality } from "./QCDashboardTypes";
import { KpiSection, QcFlowSection, AttentionSection, SummarySection } from "./QCDashboardSections";
import { useTranslation } from '@/lib/i18n';

// ─── Main Component ───────────────────────────────────────────────────────────

export default function QCDashboard() {
  const { t } = useTranslation("common");
  const { data: stats,    isLoading: sLoad  } = useQuery<QcStats>            ({ queryKey: ["/api/qc/dashboard/stats"] });
  const { data: flow,     isLoading: fLoad  } = useQuery<QcFlowData>         ({ queryKey: ["/api/qc/dashboard/flow"] });
  const { data: braks,    isLoading: bLoad  } = useQuery<QcBrak[]>           ({ queryKey: ["/api/qc/braks"] });
  const { data: recRaw,   isLoading: rLoad  } = useQuery<QcReclamation[]>    ({ queryKey: ["/api/qc/reclamations"] });
  const { data: supplier, isLoading: suLoad } = useQuery<QcSupplierQuality[]>({ queryKey: ["/api/qc/supplier-quality"] });

  const recs:      QcReclamation[]    = Array.isArray(recRaw)   ? recRaw   : [];
  const suppliers: QcSupplierQuality[] = Array.isArray(supplier) ? supplier : [];
  const brakList:  QcBrak[]           = Array.isArray(braks)    ? braks    : [];

  const passRate  = stats?.tests?.passRate || 0;
  const passColor = passRate >= 95 ? "text-[var(--ep-green)]" : passRate >= 85 ? "text-[var(--ep-yellow)]" : "text-[var(--ep-red)]";

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("qcSifatNazorati")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("k4TaQcOqimiSifat")}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={cn(
            "text-sm font-semibold px-3",
            passRate >= 95 ? "bg-green-50 text-[var(--ep-green)]" :
            passRate >= 85 ? "bg-amber-50 text-[var(--ep-yellow)]" :
                             "bg-red-50 text-[var(--ep-red)]"
          )}>
            O'tish darajasi: {sLoad ? "..." : `${passRate}%`}
          </Badge>
          {(stats?.openRca || 0) > 0 && (
            <Badge className="bg-orange-50 text-[var(--ep-primary)] text-sm px-3">
              {stats?.openRca} ochiq RCA
            </Badge>
          )}
        </div>
      </div>

      {/* ── SECTION 1: KPI Kartalar ────────────────────────── */}
      <KpiSection stats={stats} loading={sLoad} passColor={passColor} passRate={passRate} />

      {/* ── SECTION 2: 4 ta QC Oqimi ─────────────────────── */}
      <QcFlowSection flow={flow} loading={fLoad} />

      {/* ── SECTION 3: E'tibor kerak ─────────────────────── */}
      <AttentionSection
        recs={recs}
        brakList={brakList}
        suppliers={suppliers}
        rLoad={rLoad}
        bLoad={bLoad}
        suLoad={suLoad}
      />

      {/* ── SECTION 4: Sifat xulosa ─────────────────────── */}
      <SummarySection stats={stats} loading={sLoad} />

      {/* Tezkor harakatlar */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href="/qc-module">{t("qcModuli")}<ChevronRight className="w-3.5 h-3.5 ml-1" /></Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/qc-extended">{t("qcExtended")}<ChevronRight className="w-3.5 h-3.5 ml-1" /></Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/qc-final">{t("finalInspeksiya")}<ChevronRight className="w-3.5 h-3.5 ml-1" /></Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/qc-approval">{t("verify")}<ChevronRight className="w-3.5 h-3.5 ml-1" /></Link>
        </Button>
      </div>

    </div>
  );
}
