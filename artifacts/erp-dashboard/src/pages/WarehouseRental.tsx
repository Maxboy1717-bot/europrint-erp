/**
 * @module WarehouseRental
 * @description Route-level orchestrator for the Warehouse Rental page.
 * Owns data-fetching (useQuery / useMutation), top-level UI state, and
 * delegates rendering to section/dialog sub-modules:
 *   - WarehouseRentalTypes.ts   — interfaces & helpers
 *   - WarehouseRentalSections.tsx — KpiCards, OverdueAlert, RecordsTable, SettingsPanel
 *   - WarehouseRentalDialogs.tsx  — AddRecordDialog
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Warehouse, Plus, RefreshCw, Settings, SquareStack } from "lucide-react";

import { type RentalSummary, type RentalSettings } from "./WarehouseRentalTypes";
import { KpiCards, OverdueAlert } from "./WarehouseRentalSections";
import { RecordsTable } from "./WarehouseRentalTable";
import { SettingsPanel } from "./WarehouseRentalSettings";
import { AddRecordDialog } from "./WarehouseRentalDialogs";
import { useTranslation } from '@/lib/i18n';

// ─── Page Component ───────────────────────────────────────────────────────────

export default function WarehouseRental() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const [addOpen, setAddOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [tab, setTab] = useState("records");

  // ── Queries ──────────────────────────────────────────────────────────────

  const { data: summary, isLoading: summaryLoading } = useQuery<RentalSummary>({
    queryKey: ["/api/warehouse-rental/summary"],
    enabled: !!isAuthenticated,
  });

  const { data: recordsData, isLoading: recordsLoading } = useQuery<{
    records: import("./WarehouseRentalTypes").RentalRecord[];
    total: number;
  }>({
    queryKey: ["/api/warehouse-rental/records", statusFilter],
    queryFn: () =>
      apiRequest('GET', `/api/warehouse-rental/records${statusFilter ? `?status=${statusFilter}` : ""}`),
    enabled: !!isAuthenticated,
  });

  const { data: settings } = useQuery<RentalSettings>({
    queryKey: ["/api/warehouse-rental/settings"],
    enabled: !!isAuthenticated,
  });

  // ── Mutations ─────────────────────────────────────────────────────────────

  const invalidateRecords = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/warehouse-rental/records"] });
    queryClient.invalidateQueries({ queryKey: ["/api/warehouse-rental/summary"] });
  };

  const closeMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("POST", `/api/warehouse-rental/records/${id}/close`, {
        closedDate: new Date().toISOString().split("T")[0],
      }),
    onSuccess: () => {
      toast({ title: "Ijara yopildi" });
      invalidateRecords();
    },
    onError: (err: Error) =>
      toast({ title: "Xato", description: err.message, variant: "destructive" }),
  });

  const paidMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("POST", `/api/warehouse-rental/records/${id}/mark-paid`, {}),
    onSuccess: () => {
      toast({ title: "To'langan deb belgilandi" });
      invalidateRecords();
    },
    onError: (err: Error) =>
      toast({ title: "Xato", description: err.message, variant: "destructive" }),
  });

  const recalcMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/warehouse-rental/recalculate", {}),
    onSuccess: (data: Record<string, unknown>) => {
      toast({ title: `Yangilandi: ${data?.updated ?? 0} ta yozuv` });
      invalidateRecords();
    },
    onError: (err: Error) =>
      toast({ title: "Xato", description: err.message, variant: "destructive" }),
  });

  const records = recordsData?.records ?? [];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Warehouse className="h-6 w-6 text-primary" />
            {t("omborIchkiIjara")}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t("tayyorMahsulotOmbordaSaqlash8")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => recalcMutation.mutate()}
            disabled={recalcMutation.isPending}
            data-testid="button-recalculate"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            {t("qaytaHisoblash")}
          </Button>
          <Button onClick={() => setAddOpen(true)} data-testid="button-add-rental">
            <Plus className="h-4 w-4 mr-1" /> {t("yangiYozuv1")}
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <KpiCards summary={summary} isLoading={summaryLoading} />

      {/* Overdue Alert */}
      <OverdueAlert summary={summary} />

      {/* Main Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="records" data-testid="tab-records">
            <SquareStack className="h-4 w-4 mr-1" /> {t("yozuvlar")}
          </TabsTrigger>
          <TabsTrigger value="settings" data-testid="tab-settings">
            <Settings className="h-4 w-4 mr-1" /> {t("settings")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="records" className="mt-4">
          <RecordsTable
            records={records}
            isLoading={recordsLoading}
            statusFilter={statusFilter}
            onStatusFilter={setStatusFilter}
            onClose={(id) => closeMutation.mutate(id)}
            onPaid={(id) => paidMutation.mutate(id)}
            closePending={closeMutation.isPending}
            paidPending={paidMutation.isPending}
          />
        </TabsContent>

        <TabsContent value="settings" className="mt-4">
          <SettingsPanel settings={settings ?? null} onSaved={() => setTab("records")} />
        </TabsContent>
      </Tabs>

      {/* Add Dialog */}
      <AddRecordDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        settings={settings ?? null}
      />
    </div>
  );
}
