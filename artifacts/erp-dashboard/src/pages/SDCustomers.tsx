import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
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
import { Users, Building2, Search, Plus, Eye, Filter, User } from "lucide-react";
import { fmtMoney, fmtDate, fmtNum, CategoryBadge, StatusBadge } from "@/components/sd/helpers";
import { Customer360View } from "@/components/sd/Customer360View";

interface Customer {
  id: number;
  name: string;
  customerCode?: string;
  customerType: "legal" | "individual";
  customerCategory?: string;
  status: string;
  stir?: string;
  industry?: string;
  openDebt?: number;
  lastContactedAt?: string;
}

type CustomerFormData = {
  title: string;
  customerType: "legal" | "individual";
  stir?: string;
  industry?: string;
  source?: string;
  creditLimit?: number;
  paymentTermsDays?: number;
};

export default function SDCustomers() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: listData, isLoading } = useQuery<{
    data: Customer[];
    summary?: { totalCustomers: number; totalDebt: number; bySegment?: Record<string, number> };
    pagination?: { total: number; pages: number };
  }>({
    queryKey: ["/api/sd/customers", { search, category, status }],
    queryFn: () => {
      const p = new URLSearchParams({ limit: "50" });
      if (search) p.set("search", search);
      if (category !== "all") p.set("category", category);
      if (status !== "all") p.set("status", status);
      return apiRequest("GET", `/api/sd/customers?${p}`);
    },
  });

  const customers = listData?.data || [];
  const summary = listData?.summary;
  const pagination = listData?.pagination;

  const addForm = useForm<CustomerFormData>({
    resolver: zodResolver(z.object({
      title: z.string().min(1, "Nom kerak"),
      customerType: z.enum(["legal", "individual"]).default("legal"),
      stir: z.string().optional(),
      industry: z.string().optional(),
      source: z.string().optional(),
      creditLimit: z.coerce.number().optional(),
      paymentTermsDays: z.coerce.number().optional(),
    })),
    defaultValues: { customerType: "legal" as const, title: "" },
  });

  const addMutation = useMutation({
    mutationFn: (data: CustomerFormData) => apiRequest("POST", "/api/sd/customers", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/sd/customers"] });
      toast({ title: "Mijoz qo'shildi" });
      setShowAdd(false);
      addForm.reset();
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  if (selectedId !== null) {
    return (
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <Customer360View customerId={selectedId} onBack={() => setSelectedId(null)} />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Mijozlar</h1>
          {summary && (
            <p className="text-sm text-muted-foreground mt-0.5">
              Jami: {summary.totalCustomers} ta •
              A: {summary.bySegment?.A} • B: {summary.bySegment?.B} •
              C: {summary.bySegment?.C} • D: {summary.bySegment?.D} •
              Qarz: {fmtMoney(summary.totalDebt)}
            </p>
          )}
        </div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild>
            <Button data-testid="btn-add-customer"><Plus className="h-4 w-4 mr-1" />Yangi mijoz</Button>
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
                <FormField control={addForm.control} name="industry" render={({ field }) => (
                  <FormItem><FormLabel>Soha</FormLabel>
                    <FormControl><Input {...field} /></FormControl></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={addForm.control} name="creditLimit" render={({ field }) => (
                    <FormItem><FormLabel>Kredit limiti</FormLabel>
                      <FormControl><Input {...field} type="number" data-testid="input-credit-limit" /></FormControl></FormItem>
                  )} />
                  <FormField control={addForm.control} name="paymentTermsDays" render={({ field }) => (
                    <FormItem><FormLabel>To'lov muddati (kun)</FormLabel>
                      <FormControl><Input {...field} type="number" /></FormControl></FormItem>
                  )} />
                </div>
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
                  <Button type="submit" disabled={addMutation.isPending} data-testid="btn-submit-customer">Saqlash</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {([
            { cat: "A", label: "VIP", count: summary.bySegment?.A || 0, color: "text-green-600" },
            { cat: "B", label: "Doimiy", count: summary.bySegment?.B || 0, color: "text-blue-600" },
            { cat: "C", label: "Oddiy", count: summary.bySegment?.C || 0, color: "text-yellow-600" },
            { cat: "D", label: "Xavfli", count: summary.bySegment?.D || 0, color: "text-red-600" },
          ]).map(s => (
            <Card key={s.cat} className="cursor-pointer hover-elevate"
              onClick={() => setCategory(category === s.cat ? "all" : s.cat)}
              data-testid={`card-segment-${s.cat}`}>
              <CardContent className="p-4 text-center">
                <div className={`text-2xl font-bold ${s.color}`}>{s.cat}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
                <div className="text-lg font-semibold mt-1">{s.count}</div>
                {category === s.cat && <div className="mt-1 text-xs text-primary">Filtrlandi</div>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Qidirish (nom, STIR, kod...)"
            value={search} onChange={e => setSearch(e.target.value)}
            data-testid="input-search-customers" />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40" data-testid="select-status-filter"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha holat</SelectItem>
            <SelectItem value="active">Aktiv</SelectItem>
            <SelectItem value="inactive">Nofaol</SelectItem>
            <SelectItem value="blacklist">Qora ro'yxat</SelectItem>
          </SelectContent>
        </Select>
        {(category !== "all" || status !== "all" || search) && (
          <Button variant="outline" size="sm" onClick={() => { setCategory("all"); setStatus("all"); setSearch(""); }}>
            <Filter className="h-4 w-4 mr-1" />Tozalash
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={`k-${i}`} className="h-16 w-full" />)}
            </div>
          ) : customers.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>Mijozlar topilmadi</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    {(["Mijoz", "Kod", "ABC", "Holat", "Qarz", "So'nggi aloqa", ""]).map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(Array.isArray(customers) ? customers : []).map((c) => (
                    <tr key={c.id} className="border-b hover-elevate cursor-pointer"
                      onClick={() => setSelectedId(c.id)}
                      data-testid={`row-customer-${c.id}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                            {c.customerType === "individual"
                              ? <User className="h-4 w-4 text-muted-foreground" />
                              : <Building2 className="h-4 w-4 text-muted-foreground" />}
                          </div>
                          <div>
                            <p className="font-medium">{c.name}</p>
                            <p className="text-xs text-muted-foreground">{c.stir || c.industry || "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{c.customerCode || "—"}</code>
                      </td>
                      <td className="px-4 py-3"><CategoryBadge cat={c.customerCategory} /></td>
                      <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                      <td className="px-4 py-3">
                        <span className={fmtNum(c.openDebt) > 0 ? "text-destructive font-medium" : ""}>
                          {fmtMoney(c.openDebt)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{fmtDate(c.lastContactedAt)}</td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" size="sm" data-testid={`btn-view-customer-${c.id}`}
                          onClick={(e) => { e.stopPropagation(); setSelectedId(c.id); }}>
                          <Eye className="h-4 w-4 mr-1" />Ko'rish
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {pagination && pagination.pages > 1 && (
        <p className="text-sm text-muted-foreground text-center">
          {pagination.total} mijozdan {customers.length} tasi ko'rsatilmoqda
        </p>
      )}
    </div>
  );
}
