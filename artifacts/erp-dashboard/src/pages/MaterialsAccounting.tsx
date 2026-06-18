/**
 * @module MaterialsAccounting
 * @description React page component. Route-level UI. State, hooks, and orchestration only.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Warehouse, RefreshCw } from "lucide-react";
import type { MaterialMovement, InventoryValuationData, OrderConsumption, MovFormState } from "./MaterialsAccountingTypes";
import { DEFAULT_MOV_FORM } from "./MaterialsAccountingTypes";
import { RecordMovementDialog } from "./MaterialsAccountingDialogs";
import { StatCards, MovementsCard } from "./MaterialsAccountingSections";
import { OrderConsumptionCard, InventoryValuationCard } from "./MaterialsAccountingPanels";
import { EPErrorState, EPPageHeader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

export default function MaterialsAccounting() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [moveTypeFilter, setMoveTypeFilter] = useState<string>("all");
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [movDialogOpen, setMovDialogOpen] = useState(false);
  const [movForm, setMovForm] = useState<MovFormState>(DEFAULT_MOV_FORM);

  const recordMovementMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/warehouse/movements", {
        materialId: movForm.materialId,
        type: movForm.type,
        quantity: Number(movForm.quantity),
        notes: movForm.notes,
      }),
    onSuccess: () => {
      toast({ title: "Muvaffaqiyatli", description: "Harakat muvaffaqiyatli qayd etildi." });
      queryClient.invalidateQueries({ queryKey: ["/api/accounting/materials"] });
      setMovDialogOpen(false);
      setMovForm(DEFAULT_MOV_FORM);
    },
    onError: () => {
      toast({ title: "Xatolik", description: "Harakatni qayd etishda xatolik yuz berdi.", variant: "destructive" });
    },
  });

  const {
    data: movements = [],
    isLoading: movementsLoading,
    refetch: refetchMovements,
    isError, error,
  } = useQuery<MaterialMovement[]>({
    queryKey: [
      "/api/accounting/materials",
      { startDate, endDate, moveType: moveTypeFilter !== "all" ? moveTypeFilter : undefined },
    ],
  });

  const { data: inventoryData, isLoading: inventoryLoading } = useQuery<InventoryValuationData>({
    queryKey: ["/api/accounting/inventory-valuation"],
  });

  const { data: orderConsumptions = [] } = useQuery<OrderConsumption[]>({
    queryKey: ["/api/accounting/materials/by-order"],
  });

  // ---------------------------------------------------------------------------
  // Derived values
  // ---------------------------------------------------------------------------

  const totalInventoryValue = inventoryData?.summary?.totalValue || 0;

  const monthlyConsumed = movements
    .filter(
      (m) =>
        m.moveType?.toLowerCase() === "out" ||
        m.moveType?.toLowerCase() === "issue" ||
        m.moveType?.toLowerCase() === "chiqim",
    )
    .reduce((sum, m) => sum + (m.totalCost || 0), 0);

  const monthlyReceived = movements
    .filter(
      (m) =>
        m.moveType?.toLowerCase() === "in" ||
        m.moveType?.toLowerCase() === "receipt" ||
        m.moveType?.toLowerCase() === "kirim",
    )
    .reduce((sum, m) => sum + (m.totalCost || 0), 0);

  const turnoverRate =
    totalInventoryValue > 0 ? ((monthlyConsumed / totalInventoryValue) * 12).toFixed(2) : "0.00";

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const toggleOrderExpansion = (orderId: string) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  const handleApplyFilters = () => {
    refetchMovements();
  };

  const handleClearFilters = () => {
    setStartDate("");
    setEndDate("");
    setMoveTypeFilter("all");
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (isError) {
    return <EPErrorState onRetry={refetchMovements}  error={error} />;
  }

  return (
    <div className="space-y-6" data-testid="materials-accounting-page">
      <EPPageHeader
        icon={<Warehouse className="h-5 w-5" />}
        title={t("materiallarHisobi")}
        subtitle={t("omborBuxgalteriMaterialHarakatlariVa")}
        actions={
          <div className="flex items-center gap-2">
            <RecordMovementDialog
              open={movDialogOpen}
              onOpenChange={setMovDialogOpen}
              form={movForm}
              onFormChange={setMovForm}
              onSubmit={() => recordMovementMutation.mutate()}
              isPending={recordMovementMutation.isPending}
            />
            <Button variant="outline" onClick={() => refetchMovements()} data-testid="button-refresh">
              <RefreshCw className="h-4 w-4 mr-2" />
              {t("refresh")}
            </Button>
          </div>
        }
      />

      {/* Page Body */}
      <div className="space-y-6 pt-6">
        <StatCards
          totalInventoryValue={totalInventoryValue}
          monthlyConsumed={monthlyConsumed}
          monthlyReceived={monthlyReceived}
          turnoverRate={turnoverRate}
          inventoryLoading={inventoryLoading}
          movementsLoading={movementsLoading}
          inventoryData={inventoryData}
        />

        <MovementsCard
          movements={movements}
          movementsLoading={movementsLoading}
          startDate={startDate}
          endDate={endDate}
          moveTypeFilter={moveTypeFilter}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onMoveTypeChange={setMoveTypeFilter}
          onApplyFilters={handleApplyFilters}
          onClearFilters={handleClearFilters}
        />

        <div className="grid gap-6 lg:grid-cols-2">
          <OrderConsumptionCard
            orderConsumptions={orderConsumptions}
            expandedOrders={expandedOrders}
            onToggleOrder={toggleOrderExpansion}
          />
          <InventoryValuationCard
            inventoryData={inventoryData}
            inventoryLoading={inventoryLoading}
          />
        </div>
      </div>
    </div>
  );
}
