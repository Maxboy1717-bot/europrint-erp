import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Send, CheckCircle } from "lucide-react";
import { 
  SdQuotation, SdCustomer, SdPriceResult, SdQuotationItem,
  fmt 
} from "./types";

const QUOT_STATUS_LABELS: Record<string, string> = {
  draft: "Qoralama", sent: "Yuborildi", viewed: "Ko'rildi",
  approved: "Tasdiqlandi", rejected: "Rad etildi", expired: "Muddati o'tdi",
};
const QUOT_STATUS_COLORS: Record<string, string> = {
  draft: "bg-surface-container-low text-on-surface", sent: "bg-blue-100 text-blue-700",
  viewed: "bg-indigo-100 text-indigo-700", approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700", expired: "bg-amber-100 text-amber-700",
};

export function QuotationsTab() {
  const [isNew, setIsNew] = useState(false);
  const [priceResult, setPriceResult] = useState<SdPriceResult | null>(null);
  const [calcForm, setCalcForm] = useState({
    productType: "box", paperType: "B-flute", lengthMm: 300, widthMm: 200, heightMm: 100,
    thicknessMm: 3, printColors: 0, quantity: 1000, isNewDie: false,
  });
  const [form, setForm] = useState({ customerId: "", validUntil: "", notes: "", paymentTerms: "70% avans, 30% yetkazishdan oldin" });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: quotations = [], isLoading } = useQuery<SdQuotation[]>({
    queryKey: ["/api/sd/quotations"],
  });

  const { data: customers } = useQuery<{ data: SdCustomer[] }>({
    queryKey: ["/api/sd/customers"],
    queryFn: () => apiRequest("GET", "/api/sd/customers?limit=100"),
  });

  const calcMut = useMutation({
    mutationFn: (body: typeof calcForm) => apiRequest("POST", "/api/sd/calculate-price", body),
    onSuccess: (data: SdPriceResult) => setPriceResult(data),
    onError: () => toast({ title: "Hisoblashda xatolik", variant: "destructive" }),
  });

  const createMut = useMutation({
    mutationFn: (body: Record<string, unknown>) => apiRequest("POST", "/api/sd/quotations", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sd/quotations"] });
      setIsNew(false);
      setPriceResult(null);
      toast({ title: "Taklifnoma yaratildi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const sendMut = useMutation({
    mutationFn: (id: string | number) => apiRequest("PUT", `/api/sd/quotations/${id}/send`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sd/quotations"] });
      toast({ title: "Yuborildi" });
    },
  });

  const approveMut = useMutation({
    mutationFn: (id: string | number) => apiRequest("PUT", `/api/sd/quotations/${id}/approve`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sd/quotations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sd/orders"] });
      toast({ title: "Tasdiqlandi, buyurtma yaratildi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold">Taklifnomalar ({quotations.length})</h3>
        <Dialog open={isNew} onOpenChange={setIsNew}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-quotation"><Plus className="w-4 h-4 mr-1" />Yangi taklifnoma</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Taklifnoma + narx hisoblash</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Mahsulot parametrlari</h4>
                <div><Label>Mahsulot turi</Label>
                  <Select value={calcForm.productType} onValueChange={v => setCalcForm({ ...calcForm, productType: v })}>
                    <SelectTrigger data-testid="select-product-type"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(["box", "lid", "tray", "cup", "other"]).map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Uzunlik (mm)</Label>
                    <Input data-testid="input-length" type="number" value={calcForm.lengthMm}
                      onChange={e => setCalcForm({ ...calcForm, lengthMm: +e.target.value })} /></div>
                  <div><Label>Kenglik (mm)</Label>
                    <Input data-testid="input-width" type="number" value={calcForm.widthMm}
                      onChange={e => setCalcForm({ ...calcForm, widthMm: +e.target.value })} /></div>
                  <div><Label>Balandlik (mm)</Label>
                    <Input data-testid="input-height" type="number" value={calcForm.heightMm}
                      onChange={e => setCalcForm({ ...calcForm, heightMm: +e.target.value })} /></div>
                  <div><Label>Qalinlik (mm)</Label>
                    <Input data-testid="input-thickness" type="number" value={calcForm.thicknessMm}
                      onChange={e => setCalcForm({ ...calcForm, thicknessMm: +e.target.value })} /></div>
                </div>
                <div><Label>Bosma ranglari</Label>
                  <Select value={String(calcForm.printColors)} onValueChange={v => setCalcForm({ ...calcForm, printColors: +v })}>
                    <SelectTrigger data-testid="select-print-colors"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {([0, 1, 2, 3, 4]).map(n => <SelectItem key={n} value={String(n)}>{n === 0 ? "Rangsiz" : `${n} rang`}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Miqdor (dona)</Label>
                  <Input data-testid="input-quantity" type="number" value={calcForm.quantity}
                    onChange={e => setCalcForm({ ...calcForm, quantity: +e.target.value })} /></div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="newDie" checked={calcForm.isNewDie}
                    onChange={e => setCalcForm({ ...calcForm, isNewDie: e.target.checked })} />
                  <Label htmlFor="newDie">Yangi qolip kerak</Label>
                </div>
                <Button data-testid="button-calculate-price" className="w-full"
                  onClick={() => calcMut.mutate(calcForm)} disabled={calcMut.isPending}>
                  {calcMut.isPending ? "Hisoblanmoqda..." : "Narxni hisoblash"}
                </Button>
              </div>

              <div className="space-y-3">
                {priceResult && (
                  <Card className="bg-primary/5">
                    <CardContent className="p-3 space-y-1.5 text-sm">
                      <h4 className="font-semibold text-primary">Narx tahlili</h4>
                      <div className="flex justify-between"><span className="text-muted-foreground">Qog'oz:</span><span>{fmt(priceResult.paperCost || 0)} so'm</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Ishlab chiqarish:</span><span>{fmt(priceResult.productionCost || 0)} so'm</span></div>
                      {(priceResult.printCost || 0) > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Bosma:</span><span>{fmt(priceResult.printCost || 0)} so'm</span></div>}
                      {(priceResult.dieCost || 0) > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Qolip:</span><span>{fmt(priceResult.dieCost || 0)} so'm</span></div>}
                      <div className="flex justify-between"><span className="text-muted-foreground">Yetkazish:</span><span>{fmt(priceResult.deliveryCost || 0)} so'm</span></div>
                      <div className="border-t pt-1.5 flex justify-between font-medium"><span>Tannarx:</span><span>{fmt(priceResult.costPrice || 0)} so'm</span></div>
                      <div className="flex justify-between font-bold text-primary"><span>Jami narx:</span><span>{fmt(priceResult.totalPrice || 0)} so'm</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">1 dona:</span><span className="font-semibold">{fmt(priceResult.unitPrice || 0)} so'm</span></div>
                      <div className="text-xs text-muted-foreground">Margin: {priceResult.margin}%</div>
                    </CardContent>
                  </Card>
                )}

                {priceResult && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Taklifnoma ma'lumotlari</h4>
                    <div><Label>Mijoz</Label>
                      <Select value={form.customerId} onValueChange={v => setForm({ ...form, customerId: v })}>
                        <SelectTrigger data-testid="select-quotation-customer"><SelectValue placeholder="Tanlang" /></SelectTrigger>
                        <SelectContent>
                          {customers?.data?.map((c: SdCustomer) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>Amal qilish muddati</Label>
                      <Input type="date" value={form.validUntil} onChange={e => setForm({ ...form, validUntil: e.target.value })} /></div>
                    <div><Label>Izoh</Label>
                      <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
                    <Button data-testid="button-save-quotation" className="w-full"
                      onClick={() => createMut.mutate({
                        ...form,
                        items: [{ ...calcForm, ...priceResult }],
                      })}
                      disabled={createMut.isPending}>
                      {createMut.isPending ? "Yaratilmoqda..." : "Taklifnoma yaratish"}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {isLoading && <div className="text-sm text-muted-foreground">Yuklanmoqda...</div>}
        {(Array.isArray(quotations) ? quotations : []).map((q: SdQuotation) => (
          <Card key={q.id} data-testid={`card-quotation-${q.id}`}>
            <CardContent className="p-4 flex items-center justify-between gap-3 flex-wrap">
              <div className="space-y-0.5">
                <div className="font-mono text-sm font-bold">{q.quotationNumber}</div>
                <div className="text-xs text-muted-foreground">{q.createdAt?.slice(0, 10)}</div>
              </div>
              <div className="text-sm">
                <div className="font-semibold">{fmt(q.totalPrice || 0)} so'm</div>
                <div className="text-xs text-muted-foreground">Margin: {q.margin}%</div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-md font-medium ${QUOT_STATUS_COLORS[q.status || ""] || ""}`}>
                {QUOT_STATUS_LABELS[q.status || ""] || q.status}
              </span>
              <div className="flex gap-2">
                {q.status === "draft" && (
                  <Button size="sm" variant="outline" data-testid={`button-send-quotation-${q.id}`}
                    onClick={() => sendMut.mutate(q.id)} disabled={sendMut.isPending}>
                    <Send className="w-3 h-3 mr-1" />Yuborish
                  </Button>
                )}
                {(q.status === "sent" || q.status === "viewed") && (
                  <Button size="sm" data-testid={`button-approve-quotation-${q.id}`}
                    onClick={() => approveMut.mutate(q.id)} disabled={approveMut.isPending}>
                    <CheckCircle className="w-3 h-3 mr-1" />Tasdiqlash
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {!isLoading && quotations.length === 0 && (
          <div className="text-center text-muted-foreground py-8 text-sm">Taklifnomalar yo'q</div>
        )}
      </div>
    </div>
  );
}
