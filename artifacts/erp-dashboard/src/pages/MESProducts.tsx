import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Package, Search, CheckCircle, XCircle, Plus, ToggleLeft, ToggleRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ecommerceApi } from "@/lib/api/misc";

interface Product {
  id: string;
  code: string;
  name: string;
  nameRu?: string;
  category?: string;
  unit: string;
  standardCost?: number;
  isActive: boolean;
  createdAt: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  gofreli: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  quti: "bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
  rulon: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  other: "bg-muted text-muted-foreground",
};

const UNITS = ["dona", "kg", "litr", "m", "m²", "m³", "quti", "rulon", "varaq"];
const CATEGORIES = ["gofreli", "quti", "rulon", "etiket", "lenta", "xaltacha", "other"];

export default function MESProducts() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    code: "", name: "", nameRu: "", category: "other",
    unit: "dona", standardCost: "",
  });

  const { data: raw, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const products: Product[] = Array.isArray(raw) ? raw : [];

  const createProductMutation = useMutation({
    mutationFn: (data: typeof form) =>
      ecommerceApi.createProduct({
        ...data,
        standardCost: data.standardCost ? Number(data.standardCost) : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setCreateOpen(false);
      setForm({ code: "", name: "", nameRu: "", category: "other", unit: "dona", standardCost: "" });
      toast({ title: "Mahsulot yaratildi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      ecommerceApi.updateProduct(id, { isActive: !isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Mahsulot holati o'zgartirildi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const filtered = (Array.isArray(products) ? products : []).filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.code.toLowerCase().includes(search.toLowerCase()) ||
    (p.category || "").toLowerCase().includes(search.toLowerCase())
  );

  const active = (Array.isArray(products) ? products : []).filter(p => p.isActive).length;

  return (
    <div className="flex-1 overflow-auto p-5 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mahsulotlar</h1>
          <p className="text-sm text-muted-foreground">Ishlab chiqariladigan mahsulotlar katalogi</p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <Badge variant="outline" className="gap-1.5">
            <CheckCircle className="w-3 h-3 text-emerald-500" /> {active} faol
          </Badge>
          <Badge variant="outline" className="gap-1.5">
            <Package className="w-3 h-3 text-muted-foreground" /> {products.length} jami
          </Badge>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Mahsulot qo'shish
          </Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Nom, kod yoki kategoriya..."
          className="pl-9"
          value={search}
          onChange={e => setSearch(e.target.value)}
          data-testid="input-product-search"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {([1,2,3,4,5,6,7,8]).map(i => <Skeleton key={`k-${i}`} className="h-40 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{search ? "Qidiruv bo'yicha topilmadi" : "Mahsulot topilmadi"}</p>
          <Button className="mt-4" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Mahsulot qo'shish
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {(Array.isArray(filtered) ? filtered : []).map(p => (
            <Card key={p.id} className={cn(!p.isActive && "opacity-60")} data-testid={`card-product-${p.id}`}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Package className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex gap-1.5 flex-wrap justify-end">
                    {p.category && (
                      <Badge className={cn("text-[10px] px-1.5", CATEGORY_COLORS[p.category] ?? CATEGORY_COLORS.other)}>
                        {p.category}
                      </Badge>
                    )}
                    {!p.isActive && (
                      <Badge variant="outline" className="text-[10px] px-1.5">
                        <XCircle className="w-2.5 h-2.5 mr-0.5" /> Nofaol
                      </Badge>
                    )}
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground leading-tight">{p.name}</p>
                  {p.nameRu && <p className="text-xs text-muted-foreground mt-0.5">{p.nameRu}</p>}
                </div>
                <div className="flex items-center justify-between border-t pt-2">
                  <div>
                    <p className="text-[10px] text-muted-foreground">Kod</p>
                    <p className="text-xs font-mono font-semibold text-foreground">{p.code}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground">O'lchov</p>
                    <p className="text-xs font-semibold text-foreground">{p.unit}</p>
                  </div>
                  {p.standardCost && (
                    <div className="text-right">
                      <p className="text-[10px] text-muted-foreground">Tannarx</p>
                      <p className="text-xs font-semibold text-foreground">
                        {Number(p.standardCost).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-7 text-xs"
                  onClick={() => toggleActiveMutation.mutate({ id: p.id, isActive: p.isActive })}
                  disabled={toggleActiveMutation.isPending}
                >
                  {p.isActive ? (
                    <><ToggleLeft className="h-3 w-3 mr-1 text-red-500" /> Faolsizlashtirish</>
                  ) : (
                    <><ToggleRight className="h-3 w-3 mr-1 text-emerald-500" /> Faollashtirish</>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Yangi mahsulot qo'shish</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Nomi (UZ)</Label>
                <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Mahsulot nomi" />
              </div>
              <div className="space-y-2">
                <Label>Nomi (RU)</Label>
                <Input value={form.nameRu} onChange={e => setForm(p => ({ ...p, nameRu: e.target.value }))} placeholder="Название" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Kod</Label>
                <Input value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} placeholder="PRD-001" />
              </div>
              <div className="space-y-2">
                <Label>O'lchov birligi</Label>
                <Select value={form.unit} onValueChange={v => setForm(p => ({ ...p, unit: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Array.isArray(UNITS) ? UNITS : []).map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Kategoriya</Label>
                <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Array.isArray(CATEGORIES) ? CATEGORIES : []).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tannarx (so'm)</Label>
                <Input type="number" value={form.standardCost} onChange={e => setForm(p => ({ ...p, standardCost: e.target.value }))} placeholder="0" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Bekor qilish</Button>
            <Button onClick={() => createProductMutation.mutate(form)} disabled={createProductMutation.isPending || !form.name || !form.code}>Saqlash</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
