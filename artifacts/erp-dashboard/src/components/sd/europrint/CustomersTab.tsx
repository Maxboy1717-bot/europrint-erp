/**
 * @module CustomersTab
 * @description React UI component.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, MapPin, Phone } from "lucide-react";
import { 
  SdCustomer, SdContact, SdOrderSummary, 
  fmt, SEGMENT_LABELS, SEGMENT_COLORS 
} from "./types";

export function CustomersTab() {
  const [search, setSearch] = useState("");
  const [segment, setSegment] = useState("all");
  const [selected, setSelected] = useState<SdCustomer | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState({ name: "", stir: "", actualAddress: "", legalAddress: "", segment: "new", notes: "" });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{ data: SdCustomer[] }>({
    queryKey: ["/api/sd/customers", search, segment],
    queryFn: () => {
      const params = new URLSearchParams({ limit: "50" });
      if (search) params.append("search", search);
      if (segment !== "all") params.append("segment", segment);
      return apiRequest("GET", `/api/sd/customers?${params}`);
    },
  });

  const { data: detail } = useQuery<SdCustomer>({
    queryKey: ["/api/sd/customers", selected?.id],
    queryFn: () => apiRequest("GET", `/api/sd/customers/${selected?.id}`),
    enabled: !!selected?.id,
  });

  const createMut = useMutation({
    mutationFn: (body: typeof form) => apiRequest("POST", "/api/sd/customers", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sd/customers"] });
      setIsNew(false);
      setForm({ name: "", stir: "", actualAddress: "", legalAddress: "", segment: "new", notes: "" });
      toast({ title: "Mijoz qo'shildi" });
    },
    onError: (err: Error) => toast({ title: "Xatolik", description: err.message || "Mijoz qo'shib bo'lmadi", variant: "destructive" }),
  });

  const customers: SdCustomer[] = Array.isArray(data) ? data : (data?.data || []);

  return (
    <div className="flex gap-4 h-[calc(100vh-200px)]">
      {/* List */}
      <div className="w-80 flex flex-col gap-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input data-testid="input-customer-search" placeholder="Qidirish..." className="pl-8"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Dialog open={isNew} onOpenChange={setIsNew}>
            <DialogTrigger asChild>
              <Button size="icon" data-testid="button-add-customer"><Plus className="w-4 h-4" /></Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="text-[18px] font-semibold">Yangi mijoz</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Kompaniya nomi *</Label>
                  <Input data-testid="input-customer-name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                <div><Label>STIR</Label>
                  <Input data-testid="input-customer-stir" value={form.stir} onChange={e => setForm({ ...form, stir: e.target.value })} /></div>
                <div><Label>Segment</Label>
                  <Select value={form.segment} onValueChange={v => setForm({ ...form, segment: v })}>
                    <SelectTrigger data-testid="select-customer-segment" className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(SEGMENT_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Manzil</Label>
                  <Input data-testid="input-customer-address" value={form.actualAddress} onChange={e => setForm({ ...form, actualAddress: e.target.value })} /></div>
                <div><Label>Izoh</Label>
                  <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
                <Button data-testid="button-save-customer" className="w-full" onClick={() => createMut.mutate(form)} disabled={!form.name || createMut.isPending}>
                  {createMut.isPending ? "Saqlanmoqda..." : "Saqlash"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Select value={segment} onValueChange={setSegment}>
          <SelectTrigger data-testid="select-segment-filter" className="h-9"><SelectValue placeholder="Segment" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barchasi</SelectItem>
            {Object.entries(SEGMENT_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>

        <div className="flex-1 overflow-y-auto space-y-2">
          {isLoading && <div className="text-sm text-muted-foreground p-2">Yuklanmoqda...</div>}
          {(Array.isArray(customers) ? customers : []).map((c: SdCustomer) => (
            <div key={c.id} data-testid={`card-customer-${c.id}`}
              className={`p-3 rounded-md border cursor-pointer hover-elevate transition-colors ${selected?.id === c.id ? "bg-primary/5 border-primary/30" : ""}`}
              onClick={() => setSelected(c)}>
              <div className="flex items-start justify-between gap-1">
                <div className="font-medium text-sm truncate">{c.name}</div>
                <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium shrink-0 ${SEGMENT_COLORS[c.segment] || ""}`}>
                  {SEGMENT_LABELS[c.segment] || c.segment}
                </span>
              </div>
              {c.stir && <div className="text-xs text-muted-foreground mt-0.5">STIR: {c.stir}</div>}
              <div className="text-xs text-muted-foreground mt-1">{c.totalOrders || 0} ta buyurtma · {fmt(c.totalRevenue || 0)} so'm</div>
            </div>
          ))}
          {!isLoading && customers.length === 0 && (
            <div className="text-sm text-muted-foreground text-center p-4">Mijozlar topilmadi</div>
          )}
        </div>
      </div>

      {/* Detail */}
      <div className="flex-1 overflow-y-auto">
        {!selected ? (
          <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
            Mijozni tanlang
          </div>
        ) : (
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h2 className="text-lg font-bold">{detail?.name || selected.name}</h2>
                    {detail?.stir && <div className="text-sm text-muted-foreground">STIR: {detail.stir}</div>}
                  </div>
                  <span className={`text-sm px-2 py-1 rounded-md font-medium ${SEGMENT_COLORS[detail?.segment || selected.segment] || ""}`}>
                    {SEGMENT_LABELS[detail?.segment || selected.segment]}
                  </span>
                </div>
                {detail?.actualAddress && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 shrink-0" />
                    {detail.actualAddress}
                  </div>
                )}
                {detail?.notes && <div className="text-sm text-muted-foreground">{detail.notes}</div>}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t">
                  <div className="text-center">
                    <div className="text-xl font-bold text-primary">{detail?.totalOrders || 0}</div>
                    <div className="text-xs text-muted-foreground">Buyurtmalar</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold">{fmt(detail?.totalRevenue || 0)}</div>
                    <div className="text-xs text-muted-foreground">Jami summa</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold">{detail?.creditLimit ? fmt(detail.creditLimit) : "—"}</div>
                    <div className="text-xs text-muted-foreground">Kredit limit</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {detail?.contacts && detail.contacts.length > 0 && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Kontaktlar</CardTitle></CardHeader>
                <CardContent className="p-4 pt-0 space-y-2">
                  {(Array.isArray(detail.contacts) ? detail.contacts : []).map((ct: SdContact) => (
                    <div key={ct.id} className="flex items-center gap-3 text-sm">
                      <div className="flex-1">
                        <span className="font-medium">{ct.name}</span>
                        {ct.position && <span className="text-muted-foreground"> · {ct.position}</span>}
                      </div>
                      {ct.phone && <div className="flex items-center gap-1 text-muted-foreground"><Phone className="w-3 h-3" />{ct.phone}</div>}
                      {ct.isPrimary && <Badge className="text-xs">Asosiy</Badge>}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {detail?.recentOrders && detail.recentOrders.length > 0 && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">So'nggi buyurtmalar</CardTitle></CardHeader>
                <CardContent className="p-4 pt-0 space-y-2">
                  {(Array.isArray(detail.recentOrders) ? detail.recentOrders : []).map((o: SdOrderSummary) => (
                    <div key={o.id} className="flex items-center justify-between gap-2 text-sm py-1 border-b last:border-0">
                      <div className="font-mono text-xs text-muted-foreground">{o.orderNumber}</div>
                      <div className="flex-1 text-right">{fmt(o.totalAmount)} so'm</div>
                      <span className={`text-xs px-1.5 py-0.5 rounded-md ${SEGMENT_COLORS[o.status] || ""}`}>
                        {o.status}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
