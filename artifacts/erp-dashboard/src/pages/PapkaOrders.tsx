/**
 * @module PapkaOrders
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import type { PapkaOrder } from "@shared/schema";
import {
  formSchema, FormData, Lang, DEFAULT_FORM_VALUES, TRANSLATIONS,
} from "./PapkaOrdersTypes";
import { StatsRow, OrdersList } from "./PapkaOrdersSections";
import { OrderDialog } from "./PapkaOrdersDialogs";
import { EPErrorState, EPPageHeader, EPLoader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

// The /api/papka-orders list endpoint is a shared legacy shim that returns raw
// snake_case rows. Normalize each row to the camelCase PapkaOrder shape the table
// renders (accepting either casing so it keeps working if the BE shape changes).
function normalizePapkaOrder(r: Record<string, unknown>): PapkaOrder {
  const pick = (...keys: string[]): unknown => {
    for (const k of keys) {
      const v = r[k];
      if (v !== undefined && v !== null) return v;
    }
    return undefined;
  };
  return {
    ...r,
    id: String(pick("id") ?? ""),
    papkaNo: String(pick("papkaNo", "papka_no") ?? ""),
    mijozNomi: String(pick("mijozNomi", "mijoz_nomi", "customer_name") ?? ""),
    mahsulotNomi: String(pick("mahsulotNomi", "mahsulot_nomi", "product_name") ?? ""),
    mahsulotTuri: String(pick("mahsulotTuri", "mahsulot_turi") ?? ""),
    tiraj: Number(pick("tiraj", "quantity") ?? 0),
    listSoni: Number(pick("listSoni", "list_soni") ?? 0),
    formatA: Number(pick("formatA", "format_a") ?? 0),
    formatB: Number(pick("formatB", "format_b") ?? 0),
    status: String(pick("status") ?? "new"),
    sana: String(pick("sana") ?? ""),
    tayyorBolishSanasi: String(pick("tayyorBolishSanasi", "tayyor_bolish_sanasi") ?? ""),
    notes: String(pick("notes") ?? ""),
  } as PapkaOrder;
}

export default function PapkaOrders() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const [lang, setLang] = useState<Lang>("uz");
  const [showDialog, setShowDialog] = useState(false);
  const [editingOrder, setEditingOrder] = useState<PapkaOrder | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: ordersResponse, isLoading, isError, error, refetch } = useQuery<
    PapkaOrder[] | { items?: PapkaOrder[]; total?: number }
  >({
    queryKey: ["/api/papka-orders"],
  });

  const rawOrders: Record<string, unknown>[] = Array.isArray(ordersResponse)
    ? (ordersResponse as unknown as Record<string, unknown>[])
    : Array.isArray(ordersResponse?.items)
      ? (ordersResponse.items as unknown as Record<string, unknown>[])
      : [];
  const allOrders: PapkaOrder[] = rawOrders.map(normalizePapkaOrder);

  // Search + status filter run client-side — the shared list endpoint does not
  // filter on these params, so filtering here makes the toolbar actually work.
  const orders = allOrders.filter((o) => {
    const matchesStatus = statusFilter === "all" || o.status === statusFilter;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      [o.papkaNo, o.mijozNomi, o.mahsulotNomi].some((v) =>
        (v ?? "").toString().toLowerCase().includes(q),
      );
    return matchesStatus && matchesSearch;
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: DEFAULT_FORM_VALUES,
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => apiRequest("POST", "/api/papka-orders", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/papka-orders"] });
      setShowDialog(false);
      form.reset(DEFAULT_FORM_VALUES);
      toast({ title: lang === "uz" ? "Buyurtma yaratildi" : "Заказ создан" });
    },
    onError: (error: Error & { errorDetails?: { uz: string; ru: string } }) => {
      let errorMessage = lang === "uz" ? "Xatolik" : "Ошибка";
      if (error.errorDetails) {
        errorMessage = lang === "uz" ? error.errorDetails.uz : error.errorDetails.ru;
        if (errorMessage.toLowerCase().includes("papka raqami") || errorMessage.toLowerCase().includes("номер папки")) {
          form.setError("papkaNo", { type: "manual", message: errorMessage });
        }
      }
      toast({ variant: "destructive", title: lang === "uz" ? "Xatolik" : "Ошибка", description: errorMessage });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: FormData }) =>
      apiRequest("PATCH", `/api/papka-orders/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/papka-orders"] });
      setShowDialog(false);
      setEditingOrder(null);
      form.reset(DEFAULT_FORM_VALUES);
      toast({ title: lang === "uz" ? "Buyurtma yangilandi" : "Заказ обновлен" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("PATCH", `/api/papka-orders/${id}`, { status: "cancelled" });
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/papka-orders"] });
      toast({ title: lang === "uz" ? "Buyurtma bekor qilindi" : "Заказ отменён" });
    },
  });

  const handleEdit = (order: PapkaOrder) => {
    setEditingOrder(order);
    form.reset({
      papkaNo: order.papkaNo || "",
      mijozNomi: order.mijozNomi || "",
      mahsulotNomi: order.mahsulotNomi || "",
      mahsulotTuri: order.mahsulotTuri || "",
      tiraj: order.tiraj || 0,
      listSoni: order.listSoni || 0,
      formatA: order.formatA || 0,
      formatB: order.formatB || 0,
      status: order.status || "new",
      sana: order.sana || "",
      tayyorBolishSanasi: order.tayyorBolishSanasi || "",
      notes: order.notes || "",
    });
    setShowDialog(true);
  };

  const handleNewOrder = () => {
    setEditingOrder(null);
    form.reset({ ...DEFAULT_FORM_VALUES, sana: new Date().toISOString().split("T")[0] });
    setShowDialog(true);
  };

  const onSubmit = (data: FormData) => {
    if (editingOrder) {
      updateMutation.mutate({ id: editingOrder.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const activeCount = allOrders.filter(o => ["new", "planning", "production"].includes(o.status)).length;
  const completedCount = allOrders.filter(o => o.status === "completed").length;

  const tr = TRANSLATIONS[lang];

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <EPPageHeader
        breadcrumb={<>{t("dashboard9")}<b className="text-foreground">{tr.title}</b></>}
        title={tr.title}
        subtitle={t("ofsetBosmaPapkaVaQadoqlash")}
      />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-muted/40 p-1 rounded-lg border border-border/30">
            <Button variant="ghost" size="sm" onClick={() => setLang("uz")}
              className={`rounded-md px-3 ${lang === "uz" ? "bg-primary text-white" : "text-muted-foreground"}`}
              data-testid="button-lang-uz">UZ</Button>
            <Button variant="ghost" size="sm" onClick={() => setLang("ru")}
              className={`rounded-md px-3 ${lang === "ru" ? "bg-primary text-white" : "text-muted-foreground"}`}
              data-testid="button-lang-ru">RU</Button>
          </div>
          <Button onClick={handleNewOrder} data-testid="button-add-order"
            className="bg-primary text-white rounded-lg px-6 shadow-sm gap-2">
            <Plus className="h-4 w-4" />
            {tr.addOrder}
          </Button>
        </div>
      </div>

      <StatsRow
        totalCount={allOrders.length}
        activeCount={activeCount}
        completedCount={completedCount}
        lang={lang}
      />

      <OrdersList
        orders={orders}
        lang={lang}
        searchQuery={searchQuery}
        statusFilter={statusFilter}
        onSearchChange={setSearchQuery}
        onStatusFilterChange={setStatusFilter}
        onEdit={handleEdit}
        onDelete={(id) => deleteMutation.mutate(id)}
        isDeletePending={deleteMutation.isPending}
      />

      <OrderDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        editingOrder={editingOrder}
        form={form}
        onSubmit={onSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        lang={lang}
      />
    </div>
  );
}
