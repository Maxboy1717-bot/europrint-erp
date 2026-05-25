/**
 * @module SDQuotations
 * @description React page component. Route-level UI for SD Quotations.
 */

import { useState } from "react";
import { AlertCircle, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  quotationFormSchema,
  type QuotationFormData,
  type QuotationWithItems,
  type QuotationLineItem,
  type Quotation,
} from "./SDQuotationsTypes";
import { AddEditQuotationDialog } from "./SDQuotationDialog";
import { QuotationDetailSheet } from "./SDQuotationDetailSheet";
import { QuotationConfirmDialogs } from "./SDQuotationsDialogs";
import {
  defaultFormValues,
  QuotationStatusCards,
  QuotationTable,
  type StatusCounts,
} from "./SDQuotationsSections";
import { useQuotationsData, useQuotationsMutations } from "./SDQuotationsHooks";
import { apiRequest } from '@/lib/queryClient';
import { EPErrorState, EPPageHeader, EPLoader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function SDQuotations() {
  const { t } = useTranslation("common");
  const { toast } = useToast();

  // UI state
  const [openDialog, setOpenDialog] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null);
  const [selectedQuotation, setSelectedQuotation] = useState<QuotationWithItems | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [confirmDeleteQuotationId, setConfirmDeleteQuotationId] = useState<string | null>(null);
  const [confirmConvertOrderId, setConfirmConvertOrderId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [items, setItems] = useState<QuotationLineItem[]>([]);

  // -------------------------------------------------------------------------
  // Queries
  // -------------------------------------------------------------------------

  const { quotations: quotationsQuery, companies: companiesQuery, products: productsQuery } =
    useQuotationsData();

  const { data: quotations = [], isLoading, error, isError, refetch } = quotationsQuery;
  const { data: companies = [] } = companiesQuery;
  const { data: products = [] } = productsQuery;

  // -------------------------------------------------------------------------
  // Form
  // -------------------------------------------------------------------------

  const quotationForm = useForm<QuotationFormData>({
    resolver: zodResolver(quotationFormSchema),
    defaultValues: defaultFormValues(),
  });

  // -------------------------------------------------------------------------
  // Mutations
  // -------------------------------------------------------------------------

  const { saveQuotation, deleteQuotation, convertToOrder } = useQuotationsMutations({
    onSaveSuccess: () => {
      setOpenDialog(false);
      quotationForm.reset(defaultFormValues());
      setItems([]);
      setEditingQuotation(null);
    },
    onDeleteSuccess: () => {
      setConfirmDeleteQuotationId(null);
    },
  });

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  const handleViewDetails = async (quotation: Quotation) => {
    try {
      const data = (await apiRequest('GET', `/api/sd/quotations/${quotation.id}`)) as Record<string, any>;
      setSelectedQuotation(data);
      setDetailSheetOpen(true);
    } catch {
      toast({ variant: "destructive", description: "Ma'lumotlarni yuklashda xatolik" });
    }
  };

  const handleEdit = (quotation: Quotation) => {
    setEditingQuotation(quotation);
    quotationForm.reset({
      quotationNumber: quotation.quotationNumber,
      customerId: quotation.customerId || "",
      customerName: quotation.customerName,
      quotationDate: quotation.quotationDate,
      validUntil: quotation.validUntil,
      status: quotation.status as QuotationFormData["status"],
      currency: quotation.currency,
      paymentTerms: quotation.paymentTerms || "",
      notes: quotation.notes || "",
      netValue: quotation.netValue,
      taxAmount: quotation.taxAmount,
      totalValue: quotation.totalValue,
    });
    setItems([]);
    setOpenDialog(true);
  };

  const handleNewClick = () => {
    setEditingQuotation(null);
    quotationForm.reset(defaultFormValues());
    setItems([]);
  };

  const addItem = () => {
    setItems([...items, { productId: "", description: "", quantity: 1, unitPrice: 0, discount: 0 }]);
  };

  const updateItem = (index: number, field: keyof QuotationLineItem, value: string | number) => {
    const newItems = [...items];
    (newItems[index] as unknown as Record<string, string | number>)[field] = value;
    if (field === "productId" && value) {
      const product = (Array.isArray(products) ? products : []).find((p) => p.id === value);
      if (product) {
        newItems[index].description = product.name;
        newItems[index].unitPrice = product.basePrice || 0;
      }
    }
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems((Array.isArray(items) ? items : []).filter((_, i) => i !== index));
  };

  // -------------------------------------------------------------------------
  // Derived data
  // -------------------------------------------------------------------------

  const safeQuotations = Array.isArray(quotations) ? quotations : [];

  const filteredQuotations =
    statusFilter === "all" ? safeQuotations : safeQuotations.filter((q) => q.status === statusFilter);

  const statusCounts: StatusCounts = {
    draft:     safeQuotations.filter((q) => q.status === "draft").length,
    sent:      safeQuotations.filter((q) => q.status === "sent").length,
    accepted:  safeQuotations.filter((q) => q.status === "accepted").length,
    rejected:  safeQuotations.filter((q) => q.status === "rejected").length,
    expired:   safeQuotations.filter((q) => q.status === "expired").length,
    converted: safeQuotations.filter((q) => q.status === "converted").length,
  };

  // -------------------------------------------------------------------------
  // Early returns
  // -------------------------------------------------------------------------

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

  if (!quotations || quotations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2" data-testid="empty-state">
        <Package className="h-12 w-12 text-muted-foreground" />
        <p className="text-lg font-medium">{t("hozirchaMalumotYoq")}</p>
        <p className="text-sm text-muted-foreground">{t("yangiYozuvQoshishUchunYuqoridagi")}</p>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* ---- Page header ---- */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div>
          <EPPageHeader
        breadcrumb={<>{t("dashboard9")}<b className="text-foreground">{t("taklifnomalarBoshqaruvi")}</b></>}
        title={t("taklifnomalarBoshqaruvi")}
        subtitle={t("sapSdNarxTakliflariniBoshqarish")}
      />
        </div>

        <AddEditQuotationDialog
          open={openDialog}
          onOpenChange={setOpenDialog}
          isEditing={editingQuotation !== null}
          form={quotationForm}
          items={items}
          companies={companies}
          products={products}
          isSavePending={saveQuotation.isPending}
          onSave={(data) => saveQuotation.mutate({ data, items, editingQuotation })}
          onAddItem={addItem}
          onUpdateItem={updateItem}
          onRemoveItem={removeItem}
          onNewClick={handleNewClick}
        />
      </div>

      {/* ---- Status summary cards ---- */}
      <QuotationStatusCards statusCounts={statusCounts} />

      {/* ---- Quotations table ---- */}
      <QuotationTable
        filteredQuotations={filteredQuotations}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onView={handleViewDetails}
        onEdit={handleEdit}
        onConvert={(id) => setConfirmConvertOrderId(id)}
        onDelete={(id) => setConfirmDeleteQuotationId(id)}
      />

      {/* ---- Detail sheet ---- */}
      <QuotationDetailSheet
        open={detailSheetOpen}
        onOpenChange={(open) => { if (!open) setDetailSheetOpen(false); }}
        quotation={selectedQuotation}
        isConvertPending={convertToOrder.isPending}
        onConvertToOrder={(id) => setConfirmConvertOrderId(id)}
      />

      {/* ---- Confirm dialogs ---- */}
      <QuotationConfirmDialogs
        confirmDeleteQuotationId={confirmDeleteQuotationId}
        onDeleteOpenChange={(open) => { if (!open) setConfirmDeleteQuotationId(null); }}
        onConfirmDelete={() => {
          if (confirmDeleteQuotationId !== null) deleteQuotation.mutate(confirmDeleteQuotationId);
        }}
        confirmConvertOrderId={confirmConvertOrderId}
        onConvertOpenChange={(open) => { if (!open) setConfirmConvertOrderId(null); }}
        onConfirmConvert={() => {
          if (confirmConvertOrderId !== null) convertToOrder.mutate(confirmConvertOrderId);
        }}
      />
    </div>
  );
}
