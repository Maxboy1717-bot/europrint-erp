/**
 * @module AuditConsole
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { History, Clock, Search, FileText, Download } from "lucide-react";

import {
  type AuditLog,
  type AuditStats,
  type AuditFilters,
  type AuditConsoleProps,
} from "./AuditConsoleTypes";
import {
  StatsCards,
  TimelineTab,
  SearchTab,
  DocumentTraceTab,
} from "./AuditConsoleSections";
import { ExportTab } from "./AuditConsoleExportTab";
import { AuditLogDetailDialog } from "./AuditConsoleDialogs";

export function AuditConsole({ onExportCSV, onExportExcel, onExportPDF }: AuditConsoleProps) {
  const { toast } = useToast();
  const [docSearchQuery, setDocSearchQuery] = useState("");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [filters, setFilters] = useState<AuditFilters>({
    actionType: "",
    entityType: "",
    source: "",
    documentNo: "",
  });

  const { data: auditStats, refetch } = useQuery<AuditStats>({
    queryKey: ["/api/europrint-control/audit-stats"],
  });

  const { data: auditLogs = [], isLoading } = useQuery<AuditLog[]>({
    queryKey: ["/api/europrint-control/audit-logs", filters],
  });

  const { data: actionTypes = [] } = useQuery<{ value: string; label: string }[]>({
    queryKey: ["/api/europrint-control/audit-action-types"],
  });

  const { data: sourceTypes = [] } = useQuery<{ value: string; label: string }[]>({
    queryKey: ["/api/europrint-control/audit-source-types"],
  });

  const handleRefresh = () => {
    refetch();
    toast({ title: "Yangilandi", description: "Ma'lumotlar muvaffaqiyatli yangilandi" });
  };

  const handleDocSearch = () => {
    if (docSearchQuery.trim()) {
      toast({ title: "Qidirilmoqda", description: `"${docSearchQuery}" bo'yicha qidiruv boshlandi` });
    }
  };

  return (
    <Card className="border-blue-500/30" data-testid="audit-console-section">
      <CardHeader className="bg-blue-500/5 border-b border-blue-500/20">
        <CardTitle className="flex items-center gap-2 text-[var(--ep-blue)] dark:text-blue-400">
          <History className="h-6 w-6" />
          AUDIT CONSOLE — 100% Qamrovli
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          Tizimda har qanday o'zgarish bu yerda ko'rinadi (immutable)
        </p>
      </CardHeader>
      <CardContent className="pt-6">
        <StatsCards auditStats={auditStats} />

        <Tabs defaultValue="timeline" className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-4">
            <TabsTrigger value="timeline" data-testid="audit-tab-timeline">
              <Clock className="h-4 w-4 mr-1" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="search" data-testid="audit-tab-search">
              <Search className="h-4 w-4 mr-1" />
              Qidirish
            </TabsTrigger>
            <TabsTrigger value="document" data-testid="audit-tab-document">
              <FileText className="h-4 w-4 mr-1" />
              Hujjat Trace
            </TabsTrigger>
            <TabsTrigger value="export" data-testid="audit-tab-export">
              <Download className="h-4 w-4 mr-1" />
              Export
            </TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="space-y-4">
            <TimelineTab
              auditLogs={Array.isArray(auditLogs) ? auditLogs : []}
              isLoading={isLoading}
              onRefresh={handleRefresh}
              onSelectLog={setSelectedLog}
            />
          </TabsContent>

          <TabsContent value="search" className="space-y-4">
            <SearchTab
              filters={filters}
              actionTypes={Array.isArray(actionTypes) ? actionTypes : []}
              sourceTypes={Array.isArray(sourceTypes) ? sourceTypes : []}
              onFiltersChange={setFilters}
            />
          </TabsContent>

          <TabsContent value="document" className="space-y-4">
            <DocumentTraceTab
              docSearchQuery={docSearchQuery}
              onQueryChange={setDocSearchQuery}
              onSearch={handleDocSearch}
            />
          </TabsContent>

          <TabsContent value="export" className="space-y-4">
            <ExportTab
              onExportCSV={onExportCSV}
              onExportExcel={onExportExcel}
              onExportPDF={onExportPDF}
            />
          </TabsContent>
        </Tabs>

        <AuditLogDetailDialog
          selectedLog={selectedLog}
          onClose={() => setSelectedLog(null)}
        />
      </CardContent>
    </Card>
  );
}
