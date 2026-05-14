/**
 * @module KaizenPage
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Lightbulb, Plus, RefreshCw } from "lucide-react";

import type { KaizenSuggestion } from "./KaizenPageTypes";
import {
  KaizenStats, KaizenFilter, KaizenBoardSkeleton,
  KaizenKanbanBoard, KaizenFilteredGrid,
} from "./KaizenPageSections";
import { KaizenSubmitDialog, KaizenStatusDialog } from "./KaizenPageDialogs";
import { useTranslation } from '@/lib/i18n';

export default function KaizenPage() {
  const { t } = useTranslation("common");
  const [showSubmit, setShowSubmit]       = useState(false);
  const [statusTarget, setStatusTarget]   = useState<KaizenSuggestion | null>(null);
  const [filterStatus, setFilterStatus]   = useState("all");

  const { data, isLoading } = useQuery<{ suggestions: KaizenSuggestion[]; total: number }>({
    queryKey: ["/api/kaizen/suggestions", filterStatus !== "all" ? { status: filterStatus } : {}],
  });

  const { data: stats } = useQuery<{ stats: Record<string, number>; total: number }>({
    queryKey: ["/api/kaizen/stats"],
  });

  const suggestions = data?.suggestions ?? [];

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/kaizen/suggestions"] });
    queryClient.invalidateQueries({ queryKey: ["/api/kaizen/stats"] });
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <Lightbulb className="w-5 h-5 text-[var(--ep-blue)]" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{t("kaizenDoimiyTakomillashtirish")}</h1>
            <p className="text-sm text-muted-foreground">{t("xodimlarGoyalariniTopshiringVaKuzating")}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-1" /> {t("refresh")}
          </Button>
          <Button size="sm" onClick={() => setShowSubmit(true)}>
            <Plus className="w-4 h-4 mr-1" /> {t("goyaTopshirish")}
          </Button>
        </div>
      </div>

      {/* Stats */}
      {stats && <KaizenStats stats={stats} />}

      {/* Filter */}
      <KaizenFilter filterStatus={filterStatus} onFilterChange={setFilterStatus} />

      {/* Board */}
      {isLoading ? (
        <KaizenBoardSkeleton />
      ) : filterStatus === "all" ? (
        <KaizenKanbanBoard suggestions={suggestions} onStatusChange={setStatusTarget} />
      ) : (
        <KaizenFilteredGrid suggestions={suggestions} onStatusChange={setStatusTarget} />
      )}

      {/* Dialogs */}
      <KaizenSubmitDialog
        open={showSubmit}
        onOpenChange={setShowSubmit}
        onSuccess={handleRefresh}
      />
      <KaizenStatusDialog
        target={statusTarget}
        onClose={() => setStatusTarget(null)}
        onSuccess={handleRefresh}
      />
    </div>
  );
}
