/**
 * @module GoodsReceiving
 * @description React page component. Route-level UI.
 */

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Plus, AlertCircle } from "lucide-react";
import {
  GoodsReceipt,
  GoodsReceiptLine,
} from "@/components/wms/receiving/types";
import { useGoodsReceivingTranslations } from "@/components/wms/receiving/useGoodsReceivingTranslations";
import { SummaryCards } from "@/components/wms/receiving/SummaryCards";
import { ReceivingList } from "@/components/wms/receiving/ReceivingList";
import { ReceiveFormDialog } from "@/components/wms/receiving/ReceiveFormDialog";
import { ItemEntryDialog } from "@/components/wms/receiving/ItemEntryDialog";
import { QcCheckDialog } from "@/components/wms/receiving/QcCheckDialog";
import { ReceiptDetailSheet } from "@/components/wms/receiving/ReceiptDetailSheet";
import {
  useGoodsReceivingData,
  useGoodsReceivingMutations,
  useGoodsReceivingLookups,
} from "@/components/wms/receiving/useGoodsReceivingHooks";
import { EPErrorState, EPPageHeader, EPLoader } from "@/components/ep";

export default function GoodsReceiving() {
  const { language, setLanguage } = useLanguage();
  const t = useGoodsReceivingTranslations() as ReturnType<typeof useGoodsReceivingTranslations> & ((key: string) => string);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<GoodsReceipt | null>(null);
  const [isAddLineDialogOpen, setIsAddLineDialogOpen] = useState(false);
  const [isQcDialogOpen, setIsQcDialogOpen] = useState(false);
  const [selectedLine, setSelectedLine] = useState<GoodsReceiptLine | null>(null);
  const [qcAction, setQcAction] = useState<"pass" | "fail">("pass");
  const [qcNotes, setQcNotes] = useState("");

  const [lineFormData, setLineFormData] = useState({
    materialCardId: "",
    orderedQuantity: 0,
    receivedQuantity: 0,
    unitCost: 0,
    batchNumber: "",
    expiryDate: "",
    binId: "",
  });

  const { data: receipts, isLoading, error, isError, refetch } = useGoodsReceivingData(statusFilter, dateFrom, dateTo);
  const { stats, vendors, warehouses, materials, bins } = useGoodsReceivingLookups();

  const { data: receiptDetail, refetch: refetchDetail } = useQuery<GoodsReceipt>({
    queryKey: ["/api/warehouse/goods-receipts", selectedReceipt?.id],
    enabled: !!selectedReceipt?.id,
  });

  const {
    createReceiptMutation,
    addLineMutation,
    updateQcMutation,
    completeReceiptMutation,
  } = useGoodsReceivingMutations(refetchDetail);

  const resetLineForm = () => {
    setLineFormData({
      materialCardId: "",
      orderedQuantity: 0,
      receivedQuantity: 0,
      unitCost: 0,
      batchNumber: "",
      expiryDate: "",
      binId: "",
    });
  };

  const filteredReceipts = useMemo(() => {
    if (!receipts) return [];
    if (!searchQuery) return receipts;
    const q = searchQuery.toLowerCase();
    return (Array.isArray(receipts) ? receipts : []).filter(
      (r) =>
        r.receiptNumber.toLowerCase().includes(q) ||
        r.supplierName?.toLowerCase().includes(q) ||
        r.warehouseName?.toLowerCase().includes(q)
    );
  }, [receipts, searchQuery]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="loading-spinner">
        <EPLoader size={32} tone="muted" />
      </div>
    );
  }

  if (isError) return <EPErrorState onRetry={refetch}  error={error} />;
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2" data-testid="error-state">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-muted-foreground">{t("malumotlarniYuklashdaXatolikYuzBerdi")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <EPPageHeader
        breadcrumb={<>{t("dashboard9")}<b className="text-foreground">{t("tovarlarQabuli")}</b></>}
        title={t("tovarlarQabuli")}
      />
          <p className="text-muted-foreground">{t.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLanguage(language === "uz" ? "ru" : "uz")}
            data-testid="button-lang-toggle"
          >
            {language === "uz" ? "RU" : "UZ"}
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-new-receipt">
            <Plus className="h-4 w-4 mr-2" />
            {t.newReceipt}
          </Button>
        </div>
      </div>

      <SummaryCards stats={stats.data} />

      <ReceivingList
        receipts={filteredReceipts}
        isLoading={isLoading}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        dateFrom={dateFrom}
        setDateFrom={setDateFrom}
        dateTo={dateTo}
        setDateTo={setDateTo}
        onViewDetail={(receipt) => {
          setSelectedReceipt(receipt);
          setIsDetailSheetOpen(true);
        }}
      />

      <ReceiveFormDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        vendors={vendors.data || []}
        warehouses={warehouses.data || []}
        onSubmit={(data) => {
          createReceiptMutation.mutate(data, {
            onSuccess: () => {
              setIsCreateDialogOpen(false);
            },
          });
        }}
        isPending={createReceiptMutation.isPending}
      />

      <ItemEntryDialog
        isOpen={isAddLineDialogOpen}
        onOpenChange={setIsAddLineDialogOpen}
        materials={materials.data || []}
        bins={bins.data || []}
        lineFormData={lineFormData}
        setLineFormData={setLineFormData}
        onSubmit={() => {
          if (!selectedReceipt) return;
          addLineMutation.mutate(
            { receiptId: selectedReceipt.id, data: lineFormData },
            {
              onSuccess: () => {
                setIsAddLineDialogOpen(false);
                resetLineForm();
              },
            }
          );
        }}
        isPending={addLineMutation.isPending}
      />

      <QcCheckDialog
        isOpen={isQcDialogOpen}
        onOpenChange={setIsQcDialogOpen}
        selectedLine={selectedLine}
        qcAction={qcAction}
        qcNotes={qcNotes}
        setQcNotes={setQcNotes}
        onConfirm={() => {
          if (!selectedLine) return;
          updateQcMutation.mutate(
            {
              lineId: selectedLine.id,
              data: { qcStatus: qcAction === "pass" ? "passed" : "failed", qcNotes },
            },
            {
              onSuccess: () => {
                setIsQcDialogOpen(false);
                setQcNotes("");
              },
            }
          );
        }}
        isPending={updateQcMutation.isPending}
      />

      <ReceiptDetailSheet
        isOpen={isDetailSheetOpen}
        onOpenChange={setIsDetailSheetOpen}
        receiptDetail={receiptDetail}
        onAddLine={() => setIsAddLineDialogOpen(true)}
        onQcAction={(line, action) => {
          setSelectedLine(line);
          setQcAction(action);
          setQcNotes("");
          setIsQcDialogOpen(true);
        }}
        onComplete={(id) => {
          completeReceiptMutation.mutate(id, {
            onSuccess: () => {
              setIsDetailSheetOpen(false);
            },
          });
        }}
        isCompleting={completeReceiptMutation.isPending}
      />
    </div>
  );
}
