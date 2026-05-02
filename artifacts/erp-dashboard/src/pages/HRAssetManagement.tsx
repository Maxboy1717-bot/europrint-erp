import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Package, Plus, Search, RefreshCw, Monitor, Smartphone, Key, Shirt,
  Printer, Laptop, AlertTriangle, CheckCircle, UserCheck, RotateCcw,
  Filter, Eye
} from "lucide-react";

type ReportType = "lost" | "broken" | "damaged";

interface AssignmentHistory {
  id: string;
  employee_id: string;
  employee_name: string | null;
  assigned_date: string;
  return_date: string | null;
  condition_on_assign: string;
  condition_on_return: string | null;
}

interface Asset {
  id: string;
  serial_number: string | null;
  name: string;
  category: string;
  status: string;
  purchase_date: string | null;
  value: number;
  department_id: string | null;
  notes: string | null;
  created_at: string;
  assigned_to: string | null;
  assigned_employee_name: string | null;
  assigned_date: string | null;
  history?: AssignmentHistory[];
}

interface Department {
  id: string;
  name: string;
}

interface Employee {
  id: string;
  full_name: string;
  employee_id: string;
}

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  laptop: Laptop,
  computer: Monitor,
  phone: Smartphone,
  printer: Printer,
  key: Key,
  uniform: Shirt,
  other: Package,
};

const CATEGORY_LABELS: Record<string, string> = {
  laptop: "Noutbuk",
  computer: "Kompyuter",
  phone: "Telefon",
  printer: "Printer",
  key: "Kalit",
  uniform: "Forma kiyim",
  other: "Boshqa",
};

const STATUS_LABELS: Record<string, string> = {
  available: "Bo'sh",
  assigned: "Berilgan",
  broken: "Buzilgan",
  lost: "Yo'qolgan",
  damaged: "Shikastlangan",
  maintenance: "Ta'mirda",
};

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  available: "outline",
  assigned: "default",
  broken: "destructive",
  lost: "destructive",
  damaged: "destructive",
  maintenance: "secondary",
};

const CONDITION_LABELS: Record<string, string> = {
  new: "Yangi",
  good: "Yaxshi",
  fair: "Qoniqarli",
  poor: "Yomon",
  broken: "Buzilgan",
};

const EMPTY_FORM = {
  serial_number: "",
  name: "",
  category: "laptop",
  status: "available",
  purchase_date: "",
  value: "",
  notes: "",
};

const EMPTY_ASSIGN = {
  employee_id: "",
  assigned_date: new Date().toISOString().slice(0, 10),
  condition_on_assign: "good",
  notes: "",
};

const EMPTY_RETURN = {
  return_date: new Date().toISOString().slice(0, 10),
  condition_on_return: "good",
  notes: "",
};

const EMPTY_REPORT: { report_type: ReportType; description: string } = {
  report_type: "broken",
  description: "",
};

export default function HRAssetManagement() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDepartment, setFilterDepartment] = useState("all");

  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [assignForm, setAssignForm] = useState(EMPTY_ASSIGN);

  const [returnOpen, setReturnOpen] = useState(false);
  const [returnForm, setReturnForm] = useState(EMPTY_RETURN);

  const [reportOpen, setReportOpen] = useState(false);
  const [reportForm, setReportForm] = useState<{ report_type: ReportType; description: string }>(EMPTY_REPORT);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailAsset, setDetailAsset] = useState<Asset | null>(null);

  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (filterCategory !== "all") params.append("category", filterCategory);
  if (filterStatus !== "all") params.append("status", filterStatus);
  if (filterDepartment !== "all") params.append("department_id", filterDepartment);

  const { data: rawAssets, isLoading, refetch } = useQuery<Asset[]>({
    queryKey: ["/api/assets", search, filterCategory, filterStatus, filterDepartment],
    queryFn: async () => {
      const res = await fetch(`/api/assets?${params.toString()}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const assets = Array.isArray(rawAssets) ? rawAssets : [];

  const { data: employees } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
    queryFn: async () => {
      const res = await fetch("/api/employees?limit=500", { credentials: "include" });
      if (!res.ok) return [];
      const data: unknown = await res.json();
      return Array.isArray(data) ? (data as Employee[]) : ((data as { employees?: Employee[] }).employees ?? []);
    },
  });

  const { data: departments } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
    queryFn: async () => {
      const res = await fetch("/api/departments", { credentials: "include" });
      if (!res.ok) return [];
      const data: unknown = await res.json();
      return Array.isArray(data) ? (data as Department[]) : [];
    },
  });

  const addMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/assets", {
      ...form,
      value: form.value ? Number(form.value) : 0,
      purchase_date: form.purchase_date || null,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      setAddOpen(false);
      setForm(EMPTY_FORM);
      toast({ title: "Jihoz qo'shildi" });
    },
    onError: () => toast({ title: "Xatolik yuz berdi", variant: "destructive" }),
  });

  const assignMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/assets/${selectedAsset?.id}/assign`, assignForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      setAssignOpen(false);
      setAssignForm(EMPTY_ASSIGN);
      toast({ title: "Jihoz xodimga berildi" });
    },
    onError: (err: Error) => toast({ title: err?.message || "Xatolik yuz berdi", variant: "destructive" }),
  });

  const returnMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/assets/${selectedAsset?.id}/return`, returnForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      setReturnOpen(false);
      setReturnForm(EMPTY_RETURN);
      toast({ title: "Jihoz qaytarildi" });
    },
    onError: () => toast({ title: "Xatolik yuz berdi", variant: "destructive" }),
  });

  const reportMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/assets/${selectedAsset?.id}/report`, reportForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      setReportOpen(false);
      setReportForm(EMPTY_REPORT);
      toast({ title: "Hisobot yuborildi. Maosh chegirmasi navbatga qo'shildi." });
    },
    onError: () => toast({ title: "Xatolik yuz berdi", variant: "destructive" }),
  });

  const openDetail = async (asset: Asset) => {
    const res = await fetch(`/api/assets/${asset.id}`, { credentials: "include" });
    if (res.ok) {
      const data = await res.json() as Asset;
      setDetailAsset(data);
      setDetailOpen(true);
    }
  };

  const stats = {
    total: assets.length,
    available: (Array.isArray(assets) ? assets : []).filter(a => a.status === "available").length,
    assigned: (Array.isArray(assets) ? assets : []).filter(a => a.status === "assigned").length,
    broken: (Array.isArray(assets) ? assets : []).filter(a => ["broken", "lost", "damaged"].includes(a.status)).length,
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Aktivlar Boshqaruvi</h1>
          <p className="text-sm text-on-surface-variant mt-1">Xodimlarga berilgan jihozlar, kalitlar va forma kiyimlar</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Yangi jihoz
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {([
          { label: "Jami", value: stats.total, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/20" },
          { label: "Bo'sh", value: stats.available, color: "text-green-600", bg: "bg-green-50 dark:bg-green-950/20" },
          { label: "Berilgan", value: stats.assigned, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/20" },
          { label: "Muammo", value: stats.broken, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/20" },
        ]).map(s => (
          <Card key={s.label} className={`border-border/50 ${s.bg}`}>
            <CardContent className="p-4">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-on-surface-variant mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
          <Input
            className="pl-9"
            placeholder="Nomi yoki serial raqam bo'yicha qidirish..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-full sm:w-40">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Tur" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha turlar</SelectItem>
            {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
              <SelectItem key={v} value={v}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Holat" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha holatlar</SelectItem>
            {Object.entries(STATUS_LABELS).map(([v, l]) => (
              <SelectItem key={v} value={v}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterDepartment} onValueChange={setFilterDepartment}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Bo'lim" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha bo'limlar</SelectItem>
            {(Array.isArray(departments) ? departments : []).map(d => (
              <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Jihoz</TableHead>
                  <TableHead>Serial raqam</TableHead>
                  <TableHead>Tur</TableHead>
                  <TableHead>Holat</TableHead>
                  <TableHead>Xodim</TableHead>
                  <TableHead>Berilgan sana</TableHead>
                  <TableHead className="text-right">Amallar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`k-${i}`}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))}
                {!isLoading && assets.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-on-surface-variant">
                      <Package className="w-10 h-10 mx-auto mb-3 opacity-20" />
                      <p>Aktivlar topilmadi</p>
                    </TableCell>
                  </TableRow>
                )}
                {(Array.isArray(assets) ? assets : []).map(asset => {
                  const Icon = CATEGORY_ICONS[asset.category] ?? Package;
                  return (
                    <TableRow key={asset.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                            <Icon className="w-4 h-4 text-primary" />
                          </div>
                          <span className="font-medium text-sm">{asset.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-on-surface-variant font-mono">
                        {asset.serial_number ?? "—"}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{CATEGORY_LABELS[asset.category] ?? asset.category}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANTS[asset.status] ?? "outline"} className="text-xs">
                          {STATUS_LABELS[asset.status] ?? asset.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {asset.assigned_employee_name ?? <span className="text-on-surface-variant">—</span>}
                      </TableCell>
                      <TableCell className="text-sm text-on-surface-variant">
                        {asset.assigned_date ? new Date(asset.assigned_date).toLocaleDateString("uz-UZ") : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 justify-end">
                          <Button size="sm" variant="ghost" onClick={() => openDetail(asset)}>
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          {asset.status === "available" && (
                            <Button size="sm" variant="ghost" className="text-blue-600" onClick={() => {
                              setSelectedAsset(asset);
                              setAssignOpen(true);
                            }}>
                              <UserCheck className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          {asset.status === "assigned" && (
                            <>
                              <Button size="sm" variant="ghost" className="text-green-600" onClick={() => {
                                setSelectedAsset(asset);
                                setReturnOpen(true);
                              }}>
                                <RotateCcw className="w-3.5 h-3.5" />
                              </Button>
                              <Button size="sm" variant="ghost" className="text-red-600" onClick={() => {
                                setSelectedAsset(asset);
                                setReportOpen(true);
                              }}>
                                <AlertTriangle className="w-3.5 h-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Asset Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Yangi jihoz qo'shish</DialogTitle>
            <DialogDescription>Kompaniya jihozi ma'lumotlarini kiriting</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label>Nomi *</Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="MacBook Pro 14" />
              </div>
              <div className="space-y-1.5">
                <Label>Tur</Label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Serial raqam</Label>
                <Input value={form.serial_number} onChange={e => setForm({ ...form, serial_number: e.target.value })} placeholder="SN-12345" />
              </div>
              <div className="space-y-1.5">
                <Label>Xarid sanasi</Label>
                <Input type="date" value={form.purchase_date} onChange={e => setForm({ ...form, purchase_date: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Qiymati (UZS)</Label>
                <Input type="number" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} placeholder="5000000" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Izoh</Label>
                <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Bekor qilish</Button>
            <Button onClick={() => addMutation.mutate()} disabled={addMutation.isPending || !form.name}>
              {addMutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Xodimga berish</DialogTitle>
            <DialogDescription>{selectedAsset?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Xodim *</Label>
              <Select value={assignForm.employee_id} onValueChange={v => setAssignForm({ ...assignForm, employee_id: v })}>
                <SelectTrigger><SelectValue placeholder="Xodimni tanlang" /></SelectTrigger>
                <SelectContent>
                  {(Array.isArray(employees) ? employees : []).map(e => (
                    <SelectItem key={e.id} value={e.id}>{e.full_name} ({e.employee_id})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Berish sanasi</Label>
              <Input type="date" value={assignForm.assigned_date} onChange={e => setAssignForm({ ...assignForm, assigned_date: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Holat</Label>
              <Select value={assignForm.condition_on_assign} onValueChange={v => setAssignForm({ ...assignForm, condition_on_assign: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(CONDITION_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Izoh</Label>
              <Textarea value={assignForm.notes} onChange={e => setAssignForm({ ...assignForm, notes: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>Bekor qilish</Button>
            <Button onClick={() => assignMutation.mutate()} disabled={assignMutation.isPending || !assignForm.employee_id}>
              {assignMutation.isPending ? "..." : "Berish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Return Dialog */}
      <Dialog open={returnOpen} onOpenChange={setReturnOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Jihoz qaytarish</DialogTitle>
            <DialogDescription>{selectedAsset?.name} — {selectedAsset?.assigned_employee_name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Qaytarish sanasi</Label>
              <Input type="date" value={returnForm.return_date} onChange={e => setReturnForm({ ...returnForm, return_date: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Qaytarishdagi holat</Label>
              <Select value={returnForm.condition_on_return} onValueChange={v => setReturnForm({ ...returnForm, condition_on_return: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(CONDITION_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Izoh</Label>
              <Textarea value={returnForm.notes} onChange={e => setReturnForm({ ...returnForm, notes: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReturnOpen(false)}>Bekor qilish</Button>
            <Button onClick={() => returnMutation.mutate()} disabled={returnMutation.isPending}>
              {returnMutation.isPending ? "..." : "Qaytarish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report Dialog */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Muammo haqida xabar berish
            </DialogTitle>
            <DialogDescription>{selectedAsset?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Muammo turi *</Label>
              <Select value={reportForm.report_type} onValueChange={v => setReportForm({ ...reportForm, report_type: v as ReportType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="broken">Buzilgan</SelectItem>
                  <SelectItem value="damaged">Shikastlangan</SelectItem>
                  <SelectItem value="lost">Yo'qolgan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Tavsif</Label>
              <Textarea value={reportForm.description} onChange={e => setReportForm({ ...reportForm, description: e.target.value })} rows={3} placeholder="Muammo haqida batafsil ma'lumot..." />
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg text-sm text-amber-700 dark:text-amber-400 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              Yo'qolgan yoki shikastlangan jihoz uchun maosh chegirmasi navbatga qo'shiladi.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportOpen(false)}>Bekor qilish</Button>
            <Button variant="destructive" onClick={() => reportMutation.mutate()} disabled={reportMutation.isPending}>
              {reportMutation.isPending ? "..." : "Xabar berish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{detailAsset?.name}</DialogTitle>
            <DialogDescription>Serial: {detailAsset?.serial_number ?? "—"}</DialogDescription>
          </DialogHeader>
          {detailAsset && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-on-surface-variant">Tur</p>
                  <p className="font-medium">{CATEGORY_LABELS[detailAsset.category] ?? detailAsset.category}</p>
                </div>
                <div>
                  <p className="text-on-surface-variant">Holat</p>
                  <Badge variant={STATUS_VARIANTS[detailAsset.status] ?? "outline"}>
                    {STATUS_LABELS[detailAsset.status] ?? detailAsset.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-on-surface-variant">Qiymati</p>
                  <p className="font-medium">{Number(detailAsset.value).toLocaleString()} UZS</p>
                </div>
                <div>
                  <p className="text-on-surface-variant">Xarid sanasi</p>
                  <p className="font-medium">{detailAsset.purchase_date ?? "—"}</p>
                </div>
                {detailAsset.assigned_employee_name && (
                  <div className="col-span-2">
                    <p className="text-on-surface-variant">Hozirgi foydalanuvchi</p>
                    <p className="font-medium text-primary">{detailAsset.assigned_employee_name}</p>
                  </div>
                )}
              </div>

              {detailAsset.history && detailAsset.history.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Topshiriq tarixi</p>
                  <div className="space-y-2">
                    {(Array.isArray(detailAsset.history) ? detailAsset.history : []).map((h: AssignmentHistory, i: number) => (
                      <div key={`k-${i}`} className="flex items-center gap-3 p-2 rounded-lg bg-surface-container-low text-sm">
                        {h.return_date ? (
                          <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                        ) : (
                          <UserCheck className="w-4 h-4 text-blue-500 shrink-0" />
                        )}
                        <div className="flex-1">
                          <p className="font-medium">{h.employee_name ?? h.employee_id}</p>
                          <p className="text-on-surface-variant">
                            {h.assigned_date} → {h.return_date ?? "Hozir"}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {h.return_date
                            ? (CONDITION_LABELS[h.condition_on_return ?? ""] ?? h.condition_on_return)
                            : (CONDITION_LABELS[h.condition_on_assign] ?? h.condition_on_assign)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
