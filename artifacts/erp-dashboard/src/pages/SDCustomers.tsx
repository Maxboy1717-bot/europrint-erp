import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Users, Building2, Search, Plus, Eye, X, User, Phone,
  TrendingUp, CreditCard, UserCheck, AlertTriangle, ChevronRight,
  BarChart3, ArrowUpRight, ArrowDownRight, Sparkles,
} from "lucide-react";
import { fmtMoney, fmtDate, fmtNum } from "@/components/sd/helpers";
import { Customer360View } from "@/components/sd/Customer360View";

interface Customer {
  id: number;
  name: string;
  customerCode?: string;
  customerType: "legal" | "individual";
  customerCategory?: string;
  segment?: string;
  status: string;
  stir?: string;
  inn?: string;
  industry?: string;
  phone?: string;
  email?: string;
  address?: string;
  openDebt?: number;
  order_count?: number;
  lifetime_value?: string | number;
  lastContactedAt?: string;
  created_at?: string;
}

type CustomerFormData = {
  title: string;
  customerType: "legal" | "individual";
  stir?: string;
  phone?: string;
  email?: string;
  address?: string;
  industry?: string;
  source?: string;
  creditLimit?: number;
  paymentTermsDays?: number;
};

const SEGMENT_CONF: Record<string, { label: string; bg: string; text: string; ring: string; icon: string }> = {
  A: { label: "VIP", bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-300", ring: "ring-emerald-200 dark:ring-emerald-800", icon: "A" },
  B: { label: "Doimiy", bg: "bg-sky-50 dark:bg-sky-950/40", text: "text-sky-700 dark:text-sky-300", ring: "ring-sky-200 dark:ring-sky-800", icon: "B" },
  C: { label: "Oddiy", bg: "bg-amber-50 dark:bg-amber-950/40", text: "text-amber-700 dark:text-amber-300", ring: "ring-amber-200 dark:ring-amber-800", icon: "C" },
  D: { label: "Xavfli", bg: "bg-rose-50 dark:bg-rose-950/40", text: "text-rose-700 dark:text-rose-300", ring: "ring-rose-200 dark:ring-rose-800", icon: "D" },
  new: { label: "Yangi", bg: "bg-violet-50 dark:bg-violet-950/40", text: "text-violet-700 dark:text-violet-300", ring: "ring-violet-200 dark:ring-violet-800", icon: "N" },
};

const STATUS_CONF: Record<string, { label: string; dot: string }> = {
  active: { label: "Aktiv", dot: "bg-emerald-500" },
  inactive: { label: "Nofaol", dot: "bg-gray-400" },
  blacklist: { label: "Qora ro'yxat", dot: "bg-rose-500" },
};

function SegBadge({ seg }: { seg?: string }) {
  const s = SEGMENT_CONF[seg || "C"] || SEGMENT_CONF.C;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ring-1 ${s.bg} ${s.text} ${s.ring}`}>
      {s.icon} <span className="hidden sm:inline">— {s.label}</span>
    </span>
  );
}

function StatusDot({ status }: { status?: string }) {
  const s = STATUS_CONF[status || "active"] || STATUS_CONF.active;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

export default function SDCustomers() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [segFilter, setSegFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: listData, isLoading } = useQuery<{ data: Customer[] }>({
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
    return customers.filter(c => (c.customerCategory || c.segment || "C") === segFilter);
  }, [customers, segFilter]);

  // Stats
  const stats = useMemo(() => {
    const total = customers.length;
    const segs: Record<string, number> = {};
    let totalVal = 0;
    let activeCount = 0;
    customers.forEach(c => {
      const s = c.customerCategory || c.segment || "C";
      segs[s] = (segs[s] || 0) + 1;
      totalVal += Number(c.lifetime_value || 0);
      if (c.status === "active") activeCount++;
    });
    return { total, segs, totalVal, activeCount };
  }, [customers]);

  const addForm = useForm<CustomerFormData>({
    resolver: zodResolver(z.object({
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
    })),
    defaultValues: { customerType: "legal" as const, title: "" },
  });

  const addMutation = useMutation({
    mutationFn: (data: CustomerFormData) => apiRequest("POST", "/api/sd/customers", { name: data.title, ...data }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/sd/customers"] });
      toast({ title: "Mijoz muvaffaqiyatli qo'shildi" });
      setShowAdd(false);
      addForm.reset();
    },
    onError: (err: Error) => toast({ title: "Xatolik", description: err.message || "Mijoz qo'shib bo'lmadi", variant: "destructive" }),
  });

  /* ──────────────── 360 VIEW ──────────────── */
  if (selectedId !== null) {
    return (
      <div className="p-3 lg:p-5 max-w-[1400px] mx-auto">
        <Customer360View customerId={selectedId} onBack={() => setSelectedId(null)} />
      </div>
    );
  }

  /* ──────────────── LIST VIEW ──────────────── */
  const hasFilters = segFilter !== "all" || statusFilter !== "all" || !!search;

  return (
    <div className="p-3 lg:p-5 max-w-[1400px] mx-auto space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-md shadow-orange-500/20">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Mijozlar bazasi</h1>
            <p className="text-xs text-muted-foreground">
              {stats.total} ta mijoz &middot; {stats.activeCount} ta aktiv
            </p>
          </div>
        </div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-md shadow-orange-500/20 text-white border-0"
              data-testid="btn-add-customer">
              <Plus className="h-4 w-4 mr-1.5" />Yangi mijoz
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Yangi mijoz qo'shish</DialogTitle></DialogHeader>
            <Form {...addForm}>
              <form onSubmit={addForm.handleSubmit(d => addMutation.mutate(d))} className="space-y-3">
                <FormField control={addForm.control} name="title" render={({ field }) => (
                  <FormItem><FormLabel>Kompaniya / Ism *</FormLabel>
                    <FormControl><Input {...field} data-testid="input-customer-title" placeholder="Kompaniya nomi" /></FormControl>
                    <FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={addForm.control} name="customerType" render={({ field }) => (
                    <FormItem><FormLabel>Tur</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger data-testid="select-customer-type"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="legal">Yuridik</SelectItem>
                          <SelectItem value="individual">Jismoniy</SelectItem>
                        </SelectContent>
                      </Select></FormItem>
                  )} />
                  <FormField control={addForm.control} name="stir" render={({ field }) => (
                    <FormItem><FormLabel>STIR (INN)</FormLabel>
                      <FormControl><Input {...field} data-testid="input-stir" /></FormControl></FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={addForm.control} name="phone" render={({ field }) => (
                    <FormItem><FormLabel>Telefon</FormLabel>
                      <FormControl><Input {...field} placeholder="+998 ..." /></FormControl></FormItem>
                  )} />
                  <FormField control={addForm.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>Email</FormLabel>
                      <FormControl><Input {...field} type="email" /></FormControl></FormItem>
                  )} />
                </div>
                <FormField control={addForm.control} name="address" render={({ field }) => (
                  <FormItem><FormLabel>Manzil</FormLabel>
                    <FormControl><Input {...field} /></FormControl></FormItem>
                )} />
                <FormField control={addForm.control} name="source" render={({ field }) => (
                  <FormItem><FormLabel>Manbaa</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Tanlang" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="ads">Reklama</SelectItem>
                        <SelectItem value="referral">Tavsiya</SelectItem>
                        <SelectItem value="website">Veb-sayt</SelectItem>
                        <SelectItem value="exhibition">Ko'rgazma</SelectItem>
                        <SelectItem value="other">Boshqa</SelectItem>
                      </SelectContent>
                    </Select></FormItem>
                )} />
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" type="button" onClick={() => setShowAdd(false)}>Bekor</Button>
                  <Button type="submit" disabled={addMutation.isPending} data-testid="btn-submit-customer"
                    className="bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0">
                    {addMutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: "Jami", value: stats.total, icon: Users, gradient: "from-slate-500 to-slate-600", sub: "mijoz" },
          { label: "VIP (A)", value: stats.segs.A || 0, icon: Sparkles, gradient: "from-emerald-500 to-teal-500", sub: "mijoz" },
          { label: "Doimiy (B)", value: stats.segs.B || 0, icon: UserCheck, gradient: "from-sky-500 to-blue-500", sub: "mijoz" },
          { label: "Oddiy (C)", value: stats.segs.C || 0, icon: BarChart3, gradient: "from-amber-500 to-orange-500", sub: "mijoz" },
          { label: "Umumiy qiymat", value: fmtMoney(stats.totalVal), icon: TrendingUp, gradient: "from-violet-500 to-purple-500", sub: "" },
        ].map(s => (
          <div key={s.label} className="relative overflow-hidden rounded-xl border bg-card p-3.5 hover:shadow-md transition-shadow">
            <div className={`absolute -right-3 -top-3 w-14 h-14 rounded-full bg-gradient-to-br ${s.gradient} opacity-10`} />
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{s.label}</p>
                <p className="text-xl font-bold mt-0.5">{s.value}</p>
                {s.sub && <p className="text-[10px] text-muted-foreground">{s.sub}</p>}
              </div>
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${s.gradient} flex items-center justify-center shadow-sm`}>
                <s.icon className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Search & Filters ── */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9 h-9 rounded-lg" placeholder="Qidirish (nom, STIR, kod...)"
            value={search} onChange={e => setSearch(e.target.value)}
            data-testid="input-search-customers" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {["all", "A", "B", "C", "D"].map(s => (
            <button key={s}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all
                ${segFilter === s
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-card hover:bg-muted border-border text-muted-foreground hover:text-foreground"}`}
              onClick={() => setSegFilter(s)}
              data-testid={`btn-seg-${s}`}>
              {s === "all" ? "Barchasi" : `${s} — ${SEGMENT_CONF[s]?.label}`}
            </button>
          ))}
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[130px] h-9 text-xs" data-testid="select-status-filter"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha holat</SelectItem>
            <SelectItem value="active">Aktiv</SelectItem>
            <SelectItem value="inactive">Nofaol</SelectItem>
            <SelectItem value="blacklist">Qora ro'yxat</SelectItem>
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button variant="ghost" size="sm" className="h-9 text-xs text-muted-foreground"
            onClick={() => { setSegFilter("all"); setStatusFilter("all"); setSearch(""); }}>
            <X className="h-3.5 w-3.5 mr-1" />Tozalash
          </Button>
        )}
      </div>

      {/* ── Customer List ── */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={`k-${i}`} className="rounded-xl border p-4">
              <Skeleton className="h-5 w-48 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <p className="text-muted-foreground font-medium">Mijozlar topilmadi</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Filtrlarni o'zgartiring yoki yangi mijoz qo'shing</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map((c) => {
            const seg = c.customerCategory || c.segment || "C";
            const val = Number(c.lifetime_value || 0);
            return (
              <div key={c.id}
                className="group relative flex items-center gap-4 rounded-xl border bg-card p-3 lg:p-4 cursor-pointer
                  hover:bg-accent/50 hover:border-primary/20 hover:shadow-sm transition-all duration-150"
                onClick={() => setSelectedId(c.id)}
                data-testid={`row-customer-${c.id}`}>
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0
                  ${SEGMENT_CONF[seg]?.bg || "bg-muted"} ${SEGMENT_CONF[seg]?.text || ""}`}>
                  {c.customerType === "individual"
                    ? <User className="h-5 w-5" />
                    : <Building2 className="h-5 w-5" />}
                </div>

                {/* Main info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm truncate">{c.name}</p>
                    <SegBadge seg={seg} />
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                    {(c.stir || c.inn) && <span>STIR: {c.stir || c.inn}</span>}
                    {c.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{c.phone}</span>}
                    {!c.stir && !c.inn && !c.phone && c.industry && <span>{c.industry}</span>}
                  </div>
                </div>

                {/* Stats */}
                <div className="hidden md:flex items-center gap-6 shrink-0">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Buyurtmalar</p>
                    <p className="text-sm font-semibold">{c.order_count || 0}</p>
                  </div>
                  <div className="text-right min-w-[100px]">
                    <p className="text-xs text-muted-foreground">Qiymat</p>
                    <p className="text-sm font-semibold">{fmtMoney(val)}</p>
                  </div>
                  <div className="text-center min-w-[60px]">
                    <StatusDot status={c.status} />
                  </div>
                </div>

                {/* Arrow */}
                <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div className="text-center py-2">
        <p className="text-xs text-muted-foreground">
          {filtered.length} / {customers.length} mijoz ko'rsatilmoqda
        </p>
      </div>
    </div>
  );
}
