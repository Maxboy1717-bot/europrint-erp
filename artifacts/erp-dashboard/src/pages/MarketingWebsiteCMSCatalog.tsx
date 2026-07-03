/**
 * @module MarketingWebsiteCMSCatalog
 * @description Tab-section component embedded in MarketingWebsiteCMS ("Katalog" tab).
 *
 * Web-katalog / CMS kontent-admin (Master-reja §5.3 band 3.10). Backend allaqachon
 * mavjud (EcommerceCatalogController: /api/admin/products, /api/admin/categories;
 * EcommercePublicController: /api/public/products/:slug, /api/public/categories) —
 * bu komponent faqat admin CRUD FE qismini `public_products` jadvali uchun qo'shadi
 * (MaterialCardsPage naqshi asosida). C6 (marketing-kontent-turlari) 🔵 OCHIQ —
 * mavjud `product_categories` tuzilmasidan foydalaniladi, yangi kontent-tur
 * fabrikatsiya qilinmaydi. Alohida route emas — mavjud web-sayt CMS sahifasiga
 * tab sifatida ulanadi (Q-42 tab ierarxiya, dizayn izchillik).
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Plus, Search, Globe, Pencil, ExternalLink } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { EPStatusPill } from "@/components/ep";

interface PublicCategory {
  id: number;
  name: string;
  slug: string;
  isActive?: boolean | null;
}

interface PublicProduct {
  id: number;
  categoryId?: string | number | null;
  name: string;
  nameRu?: string | null;
  slug: string;
  description?: string | null;
  shortDescription?: string | null;
  pricePerUnit?: string | number | null;
  price?: string | number | null;
  unit?: string | null;
  minOrderQuantity?: number | null;
  inStock?: boolean | null;
  isFeatured?: boolean | null;
  isActive?: boolean | null;
  category?: PublicCategory | null;
}

interface ProductsResponse {
  products: PublicProduct[];
  pagination?: { total?: number };
}

const EMPTY_FORM = {
  name: "",
  nameRu: "",
  slug: "",
  categoryId: "",
  shortDescription: "",
  description: "",
  pricePerUnit: "",
  unit: "dona",
  minOrderQuantity: "100",
  inStock: true,
  isFeatured: false,
  isActive: true,
};

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function MarketingWebsiteCMSCatalog() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: productsData, isLoading } = useQuery<ProductsResponse>({
    queryKey: ["/api/admin/products"],
  });

  const { data: categories } = useQuery<PublicCategory[]>({
    queryKey: ["/api/admin/categories"],
  });

  const products: PublicProduct[] = Array.isArray(productsData?.products) ? productsData.products : [];
  const categoryList: PublicCategory[] = Array.isArray(categories) ? categories : [];

  const resetForm = () => {
    setDialogOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/admin/products", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      toast({ title: t("mahsulotYaratildi", "Mahsulot yaratildi") });
      resetForm();
    },
    onError: () => toast({ title: t("xatolik", "Xatolik"), variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      apiRequest("PUT", `/api/admin/products/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      toast({ title: t("mahsulotYangilandi", "Mahsulot yangilandi") });
      resetForm();
    },
    onError: () => toast({ title: t("xatolik", "Xatolik"), variant: "destructive" }),
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (p: PublicProduct) => {
    setEditingId(p.id);
    setForm({
      name: p.name ?? "",
      nameRu: p.nameRu ?? "",
      slug: p.slug ?? "",
      categoryId: p.categoryId != null ? String(p.categoryId) : "",
      shortDescription: p.shortDescription ?? "",
      description: p.description ?? "",
      pricePerUnit: p.pricePerUnit != null ? String(p.pricePerUnit) : "",
      unit: p.unit ?? "dona",
      minOrderQuantity: p.minOrderQuantity != null ? String(p.minOrderQuantity) : "100",
      inStock: p.inStock ?? true,
      isFeatured: p.isFeatured ?? false,
      isActive: p.isActive ?? true,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.slug.trim()) {
      toast({ title: t("nomVaSlugKiriting", "Nom va slug kiriting"), variant: "destructive" });
      return;
    }
    const payload: Record<string, unknown> = {
      name: form.name,
      nameRu: form.nameRu || undefined,
      slug: form.slug,
      categoryId: form.categoryId ? Number(form.categoryId) : undefined,
      shortDescription: form.shortDescription || undefined,
      description: form.description || undefined,
      pricePerUnit: form.pricePerUnit ? Number(form.pricePerUnit) : undefined,
      unit: form.unit,
      minOrderQuantity: form.minOrderQuantity ? Number(form.minOrderQuantity) : undefined,
      inStock: form.inStock,
      isFeatured: form.isFeatured,
      isActive: form.isActive,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const list = products.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.name?.toLowerCase().includes(q) || p.slug?.toLowerCase().includes(q);
  });

  const activeCount = products.filter((p) => p.isActive).length;

  return (
    <div className="space-y-4" data-testid="marketing-website-cms-catalog">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant="outline" className="gap-1.5">
            <Globe className="w-3 h-3 text-[var(--ep-green)]" /> {activeCount} {t("faolBadge", "faol")}
          </Badge>
          <Badge variant="outline" className="gap-1.5">
            {products.length} {t("jamiBadge", "jami")}
          </Badge>
        </div>
        <Button size="sm" onClick={openCreate} data-testid="button-create-product">
          <Plus className="h-4 w-4 mr-1" />
          {t("mahsulotQoshish", "Mahsulot qo'shish")}
        </Button>
      </div>

      <div className="relative w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t("nomYokiSlugBoyichaQidirish", "Nom yoki slug bo'yicha qidirish...")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
          data-testid="input-catalog-search"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">{t("Yuklanmoqda...")}</div>
          ) : list.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Globe className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>{t("mahsulotTopilmadi", "Mahsulot topilmadi")}</p>
              <Button className="mt-4" onClick={openCreate}>
                <Plus className="h-4 w-4 mr-2" /> {t("mahsulotQoshish", "Mahsulot qo'shish")}
              </Button>
            </div>
          ) : (
            <div className="ep-table-scroll">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("name")}</TableHead>
                    <TableHead>{t("slug", "Slug")}</TableHead>
                    <TableHead>{t("category")}</TableHead>
                    <TableHead className="text-right">{t("narx", "Narx")}</TableHead>
                    <TableHead>{t("status28", "Holat")}</TableHead>
                    <TableHead className="text-right">{t("amallar", "Amallar")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.map((p) => (
                    <TableRow key={p.id} className="hover:bg-muted/40 transition-colors" data-testid={`row-product-${p.id}`}>
                      <TableCell className="font-medium">
                        {p.name}
                        {p.nameRu && <p className="text-xs text-muted-foreground">{p.nameRu}</p>}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{p.slug}</TableCell>
                      <TableCell className="text-muted-foreground">{p.category?.name || "—"}</TableCell>
                      <TableCell className="text-right">
                        {p.pricePerUnit ? `${Number(p.pricePerUnit).toLocaleString()} ${p.unit || ""}` : "—"}
                      </TableCell>
                      <TableCell>
                        {p.isActive ? (
                          <EPStatusPill tone="success">{t("active")}</EPStatusPill>
                        ) : (
                          <EPStatusPill tone="neutral">{t("inactive")}</EPStatusPill>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)} data-testid={`button-edit-${p.id}`}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            title={t("saytdaKorish", "Saytda ko'rish")}
                            onClick={() => window.open(`/api/public/products/${p.slug}`, "_blank", "noopener,noreferrer")}
                            data-testid={`button-view-${p.id}`}
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetForm(); else setDialogOpen(true); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold">
              {editingId ? t("mahsulotniTahrirlash", "Mahsulotni tahrirlash") : t("yangiMahsulotQoshish", "Yangi mahsulot qo'shish")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>{t("nomiUz", "Nomi (UZ)")}</Label>
                <Input
                  value={form.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setForm((p) => ({
                      ...p,
                      name,
                      slug: editingId ? p.slug : slugify(name),
                    }));
                  }}
                  placeholder={t("mahsulotNomi", "Mahsulot nomi")}
                  data-testid="input-product-name"
                />
              </div>
              <div className="space-y-1">
                <Label>{t("nomiRu", "Nomi (RU)")}</Label>
                <Input
                  value={form.nameRu}
                  onChange={(e) => setForm((p) => ({ ...p, nameRu: e.target.value }))}
                  placeholder={t("untitled")}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>{t("slugUrl", "Slug (URL)")}</Label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm((p) => ({ ...p, slug: slugify(e.target.value) }))}
                  placeholder={t("slugMisol", "mahsulot-nomi")}
                  data-testid="input-product-slug"
                />
              </div>
              <div className="space-y-1">
                <Label>{t("category")}</Label>
                <Select value={form.categoryId || "none"} onValueChange={(v) => setForm((p) => ({ ...p, categoryId: v === "none" ? "" : v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t("tanlanmagan", "Tanlanmagan")}</SelectItem>
                    {categoryList.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>{t("qisqaTavsif", "Qisqa tavsif")}</Label>
              <Input
                value={form.shortDescription}
                onChange={(e) => setForm((p) => ({ ...p, shortDescription: e.target.value }))}
                placeholder={t("qisqaTavsif", "Qisqa tavsif")}
              />
            </div>
            <div className="space-y-1">
              <Label>{t("toliqTavsif", "To'liq tavsif")}</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder={t("toliqTavsif", "To'liq tavsif")}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>{t("narxBirlik", "Narx (birlik uchun)")}</Label>
                <Input
                  type="number"
                  value={form.pricePerUnit}
                  onChange={(e) => setForm((p) => ({ ...p, pricePerUnit: e.target.value }))}
                  placeholder="0"
                />
              </div>
              <div className="space-y-1">
                <Label>{t("olchovBirligi")}</Label>
                <Select value={form.unit} onValueChange={(v) => setForm((p) => ({ ...p, unit: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["dona", "kg", "m2", "m3", "quti", "rulon"].map((u) => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>{t("minBuyurtma", "Min. buyurtma")}</Label>
                <Input
                  type="number"
                  value={form.minOrderQuantity}
                  onChange={(e) => setForm((p) => ({ ...p, minOrderQuantity: e.target.value }))}
                  placeholder="100"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-6 pt-1">
              <div className="flex items-center gap-2">
                <Switch checked={form.inStock} onCheckedChange={(v) => setForm((p) => ({ ...p, inStock: v }))} />
                <Label className="mb-0">{t("omboda", "Omborda mavjud")}</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.isFeatured} onCheckedChange={(v) => setForm((p) => ({ ...p, isFeatured: v }))} />
                <Label className="mb-0">{t("tavsiyaEtilgan", "Tavsiya etilgan")}</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.isActive} onCheckedChange={(v) => setForm((p) => ({ ...p, isActive: v }))} />
                <Label className="mb-0">{t("active")}</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>{t("cancel")}</Button>
            <Button
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending || !form.name.trim() || !form.slug.trim()}
              data-testid="button-save-product"
            >
              {t("Saqlash")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
