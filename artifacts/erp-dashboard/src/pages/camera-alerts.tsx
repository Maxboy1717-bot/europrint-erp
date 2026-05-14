/**
 * @module camera-alerts
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient, safeArray } from "@/lib/queryClient";
import {
  type CameraAlert,
  type Language,
  buildTranslations,
  filterAlerts,
} from "./camera-alerts-types";
import { AlertPageHeader, AlertStatCards, AlertsTable } from "./camera-alerts-sections";
import { EPErrorState } from "@/components/ep";

export default function CameraAlerts() {
  const { toast } = useToast();
  const [language, setLanguage] = useState<Language>("uz");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const { data: alerts, isLoading, isError, refetch } = useQuery<CameraAlert[]>({
    queryKey: ["/api/camera-alerts"],
  });

  const acknowledgeMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("POST", `/api/camera-alerts/${id}/acknowledge`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/camera-alerts"] });
      toast({
        title: language === "uz" ? "Tasdiqlandi" : "Подтверждено",
        description: language === "uz" ? "Ogohlantirish tasdiqlandi" : "Уведомление подтверждено",
      });
    },
  });

  const resolveMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("POST", `/api/camera-alerts/${id}/resolve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/camera-alerts"] });
      toast({
        title: language === "uz" ? "Hal qilindi" : "Решено",
        description: language === "uz" ? "Ogohlantirish hal qilindi" : "Уведомление решено",
      });
    },
  });

  const t = buildTranslations(language);
  const safeAlerts = safeArray<CameraAlert>(alerts);

  const filteredAlerts = filterAlerts(safeAlerts, searchTerm, filterType, filterSeverity, filterStatus);

  const totalAlerts = safeAlerts.length;
  const unresolvedAlerts = (Array.isArray(safeAlerts) ? safeAlerts : []).filter(a => !a.isResolved).length;
  const criticalAlerts = (Array.isArray(safeAlerts) ? safeAlerts : []).filter(a => a.severity === "critical" && !a.isResolved).length;

  if (isError) {
    return <EPErrorState onRetry={refetch} />;
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
        <Skeleton className="h-10 w-64 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {([...Array(3)]).map((_, i) => <Skeleton key={`k-${i}`} className="h-24 rounded-lg" />)}
        </div>
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AlertPageHeader
        t={t}
        language={language}
        onLanguageChange={setLanguage}
      />

      <AlertStatCards
        totalAlerts={totalAlerts}
        unresolvedAlerts={unresolvedAlerts}
        criticalAlerts={criticalAlerts}
        t={t}
      />

      <AlertsTable
        filteredAlerts={filteredAlerts}
        language={language}
        t={t}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterType={filterType}
        onFilterTypeChange={setFilterType}
        filterSeverity={filterSeverity}
        onFilterSeverityChange={setFilterSeverity}
        filterStatus={filterStatus}
        onFilterStatusChange={setFilterStatus}
        onAcknowledge={(id) => acknowledgeMutation.mutate(id)}
        onResolve={(id) => resolveMutation.mutate(id)}
        isAcknowledgePending={acknowledgeMutation.isPending}
        isResolvePending={resolveMutation.isPending}
      />
    </div>
  );
}
