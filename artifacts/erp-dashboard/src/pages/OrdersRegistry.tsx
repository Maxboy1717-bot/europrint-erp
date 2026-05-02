import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { PageState } from "@/components/ui/page-state";
import { FileText, Plus, RefreshCw, Search, Eye, ChevronDown } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrdersRegistryEntry {
  id: number;
  number: string;
  category: string;
  title: string;
  content?: string;
  issuedBy: string | null;
  issuedDate: string;
  status: string;
  departmentIds: number[] | null;
  createdAt: string;
}

const CATEGORIES = ["OT", "OM", "OR", "OP", "OX"] as const;
type Category = typeof CATEGORIES[number];

const CATEGORY_LABELS: Record<Category, string> = {
  OT: "Umumiy buyruq",
  OM: "Mehnat buyruqi",
  OR: "Rejalashtiruv buyruqi",
  OP: "Ishlab chiqarish buyruqi",
  OX: "Xo'jalik buyruqi",
};

const CATEGORY_COLORS: Record<Category, string> = {
  OT: "bg-blue-100 text-blue-800",
  OM: "bg-green-100 text-green-800",
  OR: "bg-purple-100 text-purple-800",
  OP: "bg-orange-100 text-orange-800",
  OX: "bg-teal-100 text-teal-800",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Faol",
  cancelled: "Bekor qilingan",
  expired: "Muddati o'tgan",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  expired: "bg-gray-100 text-gray-600",
};

// ─── Create Form ──────────────────────────────────────────────────────────────

function CreateOrderForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    category: "",
    title: "",
    content: "",
    issuedDate: new Date().toISOString().split("T")[0],
    status: "active",
  });

  const mutation = useMutation({
    mutationFn: (data: typeof form) => apiRequest("POST", "/api/orders-registry", data),
    onSuccess: () => {
      toast({ title: "Buyruq muvaffaqiyatli qo'shildi" });
      onSuccess();
      onClose();
    },
    onError: () => toast({ title: "Xatolik yuz berdi", variant: "destructive" }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.category || !form.title.trim() || !form.content.trim() || !form.issuedDate) {
      toast({ title: "Barcha majburiy maydonlarni to'ldiring", variant: "destructive" });
      return;
    }
    mutation.mutate(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Kategoriya *</Label>
          <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
            <SelectTrigger>
              <SelectValue placeholder="Kategoriya tanlang" />
            </SelectTrigger>
            <SelectContent>
              {(Array.isArray(CATEGORIES) ? CATEGORIES : []).map((c) => (
                <SelectItem key={c} value={c}>
                  {c} — {CATEGORY_LABELS[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="issuedDate">Chiqarilgan sana *</Label>
          <Input
            id="issuedDate"
            type="date"
            value={form.issuedDate}
            onChange={(e) => setForm((f) => ({ ...f, issuedDate: e.target.value }))}
            required
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="title">Sarlavha *</Label>
        <Input
          id="title"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="Buyruq sarlavhasi"
          required
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="content">Buyruq matni *</Label>
        <Textarea
          id="content"
          value={form.content}
          onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
          placeholder="To'liq buyruq matni"
          rows={6}
          required
        />
      </div>
      <div className="space-y-1">
        <Label>Status</Label>
        <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Faol</SelectItem>
            <SelectItem value="cancelled">Bekor qilingan</SelectItem>
            <SelectItem value="expired">Muddati o'tgan</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>Bekor qilish</Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
        </Button>
      </DialogFooter>
    </form>
  );
}

// ─── Detail Dialog ────────────────────────────────────────────────────────────

function OrderDetailDialog({ orderId, onClose }: { orderId: number; onClose: () => void }) {
  const { data: entry, isLoading } = useQuery<OrdersRegistryEntry>({
    queryKey: [`/api/orders-registry/${orderId}`],
  });

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : entry ? (
        <>
          <div className="flex items-center gap-3 flex-wrap">
            <Badge className={`${CATEGORY_COLORS[entry.category as Category] || ""} border-0`}>
              {entry.number}
            </Badge>
            <Badge className={`${STATUS_COLORS[entry.status] || ""} border-0`}>
              {STATUS_LABELS[entry.status] || entry.status}
            </Badge>
            <span className="text-sm text-muted-foreground">{entry.issuedDate}</span>
          </div>
          <h3 className="font-semibold text-base">{entry.title}</h3>
          <div className="p-4 bg-muted rounded-lg text-sm whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
            {entry.content}
          </div>
          <p className="text-xs text-muted-foreground">
            Kiritilgan: {new Date(entry.createdAt).toLocaleString("uz-UZ")}
          </p>
        </>
      ) : (
        <p className="text-muted-foreground">Buyruq topilmadi</p>
      )}
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Yopish</Button>
      </DialogFooter>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OrdersRegistry() {
  const { toast } = useToast();
  const { hasRole } = useAuth();
  const canCreate = hasRole("admin", "super_admin", "director", "erp_manager");
  const [showCreate, setShowCreate] = useState(false);
  const [viewId, setViewId] = useState<number | null>(null);
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterYear, setFilterYear] = useState("");
  const [search, setSearch] = useState("");

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => String(currentYear - i));

  const queryParams: Record<string, string> = {};
  if (filterCategory !== "all") queryParams.category = filterCategory;
  if (filterStatus !== "all") queryParams.status = filterStatus;
  if (filterYear) queryParams.year = filterYear;
  if (search) queryParams.search = search;

  const { data, isLoading, isError, refetch } = useQuery<{ entries: OrdersRegistryEntry[]; total: number }>({
    queryKey: ["/api/orders-registry", Object.keys(queryParams).length > 0 ? queryParams : {}],
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/orders-registry"] });
  };

  const entries = data?.entries ?? [];

  const statsByCategory = CATEGORIES.reduce((acc, c) => {
    acc[c] = (Array.isArray(entries) ? entries : []).filter((e) => e.category === c).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
            <FileText className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Buyruqlar Registri</h1>
            <p className="text-sm text-muted-foreground">Markazlashgan rasmiy hujjatlar boshqaruvi</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-1" /> Yangilash
          </Button>
          {canCreate && (
            <Button size="sm" onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4 mr-1" /> Yangi buyruq
            </Button>
          )}
        </div>
      </div>

      {/* Category Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {(Array.isArray(CATEGORIES) ? CATEGORIES : []).map((c) => (
          <Card
            key={c}
            className={`p-3 cursor-pointer transition-all ${filterCategory === c ? "ring-2 ring-primary" : "hover:border-primary"}`}
            onClick={() => setFilterCategory(filterCategory === c ? "all" : c)}
          >
            <div className={`text-xs font-semibold px-1.5 py-0.5 rounded inline-block mb-2 ${CATEGORY_COLORS[c]}`}>{c}</div>
            <p className="text-2xl font-bold">{statsByCategory[c]}</p>
            <p className="text-xs text-muted-foreground">{CATEGORY_LABELS[c]}</p>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1 flex-1 min-w-[200px]">
              <Label className="text-xs">Qidirish</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
                <Input
                  className="pl-8"
                  placeholder="Sarlavha bo'yicha qidirish..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1 min-w-[140px]">
              <Label className="text-xs">Kategoriya</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Barchasi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barchasi</SelectItem>
                  {(Array.isArray(CATEGORIES) ? CATEGORIES : []).map((c) => <SelectItem key={c} value={c}>{c} — {CATEGORY_LABELS[c]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 min-w-[120px]">
              <Label className="text-xs">Yil</Label>
              <Select value={filterYear || "all"} onValueChange={(v) => setFilterYear(v === "all" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Barchasi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barchasi</SelectItem>
                  {(Array.isArray(years) ? years : []).map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 min-w-[140px]">
              <Label className="text-xs">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Barchasi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barchasi</SelectItem>
                  <SelectItem value="active">Faol</SelectItem>
                  <SelectItem value="cancelled">Bekor qilingan</SelectItem>
                  <SelectItem value="expired">Muddati o'tgan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="py-3 px-4 border-b">
          <CardTitle className="text-base">
            Buyruqlar ro'yxati
            {data?.total !== undefined && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">({data.total} ta)</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <PageState
            isLoading={isLoading}
            isError={isError}
            isEmpty={entries.length === 0}
            onRetry={() => refetch()}
            skeleton="table"
            skeletonRows={5}
            skeletonColumns={6}
            errorTitle="Buyruqlar yuklanmadi"
            errorMessage="Server bilan bog'lanishda xatolik. Qayta urinib ko'ring."
            emptyIcon={FileText}
            emptyTitle="Buyruqlar topilmadi"
            emptyDescription="Yangi buyruq qo'shish uchun yuqoridagi 'Qo'shish' tugmasini bosing."
          >
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-32">Raqam</TableHead>
                    <TableHead className="w-28">Kategoriya</TableHead>
                    <TableHead>Sarlavha</TableHead>
                    <TableHead className="w-28">Sana</TableHead>
                    <TableHead className="w-28">Status</TableHead>
                    <TableHead className="w-16 text-center">Ko'rish</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(Array.isArray(entries) ? entries : []).map((entry) => (
                    <TableRow key={entry.id} className="hover:bg-muted/50">
                      <TableCell className="font-mono text-sm font-medium">{entry.number}</TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${CATEGORY_COLORS[entry.category as Category] || ""}`}>
                          {CATEGORY_LABELS[entry.category as Category] || entry.category}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <span className="line-clamp-2 text-sm">{entry.title}</span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{entry.issuedDate}</TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${STATUS_COLORS[entry.status] || ""}`}>
                          {STATUS_LABELS[entry.status] || entry.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setViewId(entry.id)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </PageState>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" /> Yangi Buyruq Qo'shish
            </DialogTitle>
          </DialogHeader>
          <CreateOrderForm
            onClose={() => setShowCreate(false)}
            onSuccess={handleRefresh}
          />
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={viewId !== null} onOpenChange={(open) => !open && setViewId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" /> Buyruq Tafsilotlari
            </DialogTitle>
          </DialogHeader>
          {viewId !== null && (
            <OrderDetailDialog orderId={viewId} onClose={() => setViewId(null)} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
