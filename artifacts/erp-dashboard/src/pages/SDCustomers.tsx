/**
 * @module SDCustomers
 * @description Mijozlar bazasi (SD/CRM moduli — blue accent).
 *
 *   Migrated to the EuroPrint design system:
 *     - <EPPageHeader> replaces the orange→amber gradient header
 *     - 5-tile <EPKpiCard> row directly on the page
 *     - <EPErrorState> + <EPSkeletonKpiRow> for the data states
 *     - Edit + Delete dialogs
 *     - 360 view modal (inline)
 *     - Pagination
 */

import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Users, Sparkles, UserCheck, BarChart3, TrendingUp,
  Pencil, Trash2,
} from "lucide-react";
import { tLabel } from "@/lib/i18n/tLabel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

import { Customer, CustomerFormData } from "./SDCustomersTypes";
import { AddCustomerDialog } from "./SDCustomersDialogs";
import { CustomerFilterBar } from "./SDCustomersSections";
import { useTranslation } from "@/lib/i18n";
import {
  EPPageHeader, EPKpiCard, EPErrorState, EPSkeletonKpiRow, EPStatusPill,
} from "@/components/ep";
import type { EPStatusTone } from "@/components/ep/EPStatusPill";
import { Pagination } from "@/components/Pagination";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CustomerRow extends Customer {
  title?: string;
  openDebt?: number;
  totalOrders?: number;
}

interface Customer360Data {
  recentOrders?: { documentNumber: string; status: string; totalAmount: number }[];
  contacts?: { fullName: string; position: string; phone: string }[];
}

// ---------------------------------------------------------------------------
// Form schema
// ---------------------------------------------------------------------------

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

const segTone = (seg: string): EPStatusTone =>
  seg === "A" ? "success" : seg === "B" ? "info" : seg === "C" ? "warning" : seg === "D" ? "danger" : "neutral";

const statusTone = (status: string): EPStatusTone =>
  status === "active" ? "success" : status === "blacklist" ? "danger" : "warning";

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function SDCustomers() {
  const { t } = useTranslation("common");
  const [search, setSearch] = useState("");
  const [segFilter, setSegFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const { toast } = useToast();
  const qc = useQueryClient();
  const [, setLocation] = useLocation();

  // Edit dialog
  const [editDialog, setEditDialog] = useState<{ open: boolean; customer?: CustomerRow }>({ open: false });
  const [editForm, setEditForm] = useState<Partial<CustomerRow>>({});

  // Delete dialog
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id?: number; name?: string }>({ open: false });

  // 360 view dialog
  const [view360Dialog, setView360Dialog] = useState<{ open: boolean; customerId?: number }>({ open: false });
  const [tab360, setTab360] = useState<"orders" | "contacts">("orders");

  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------

  const {
    data: listData,
    isLoading,
    isError, error,
    refetch,
  } = useQuery({
    queryKey: ["/api/sd/customers", { search, segFilter, statusFilter, page, pageSize }],
    queryFn: () => {
      const p = new URLSearchParams({ limit: String(pageSize), offset: String((page - 1) * pageSize) });
      if (search) p.set("search", search);
      if (statusFilter !== "all") p.set("status", statusFilter);
      return apiRequest("GET", `/api/sd/customers?${p}`);
    },
  });

  const customers: CustomerRow[] = useMemo(() => {
    if (Array.isArray(listData)) return listData as CustomerRow[];
    const d = listData as { data?: CustomerRow[] } | null;
    return Array.isArray(d?.data) ? d!.data : [];
  }, [listData]);

  const total: number = (() => {
    const d = listData as { pagination?: { total: number }; total?: number } | null;
    return d?.pagination?.total ?? d?.total ?? customers.length;
  })();
  const totalPages = Math.ceil(total / pageSize) || 1;

  const filtered = useMemo(() => {
    if (segFilter === "all") return customers;
    return customers.filter((c) => (c.customerCategory || c.segment || "C") === segFilter);
  }, [customers, segFilter]);

  const stats = useMemo(() => {
    const totalCount = customers.length;
    const segs: Record<string, number> = {};
    let totalVal = 0;
    let activeCount = 0;
    customers.forEach((c) => {
      const s = c.customerCategory || c.segment || "C";
      segs[s] = (segs[s] || 0) + 1;
      totalVal += Number(c.lifetime_value || 0);
      if (c.status === "active") activeCount++;
    });
    return { total: totalCount, segs, totalVal, activeCount };
  }, [customers]);

  // 360 query
  const { data: c360 } = useQuery<Customer360Data>({
    queryKey: ["/api/sd/customers", view360Dialog.customerId, "360"],
    queryFn: () => apiRequest("GET", `/api/sd/customers/${view360Dialog.customerId}/360`),
    enabled: !!view360Dialog.customerId && view360Dialog.open,
  });

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------

  const addForm = useForm<CustomerFormData>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: { customerType: "legal" as const, title: "" },
  });

  const addMutation = useMutation({
    mutationFn: (data: CustomerFormData) =>
      apiRequest("POST", "/api/sd/customers", { name: data.title, ...data }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/sd/customers"] });
      toast({ title: tLabel("sd.customers.added", "Mijoz qo'shildi") });
      setShowAdd(false);
      addForm.reset();
    },
    onError: (err: Error) =>
      toast({
        title: tLabel("sd.error", "Xatolik"),
        description: err.message || tLabel("sd.customers.addFailed", "Mijoz qo'shib bo'lmadi"),
        variant: "destructive",
      }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CustomerRow> }) =>
      apiRequest("PUT", `/api/sd/customers/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/sd/customers"] });
      toast({ title: tLabel("sd.customers.updated", "Mijoz yangilandi") });
      setEditDialog({ open: false });
    },
    onError: () => toast({ title: tLabel("sd.error", "Xatolik"), variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/sd/customers/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/sd/customers"] });
      toast({ title: tLabel("sd.customers.deleted", "Mijoz o'chirildi") });
      setDeleteDialog({ open: false });
    },
    onError: () => toast({ title: tLabel("sd.error.delete", "O'chirishda xatolik"), variant: "destructive" }),
  });

  const openEdit = (c: CustomerRow) => {
    setEditForm({ title: c.name, phone: c.phone, email: c.email, address: c.address, status: c.status });
    setEditDialog({ open: true, customer: c });
  };

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

      {/* KPI row */}
      {isLoading ? (
        <EPSkeletonKpiRow count={5} />
      ) : !isError && (
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
          <EPKpiCard label={t("jamiMijozlar")} value={stats.total} icon={Users} iconBg="sd" enterDelayMs={0} />
          <EPKpiCard label="VIP (A)" value={stats.segs.A || 0} icon={Sparkles} iconBg="var(--ep-green)" enterDelayMs={60} />
          <EPKpiCard label="Doimiy (B)" value={stats.segs.B || 0} icon={UserCheck} iconBg="sd" enterDelayMs={120} />
          <EPKpiCard label="Oddiy (C)" value={stats.segs.C || 0} icon={BarChart3} iconBg="primary" enterDelayMs={180} />
          <EPKpiCard label={t("umumiyQiymat")} staticValue={fmtMoney(stats.totalVal)} icon={TrendingUp} iconBg="var(--ep-purple)" enterDelayMs={240} />
        </div>
      )}

      {isError ? (
        <EPErrorState onRetry={refetch} error={error} />
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
            onClear={() => { setSegFilter("all"); setStatusFilter("all"); setSearch(""); setPage(1); }}
          />

          {/* Table */}
          <div className="bg-card rounded-xl border-none overflow-hidden">
            <div className="ep-table-scroll">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/60 hover:bg-muted/60 border-none">
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-4">
                      {tLabel("sd.col.customer", "Mijoz")}
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-4">
                      {tLabel("sd.col.segment", "Segment")}
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-4">
                      {tLabel("sd.col.debt", "Qarz")}
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-4">
                      {tLabel("sd.col.orders", "Buyurtmalar")}
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-4">
                      {tLabel("sd.col.status", "Holat")}
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-4">
                      {tLabel("sd.col.actions", "Amallar")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={`sk-${i}`} className="border-none">
                        <TableCell colSpan={6} className="py-3 px-4">
                          <div className="h-4 bg-muted/60 rounded animate-pulse" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : filtered.length === 0 ? (
                    <TableRow className="border-none">
                      <TableCell colSpan={6} className="py-12 text-center text-muted-foreground text-sm">
                        {tLabel("sd.customers.notFound", "Mijozlar topilmadi")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    (Array.isArray(filtered) ? filtered : []).map((c) => {
                      const seg = c.customerCategory || c.segment || "C";
                      const debt = Number(c.openDebt || 0);
                      return (
                        <TableRow
                          key={c.id}
                          className="hover:bg-muted/40 transition-colors border-none cursor-pointer"
                          data-testid={`row-customer-${c.id}`}
                          onClick={() => setLocation(`/sd/customers/${c.id}`)}
                        >
                          <TableCell className="py-3 px-4">
                            <div className="font-medium text-sm text-foreground">{c.name}</div>
                            {c.phone && <div className="text-xs text-muted-foreground">{c.phone}</div>}
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            <EPStatusPill tone={segTone(seg)}>{seg}</EPStatusPill>
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            <span className={debt > 0 ? "text-[var(--ep-red)] font-semibold" : "text-muted-foreground"}>
                              {fmtMoney(debt)}
                            </span>
                          </TableCell>
                          <TableCell className="py-3 px-4 text-foreground">
                            {c.totalOrders ?? c.order_count ?? 0}
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            <EPStatusPill tone={statusTone(c.status)}>{c.status}</EPStatusPill>
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                onClick={(e) => { e.stopPropagation(); setLocation(`/sd/customers/${c.id}`); }}
                                data-testid={`btn-360-${c.id}`}
                              >
                                360°
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={(e) => { e.stopPropagation(); openEdit(c); }}
                                data-testid={`btn-edit-${c.id}`}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-[var(--ep-red)] hover:text-[var(--ep-red)]"
                                onClick={(e) => { e.stopPropagation(); setDeleteDialog({ open: true, id: c.id, name: c.name }); }}
                                data-testid={`btn-delete-${c.id}`}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            <Pagination
              currentPage={page}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={total}
              onPageChange={(p) => setPage(p)}
              onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
            />
          </div>
        </>
      )}

      {/* ── Edit Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={editDialog.open} onOpenChange={(o) => setEditDialog({ open: o })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tLabel("sd.customers.editTitle", "Mijozni tahrirlash")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>{tLabel("sd.field.name", "Nomi")}</Label>
              <Input
                value={(editForm.title ?? editForm.name) ?? ""}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              />
            </div>
            <div>
              <Label>{tLabel("sd.field.phone", "Telefon")}</Label>
              <Input
                value={editForm.phone ?? ""}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              />
            </div>
            <div>
              <Label>{tLabel("sd.field.email", "Email")}</Label>
              <Input
                value={editForm.email ?? ""}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
            </div>
            <div>
              <Label>{tLabel("sd.field.address", "Manzil")}</Label>
              <Textarea
                value={editForm.address ?? ""}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                rows={2}
              />
            </div>
            <div>
              <Label>{tLabel("sd.field.status", "Holat")}</Label>
              <Select
                value={editForm.status ?? "active"}
                onValueChange={(v) => setEditForm({ ...editForm, status: v })}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{tLabel("sd.status.active", "Faol")}</SelectItem>
                  <SelectItem value="inactive">{tLabel("sd.status.inactive", "Nofaol")}</SelectItem>
                  <SelectItem value="blacklist">{tLabel("sd.status.blacklist", "Qora ro'yxat")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full"
              disabled={updateMutation.isPending}
              onClick={() => {
                if (editDialog.customer?.id) {
                  updateMutation.mutate({ id: editDialog.customer.id, data: editForm });
                }
              }}
            >
              {updateMutation.isPending
                ? tLabel("sd.saving", "Saqlanmoqda...")
                : tLabel("sd.save", "Saqlash")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm Dialog ────────────────────────────────────────── */}
      <Dialog open={deleteDialog.open} onOpenChange={(o) => setDeleteDialog({ open: o })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tLabel("sd.customers.deleteConfirm", "O'chirishni tasdiqlang")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            <strong>{deleteDialog.name}</strong>
            {tLabel("sd.customers.deleteWarning", " ni o'chirishni xohlaysizmi? Bu amalni qaytarib bo'lmaydi.")}
          </p>
          <div className="flex gap-2 justify-end mt-4">
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false })}>
              {tLabel("sd.cancel", "Bekor qilish")}
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => { if (deleteDialog.id) deleteMutation.mutate(deleteDialog.id); }}
            >
              {deleteMutation.isPending
                ? tLabel("sd.deleting", "O'chirilmoqda...")
                : tLabel("sd.delete", "O'chirish")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── 360 View Dialog ─────────────────────────────────────────────── */}
      <Dialog open={view360Dialog.open} onOpenChange={(o) => setView360Dialog({ open: o })}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {tLabel("sd.360.title", "Mijoz 360°")} — ID: {view360Dialog.customerId}
            </DialogTitle>
          </DialogHeader>

          {/* Simple tab switcher */}
          <div className="flex gap-1 border border-border rounded-lg p-0.5 bg-card w-fit">
            <button
              className={`text-xs px-3 py-1 rounded-md transition-colors ${tab360 === "orders" ? "bg-primary text-white font-medium" : "text-muted-foreground hover:bg-muted"}`}
              onClick={() => setTab360("orders")}
            >
              {tLabel("sd.360.orders", "Buyurtmalar")}
            </button>
            <button
              className={`text-xs px-3 py-1 rounded-md transition-colors ${tab360 === "contacts" ? "bg-primary text-white font-medium" : "text-muted-foreground hover:bg-muted"}`}
              onClick={() => setTab360("contacts")}
            >
              {tLabel("sd.360.contacts", "Kontaktlar")}
            </button>
          </div>

          {tab360 === "orders" && (
            <div className="ep-table-scroll">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/60 hover:bg-muted/60 border-none">
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-2 px-3">
                      {tLabel("sd.col.docNum", "Raqam")}
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-2 px-3">
                      {tLabel("sd.col.status", "Holat")}
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-2 px-3">
                      {tLabel("sd.col.amount", "Summa")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(Array.isArray(c360?.recentOrders) ? c360!.recentOrders : []).length === 0 ? (
                    <TableRow className="border-none">
                      <TableCell colSpan={3} className="py-8 text-center text-muted-foreground text-sm">
                        {tLabel("sd.360.noOrders", "Buyurtmalar yo'q")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    (Array.isArray(c360?.recentOrders) ? c360!.recentOrders : []).map((o, i) => (
                      <TableRow key={`o-${i}`} className="hover:bg-muted/40 border-none">
                        <TableCell className="py-2 px-3 font-mono text-sm">{o.documentNumber}</TableCell>
                        <TableCell className="py-2 px-3">
                          <Badge className="text-xs rounded-full border-none bg-muted/60 text-foreground">{o.status}</Badge>
                        </TableCell>
                        <TableCell className="py-2 px-3 font-semibold">{fmtMoney(Number(o.totalAmount))}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {tab360 === "contacts" && (
            <div className="ep-table-scroll">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/60 hover:bg-muted/60 border-none">
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-2 px-3">
                      {tLabel("sd.col.fullName", "Ism")}
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-2 px-3">
                      {tLabel("sd.col.position", "Lavozim")}
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-2 px-3">
                      {tLabel("sd.col.phone", "Telefon")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(Array.isArray(c360?.contacts) ? c360!.contacts : []).length === 0 ? (
                    <TableRow className="border-none">
                      <TableCell colSpan={3} className="py-8 text-center text-muted-foreground text-sm">
                        {tLabel("sd.360.noContacts", "Kontaktlar yo'q")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    (Array.isArray(c360?.contacts) ? c360!.contacts : []).map((ct, i) => (
                      <TableRow key={`ct-${i}`} className="hover:bg-muted/40 border-none">
                        <TableCell className="py-2 px-3 font-medium text-sm">{ct.fullName}</TableCell>
                        <TableCell className="py-2 px-3 text-sm text-muted-foreground">{ct.position}</TableCell>
                        <TableCell className="py-2 px-3 text-sm">{ct.phone}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
