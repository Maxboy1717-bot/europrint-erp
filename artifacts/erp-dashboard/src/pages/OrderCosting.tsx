/** @module OrderCosting @description Route-level page component — owns state, queries, mutations, and orchestrates sub-components for the Order Costing feature. */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calculator, Plus } from "lucide-react";
import {
  OrderCosting as OrderCostingType,
  OrderCostingDetail,
  SalesOrder,
  costingFormSchema,
  CostingFormData,
} from "./OrderCostingTypes";
import { OrderCostingDetailView } from "./OrderCostingDetail";
import { CreateCostingDialog } from "./OrderCostingDialogs";
import { SummaryCards, CostingsTable, TopRankings, StatusBadge } from "./OrderCostingSections";
import { EPErrorState } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

export default function OrderCosting() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const [selectedCosting, setSelectedCosting] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: costings = [], isLoading: costingsLoading, isError, refetch } = useQuery<OrderCostingType[]>({
    queryKey: ["/api/order-costing", statusFilter !== "all" ? { status: statusFilter } : {}],
  });

  const { data: costingDetail } = useQuery<OrderCostingDetail>({
    queryKey: ["/api/order-costing", selectedCosting],
    enabled: !!selectedCosting,
  });

  const { data: salesOrders = [] } = useQuery<SalesOrder[]>({
    queryKey: ["/api/sales-orders"],
  });

  const { data: topProfitable = [] } = useQuery<OrderCostingType[]>({
    queryKey: ["/api/order-costing/top-profitable"],
  });

  const { data: topLoss = [] } = useQuery<OrderCostingType[]>({
    queryKey: ["/api/order-costing/top-loss"],
  });

  const form = useForm<CostingFormData>({
    resolver: zodResolver(costingFormSchema),
    defaultValues: {
      salesOrderId: "",
      materialCost: 0,
      laborCost: 0,
      overheadCost: 0,
      energyCost: 0,
      wasteCost: 0,
      sellingPrice: 0,
      status: "draft",
    },
  });

  const createCostingMutation = useMutation({
    mutationFn: async (data: CostingFormData) => {
      const res = await apiRequest("POST", "/api/order-costing", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/order-costing"] });
      setCreateDialogOpen(false);
      form.reset();
      toast({ title: "Muvaffaqiyat", description: "Buyurtma tannarxi yaratildi" });
    },
    onError: () => {
      toast({ title: "Xatolik", description: "Buyurtma tannarxini yaratishda xatolik", variant: "destructive" });
    },
  });

  const watchedValues = form.watch();
  const totalCost =
    (watchedValues.materialCost || 0) +
    (watchedValues.laborCost || 0) +
    (watchedValues.overheadCost || 0) +
    (watchedValues.energyCost || 0) +
    (watchedValues.wasteCost || 0);
  const grossProfit = (watchedValues.sellingPrice || 0) - totalCost;
  const profitMargin = watchedValues.sellingPrice > 0 ? (grossProfit / watchedValues.sellingPrice) * 100 : 0;

  const getStatusBadge = (status: string) => <StatusBadge status={status} />;

  if (selectedCosting && costingDetail) {
    return (
      <OrderCostingDetailView
        costingDetail={costingDetail}
        onBack={() => setSelectedCosting(null)}
        getStatusBadge={getStatusBadge}
      />
    );
  }

  if (isError) {
    return <EPErrorState onRetry={refetch} />;
  }

  return (
    <div data-testid="order-costing-page">
      <div className="-mx-4 -mt-4 lg:-mx-6 lg:-mt-6 border-b from-primary to-amber-500 text-white">
        <div className="px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calculator className="h-8 w-8" />
              <div>
                <h1 className="text-2xl font-bold">{t("buyurtmaTannarxi1")}</h1>
                <p className="text-white/75 text-sm">{t("harBirBuyurtmaUchunXarajatlar")}</p>
              </div>
            </div>
            <DialogTrigger asChild onClick={() => setCreateDialogOpen(true)}>
              <Button className="bg-card text-[var(--ep-green)] hover:bg-green-50 gap-2" data-testid="button-create-costing">
                <Plus className="h-4 w-4" />
                {t("yangiTannarx")}
              </Button>
            </DialogTrigger>
          </div>
        </div>
      </div>

      <CreateCostingDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        form={form}
        salesOrders={Array.isArray(salesOrders) ? salesOrders : []}
        onSubmit={(data) => createCostingMutation.mutate(data)}
        isPending={createCostingMutation.isPending}
        totalCost={totalCost}
        grossProfit={grossProfit}
        profitMargin={profitMargin}
      />

      <div className="space-y-6 pt-6">
        <SummaryCards costings={Array.isArray(costings) ? costings : []} isLoading={costingsLoading} />
        <CostingsTable
          costings={Array.isArray(costings) ? costings : []}
          isLoading={costingsLoading}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          onRowClick={setSelectedCosting}
          getStatusBadge={getStatusBadge}
        />
        <TopRankings
          topProfitable={Array.isArray(topProfitable) ? topProfitable : []}
          topLoss={Array.isArray(topLoss) ? topLoss : []}
          onRowClick={setSelectedCosting}
        />
      </div>
    </div>
  );
}
