/**
 * @module SDCustomers
 * @description Mijozlar bazasi (SD/CRM moduli — blue accent).
 *
 *   Migrated to the EuroPrint design system:
 *     - <EPPageHeader> replaces the orange→amber gradient header
 *       (gradient is forbidden in ERP shell)
 *     - 5-tile <EPKpiCard> row directly on the page (the old gradient-laden
 *       CustomerKpiCards sub-file is bypassed — each segment now gets its
 *       own flat module hue with stagger animation)
 *     - <EPErrorState> + <EPSkeletonKpiRow> for the data states
 *     - Verb-first Uzbek CTA on the dialog trigger
 */

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Users, Sparkles, UserCheck, BarChart3, TrendingUp,
} from "lucide-react";
import { Customer360View } from "@/components/sd/Customer360View";

import { Customer, CustomerFormData } from "./SDCustomersTypes";
import { AddCustomerDialog } from "./SDCustomersDialogs";
import { CustomerFilterBar, CustomerTable } from "./SDCustomersSections";
import { useTranslation } from '@/lib/i18n';
import {
  EPPageHeader, EPKpiCard, EPErrorState, EPSkeletonKpiRow,
} from "@/components/ep";

const customerFormSchema = z.object({
  title: z.string().min(1, "Nom kerak"),
  customerType: z.enum(["legal", "individual"]).default("legal"),
  stir: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  industry: z.string().optional(),
  source: z.string().optional(),
  creditLimit: z.coerce.number().optional(),
  paymentTermsDays: z.coerce.number().optional(),
});

// Compact currency formatter for the "Umumiy qiymat" KPI
const fmtMoney = (n: number): string => {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + " mlrd";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + " mln";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + " ming";
  return Math.round(n).toLocaleString();
};

export default function SDCustomers() {
  const { t } = useTranslation("common");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [segFilter, setSegFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const { toast } = useToast();
  const qc = useQueryClient();

  const {
    data: listData,
    isLoading,
    isError, error,
    refetch,
  } = useQuery<{ data: Customer[] }>({
    queryKey: ["/api/sd/customers", { search, segFilter, statusFilter }],
    queryFn: () => {
      const p = new URLSearchParams({ limit: "100" });
      if (search) p.set("search", search);
      if (statusFilter !== "all") p.set("status", statusFilter);
      return apiRequest("GET", `/api/sd/customers?${p}`);
    },
  });

  const customers: Customer[] = Array.isArray(listData) ? listData : (listData?.data || []);

  const filtered = useMemo(() => {
    if (segFilter === "all") return customers;
    return customers.filter((c) => (c.customerCategory || c.segment || "C") === segFilter);
  }, [customers, segFilter]);

  const stats = useMemo(() => {
    const total = customers.length;
    const segs: Record<string, number> = {};
    let totalVal = 0;
    let activeCount = 0;
    customers.forEach((c) => {
      const s = c.customerCategory || c.segment || "C";
      segs[s] = (segs[s] || 0) + 1;
      totalVal += Number(c.lifetime_value || 0);
      if (c.status === "active") activeCount++;
    });
    return { total, segs, totalVal, activeCount };
  }, [customers]);

  const addForm = useForm<CustomerFormData>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: { customerType: "legal" as const, title: "" },
  });

  const addMutation = useMutation({
    mutationFn: (data: CustomerFormData) =>
      apiRequest("POST", "/api/sd/customers", { name: data.title, ...data }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/sd/customers"] });
      toast({ title: "Mijoz qo'shildi" });
      setShowAdd(false);
      addForm.reset();
    },
    onError: (err: Error) =>
      toast({
        title: "Xatolik",
        description: err.message || "Mijoz qo'shib bo'lmadi",
        variant: "destructive",
      }),
  });

  // ─── 360 VIEW ─────────────────────────────────────────────────────────
  if (selectedId !== null) {
    return (
      <div>
        <Customer360View customerId={selectedId} onBack={() => setSelectedId(null)} />
      </div>
    );
  }

  // ─── LIST VIEW ────────────────────────────────────────────────────────
  const hasFilters = segFilter !== "all" || statusFilter !== "all" || !!search;

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <EPPageHeader
        breadcrumb={<>{t("dashboardSd")}<b className="text-foreground">{t("mijozlar")}</b></>}
        title={t("mijozlarBazasi")}
        subtitle={`${stats.total} ta mijoz · ${stats.activeCount} ta faol`}
        actions={
          <AddCustomerDialog
            open={showAdd}
            onOpenChange={setShowAdd}
            form={addForm}
            onSubmit={(d) => addMutation.mutate(d)}
            isPending={addMutation.isPending}
          />
        }
      />

      {/* KPI row — flat module hues, no gradients */}
      {isLoading ? (
        <EPSkeletonKpiRow count={5} />
      ) : !isError && (
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
          <EPKpiCard
            label={t("jamiMijozlar")}
            value={stats.total}
            icon={Users}
            iconBg="sd"
            enterDelayMs={0}
          />
          <EPKpiCard
            label="VIP (A)"
            value={stats.segs.A || 0}
            icon={Sparkles}
            iconBg="var(--ep-green)"
            enterDelayMs={60}
          />
          <EPKpiCard
            label="Doimiy (B)"
            value={stats.segs.B || 0}
            icon={UserCheck}
            iconBg="sd"
            enterDelayMs={120}
          />
          <EPKpiCard
            label="Oddiy (C)"
            value={stats.segs.C || 0}
            icon={BarChart3}
            iconBg="primary"
            enterDelayMs={180}
          />
          <EPKpiCard
            label={t("umumiyQiymat")}
            staticValue={fmtMoney(stats.totalVal)}
            icon={TrendingUp}
            iconBg="var(--ep-purple)"
            enterDelayMs={240}
          />
        </div>
      )}

      {isError ? (
        <EPErrorState onRetry={refetch}  error={error} />
      ) : (
        <>
          <CustomerFilterBar
            search={search}
            setSearch={setSearch}
            segFilter={segFilter}
            setSegFilter={setSegFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            hasFilters={hasFilters}
            onClear={() => {
              setSegFilter("all");
              setStatusFilter("all");
              setSearch("");
            }}
          />

          <CustomerTable
            customers={customers}
            filtered={filtered}
            isLoading={isLoading}
            onSelect={setSelectedId}
          />
        </>
      )}
    </div>
  );
}
