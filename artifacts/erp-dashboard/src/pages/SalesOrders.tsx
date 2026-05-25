/**
 * @module SalesOrders
 * @description React page component. Route-level UI — state management, hooks, and orchestration only.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUndoDelete } from "@/components/undo-toast";
import { useForm } from "react-hook-form";
import type { SalesOrder } from "@shared/schema";
import { insertSalesOrderSchema, type InsertSalesOrder } from "@shared/schema";
import { useTranslation } from "@/lib/i18n";
import type { CustomerRecord, DealRecord } from "./SalesOrdersTypes";
import { computeStats } from "./SalesOrdersTypes";
import { SalesOrderFormDialog } from "./SalesOrdersDialogs";
import { SalesOrdersStatsGrid, SalesOrdersTable } from "./SalesOrdersSections";
import { EPErrorState, EPPageHeader, EPLoader } from "@/components/ep";

export default function SalesOrders() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const { showUndoToast } = useUndoDelete();
  const { t: tCommon } = useTranslation('common');

  const [openDialog, setOpenDialog] = useState(false);
  const [editingOrder, setEditingOrder] = useState<SalesOrder | null>(null);

  // -------------------------------------------------------------------------
  // Queries
  // -------------------------------------------------------------------------

  const { data: salesOrders = [], isLoading, error, isError, refetch } = useQuery<SalesOrder[]>({
    queryKey: ["/api/sap/sales-orders"],
  });

  const { data: customers = [] } = useQuery<CustomerRecord[]>({
    queryKey: ["/api/crm/contacts"],
  });

  const { data: deals = [] } = useQuery<DealRecord[]>({
    queryKey: ["/api/crm/deals"],
  });

  // -------------------------------------------------------------------------
  // Form
  // -------------------------------------------------------------------------

  const salesOrderForm = useForm<InsertSalesOrder>({
    resolver: zodResolver(insertSalesOrderSchema),
    defaultValues: {
      documentType: "OR",
      salesOrg: "EURO",
      distributionChannel: "10",
      division: "00",
      customerId: "",
      soldToParty: "",
      shipToParty: "",
      billToParty: "",
      orderDate: new Date().toISOString().split('T')[0],
      requestedDeliveryDate: "",
      pricingDate: new Date().toISOString().split('T')[0],
      currency: "UZS",
      paymentTerms: "0014",
      overallStatus: "IN_PROCESS",
      deliveryStatus: "NOT_DELIVERED",
      billingStatus: "NOT_BILLED",
      netValue: 0,
      taxAmount: 0,
      totalValue: 0,
      quotationId: "",
      crmDealId: "",
      createdBy: "",
    },
  });

  // -------------------------------------------------------------------------
  // Mutations
  // -------------------------------------------------------------------------

  const saveSalesOrder = useMutation({
    mutationFn: async (data: InsertSalesOrder) => {
      if (editingOrder) {
        await apiRequest("PUT", `/api/sap/sales-orders/${editingOrder.id}`, data);
      } else {
        await apiRequest("POST", "/api/sap/sales-orders", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sap/sales-orders"] });
      toast({ description: editingOrder ? tCommon('updatedSuccessfully') : tCommon('createdSuccessfully') });
      setOpenDialog(false);
      salesOrderForm.reset();
      setEditingOrder(null);
    },
    onError: (err: Error) => {
      toast({
        variant: "destructive",
        description: err.message || tCommon('operationFailed'),
      });
    },
  });

  const deleteSalesOrder = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/sap/sales-orders/${id}`);
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sap/sales-orders"] });
      const order = (Array.isArray(salesOrders) ? salesOrders : []).find((o) => o.id === id);
      showUndoToast("sales_orders", id, order?.documentNumber || id, () => {
        queryClient.invalidateQueries({ queryKey: ["/api/sap/sales-orders"] });
      });
    },
  });

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  const handleEdit = (order: SalesOrder) => {
    setEditingOrder(order);
    salesOrderForm.reset({
      documentType: order.documentType as "OR" | "TA" | "CR",
      salesOrg: order.salesOrg,
      distributionChannel: order.distributionChannel,
      division: order.division,
      customerId: order.customerId || undefined,
      soldToParty: order.soldToParty || undefined,
      shipToParty: order.shipToParty || undefined,
      billToParty: order.billToParty || undefined,
      orderDate: order.orderDate,
      requestedDeliveryDate: order.requestedDeliveryDate || undefined,
      pricingDate: order.pricingDate,
      currency: order.currency as "UZS" | "USD" | "EUR",
      paymentTerms: order.paymentTerms || undefined,
      overallStatus: order.overallStatus as InsertSalesOrder['overallStatus'],
      deliveryStatus: order.deliveryStatus as InsertSalesOrder['deliveryStatus'],
      billingStatus: order.billingStatus as InsertSalesOrder['billingStatus'],
      netValue: order.netValue,
      taxAmount: order.taxAmount,
      totalValue: order.totalValue,
      quotationId: order.quotationId || undefined,
      crmDealId: order.crmDealId || undefined,
      createdBy: order.createdBy || undefined,
    });
    setOpenDialog(true);
  };

  const handleDelete = (id: string) => {
    deleteSalesOrder.mutate(id);
  };

  // -------------------------------------------------------------------------
  // Early returns
  // -------------------------------------------------------------------------

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background" data-testid="loading-spinner">
        <EPLoader size={32} />
      </div>
    );
  }

  if (isError) {
    return <EPErrorState onRetry={refetch}  error={error} />;
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const stats = computeStats(salesOrders);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <EPPageHeader
        breadcrumb={<>{t("dashboard9")}<b className="text-foreground">{t("buyurtmalarRoyxati")}</b></>}
        title={t("buyurtmalarRoyxati")}
        subtitle={t("sotuvVaTarqatishBuyurtmalarBoshqaruvi")}
      />
        </div>
        <div className="flex gap-3">
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingOrder(null);
                  salesOrderForm.reset();
                }}
                data-testid="button-create-sales-order"
                className="bg-primary text-white rounded-lg px-6 shadow-sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                {tCommon('create')}
              </Button>
            </DialogTrigger>

            <SalesOrderFormDialog
              open={openDialog}
              onOpenChange={setOpenDialog}
              form={salesOrderForm}
              onSubmit={(data) => saveSalesOrder.mutate(data)}
              isPending={saveSalesOrder.isPending}
              isEditing={!!editingOrder}
              customers={Array.isArray(customers) ? customers : []}
              deals={Array.isArray(deals) ? deals : []}
            />
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <SalesOrdersStatsGrid stats={stats} />

      {/* Table */}
      <SalesOrdersTable
        salesOrders={Array.isArray(salesOrders) ? salesOrders : []}
        customers={Array.isArray(customers) ? customers : []}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}
