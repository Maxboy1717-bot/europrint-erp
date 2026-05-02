import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest , selectArray } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { DollarSign, Scale, Calendar, FileText, Brain, BarChart3, Plus, Download, AlertTriangle, CheckCircle, RefreshCw, TrendingUp, CreditCard, Receipt, Building2, ArrowLeftRight, Shield , type LucideIcon } from "lucide-react";
import { ModuleSectionHeader } from "@/components/ModuleSectionHeader";
import { Skeleton } from "@/components/ui/skeleton";

interface CostCenter {
    id: number | string;
    name?: string;
    code?: string;
    description?: string;
    budget?: number | string;
    spent?: number | string;
    status?: string;
  }
  interface ProfitCenter {
    id: number | string;
    name?: string;
    code?: string;
    revenue?: number | string;
    expenses?: number | string;
  }
  interface FinPayment {
    id: number | string;
    counterpartyName?: string;
    amount?: number | string;
    status?: string;
    paymentDate?: string;
    documentDate?: string;
    createdAt?: string;
    type?: string;
  }
  interface GLDocument {
    id: number | string;
    docNumber?: string;
    description?: string;
    status?: string;
    amount?: number | string;
    debitAmount?: number | string;
    creditAmount?: number | string;
    postingDate?: string;
    documentDate?: string;
  }

const URL_TAB_MAP: Record<string, string> = {
  "/fi/cost-centers": "costcenters",
  "/fi/transfer-pricing": "profitcenters",
  "/fi/tax-management": "tax",
  "/fi/tax-calendar": "taxcal",
  "/fi/audit-log": "gldocs",
  "/fi/risk-ai": "risk",
};

function fmtMoney(val: unknown) {
  const n = Number(val);
  if (!n) return "0 so'm";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M so'm`;
  return `${n.toLocaleString()} so'm`;
}

const tabMeta: Record<string, { title: string; icon: LucideIcon }> = {
  "costcenters":  { title: "Xarajat Markazlari", icon: Building2 },
  "profitcenters":{ title: "Transfer Narxlash",  icon: ArrowLeftRight },
  "payments":     { title: "To'lovlar",           icon: CreditCard },
  "gldocs":       { title: "Audit Jurnali",       icon: Shield },
  "tax":          { title: "Soliq Boshqaruvi",    icon: FileText },
  "taxcal":       { title: "Soliq Kalendar",      icon: Calendar },
  "risk":         { title: "AI Xavf Tahlili",     icon: Brain },
};

export default function FinanceExtended() {
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState(URL_TAB_MAP[location] || "costcenters");

  useEffect(() => {
    const tab = URL_TAB_MAP[location];
    if (tab) setActiveTab(tab);
  }, [location]);
  const meta = tabMeta[activeTab] || tabMeta["costcenters"];
  const { toast } = useToast();
  const [showCCDialog, setShowCCDialog] = useState(false);

  const ccForm = useForm({
    defaultValues: { code: "", name: "", description: "", budget: "" }
  });

  // Real API queries
  const { data: costCenters = [], isLoading: ccLoading, refetch: refetchCC } = useQuery<CostCenter[]>({
    queryKey: ["/api/fi/cost-centers"],
    select: selectArray<CostCenter>,
  });

  const { data: profitCenters = [], isLoading: pcLoading } = useQuery<ProfitCenter[]>({
    queryKey: ["/api/fi/profit-centers"],
    select: selectArray<ProfitCenter>,
  });

  const { data: glDocuments = [], isLoading: glLoading, refetch: refetchGL } = useQuery<GLDocument[]>({
    queryKey: ["/api/fi/gl-documents"],
    select: selectArray<GLDocument>,
  });

  const { data: fiStats } = useQuery<Record<string, unknown>>({
    queryKey: ["/api/fi/stats"]
  });

  const { data: payments = [], isLoading: paymentsLoading } = useQuery<FinPayment[]>({
    queryKey: ["/api/fi/payments"],
    select: selectArray<FinPayment>,
  });

  interface TaxCalendarItem { id: string; name: string; taxCode: string; period: string; due: string; rate: string | number; status: string; }
  const { data: taxItems = [], isLoading: taxLoading } = useQuery<TaxCalendarItem[]>({
    queryKey: ["/api/finance-extended/tax-calendar"]
  });

  const createCC = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/fi/cost-centers", { ...data, budget: Number(data.budget) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fi/cost-centers"] });
      setShowCCDialog(false);
      ccForm.reset();
      toast({ title: "Xarajat markazi qo'shildi" });
    },
    onError: () => toast({ title: "Xatolik yuz berdi", variant: "destructive" }),
  });


  const totalBudget = (Array.isArray(costCenters) ? costCenters : []).reduce((s: number, c: CostCenter) => s + Number(c.budget || 0), 0);

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-border/50 px-6 py-3 flex items-center gap-3">
        <DollarSign className="h-5 w-5 text-primary" />
        <h1 className="font-semibold text-base">Moliya — Kengaytirilgan</h1>
        {fiStats && <Badge variant="secondary" className="ml-2">Faol</Badge>}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b border-border/50 px-4 overflow-x-auto">
                  </div>

        <div className="flex-1 overflow-auto p-6">

      <ModuleSectionHeader
        moduleName="Moliya"
        moduleColor="text-green-600"
        sectionTitle={meta?.title || ""}
        icon={meta?.icon || (() => null)}
      />
          {/* Cost Centers */}
          <TabsContent value="costcenters" className="mt-0 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Xarajat Markazlari</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => refetchCC()}>
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />Yangilash
                </Button>
                <Button size="sm" onClick={() => setShowCCDialog(true)} data-testid="button-add-cc">
                  <Plus className="h-3.5 w-3.5 mr-1.5" />Markaz Qo'shish
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {([
                { l: "Xarajat markazlari", v: costCenters.length, c: "text-primary" },
                { l: "Jami byudjet", v: fmtMoney(totalBudget), c: "text-blue-600" },
                { l: "Foyda markazlari", v: profitCenters.length, c: "text-green-600" },
                { l: "GL hujjatlar", v: glDocuments.length, c: "text-orange-600" },
              ]).map(s => (
                <Card key={s.l}><CardContent className="pt-4 pb-3">
                  <div className={`text-xl font-bold ${s.c}`}>{s.v}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s.l}</div>
                </CardContent></Card>
              ))}
            </div>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Kod</TableHead><TableHead>Nomi</TableHead>
                    <TableHead>Byudjet</TableHead><TableHead>Tavsif</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {ccLoading ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">Yuklanmoqda...</TableCell></TableRow>
                    ) : costCenters.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-30" />Xarajat markazlari yo'q
                      </TableCell></TableRow>
                    ) : (Array.isArray(costCenters) ? costCenters : []).slice(0, 15).map((cc: CostCenter) => (
                      <TableRow key={cc.id} data-testid={`row-cc-${cc.id}`}>
                        <TableCell className="font-mono text-sm">{cc.code}</TableCell>
                        <TableCell className="font-medium">{cc.name}</TableCell>
                        <TableCell className="font-medium text-blue-600">{fmtMoney(cc.budget)}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{cc.description || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Dialog open={showCCDialog} onOpenChange={setShowCCDialog}>
              <DialogContent>
                <DialogHeader><DialogTitle>Xarajat Markazi Qo'shish</DialogTitle></DialogHeader>
                <form onSubmit={ccForm.handleSubmit(d => createCC.mutate(d))} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Kod</Label>
                      <Input {...ccForm.register("code")} placeholder="CC-001" data-testid="input-cc-code" />
                    </div>
                    <div className="space-y-2">
                      <Label>Nomi</Label>
                      <Input {...ccForm.register("name")} placeholder="Bosma sexi" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Byudjet (so'm)</Label>
                    <Input type="number" {...ccForm.register("budget")} placeholder="50000000" />
                  </div>
                  <div className="space-y-2">
                    <Label>Tavsif</Label>
                    <Input {...ccForm.register("description")} />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" type="button" onClick={() => setShowCCDialog(false)}>Bekor</Button>
                    <Button type="submit" disabled={createCC.isPending}>Saqlash</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Profit Centers */}
          <TabsContent value="profitcenters" className="mt-0 space-y-4">
            <h2 className="text-lg font-semibold">Foyda Markazlari</h2>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Kod</TableHead><TableHead>Nomi</TableHead>
                    <TableHead>Daromad</TableHead><TableHead>Xarajat</TableHead><TableHead>Foyda</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {pcLoading ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">Yuklanmoqda...</TableCell></TableRow>
                    ) : profitCenters.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-30" />Foyda markazlari yo'q
                      </TableCell></TableRow>
                    ) : (Array.isArray(profitCenters) ? profitCenters : []).slice(0, 15).map((pc: ProfitCenter) => {
                      const profit = Number(pc.revenue || 0) - Number(pc.expenses || 0);
                      return (
                        <TableRow key={pc.id} data-testid={`row-pc-${pc.id}`}>
                          <TableCell className="font-mono text-sm">{pc.code}</TableCell>
                          <TableCell className="font-medium">{pc.name}</TableCell>
                          <TableCell className="text-green-600">{fmtMoney(pc.revenue)}</TableCell>
                          <TableCell className="text-red-600">{fmtMoney(pc.expenses)}</TableCell>
                          <TableCell className={profit >= 0 ? "text-green-700 font-bold" : "text-red-600 font-bold"}>
                            {fmtMoney(profit)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments */}
          <TabsContent value="payments" className="mt-0 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">To'lovlar Jurnali</h2>
              <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/fi/payments"] })}>
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />Yangilash
              </Button>
            </div>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Sana</TableHead><TableHead>Tur</TableHead>
                    <TableHead>Summa</TableHead><TableHead>Holati</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {paymentsLoading ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">Yuklanmoqda...</TableCell></TableRow>
                    ) : !Array.isArray(payments) || payments.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-30" />To'lovlar yo'q
                      </TableCell></TableRow>
                    ) : (Array.isArray(payments) ? payments : []).slice(0, 15).map((p: FinPayment) => (
                      <TableRow key={p.id} data-testid={`row-payment-${p.id}`}>
                        <TableCell className="text-muted-foreground text-sm">
                          {p.documentDate ? new Date(p.documentDate).toLocaleDateString("uz-UZ") : p.createdAt ? new Date(p.createdAt).toLocaleDateString("uz-UZ") : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{p.type || "To'lov"}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{fmtMoney(p.amount)}</TableCell>
                        <TableCell>
                          <Badge variant={p.status === "posted" ? "default" : p.status === "cancelled" ? "destructive" : "secondary"}>
                            {p.status === "posted" ? "Joylashtirildi" : p.status === "cancelled" ? "Bekor" : "Jarayonda"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* GL Documents */}
          <TabsContent value="gldocs" className="mt-0 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">GL Hujjatlar (Audit Log)</h2>
              <Button variant="outline" size="sm" onClick={() => refetchGL()}>
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />Yangilash
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {([
                { l: "Jami GL hujjatlar", v: glDocuments.length, c: "text-primary" },
                { l: "Joylashtirilgan", v: (Array.isArray(glDocuments) ? glDocuments : []).filter((d: GLDocument) => d.status === "posted").length, c: "text-green-600" },
                { l: "Qoralama", v: (Array.isArray(glDocuments) ? glDocuments : []).filter((d: GLDocument) => d.status === "draft").length, c: "text-orange-600" },
              ]).map(s => (
                <Card key={s.l}><CardContent className="pt-4 pb-3">
                  <div className={`text-2xl font-bold ${s.c}`}>{s.v}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s.l}</div>
                </CardContent></Card>
              ))}
            </div>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Hujjat №</TableHead><TableHead>Sana</TableHead>
                    <TableHead>Tavsif</TableHead><TableHead>Debet</TableHead><TableHead>Kredit</TableHead><TableHead>Holati</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {glLoading ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">Yuklanmoqda...</TableCell></TableRow>
                    ) : glDocuments.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        <Receipt className="h-8 w-8 mx-auto mb-2 opacity-30" />GL hujjatlar yo'q
                      </TableCell></TableRow>
                    ) : (Array.isArray(glDocuments) ? glDocuments : []).slice(0, 15).map((doc: GLDocument) => (
                      <TableRow key={doc.id} data-testid={`row-gl-${doc.id}`}>
                        <TableCell className="font-mono text-sm">GL-{doc.id}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {doc.documentDate ? new Date(doc.documentDate).toLocaleDateString("uz-UZ") : "—"}
                        </TableCell>
                        <TableCell className="max-w-[180px] truncate">{doc.description || "—"}</TableCell>
                        <TableCell className="text-blue-600">{fmtMoney(doc.debitAmount)}</TableCell>
                        <TableCell className="text-red-600">{fmtMoney(doc.creditAmount)}</TableCell>
                        <TableCell>
                          <Badge variant={doc.status === "posted" ? "default" : "secondary"}>
                            {doc.status === "posted" ? "Joylashtirildi" : "Qoralama"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tax */}
          <TabsContent value="tax" className="mt-0 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Ichki Soliqlar Boshqaruvi</h2>
              <Button variant="outline" size="sm">
                <Download className="h-3.5 w-3.5 mr-1.5" />Export
              </Button>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {([
                { l: "Ushbu oy jami", v: "—", c: "text-red-600" },
                { l: "To'langan", v: "—", c: "text-green-600" },
                { l: "Kutilayotgan", v: "—", c: "text-orange-600" },
                { l: "Muddati o'tgan", v: "—", c: "text-muted-foreground" },
              ]).map(s => (
                <Card key={s.l}><CardContent className="pt-4 pb-3">
                  <div className={`text-xl font-bold ${s.c}`}>{s.v}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s.l}</div>
                </CardContent></Card>
              ))}
            </div>
            <Card>
              <CardContent className="p-0">
                {taxLoading ? (
                  <div className="p-4 space-y-2">{([...Array(4)]).map((_,i)=><Skeleton key={`k-${i}`} className="h-10 w-full"/>)}</div>
                ) : taxItems.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">Soliq qoidalari kiritilmagan. Administrator tomonidan qo'shilishi kerak.</div>
                ) : (
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Soliq turi</TableHead><TableHead>Davr</TableHead>
                    <TableHead>Muddat</TableHead><TableHead>Stavka</TableHead><TableHead>Holati</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {(Array.isArray(taxItems) ? taxItems : []).map((t, i) => (
                      <TableRow key={t.id || i} data-testid={`row-tax-${i}`}>
                        <TableCell className="font-medium">{t.name}</TableCell>
                        <TableCell className="text-muted-foreground">{t.period}</TableCell>
                        <TableCell className="text-muted-foreground">{t.due}</TableCell>
                        <TableCell className="font-medium">{t.rate}%</TableCell>
                        <TableCell>
                          <Badge variant={t.status === "To'langan" ? "default" : "secondary"}>
                            {t.status === "To'langan" ? (
                              <><CheckCircle className="h-3 w-3 mr-0.5" />{t.status}</>
                            ) : t.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tax Calendar */}
          <TabsContent value="taxcal" className="mt-0 space-y-4">
            <h2 className="text-lg font-semibold">Soliq Muddatlari Kalendari</h2>
            <div className="space-y-3">
              {([
                { month: "Aprel 2026", tasks: [
                  { date: "15 aprel", tax: "INPS va MHTM to'lovi", done: false },
                  { date: "20 aprel", tax: "QQS deklaratsiyasi topshirish", done: false },
                  { date: "25 aprel", tax: "Foyda solig'i to'lovi", done: false },
                  { date: "30 aprel", tax: "Yillik hisobot (I chorak)", done: false },
                ]},
                { month: "Mart 2026", tasks: [
                  { date: "15 mart", tax: "INPS va MHTM to'lovi", done: true },
                  { date: "20 mart", tax: "QQS deklaratsiyasi", done: true },
                  { date: "25 mart", tax: "Foyda solig'i to'lovi", done: true },
                ]},
              ]).map((month, mi) => (
                <Card key={mi}>
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">{month.month}</CardTitle></CardHeader>
                  <CardContent className="pt-0 space-y-2">
                    {(Array.isArray(month.tasks) ? month.tasks : []).map((task, ti) => (
                      <div key={ti} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0" data-testid={`row-taxcal-${mi}-${ti}`}>
                        {task.done ? (
                          <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0" />
                        )}
                        <span className="text-sm font-medium w-20 shrink-0">{task.date}</span>
                        <span className="text-sm text-muted-foreground">{task.tax}</span>
                        <Badge variant={task.done ? "default" : "outline"} className="ml-auto">
                          {task.done ? "Bajarildi" : "Kutilmoqda"}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Risk AI */}
          <TabsContent value="risk" className="mt-0 space-y-4">
            <h2 className="text-lg font-semibold">AI Moliyaviy Risk Tahlili</h2>
            <div className="grid grid-cols-3 gap-4">
              {([
                { l: "Umumiy risk bali", v: "—", c: "text-orange-600", note: "" },
                { l: "Likvidlik nisbati", v: "—", c: "text-green-600", note: "" },
                { l: "Qarzdorlik nisbati", v: "—", c: "text-green-600", note: "" },
              ]).map(s => (
                <Card key={s.l}><CardContent className="pt-4 pb-3">
                  <div className={`text-2xl font-bold ${s.c}`}>{s.v}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s.l}</div>
                  <div className="text-xs font-medium mt-1">{s.note}</div>
                </CardContent></Card>
              ))}
            </div>
            <Card>
              <CardHeader><CardTitle className="text-base">AI Risk Bashoratlari</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {([
                  { risk: "Pul oqimi tanqisligi", prob: 35, impact: "Yuqori", action: "Debitor qayta ko'rib chiqish kerak" },
                  { risk: "Kreditor muddatlari o'tishi", prob: 28, impact: "O'rta", action: "Yetkazuvchilarga muddatlarni uzaytirish so'rash" },
                  { risk: "Valyuta kursi xavfi", prob: 20, impact: "Past", action: "USD/UZS kuzatuvini kuchaytirish" },
                ]).map((r, i) => (
                  <div key={`k-${i}`} className="p-3 rounded-md bg-muted/50 space-y-2" data-testid={`row-risk-${i}`}>
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-sm">{r.risk}</div>
                      <div className="flex gap-2 items-center">
                        <Badge variant={r.impact === "Yuqori" ? "destructive" : r.impact === "O'rta" ? "secondary" : "outline"}>
                          {r.impact}
                        </Badge>
                        <span className="text-sm font-bold">{r.prob}%</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-muted rounded">
                      <div className={`h-1.5 rounded ${r.prob >= 50 ? "bg-red-500" : r.prob >= 25 ? "bg-yellow-500" : "bg-green-500"}`}
                        style={{ width: `${r.prob}%` }} />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <span className="font-medium">Tavsiya: </span>{r.action}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

        </div>
      </Tabs>
    </div>
  );
}
