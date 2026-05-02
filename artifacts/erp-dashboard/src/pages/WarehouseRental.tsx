import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Warehouse,
  DollarSign,
  Clock,
  AlertTriangle,
  Plus,
  X,
  CheckCircle,
  Settings,
  RefreshCw,
  Package,
  TrendingUp,
  CalendarDays,
  SquareStack,
} from "lucide-react";
import { safeStorage } from '@/lib/safeStorage';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RentalRecord {
  id: string;
  recordNumber: string;
  orderNumber?: string;
  productName: string;
  managerName?: string;
  customerName?: string;
  warehouseName?: string;
  areaM2: number;
  admittedDate: string;
  freeDays: number;
  dailyRatePerM2: number;
  totalDays: number;
  billableDays: number;
  totalAmount: number;
  excludeWeekends: boolean;
  status: "active" | "closed" | "paid";
  notifiedAt?: string;
  closedDate?: string;
  notes?: string;
  createdAt: string;
}

interface RentalSummary {
  activeCount: number;
  overdueCount: number;
  totalActiveAmount: number;
  totalPaidAmount: number;
  totalClosedAmount: number;
  overdueRecords: RentalRecord[];
}

interface RentalSettings {
  id?: string;
  defaultFreeDays: number;
  defaultDailyRatePerM2: number;
  excludeWeekends: boolean;
  customRates: CustomRate[];
}

interface CustomRate {
  managerId: string;
  managerName: string;
  dailyRate: number;
  freeDays: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatMoney = (n: number) =>
  new Intl.NumberFormat("uz-UZ").format(Math.round(n)) + " so'm";

const statusBadge = (status: string) => {
  if (status === "active") return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">Aktiv</Badge>;
  if (status === "closed") return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300">Yopildi</Badge>;
  return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">To'langan</Badge>;
};

// ─── Add Record Dialog ────────────────────────────────────────────────────────

function AddRecordDialog({
  open,
  onClose,
  settings,
}: {
  open: boolean;
  onClose: () => void;
  settings: RentalSettings | null;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    productName: "",
    orderNumber: "",
    managerName: "",
    customerName: "",
    warehouseName: "Tayyor mahsulot ombori",
    areaM2: "",
    admittedDate: new Date().toISOString().split("T")[0],
    freeDays: String(settings?.defaultFreeDays ?? 8),
    dailyRatePerM2: String(settings?.defaultDailyRatePerM2 ?? 500),
    excludeWeekends: settings?.excludeWeekends ?? false,
    notes: "",
  });

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/warehouse-rental/records", data),
    onSuccess: () => {
      toast({ title: "Ijara yozuvi qo'shildi" });
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse-rental/records"] });
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse-rental/summary"] });
      onClose();
    },
    onError: (err: Error) => toast({ title: "Xato", description: err.message, variant: "destructive" }),
  });

  const handleSubmit = () => {
    if (!form.productName || !form.areaM2 || !form.admittedDate) {
      toast({ title: "Majburiy maydonlarni to'ldiring", variant: "destructive" });
      return;
    }
    mutation.mutate({
      ...form,
      areaM2: parseFloat(form.areaM2),
      freeDays: parseInt(form.freeDays),
      dailyRatePerM2: parseFloat(form.dailyRatePerM2),
    });
  };

  const f = (k: string, v: unknown) => setForm((prev) => ({ ...prev, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Yangi ijara yozuvi</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Mahsulot nomi *</Label>
            <Input data-testid="input-product-name" value={form.productName} onChange={(e) => f("productName", e.target.value)} placeholder="Ofset bosma qog'oz A4..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Buyurtma raqami</Label>
              <Input data-testid="input-order-number" value={form.orderNumber} onChange={(e) => f("orderNumber", e.target.value)} placeholder="ORD-2026-..." />
            </div>
            <div>
              <Label>Ombor nomi</Label>
              <Input data-testid="input-warehouse-name" value={form.warehouseName} onChange={(e) => f("warehouseName", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Menejer</Label>
              <Input data-testid="input-manager-name" value={form.managerName} onChange={(e) => f("managerName", e.target.value)} />
            </div>
            <div>
              <Label>Mijoz</Label>
              <Input data-testid="input-customer-name" value={form.customerName} onChange={(e) => f("customerName", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Maydon (m²) *</Label>
              <Input data-testid="input-area-m2" type="number" value={form.areaM2} onChange={(e) => f("areaM2", e.target.value)} placeholder="15.5" />
            </div>
            <div>
              <Label>Qabul sanasi *</Label>
              <Input data-testid="input-admitted-date" type="date" value={form.admittedDate} onChange={(e) => f("admittedDate", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Bepul kunlar</Label>
              <Input data-testid="input-free-days" type="number" value={form.freeDays} onChange={(e) => f("freeDays", e.target.value)} />
            </div>
            <div>
              <Label>Kunlik tarif (m² uchun)</Label>
              <Input data-testid="input-daily-rate" type="number" value={form.dailyRatePerM2} onChange={(e) => f("dailyRatePerM2", e.target.value)} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch data-testid="switch-exclude-weekends" checked={form.excludeWeekends} onCheckedChange={(v) => f("excludeWeekends", v)} />
            <Label>Dam olish kunlarini hisoblamaslik</Label>
          </div>
          <div>
            <Label>Izoh</Label>
            <Textarea data-testid="textarea-notes" value={form.notes} onChange={(e) => f("notes", e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Bekor</Button>
          <Button data-testid="button-save-record" onClick={handleSubmit} disabled={mutation.isPending}>
            {mutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Settings Panel ───────────────────────────────────────────────────────────

function SettingsPanel({ settings, onSaved }: { settings: RentalSettings | null; onSaved: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<RentalSettings>({
    defaultFreeDays: settings?.defaultFreeDays ?? 8,
    defaultDailyRatePerM2: settings?.defaultDailyRatePerM2 ?? 500,
    excludeWeekends: settings?.excludeWeekends ?? false,
    customRates: settings?.customRates ?? [],
  });
  const [newRate, setNewRate] = useState({ managerName: "", dailyRate: "", freeDays: "" });

  const mutation = useMutation({
    mutationFn: (data: RentalSettings) => apiRequest("PUT", "/api/warehouse-rental/settings", data),
    onSuccess: () => {
      toast({ title: "Sozlamalar saqlandi" });
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse-rental/settings"] });
      onSaved();
    },
    onError: (err: Error) => toast({ title: "Xato", description: err.message, variant: "destructive" }),
  });

  const addCustomRate = () => {
    if (!newRate.managerName || !newRate.dailyRate) return;
    setForm((prev) => ({
      ...prev,
      customRates: [
        ...prev.customRates,
        {
          managerId: Date.now().toString(),
          managerName: newRate.managerName,
          dailyRate: parseFloat(newRate.dailyRate),
          freeDays: parseInt(newRate.freeDays || "8"),
        },
      ],
    }));
    setNewRate({ managerName: "", dailyRate: "", freeDays: "" });
  };

  const removeRate = (idx: number) => {
    setForm((prev) => ({ ...prev, customRates: prev.customRates?.filter((_, i) => i !== idx) }));
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Asosiy sozlamalar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Standart bepul kunlar</Label>
              <Input
                data-testid="input-settings-free-days"
                type="number"
                value={form.defaultFreeDays}
                onChange={(e) => setForm((p) => ({ ...p, defaultFreeDays: parseInt(e.target.value) || 8 }))}
              />
            </div>
            <div>
              <Label>Standart kunlik tarif (m²/kun, so'm)</Label>
              <Input
                data-testid="input-settings-daily-rate"
                type="number"
                value={form.defaultDailyRatePerM2}
                onChange={(e) => setForm((p) => ({ ...p, defaultDailyRatePerM2: parseFloat(e.target.value) || 0 }))}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              data-testid="switch-settings-exclude-weekends"
              checked={form.excludeWeekends}
              onCheckedChange={(v) => setForm((p) => ({ ...p, excludeWeekends: v }))}
            />
            <Label>Dam olish kunlarini (shanba/yakshanba) hisoblamaslik</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Menejer uchun maxsus tarif</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {form.customRates.length > 0 && (
            <div className="space-y-2">
              {(Array.isArray(form.customRates) ? form.customRates : []).map((r, i) => (
                <div key={`k-${i}`} className="flex items-center gap-3 p-2 bg-muted rounded-md">
                  <span className="flex-1 text-sm font-medium">{r.managerName}</span>
                  <span className="text-sm text-muted-foreground">{formatMoney(r.dailyRate)}/m²/kun</span>
                  <span className="text-sm text-muted-foreground">{r.freeDays} bepul kun</span>
                  <Button size="icon" variant="ghost" onClick={() => removeRate(i)} data-testid={`button-remove-rate-${i}`}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <div className="grid grid-cols-3 gap-2">
            <Input
              data-testid="input-new-rate-manager"
              placeholder="Menejer ismi"
              value={newRate.managerName}
              onChange={(e) => setNewRate((p) => ({ ...p, managerName: e.target.value }))}
            />
            <Input
              data-testid="input-new-rate-daily"
              type="number"
              placeholder="Tarif (so'm)"
              value={newRate.dailyRate}
              onChange={(e) => setNewRate((p) => ({ ...p, dailyRate: e.target.value }))}
            />
            <Input
              data-testid="input-new-rate-free-days"
              type="number"
              placeholder="Bepul kun"
              value={newRate.freeDays}
              onChange={(e) => setNewRate((p) => ({ ...p, freeDays: e.target.value }))}
            />
          </div>
          <Button variant="outline" size="sm" onClick={addCustomRate} data-testid="button-add-custom-rate">
            <Plus className="h-4 w-4 mr-1" /> Maxsus tarif qo'shish
          </Button>
        </CardContent>
      </Card>

      <Button
        data-testid="button-save-settings"
        onClick={() => mutation.mutate(form)}
        disabled={mutation.isPending}
      >
        {mutation.isPending ? "Saqlanmoqda..." : "Sozlamalarni saqlash"}
      </Button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WarehouseRental() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [tab, setTab] = useState("records");

  const { data: summary, isLoading: summaryLoading } = useQuery<RentalSummary>({
    queryKey: ["/api/warehouse-rental/summary"],
  });

  const { data: recordsData, isLoading: recordsLoading } = useQuery<{ records: RentalRecord[]; total: number }>({
    queryKey: ["/api/warehouse-rental/records", statusFilter],
    queryFn: () =>
      fetch(`/api/warehouse-rental/records${statusFilter ? `?status=${statusFilter}` : ""}`, {
        headers: { Authorization: `Bearer ${safeStorage.getItem("auth_token")}` },
      }).then((r) => r.json()),
  });

  const { data: settings } = useQuery<RentalSettings>({
    queryKey: ["/api/warehouse-rental/settings"],
  });

  const closeMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("PATCH", `/api/warehouse-rental/records/${id}/close`, {
        closedDate: new Date().toISOString().split("T")[0],
      }),
    onSuccess: () => {
      toast({ title: "Ijara yopildi" });
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse-rental/records"] });
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse-rental/summary"] });
    },
  });

  const paidMutation = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/warehouse-rental/records/${id}/mark-paid`, {}),
    onSuccess: () => {
      toast({ title: "To'langan deb belgilandi" });
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse-rental/records"] });
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse-rental/summary"] });
    },
  });

  const recalcMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/warehouse-rental/recalculate", {}),
    onSuccess: (data: Record<string, unknown>) => {
      toast({ title: `Yangilandi: ${data?.updated ?? 0} ta yozuv` });
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse-rental/records"] });
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse-rental/summary"] });
    },
  });

  const records = recordsData?.records ?? [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Warehouse className="h-6 w-6 text-primary" />
            Ombor Ichki Ijara
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Tayyor mahsulot omborda saqlash: 8 kun bepul, keyin m² × kun × tarif
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => recalcMutation.mutate()}
            disabled={recalcMutation.isPending}
            data-testid="button-recalculate"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Qayta hisoblash
          </Button>
          <Button onClick={() => setAddOpen(true)} data-testid="button-add-rental">
            <Plus className="h-4 w-4 mr-1" /> Yangi yozuv
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={`k-${i}`} className="h-24" />)
        ) : (
          <>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-1">
                  <Package className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-muted-foreground">Aktiv yozuvlar</span>
                </div>
                <p className="text-2xl font-bold" data-testid="stat-active-count">{summary?.activeCount ?? 0}</p>
                <p className="text-xs text-muted-foreground">{summary?.overdueCount ?? 0} ta pullik boshlandi</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="h-4 w-4 text-orange-500" />
                  <span className="text-sm text-muted-foreground">Joriy ijara</span>
                </div>
                <p className="text-xl font-bold text-orange-600 dark:text-orange-400" data-testid="stat-active-amount">
                  {formatMoney(summary?.totalActiveAmount ?? 0)}
                </p>
                <p className="text-xs text-muted-foreground">Aktiv yozuvlar jami</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-muted-foreground">To'langan</span>
                </div>
                <p className="text-xl font-bold text-green-600 dark:text-green-400" data-testid="stat-paid-amount">
                  {formatMoney(summary?.totalPaidAmount ?? 0)}
                </p>
                <p className="text-xs text-muted-foreground">Jami to'lov</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-purple-500" />
                  <span className="text-sm text-muted-foreground">Yopilgan</span>
                </div>
                <p className="text-xl font-bold" data-testid="stat-closed-amount">
                  {formatMoney(summary?.totalClosedAmount ?? 0)}
                </p>
                <p className="text-xs text-muted-foreground">Jami yopilgan</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Overdue Alert */}
      {(summary?.overdueCount ?? 0) > 0 && (
        <Card className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <span className="font-semibold text-orange-700 dark:text-orange-400">
                {summary?.overdueCount} ta buyurtma bepul kundan oshdi — ijara to'lovi boshlandi
              </span>
            </div>
            <div className="space-y-1">
              {summary?.overdueRecords?.map((r) => (
                <div key={r.id} className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-medium">{r.productName}</span>
                  <span className="text-muted-foreground">•</span>
                  <span>{r.customerName || "—"}</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="font-semibold text-orange-600">{formatMoney(Number(r.totalAmount))}</span>
                  <span className="text-muted-foreground">({r.billableDays} kun × {r.areaM2} m²)</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="records" data-testid="tab-records">
            <SquareStack className="h-4 w-4 mr-1" /> Yozuvlar
          </TabsTrigger>
          <TabsTrigger value="settings" data-testid="tab-settings">
            <Settings className="h-4 w-4 mr-1" /> Sozlamalar
          </TabsTrigger>
        </TabsList>

        {/* Records Tab */}
        <TabsContent value="records" className="mt-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-4">
            {(["", "active", "closed", "paid"]).map((s) => (
              <Button
                key={s}
                variant={statusFilter === s ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(s)}
                data-testid={`filter-${s || "all"}`}
              >
                {s === "" ? "Barchasi" : s === "active" ? "Aktiv" : s === "closed" ? "Yopilgan" : "To'langan"}
              </Button>
            ))}
          </div>

          {recordsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={`k-${i}`} className="h-14 w-full" />)}
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-md">
              <Warehouse className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p>Hali ijara yozuvi yo'q. Yangi yozuv qo'shing.</p>
            </div>
          ) : (
            <div className="border rounded-md overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Raqam</TableHead>
                    <TableHead>Mahsulot</TableHead>
                    <TableHead>Mijoz / Menejer</TableHead>
                    <TableHead>Maydon (m²)</TableHead>
                    <TableHead>Qabul sanasi</TableHead>
                    <TableHead>Jami kun</TableHead>
                    <TableHead>Pullik kun</TableHead>
                    <TableHead className="text-right">Summa</TableHead>
                    <TableHead>Holat</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(Array.isArray(records) ? records : []).map((r) => (
                    <TableRow key={r.id} data-testid={`row-rental-${r.id}`}>
                      <TableCell className="font-mono text-xs">{r.recordNumber}</TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">{r.productName}</div>
                        {r.orderNumber && <div className="text-xs text-muted-foreground">{r.orderNumber}</div>}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{r.customerName || "—"}</div>
                        <div className="text-xs text-muted-foreground">{r.managerName || "—"}</div>
                      </TableCell>
                      <TableCell data-testid={`text-area-${r.id}`}>{Number(r.areaM2).toFixed(1)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <CalendarDays className="h-3 w-3 text-muted-foreground" />
                          {r.admittedDate}
                        </div>
                        <div className="text-xs text-muted-foreground">{r.freeDays} kun bepul</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span data-testid={`text-total-days-${r.id}`}>{r.totalDays}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          data-testid={`text-billable-days-${r.id}`}
                          className={Number(r.billableDays) > 0 ? "text-orange-600 font-semibold dark:text-orange-400" : "text-muted-foreground"}
                        >
                          {r.billableDays}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-semibold" data-testid={`text-amount-${r.id}`}>
                        {Number(r.billableDays) > 0 ? (
                          <span className="text-orange-600 dark:text-orange-400">{formatMoney(Number(r.totalAmount))}</span>
                        ) : (
                          <span className="text-muted-foreground">Bepul</span>
                        )}
                      </TableCell>
                      <TableCell>{statusBadge(r.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {r.status === "active" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => closeMutation.mutate(r.id)}
                              disabled={closeMutation.isPending}
                              data-testid={`button-close-${r.id}`}
                            >
                              Yopish
                            </Button>
                          )}
                          {r.status === "closed" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => paidMutation.mutate(r.id)}
                              disabled={paidMutation.isPending}
                              data-testid={`button-paid-${r.id}`}
                            >
                              To'landi
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="mt-4">
          <SettingsPanel settings={settings ?? null} onSaved={() => setTab("records")} />
        </TabsContent>
      </Tabs>

      {/* Add Dialog */}
      <AddRecordDialog open={addOpen} onClose={() => setAddOpen(false)} settings={settings ?? null} />
    </div>
  );
}
