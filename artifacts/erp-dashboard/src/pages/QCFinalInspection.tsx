import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest, getAuthHeaders } from "@/lib/queryClient";
import { CheckCircle, XCircle, ClipboardCheck, AlertTriangle } from "lucide-react";

interface PapkaOrder {
  id: string;
  papkaNo: string;
  mijozNomi: string;
  mahsulotNomi: string;
  tiraj?: number;
  status: string;
}

interface FinalInspection {
  id: string;
  papkaOrderId: string;
  status: string;
  sampleQty: number;
  defectQty: number;
  defectRate: number;
  visualOk: boolean;
  dimensionsOk: boolean;
  printOk: boolean;
  packagingOk: boolean;
  comments?: string;
  inspectedAt: string;
}

// TZ_04 (04-08): statusMap ga qc_final qo'shildi
const STATUS_MAP: Record<string, { label: string; color: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Qoralama", color: "secondary" },
  pending_design: { label: "Dizayn kutilmoqda", color: "outline" },
  pending_tech: { label: "Texnik kutilmoqda", color: "outline" },
  pending_qc: { label: "QC kutilmoqda", color: "outline" },
  approved: { label: "Tasdiqlangan", color: "default" },
  ready_for_planning: { label: "Rejalashtirish uchun tayyor", color: "default" },
  planned: { label: "Rejalashtirilgan", color: "default" },
  production: { label: "Ishlab chiqarishda", color: "default" },
  qc_final: { label: "Yakuniy QC", color: "outline" },
  completed: { label: "Tugallangan", color: "default" },
  cancelled: { label: "Bekor qilingan", color: "destructive" },
};

export default function QCFinalInspection() {
  const { toast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<PapkaOrder | null>(null);
  const [inspectDialog, setInspectDialog] = useState(false);
  const [sampleQty, setSampleQty] = useState(10);
  const [defectQty, setDefectQty] = useState(0);
  const [visualOk, setVisualOk] = useState(false);
  const [dimensionsOk, setDimensionsOk] = useState(false);
  const [printOk, setPrintOk] = useState(false);
  const [packagingOk, setPackagingOk] = useState(false);
  const [comments, setComments] = useState("");

  const { data: orders = [], isLoading } = useQuery<PapkaOrder[]>({
    queryKey: ["/api/papka-orders", "qc_final"],
    queryFn: async () => {
      const res = await fetch("/api/qc/final-orders", { credentials: "include", headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Buyurtmalarni yuklashda xatolik");
      return res.json();
    }
  });

  const { data: inspections = [] } = useQuery<FinalInspection[]>({
    queryKey: ["/api/qc/final-inspections"],
    queryFn: async () => {
      const res = await fetch("/api/qc/final-inspections", { credentials: "include", headers: getAuthHeaders() });
      if (!res.ok) return [];
      return res.json();
    }
  });

  const inspectMutation = useMutation({
    mutationFn: async () => {
      if (!selectedOrder) throw new Error("Buyurtma tanlanmagan");
      return apiRequest("POST", "/api/qc/final-inspections", {
        papkaOrderId: selectedOrder.id,
        sampleQty,
        defectQty,
        visualOk,
        dimensionsOk,
        printOk,
        packagingOk,
        comments,
      });
    },
    onSuccess: (data: { inspection: FinalInspection }) => {
      const passed = data.inspection.status === "passed";
      toast({
        title: passed ? "Muvaffaqiyat" : "Nuqson aniqlandi",
        description: passed
          ? `Buyurtma sifat nazoratidan o'tdi (nuqson: ${data.inspection.defectRate?.toFixed(1)}%)`
          : `Nuqson darajasi yuqori: ${data.inspection.defectRate?.toFixed(1)}%. Qayta ishlov kerak.`,
        variant: passed ? "default" : "destructive",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/papka-orders", "qc_final"] });
      queryClient.invalidateQueries({ queryKey: ["/api/qc/final-inspections"] });
      setInspectDialog(false);
      setSelectedOrder(null);
      resetForm();
    },
    onError: (err: Error) => {
      toast({ title: "Xatolik", description: err.message, variant: "destructive" });
    }
  });

  const completeMutation = useMutation({
    mutationFn: async (inspectionId: string) => {
      return apiRequest("POST", `/api/qc/final-inspections/${inspectionId}/complete`, {});
    },
    onSuccess: () => {
      toast({ title: "Muvaffaqiyat", description: "Buyurtma tugatildi" });
      queryClient.invalidateQueries({ queryKey: ["/api/papka-orders", "qc_final"] });
    }
  });

  const resetForm = () => {
    setSampleQty(10);
    setDefectQty(0);
    setVisualOk(false);
    setDimensionsOk(false);
    setPrintOk(false);
    setPackagingOk(false);
    setComments("");
  };

  const defectRate = sampleQty > 0 ? (defectQty / sampleQty) * 100 : 0;
  const allChecked = visualOk && dimensionsOk && printOk && packagingOk;

  if (isLoading) return <div className="p-6">Yuklanmoqda...</div>;

  return (
    <div className="p-6 space-y-6 bg-surface">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <ClipboardCheck className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-4xl font-light tracking-tight text-on-surface">
            Yakuniy <span className="font-bold text-primary">QC Tekshiruv</span>
          </h1>
          <p className="text-on-surface-variant">Tayyor mahsulotni yetkazib berishdan oldin yakuniy sifat nazorati</p>
        </div>
      </div>

      {/* Statistika */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-surface-container-lowest rounded-lg border-none shadow-none p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Kutilmoqda</p>
          <p className="text-4xl font-bold tracking-tight text-on-surface">{orders.length}</p>
        </Card>
        <Card className="bg-surface-container-lowest rounded-lg border-none shadow-none p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">O'tdi</p>
          <p className="text-4xl font-bold tracking-tight text-green-600">{(inspections ?? []).filter(i => i.status === "passed").length}</p>
        </Card>
        <Card className="bg-surface-container-lowest rounded-lg border-none shadow-none p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Rad etildi</p>
          <p className="text-4xl font-bold tracking-tight text-red-600">{(inspections ?? []).filter(i => i.status === "failed").length}</p>
        </Card>
      </div>

      {/* Kutilmoqda */}
      <div>
        <h2 className="text-lg font-semibold mb-3 text-on-surface">Tekshirish kutilmoqda</h2>
        {orders.length === 0 ? (
          <Card className="bg-surface-container-lowest rounded-lg border-none shadow-none">
            <CardContent className="py-10 text-center">
              <CheckCircle className="h-10 w-10 mx-auto text-green-500 mb-3" />
              <p className="font-medium text-on-surface">Yakuniy tekshiruv kutayotgan buyurtmalar yo'q</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {(orders ?? []).map(order => (
              <Card key={order.id} className="bg-surface-container-lowest rounded-lg border-none shadow-none" data-testid={`final-order-${order.id}`}>
                <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
                  <div>
                    <CardTitle className="text-base text-on-surface">{order.papkaNo}</CardTitle>
                    <p className="text-sm text-on-surface-variant">{order.mijozNomi}</p>
                  </div>
                  <Badge className="bg-primary-container text-on-primary-container rounded-full px-2.5 py-0.5 text-xs font-semibold">
                    {STATUS_MAP[order.status]?.label || order.status}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-on-surface-variant">
                      {order.mahsulotNomi} · {order.tiraj?.toLocaleString()} dona
                    </div>
                    <Button
                      size="sm"
                      className="bg-gradient-to-br from-primary to-primary-dim text-white rounded-lg px-5 py-2.5 text-sm font-semibold"
                      onClick={() => { setSelectedOrder(order); setInspectDialog(true); }}
                      data-testid={`btn-inspect-${order.id}`}
                    >
                      <ClipboardCheck className="h-4 w-4 mr-1" />
                      Tekshiruv o'tkazish
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* So'nggi tekshiruvlar */}
      {inspections.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 text-on-surface">So'nggi tekshiruvlar</h2>
          <div className="grid gap-2">
            {inspections.slice(0, 10).map(insp => (
              <Card key={insp.id} className="bg-surface-container-lowest rounded-lg border-none shadow-none" data-testid={`inspection-${insp.id}`}>
                <CardContent className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {insp.status === "passed"
                      ? <CheckCircle className="h-5 w-5 text-green-500" />
                      : <XCircle className="h-5 w-5 text-red-500" />}
                    <div>
                      <p className="text-sm font-medium text-on-surface">{insp.papkaOrderId}</p>
                      <p className="text-xs text-on-surface-variant">
                        Namuna: {insp.sampleQty} · Nuqson: {insp.defectQty} ({insp.defectRate?.toFixed(1)}%)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={insp.status === "passed" ? "bg-green-100 text-green-800 rounded-full px-2.5 py-0.5 text-xs font-semibold" : "bg-red-100 text-red-800 rounded-full px-2.5 py-0.5 text-xs font-semibold"}>
                      {insp.status === "passed" ? "O'tdi" : "Rad"}
                    </Badge>
                    {insp.status === "passed" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-surface-container text-on-surface rounded-lg px-4 py-2 text-sm font-medium hover:bg-surface-container-high border-none"
                        onClick={() => completeMutation.mutate(insp.id)}
                        disabled={completeMutation.isPending}
                        data-testid={`btn-complete-${insp.id}`}
                      >
                        Tugatish
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Tekshiruv Dialog */}
      <Dialog open={inspectDialog} onOpenChange={setInspectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yakuniy tekshiruv — {selectedOrder?.papkaNo}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Namuna soni</label>
                <Input
                  type="number"
                  min={1}
                  value={sampleQty}
                  onChange={(e) => setSampleQty(parseInt(e.target.value) || 1)}
                  data-testid="input-sample-qty"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Nuqsonli soni</label>
                <Input
                  type="number"
                  min={0}
                  max={sampleQty}
                  value={defectQty}
                  onChange={(e) => setDefectQty(parseInt(e.target.value) || 0)}
                  data-testid="input-defect-qty"
                />
              </div>
            </div>

            {defectQty > 0 && (
              <div className={`p-2 rounded-md flex items-center gap-2 ${defectRate > 5 ? "bg-red-50 dark:bg-red-900/20" : "bg-yellow-50 dark:bg-yellow-900/20"}`}>
                <AlertTriangle className={`h-4 w-4 ${defectRate > 5 ? "text-red-600" : "text-yellow-600"}`} />
                <span className="text-sm">Nuqson darajasi: <strong>{defectRate.toFixed(1)}%</strong> {defectRate > 5 ? "(5% dan yuqori — RAD ETILADI)" : "(normal)"}</span>
              </div>
            )}

            <div className="space-y-2 border rounded-md p-3">
              <p className="text-sm font-medium text-muted-foreground">Chek-list:</p>
              {([
                { id: "visual", label: "Vizual ko'rinish yaxshi", value: visualOk, set: setVisualOk },
                { id: "dimensions", label: "O'lchamlar normaga mos", value: dimensionsOk, set: setDimensionsOk },
                { id: "print", label: "Bosma sifati yaxshi", value: printOk, set: setPrintOk },
                { id: "packaging", label: "Qadoqlash to'g'ri", value: packagingOk, set: setPackagingOk },
              ]).map(item => (
                <div key={item.id} className="flex items-center gap-2">
                  <Checkbox
                    id={item.id}
                    checked={item.value}
                    onCheckedChange={(v) => item.set(!!v)}
                    data-testid={`checkbox-final-${item.id}`}
                  />
                  <label htmlFor={item.id} className="text-sm cursor-pointer">{item.label}</label>
                </div>
              ))}
            </div>

            <Textarea
              placeholder="Izoh (ixtiyoriy)"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              data-testid="input-final-comments"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInspectDialog(false)}>Bekor qilish</Button>
            <Button
              onClick={() => inspectMutation.mutate()}
              disabled={inspectMutation.isPending || !allChecked}
              data-testid="btn-submit-inspection"
            >
              {inspectMutation.isPending ? "Saqlanmoqda..." : "Tekshiruvni saqlash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
