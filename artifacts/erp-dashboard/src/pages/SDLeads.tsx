/**
 * @module SDLeads
 * @description Savdo lidlari (leads) ro'yxati — CRUD, KPI, export.
 *   Pattern: SDCustomers.tsx asosida qurilgan.
 */

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/lib/i18n";
import { tLabel } from "@/lib/i18n/tLabel";
import { Target, Users, TrendingUp, CheckCircle, Download, FolderOpen } from "lucide-react";

import {
  EPPageHeader, EPKpiCard, EPErrorState,
  EPSkeletonKpiRow, EPSkeletonTable, EPEmptyState, EPStatusPill,
} from "@/components/ep";
import { SearchBar } from "@/components/SearchBar";
import { Pagination } from "@/components/Pagination";

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LeadRow {
  id: number;
  title: string;
  customerId: number | null;
  customerName?: string | null;
  contactName: string | null;
  source: string | null;
  status: string;
  estimatedValue: number | null;
  assignedTo: number | null;
  assignedToName?: string | null;
  createdAt: string;
}

interface LeadStats {
  total: number;
  byStatus: Record<string, number>;
}

interface CustomerOption {
  id: number;
  title?: string;
  name?: string;
}

interface LeadFormData {
  title: string;
  customerId: string;
  source: string;
  estimatedValue: string;
  notes: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  new:          tLabel("sd.leadStatusNew",         "Yangi"),
  working:      tLabel("sd.leadStatusWorking",     "Ishlayapti"),
  quoted:       tLabel("sd.leadStatusQuoted",      "Taklif yuborildi"),
  negotiating:  tLabel("sd.leadStatusNegotiating", "Muzokaralar"),
  won:          tLabel("sd.leadStatusWon",         "Yutildi"),
  lost:         tLabel("sd.leadStatusLost",        "Yutqazildi"),
  frozen:       tLabel("sd.leadStatusFrozen",      "Muzlatildi"),
};

type EPStatusToneType = "success" | "warning" | "danger" | "info" | "brand" | "neutral";

const STATUS_TONES: Record<string, EPStatusToneType> = {
  new:         "info",
  working:     "brand",
  quoted:      "warning",
  negotiating: "warning",
  won:         "success",
  lost:        "danger",
  frozen:      "neutral",
};

const SOURCE_LABELS: Record<string, string> = {
  phone:     tLabel("sd.sourcePhone",     "Telefon"),
  telegram:  tLabel("sd.sourceTelegram",  "Telegram"),
  website:   tLabel("sd.sourceWebsite",   "Veb-sayt"),
  mobile:    tLabel("sd.sourceMobile",    "Mobil"),
  instagram: tLabel("sd.sourceInstagram", "Instagram"),
};

const ALL_STATUSES = Object.keys(STATUS_LABELS);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtNumber = (n: number | null | undefined): string => {
  if (n == null) return "—";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + " mln";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + " ming";
  return Math.round(n).toLocaleString();
};

const fmtDate = (s: string | null | undefined): string => {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleDateString("uz-UZ", {
      day: "2-digit", month: "2-digit", year: "numeric",
    });
  } catch {
    return s;
  }
};

const EMPTY_FORM: LeadFormData = {
  title: "", customerId: "", source: "", estimatedValue: "", notes: "",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function SDLeads() {
  const { t } = useTranslation("sd");
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ── State ──
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [showCreate, setShowCreate] = useState(false);
  const [editLead, setEditLead] = useState<LeadRow | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [convertId, setConvertId] = useState<number | null>(null);

  const [form, setForm] = useState<LeadFormData>(EMPTY_FORM);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [search, statusFilter]);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = "/login";
    }
  }, [authLoading, isAuthenticated]);

  // ── Queries ──
  const leadsQuery = useQuery<{ data: LeadRow[]; total: number } | LeadRow[]>({
    queryKey: ["/api/sd/leads", { search, statusFilter, page, pageSize }],
    queryFn: () => {
      const p = new URLSearchParams({
        limit: String(pageSize),
        offset: String((page - 1) * pageSize),
      });
      if (search) p.set("search", search);
      if (statusFilter !== "all") p.set("status", statusFilter);
      return apiRequest("GET", `/api/sd/leads?${p}`);
    },
    enabled: !authLoading && isAuthenticated,
  });

  const statsQuery = useQuery<LeadStats>({
    queryKey: ["/api/sd/leads/stats"],
    queryFn: () => apiRequest("GET", "/api/sd/leads/stats"),
    enabled: !authLoading && isAuthenticated,
  });

  const customersQuery = useQuery<CustomerOption[] | { data: CustomerOption[] }>({
    queryKey: ["/api/sd/customers"],
    queryFn: () => apiRequest("GET", "/api/sd/customers?limit=200"),
    enabled: showCreate || editLead !== null,
  });

  // ── Derived data ──
  const rawLeads = leadsQuery.data;
  const leads: LeadRow[] = Array.isArray(rawLeads)
    ? rawLeads
    : Array.isArray((rawLeads as { data: LeadRow[] } | undefined)?.data)
      ? (rawLeads as { data: LeadRow[] }).data
      : [];

  const totalItems: number = Array.isArray(rawLeads)
    ? (rawLeads as LeadRow[]).length
    : (rawLeads as { total?: number } | undefined)?.total ?? leads.length;

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const stats: LeadStats = statsQuery.data ?? { total: 0, byStatus: {} };

  const rawCustomers = customersQuery.data;
  const customers: CustomerOption[] = Array.isArray(rawCustomers)
    ? rawCustomers
    : Array.isArray((rawCustomers as { data: CustomerOption[] } | undefined)?.data)
      ? (rawCustomers as { data: CustomerOption[] }).data
      : [];

  // ── Mutations ──
  const createMutation = useMutation({
    mutationFn: (data: LeadFormData) =>
      apiRequest("POST", "/api/sd/leads", {
        title: data.title,
        customer_id: data.customerId ? Number(data.customerId) : undefined,
        source: data.source || undefined,
        amount: data.estimatedValue ? Number(data.estimatedValue) : undefined,
        notes: data.notes || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sd/leads"] });
      toast({ title: tLabel("sd.leadCreated", "Lead qo'shildi") });
      setShowCreate(false);
      setForm(EMPTY_FORM);
    },
    onError: (err: Error) =>
      toast({
        title: tLabel("sd.error", "Xatolik"),
        description: err.message,
        variant: "destructive",
      }),
  });

  const editMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: LeadFormData }) =>
      apiRequest("PATCH", `/api/sd/leads/${id}`, {
        title: data.title,
        customer_id: data.customerId ? Number(data.customerId) : undefined,
        source: data.source || undefined,
        amount: data.estimatedValue ? Number(data.estimatedValue) : undefined,
        notes: data.notes || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sd/leads"] });
      toast({ title: tLabel("sd.leadUpdated", "Lead yangilandi") });
      setEditLead(null);
      setForm(EMPTY_FORM);
    },
    onError: (err: Error) =>
      toast({
        title: tLabel("sd.error", "Xatolik"),
        description: err.message,
        variant: "destructive",
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/sd/leads/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sd/leads"] });
      toast({ title: tLabel("sd.leadDeleted", "Lead o'chirildi") });
      setDeleteId(null);
    },
    onError: (err: Error) =>
      toast({
        title: tLabel("sd.error", "Xatolik"),
        description: err.message,
        variant: "destructive",
      }),
  });

  const convertMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest("POST", `/api/sd/leads/${id}/convert`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sd/leads"] });
      toast({ title: tLabel("sd.leadConverted", "Buyurtmaga aylantirildi") });
      setConvertId(null);
    },
    onError: (err: Error) =>
      toast({
        title: tLabel("sd.error", "Xatolik"),
        description: err.message,
        variant: "destructive",
      }),
  });

  // ── Handlers ──
  const openEdit = (lead: LeadRow) => {
    setEditLead(lead);
    setForm({
      title: lead.title ?? "",
      customerId: lead.customerId != null ? String(lead.customerId) : "",
      source: lead.source ?? "",
      estimatedValue: lead.estimatedValue != null ? String(lead.estimatedValue) : "",
      notes: "",
    });
  };

  const handleExport = () => {
    window.open("/api/sd/leads/export", "_blank");
  };

  // ── Render ──
  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <EPPageHeader
        title={tLabel("sd.leadsPage", "Leedlar")}
        subtitle={`${stats.total} ${tLabel("sd.totalLeads", "ta lead")}`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-1" />
              {tLabel("sd.exportCsvBtn", "CSV")}
            </Button>
            <Button size="sm" onClick={() => { setForm(EMPTY_FORM); setShowCreate(true); }}>
              {tLabel("sd.addLeadBtn", "Yangi lead")}
            </Button>
          </div>
        }
      />

      {/* KPI row */}
      {leadsQuery.isLoading ? (
        <EPSkeletonKpiRow count={4} />
      ) : !leadsQuery.isError && (
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <EPKpiCard
            label={tLabel("sd.kpiTotal", "Jami")}
            value={stats.total}
            icon={Target}
            iconBg="sd"
            enterDelayMs={0}
          />
          <EPKpiCard
            label={tLabel("sd.kpiNew", "Yangi")}
            value={stats.byStatus?.new ?? 0}
            icon={Users}
            iconBg="info"
            enterDelayMs={60}
          />
          <EPKpiCard
            label={tLabel("sd.kpiWorking", "Ishlayapti")}
            value={stats.byStatus?.working ?? 0}
            icon={TrendingUp}
            iconBg="primary"
            enterDelayMs={120}
          />
          <EPKpiCard
            label={tLabel("sd.kpiWon", "Yutildi")}
            value={stats.byStatus?.won ?? 0}
            icon={CheckCircle}
            iconBg="var(--ep-green)"
            enterDelayMs={180}
          />
        </div>
      )}

      {/* Error state */}
      {leadsQuery.isError ? (
        <EPErrorState onRetry={() => leadsQuery.refetch()} error={leadsQuery.error} />
      ) : (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder={tLabel("sd.searchLeads", "Lead qidirish...")}
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder={tLabel("sd.allStatuses", "Barcha holatlar")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {tLabel("sd.allStatuses", "Barcha holatlar")}
                </SelectItem>
                {ALL_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABELS[s] ?? s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {leadsQuery.isLoading ? (
            <EPSkeletonTable rows={8} cols={8} />
          ) : leads.length === 0 ? (
            <EPEmptyState
              icon={FolderOpen}
              title={tLabel("sd.noLeads", "Leedlar yo'q")}
              description={tLabel("sd.noLeadsHint", "Yangi lead yarating")}
            />
          ) : (
            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>{tLabel("sd.colTitle",        "Sarlavha")}</TableHead>
                    <TableHead>{tLabel("sd.colCustomer",     "Mijoz")}</TableHead>
                    <TableHead>{tLabel("sd.colSource",       "Manba")}</TableHead>
                    <TableHead>{tLabel("sd.colStatus",       "Holat")}</TableHead>
                    <TableHead className="text-right">
                      {tLabel("sd.colValue", "Summa")}
                    </TableHead>
                    <TableHead>{tLabel("sd.colManager",      "Menejer")}</TableHead>
                    <TableHead>{tLabel("sd.colDate",         "Sana")}</TableHead>
                    <TableHead className="text-right">
                      {tLabel("sd.colActions", "Amallar")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead, idx) => (
                    <TableRow key={lead.id}>
                      <TableCell className="text-muted-foreground text-xs">
                        {(page - 1) * pageSize + idx + 1}
                      </TableCell>
                      <TableCell className="font-medium max-w-[160px] truncate">
                        {lead.title}
                      </TableCell>
                      <TableCell className="text-sm">
                        {lead.customerName ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {lead.source ? (SOURCE_LABELS[lead.source] ?? lead.source) : "—"}
                      </TableCell>
                      <TableCell>
                        <EPStatusPill tone={STATUS_TONES[lead.status] ?? "neutral"}>
                          {STATUS_LABELS[lead.status] ?? lead.status}
                        </EPStatusPill>
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {fmtNumber(lead.estimatedValue)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {lead.assignedToName ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        {fmtDate(lead.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(lead)}
                          >
                            {tLabel("sd.edit", "Tahrir")}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setConvertId(lead.id)}
                          >
                            {tLabel("sd.convert", "Aylantir")}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteId(lead.id)}
                          >
                            {tLabel("sd.delete", "O'chir")}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={totalItems}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      {/* ── Create dialog ── */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{tLabel("sd.addLeadTitle", "Yangi lead")}</DialogTitle>
          </DialogHeader>
          <LeadForm
            form={form}
            setForm={setForm}
            customers={customers}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              {tLabel("sd.cancel", "Bekor")}
            </Button>
            <Button
              onClick={() => createMutation.mutate(form)}
              disabled={!form.title.trim() || createMutation.isPending}
            >
              {createMutation.isPending
                ? tLabel("sd.saving", "Saqlanmoqda...")
                : tLabel("sd.save", "Saqlash")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit dialog ── */}
      <Dialog open={editLead !== null} onOpenChange={(o) => { if (!o) setEditLead(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{tLabel("sd.editLeadTitle", "Leadni tahrirlash")}</DialogTitle>
          </DialogHeader>
          <LeadForm
            form={form}
            setForm={setForm}
            customers={customers}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditLead(null)}>
              {tLabel("sd.cancel", "Bekor")}
            </Button>
            <Button
              onClick={() => {
                if (editLead) editMutation.mutate({ id: editLead.id, data: form });
              }}
              disabled={!form.title.trim() || editMutation.isPending}
            >
              {editMutation.isPending
                ? tLabel("sd.saving", "Saqlanmoqda...")
                : tLabel("sd.save", "Saqlash")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirm dialog ── */}
      <Dialog open={deleteId !== null} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{tLabel("sd.deleteConfirmTitle", "O'chirishni tasdiqlang")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {tLabel("sd.deleteConfirmDesc", "Bu amalni qaytarib bo'lmaydi.")}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              {tLabel("sd.cancel", "Bekor")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => { if (deleteId != null) deleteMutation.mutate(deleteId); }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending
                ? tLabel("sd.deleting", "O'chirilmoqda...")
                : tLabel("sd.deleteBtn", "O'chirish")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Convert confirm dialog ── */}
      <Dialog open={convertId !== null} onOpenChange={(o) => { if (!o) setConvertId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{tLabel("sd.convertTitle", "Buyurtmaga aylantirish")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {tLabel("sd.convertConfirm", "Bu leadni buyurtmaga aylantirmoqchimisiz?")}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConvertId(null)}>
              {tLabel("sd.cancel", "Bekor")}
            </Button>
            <Button
              onClick={() => { if (convertId != null) convertMutation.mutate(convertId); }}
              disabled={convertMutation.isPending}
            >
              {convertMutation.isPending
                ? tLabel("sd.converting", "Aylantirilmoqda...")
                : tLabel("sd.convertBtn", "Aylantirish")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── LeadForm sub-component ───────────────────────────────────────────────────

interface LeadFormProps {
  form: LeadFormData;
  setForm: (f: LeadFormData) => void;
  customers: CustomerOption[];
}

function LeadForm({ form, setForm, customers }: LeadFormProps) {
  const update = (key: keyof LeadFormData, value: string) =>
    setForm({ ...form, [key]: value });

  return (
    <div className="flex flex-col gap-4">
      {/* Title */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="lead-title">
          {tLabel("sd.formTitle", "Sarlavha")} <span className="text-destructive">*</span>
        </Label>
        <Input
          id="lead-title"
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
          placeholder={tLabel("sd.formTitlePlaceholder", "Lead sarlavhasi")}
        />
      </div>

      {/* Customer */}
      <div className="flex flex-col gap-1.5">
        <Label>{tLabel("sd.formCustomer", "Mijoz")}</Label>
        <Select value={form.customerId} onValueChange={(v) => update("customerId", v)}>
          <SelectTrigger>
            <SelectValue placeholder={tLabel("sd.formCustomerPlaceholder", "Mijozni tanlang")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{tLabel("sd.formNoCustomer", "Mijoz yo'q")}</SelectItem>
            {(Array.isArray(customers) ? customers : []).map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.title ?? c.name ?? `#${c.id}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Source */}
      <div className="flex flex-col gap-1.5">
        <Label>{tLabel("sd.formSource", "Manba")}</Label>
        <Select value={form.source} onValueChange={(v) => update("source", v)}>
          <SelectTrigger>
            <SelectValue placeholder={tLabel("sd.formSourcePlaceholder", "Manbani tanlang")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{tLabel("sd.formNoSource", "Belgilanmagan")}</SelectItem>
            {Object.entries(SOURCE_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Estimated value */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="lead-value">
          {tLabel("sd.formEstimatedValue", "Mo'ljallangan summa")}
        </Label>
        <Input
          id="lead-value"
          type="number"
          value={form.estimatedValue}
          onChange={(e) => update("estimatedValue", e.target.value)}
          placeholder="0"
        />
      </div>

      {/* Notes */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="lead-notes">
          {tLabel("sd.formNotes", "Izoh")}
        </Label>
        <Textarea
          id="lead-notes"
          value={form.notes}
          onChange={(e) => update("notes", e.target.value)}
          placeholder={tLabel("sd.formNotesPlaceholder", "Qo'shimcha ma'lumot...")}
          rows={3}
        />
      </div>
    </div>
  );
}
