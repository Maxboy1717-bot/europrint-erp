/**
 * @module HROffboarding
 * @description Route-level page component for HR Offboarding management.
 * Orchestrates state, queries, and top-level layout; delegates checklist
 * and dialog rendering to sub-modules.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  UserX, CheckCircle2, Clock, AlertCircle, FileText, Search, Plus,
  ShieldOff, ClipboardList,
} from "lucide-react";
import { getAuthHeaders } from "@/lib/queryClient";
import { type OffboardingCase, type Stats } from "./HROffboardingTypes";
import { OffboardingCard, CreateCaseDialog } from "./HROffboardingDialogs";
import { ChecklistPanel } from "./HROffboardingSteps";
import { apiRequest } from '@/lib/queryClient';
import { EPStatusPill } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function HROffboarding() {
  const { t } = useTranslation("common");
  const [statusFilter, setStatusFilter] = useState("active");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [checklistCaseId, setChecklistCaseId] = useState<number | null>(null);

  // ── Stats query ─────────────────────────────────────────────────────────────
  const { data: stats } = useQuery<Stats>({
    queryKey: ["/api/hr/offboarding/cases/stats"],
    queryFn: async () => {
      const r = await apiRequest('GET', "/api/hr/offboarding/cases/stats");
      if (!r.ok) return undefined;
      const d: unknown = await r.json();
      return (d && typeof d === "object" && !Array.isArray(d) ? d : {}) as Stats;
    },
  });

  // ── Cases list query ────────────────────────────────────────────────────────
  const { data: rawCases, isLoading } = useQuery<OffboardingCase[]>({
    queryKey: ["/api/hr/offboarding/cases", statusFilter, search],
    queryFn: async () => {
      const r = await fetch(
        `/api/hr/offboarding/cases?status=${
          statusFilter === "all" ? "" : statusFilter
        }&search=${encodeURIComponent(search)}`,
        { credentials: "include", headers: getAuthHeaders() },
      );
      if (!r.ok) return [];
      const d: unknown = await r.json();
      return Array.isArray(d)
        ? (d as OffboardingCase[])
        : Array.isArray((d as { items?: OffboardingCase[] })?.items)
        ? (d as { items: OffboardingCase[] }).items
        : [];
    },
  });

  // ── Derived values ──────────────────────────────────────────────────────────
  const safeStats = {
    active:    Number(stats?.active    ?? 0),
    completed: Number(stats?.completed ?? 0),
    cancelled: Number(stats?.cancelled ?? 0),
    total:     Number(stats?.total     ?? 0),
  };

  const casesList = Array.isArray(rawCases) ? rawCases : [];

  const statCards = [
    {
      label: "Jami",
      value: safeStats.total,
      color: "text-[var(--ep-blue)]",
      bg: "bg-blue-50 dark:bg-blue-900/10",
      icon: <FileText className="h-4 w-4 text-[var(--ep-blue)]" />,
    },
    {
      label: "Faol",
      value: safeStats.active,
      color: "text-[var(--ep-primary)]",
      bg: "bg-orange-50 dark:bg-orange-900/10",
      icon: <Clock className="h-4 w-4 text-[var(--ep-primary)]" />,
    },
    {
      label: "Yakunlangan",
      value: safeStats.completed,
      color: "text-[var(--ep-green)]",
      bg: "bg-green-50 dark:bg-green-900/10",
      icon: <CheckCircle2 className="h-4 w-4 text-[var(--ep-green)]" />,
    },
    {
      label: "Bekor qilindi",
      value: safeStats.cancelled,
      color: "text-gray-500",
      bg: "bg-gray-50 dark:bg-gray-800/20",
      icon: <AlertCircle className="h-4 w-4 text-gray-400" />,
    },
  ];

  const filterLabels: Record<string, string> = {
    all:       "Barchasi",
    active:    "Faol",
    completed: "Yakunlangan",
    cancelled: "Bekor",
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      {/* Page header */}
      <div className="border-b border-border/50 px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ShieldOff className="h-5 w-5 text-[var(--ep-primary)]" />
          <h1 className="font-semibold text-base">{t("hrOffboarding")}</h1>
          <EPStatusPill tone="neutral">{safeStats.active} faol</EPStatusPill>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="h-8 text-xs bg-[var(--ep-primary)] hover:bg-[var(--ep-primary)]/90 text-white"
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          {t("yangiJarayon")}
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-5">
        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-4 gap-4">
          {statCards.map(s => (
            <Card key={s.label}>
              <CardContent className="pt-4 pb-3 flex items-center gap-3">
                <div className={`rounded-full p-2.5 ${s.bg}`}>{s.icon}</div>
                <div>
                  <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder={t("xodimYokiBolimQidiring")}
              className="h-8 text-sm pl-8"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-1">
            {(["all", "active", "completed", "cancelled"] as const).map(s => (
              <Button
                key={s}
                size="sm"
                variant={statusFilter === s ? "default" : "outline"}
                className="h-8 text-xs px-3"
                onClick={() => setStatusFilter(s)}
              >
                {filterLabels[s]}
              </Button>
            ))}
          </div>
          {casesList.length > 0 && (
            <span className="text-xs text-muted-foreground ml-1">{casesList.length} ta</span>
          )}
        </div>

        {/* Cases list */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={`k-${i}`} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        ) : casesList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
            <UserX className="h-14 w-14 opacity-10" />
            <p className="text-sm">
              {statusFilter === "active"
                ? "Faol offboarding jarayonlari yo'q"
                : "Mos jarayon topilmadi"}
            </p>
            {statusFilter === "active" && (
              <Button
                size="sm"
                variant="outline"
                className="mt-2"
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                {t("yangiJarayonBoshlash")}
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {casesList.map(item => (
              <OffboardingCard
                key={item.id}
                item={item}
                onOpenChecklist={id => setChecklistCaseId(id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create case dialog */}
      <CreateCaseDialog open={createOpen} onClose={() => setCreateOpen(false)} />

      {/* Checklist dialog */}
      <Dialog
        open={checklistCaseId !== null}
        onOpenChange={v => !v && setChecklistCaseId(null)}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-[var(--ep-primary)]" />
              {t("offboardingChekListi")}
            </DialogTitle>
          </DialogHeader>
          {checklistCaseId !== null && (
            <ChecklistPanel
              caseId={checklistCaseId}
              onClose={() => setChecklistCaseId(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
