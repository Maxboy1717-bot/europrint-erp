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
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { FileText, Plus, Send, CheckCircle, Calculator, Package } from "lucide-react";
import { fmt, QUOT_STATUS_LABELS, QUOT_STATUS_COLORS } from "@/lib/sd-helpers";

interface SdCustomerItem { id: string; name?: string; email?: string; phone?: string }
interface PriceResult {
  blankLengthMm?: number;
  blankWidthMm?: number;
  blankAreaM2?: number;
  totalPaperM2?: number;
  paperCost?: number;
  printCost?: number;
  plateCost?: number;
  dieCost?: number;
  processingCost?: number;
  extrasCost?: number;
  deliveryCost?: number;
  totalCostPrice?: number;
  markupPercent?: number;
  markupAmount?: number;
  vatAmount?: number;
  unitPriceWithVat?: number;
  totalPriceWithVat?: number;
  grossMarginPercent?: number;
}
interface SdQuotationItem {
  id: string;
  quotationNumber?: string;
  status?: string;
  customerName?: string;
  quantity?: number;
  validUntil?: string;
  totalPrice?: number;
  unitPrice?: number;
  notes?: string;
  customerId?: string;
}

const PAPER_TYPES = [
  { value: "b_flute", label: "B-flute 3mm (Standart)" },
  { value: "c_flute", label: "C-flute 4mm (O'rta)" },
  { value: "bc_flute", label: "BC-flute 7mm (Ikki qavat)" },
  { value: "e_flute", label: "E-flute 1.5mm (Ingichka)" },
  { value: "micro", label: "Micro-flute (Eng ingichka)" },
];

const PRINT_COLORS = [
  { value: 0, label: "Bossiz" },
  { value: 1, label: "1 rang" },
  { value: 2, label: "2 rang" },
  { value: 4, label: "4 rang (To'liq CMYK)" },
];

const DELIVERY_TYPES = [
  { value: 0, label: "Toshkent (Standart)" },
  { value: 30, label: "30 km gacha" },
  { value: 60, label: "60 km gacha" },
  { value: 100, label: "100 km gacha" },
];

const defaultCalcForm = {
  lengthMm: 300, widthMm: 200, heightMm: 100,
  paperType: "b_flute", printColors: 0, quantity: 1000,
  isNewDie: false, lamination: false, embossing: false, perforation: false,
  deliveryKm: 0,
};

export default function SDSalesQuotes() {
  const [isNew, setIsNew] = useState(false);
  const [priceResult, setPriceResult] = useState<PriceResult | null>(null);
  const [calcForm, setCalcForm] = useState({ ...defaultCalcForm });
  const [form, setForm] = useState({
    customerId: "", validUntil: "", notes: "",
    paymentTerms: "70% avans, 30% yetkazishdan oldin",
  });
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: quotations = [], isLoading } = useQuery<SdQuotationItem[]>({
    queryKey: ["/api/sd/quotations"],
  });

  const { data: customersData } = useQuery<{ data: SdCustomerItem[] }>({
    queryKey: ["/api/sd/customers"],
    queryFn: () => apiRequest("GET", "/api/sd/customers?limit=200").then((r: Response) => r.json()),
  });

  const customers = customersData?.data || [];

  const calcMut = useMutation({
    mutationFn: (body: Record<string, unknown>) => apiRequest("POST", "/api/sd/calculate-price", body).then((r: Response) => r.json()),
    onSuccess: (data) => setPriceResult(data),
    onError: () => toast({ title: "Hisoblashda xatolik", variant: "destructive" }),
  });

  const createMut = useMutation({
    mutationFn: (body: Record<string, unknown>) => apiRequest("POST", "/api/sd/quotations", body).then((r: Response) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/sd/quotations"] });
      setIsNew(false);
      setPriceResult(null);
      setCalcForm({ ...defaultCalcForm });
      setForm({
        customerId: "", validUntil: "", notes: "",
        paymentTerms: "70% avans, 30% yetkazishdan oldin",
      });
      toast({ title: "Taklifnoma yaratildi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const sendMut = useMutation({
    mutationFn: (id: string) => apiRequest("PUT", `/api/sd/quotations/${id}/send`, {}).then((r: Response) => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/sd/quotations"] }); toast({ title: "Yuborildi" }); },
  });

  const approveMut = useMutation({
    mutationFn: (id: string) => apiRequest("PUT", `/api/sd/quotations/${id}/approve`, {}).then((r: Response) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/sd/quotations"] });
      qc.invalidateQueries({ queryKey: ["/api/sd/orders"] });
      toast({ title: "Tasdiqlandi — buyurtma va shartnoma yaratildi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  function handleCalc() {
    calcMut.mutate({
      ...calcForm,
      printColors: Number(calcForm.printColors),
      quantity: Number(calcForm.quantity),
      lengthMm: Number(calcForm.lengthMm),
      widthMm: Number(calcForm.widthMm),
      heightMm: Number(calcForm.heightMm),
      deliveryKm: Number(calcForm.deliveryKm),
    });
  }

  function handleCreate(): void {
    if (!form.customerId) { toast({ title: "Mijoz tanlanmagan", variant: "destructive" }); return; }
    if (!priceResult) { toast({ title: "Avval narx hisoblab oling", variant: "destructive" }); return; }
    if (!form.validUntil) { toast({ title: "Amal qilish muddati kiritilmagan", variant: "destructive" }); return; }
    createMut.mutate({
      customerId: form.customerId,
      customerName: (Array.isArray(customers) ? customers : []).find((c: SdCustomerItem) => String(c.id) === String(form.customerId))?.name,
      validUntil: form.validUntil,
      notes: form.notes,
      paymentTerms: form.paymentTerms,
      items: [{
        ...calcForm,
        printColors: Number(calcForm.printColors),
        quantity: Number(calcForm.quantity),
      }],
      markupPercent: priceResult.markupPercent,
      vatRate: 12, // Default VAT
    });
  }

  return (
    <div className="p-6 max-w-screen-xl mx-auto bg-surface min-h-full">
      <div className="flex items-center gap-3 pb-6 mb-6">
        <div className="p-2 bg-primary/10 rounded-lg">
          <FileText className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1">
          <h1 className="text-4xl font-light tracking-tight text-on-surface">
            Sotuv <span className="font-bold text-primary">Takliflari</span>
          </h1>
          <p className="text-on-surface-variant">Narx hisoblash, taklifnoma yaratish va tasdiqlash</p>
        </div>
        <Dialog open={isNew} onOpenChange={setIsNew}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-quotation" className="bg-gradient-to-br from-primary to-primary-dim text-white rounded-lg px-5 py-2.5 text-sm font-semibold">
              <Plus className="w-4 h-4 mr-1" />Yangi taklifnoma
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Yangi taklifnoma — Narx hisoblash</DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Package className="w-4 h-4" />Mahsulot parametrlari
                </h3>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs">Uzunlik (mm)</Label>
                    <Input type="number" value={calcForm.lengthMm}
                      onChange={e => setCalcForm(p => ({ ...p, lengthMm: +e.target.value }))}
                      data-testid="input-length" min={10} />
                  </div>
                  <div>
                    <Label className="text-xs">Kenglik (mm)</Label>
                    <Input type="number" value={calcForm.widthMm}
                      onChange={e => setCalcForm(p => ({ ...p, widthMm: +e.target.value }))}
                      data-testid="input-width" min={10} />
                  </div>
                  <div>
                    <Label className="text-xs">Balandlik (mm)</Label>
                    <Input type="number" value={calcForm.heightMm}
                      onChange={e => setCalcForm(p => ({ ...p, heightMm: +e.target.value }))}
                      data-testid="input-height" min={10} />
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Qog'oz turi</Label>
                  <Select value={calcForm.paperType} onValueChange={v => setCalcForm(p => ({ ...p, paperType: v }))}>
                    <SelectTrigger data-testid="select-paper-type"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Array.isArray(PAPER_TYPES) ? PAPER_TYPES : []).map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Bosma</Label>
                  <Select value={String(calcForm.printColors)} onValueChange={v => setCalcForm(p => ({ ...p, printColors: +v }))}>
                    <SelectTrigger data-testid="select-print"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Array.isArray(PRINT_COLORS) ? PRINT_COLORS : []).map(c => <SelectItem key={c.value} value={String(c.value)}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Miqdor (dona)</Label>
                  <Input type="number" value={calcForm.quantity}
                    onChange={e => setCalcForm(p => ({ ...p, quantity: +e.target.value }))}
                    data-testid="input-quantity" min={1} />
                </div>

                <div>
                  <Label className="text-xs">Yetkazish masofasi</Label>
                  <Select value={String(calcForm.deliveryKm)} onValueChange={v => setCalcForm(p => ({ ...p, deliveryKm: +v }))}>
                    <SelectTrigger data-testid="select-delivery"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Array.isArray(DELIVERY_TYPES) ? DELIVERY_TYPES : []).map(d => <SelectItem key={d.value} value={String(d.value)}>{d.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Qo'shimcha ishlovlar</Label>
                  {([
                    { key: "isNewDie", label: "Yangi qolip kerak" },
                    { key: "lamination", label: "Laminatsiya" },
                    { key: "embossing", label: "Bo'rtma (kongreve)" },
                    { key: "perforation", label: "Perforatsiya (teshish)" },
                  ]).map(opt => (
                    <div key={opt.key} className="flex items-center gap-2">
                      <Checkbox
                        id={opt.key}
                        checked={!!(calcForm as Record<string, unknown>)[opt.key]}
                        onCheckedChange={v => setCalcForm(p => ({ ...p, [opt.key]: !!v }))}
                        data-testid={`check-${opt.key}`}
                      />
                      <Label htmlFor={opt.key} className="text-sm font-normal cursor-pointer">{opt.label}</Label>
                    </div>
                  ))}
                </div>

                <Button className="w-full" onClick={handleCalc} disabled={calcMut.isPending} data-testid="btn-calculate">
                  <Calculator className="w-4 h-4 mr-2" />
                  {calcMut.isPending ? "Hisoblanmoqda..." : "Narxni hisoblash"}
                </Button>
              </div>

              <div className="space-y-4">
                {priceResult ? (
                  <>
                    <div className="p-4 bg-muted/50 rounded-md space-y-2">
                      <h3 className="font-semibold text-sm">Hisoblash natijasi</h3>
                      <div className="text-xs space-y-1.5 text-muted-foreground">
                        <div className="flex justify-between">
                          <span>Blanka o'lchami:</span>
                          <span>{priceResult.blankLengthMm} × {priceResult.blankWidthMm} mm</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Bitta blanka maydoni:</span>
                          <span>{priceResult.blankAreaM2} m²</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Jami qog'oz sarfi:</span>
                          <span>{priceResult.totalPaperM2} m²</span>
                        </div>
                      </div>
                      <Separator className="my-2" />
                      <div className="text-xs space-y-1.5">
                        <div className="flex justify-between text-muted-foreground">
                          <span>Qog'oz:</span><span>{fmt(priceResult.paperCost ?? 0)} so'm</span>
                        </div>
                        {(priceResult.printCost ?? 0) > 0 && (
                          <div className="flex justify-between text-muted-foreground">
                            <span>Bosma:</span><span>{fmt(priceResult.printCost ?? 0)} so'm</span>
                          </div>
                        )}
                        {(priceResult.plateCost ?? 0) > 0 && (
                          <div className="flex justify-between text-muted-foreground">
                            <span>Plastinalar:</span><span>{fmt(priceResult.plateCost ?? 0)} so'm</span>
                          </div>
                        )}
                        {(priceResult.dieCost ?? 0) > 0 && (
                          <div className="flex justify-between text-muted-foreground">
                            <span>Yangi qolip:</span><span>{fmt(priceResult.dieCost ?? 0)} so'm</span>
                          </div>
                        )}
                        <div className="flex justify-between text-muted-foreground">
                          <span>Ishlov:</span><span>{fmt(priceResult.processingCost ?? 0)} so'm</span>
                        </div>
                        {(priceResult.extrasCost ?? 0) > 0 && (
                          <div className="flex justify-between text-muted-foreground">
                            <span>Qo'shimchalar:</span><span>{fmt(priceResult.extrasCost ?? 0)} so'm</span>
                          </div>
                        )}
                        <div className="flex justify-between text-muted-foreground">
                          <span>Yetkazish:</span><span>{fmt(priceResult.deliveryCost ?? 0)} so'm</span>
                        </div>
                        <Separator className="my-1" />
                        <div className="flex justify-between font-medium">
                          <span>Tannarx:</span><span>{fmt(priceResult.totalCostPrice ?? 0)} so'm</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>Ustama ({priceResult.markupPercent}%):</span>
                          <span>{fmt(priceResult.markupAmount ?? 0)} so'm</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>QQS:</span><span>{fmt(priceResult.vatAmount ?? 0)} so'm</span>
                        </div>
                      </div>
                      <Separator className="my-2" />
                      <div className="space-y-1">
                        <div className="flex justify-between font-semibold text-primary">
                          <span>Birlik narxi (QQS bilan):</span>
                          <span>{fmt(priceResult.unitPriceWithVat ?? 0)} so'm</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg">
                          <span>Jami ({fmt(calcForm.quantity)} dona):</span>
                          <span>{fmt(priceResult.totalPriceWithVat ?? 0)} so'm</span>
                        </div>
                        <div className="text-xs text-muted-foreground text-right">
                          Gross margin: {priceResult.grossMarginPercent}%
                        </div>
                      </div>
                    </div>

                    <Separator />
                    <h3 className="font-semibold text-sm">Taklifnoma ma'lumotlari</h3>

                    <div>
                      <Label className="text-xs">Mijoz *</Label>
                      <Select value={form.customerId} onValueChange={v => setForm(p => ({ ...p, customerId: v }))}>
                        <SelectTrigger data-testid="select-customer"><SelectValue placeholder="Mijoz tanlang" /></SelectTrigger>
                        <SelectContent>
                          {(Array.isArray(customers) ? customers : []).map((c: SdCustomerItem) => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs">Amal qilish muddati *</Label>
                      <Input type="date" value={form.validUntil}
                        onChange={e => setForm(p => ({ ...p, validUntil: e.target.value }))}
                        data-testid="input-valid-until" />
                    </div>

                    <div>
                      <Label className="text-xs">To'lov shartlari</Label>
                      <Input value={form.paymentTerms}
                        onChange={e => setForm(p => ({ ...p, paymentTerms: e.target.value }))}
                        data-testid="input-payment-terms" />
                    </div>

                    <div>
                      <Label className="text-xs">Izoh</Label>
                      <Textarea value={form.notes}
                        onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                        rows={2} data-testid="input-notes" />
                    </div>

                    <Button className="w-full" onClick={handleCreate} disabled={createMut.isPending} data-testid="btn-create-quotation">
                      {createMut.isPending ? "Saqlanmoqda..." : "Taklifnoma yaratish"}
                    </Button>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-muted-foreground text-sm gap-3 bg-muted/30 rounded-md">
                    <Calculator className="w-10 h-10 opacity-40" />
                    <p>Parametrlarni kiritib, "Narxni hisoblash" tugmasini bosing</p>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Yuklanmoqda...</div>
      ) : (quotations as SdQuotationItem[]).length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Hozircha taklifnomalar yo'q</p>
          <p className="text-sm mt-1">Yuqoridagi tugma orqali birinchi taklifnomani yarating</p>
        </div>
      ) : (
        <div className="space-y-2">
          {(quotations as SdQuotationItem[]).map((q: SdQuotationItem) => (
            <Card key={q.id} className="hover-elevate" data-testid={`card-quotation-${q.id}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-muted rounded-md">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{q.quotationNumber}</span>
                      <Badge className={`text-xs ${QUOT_STATUS_COLORS[q.status ?? ""] || ""}`}>
                        {QUOT_STATUS_LABELS[q.status ?? ""] || q.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {q.customerName || "—"}
                      {q.quantity && ` • ${fmt(q.quantity)} dona`}
                      {q.validUntil && ` • Muddati: ${q.validUntil}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">{fmt(q.totalPrice ?? 0)} so'm</p>
                    {q.unitPrice && (
                      <p className="text-xs text-muted-foreground">{fmt(q.unitPrice ?? 0)} so'm/dona</p>
                    )}
                    <div className="flex gap-1 mt-2 justify-end">
                      {q.status === "draft" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => sendMut.mutate(q.id)}
                          disabled={sendMut.isPending}
                          data-testid={`btn-send-${q.id}`}
                        >
                          <Send className="w-3.5 h-3.5 mr-1" />Yuborish
                        </Button>
                      )}
                      {(q.status === "sent" || q.status === "draft") && (
                        <Button
                          size="sm"
                          onClick={() => approveMut.mutate(q.id)}
                          disabled={approveMut.isPending}
                          data-testid={`btn-approve-${q.id}`}
                        >
                          <CheckCircle className="w-3.5 h-3.5 mr-1" />Tasdiqlash
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
