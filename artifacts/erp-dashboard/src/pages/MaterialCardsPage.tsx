/**
 * @module MaterialCardsPage
 * @description React page component. Route-level UI.
 */

import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Plus, Search, Package, Pencil } from "lucide-react";

import { useTranslation } from '@/lib/i18n';
import { EPStatusPill, EPPageHeader } from "@/components/ep";
interface Material {
  id: number;
  materialCode: string;
  name: string;
  unit: string;
  category?: string;
  currentStock: number;
  minStock: number;
  status: string;
}

type TFunc = (key: string, fallback?: string) => string;

// VISION-3340 #64 — FE zod schemas mirror the backend DTOs in
// apps/api/src/modules/compatibility/warehouse-catalog.controller.ts
// (CreateWarehouseMaterialSchema / UpdateWarehouseMaterialSchema) so client
// validation agrees with server validation.
const buildCreateMaterialSchema = (t: TFunc) =>
  z.object({
    materialCode: z
      .string()
      .trim()
      .min(1, t('materialKodKiriting', 'Kodni kiriting'))
      .max(100, t('materialKodMaks100', "Kod 100 belgidan oshmasligi kerak")),
    name: z
      .string()
      .trim()
      .min(1, t('materialNomKiriting', 'Nomni kiriting'))
      .max(500, t('materialNomMaks500', "Nom 500 belgidan oshmasligi kerak")),
    unit: z
      .string()
      .trim()
      .min(1, t('olchovBirliginiTanlang', "O'lchov birligini tanlang"))
      .max(50),
    category: z
      .string()
      .trim()
      .max(100, t('kategoriyaMaks100', "Kategoriya 100 belgidan oshmasligi kerak")),
    minStock: z.coerce
      .number({ invalid_type_error: t('minQoldiqRaqamBolsin', "Minimal qoldiq raqam bo'lishi kerak") })
      .nonnegative(t('minQoldiqManfiyBolmasin', "Minimal qoldiq manfiy bo'lmasligi kerak")),
  });

const buildUpdateMaterialSchema = (t: TFunc) => buildCreateMaterialSchema(t).omit({ materialCode: true });

type CreateMaterialForm = z.infer<ReturnType<typeof buildCreateMaterialSchema>>;
type UpdateMaterialForm = z.infer<ReturnType<typeof buildUpdateMaterialSchema>>;

const CREATE_DEFAULTS: CreateMaterialForm = { materialCode: "", name: "", unit: "kg", category: "", minStock: 0 };
const UPDATE_DEFAULTS: UpdateMaterialForm = { name: "", unit: "kg", category: "", minStock: 0 };

export default function MaterialCardsPage() {
  const { t } = useTranslation('common');
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [search, setSearch] = useState("");

  // SB0756/SB0757 — edit path (create existed, edit did not).
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);

  const createSchema = useMemo(() => buildCreateMaterialSchema(t), [t]);
  const updateSchema = useMemo(() => buildUpdateMaterialSchema(t), [t]);

  const createForm = useForm<CreateMaterialForm>({
    resolver: zodResolver(createSchema),
    defaultValues: CREATE_DEFAULTS,
  });

  const editForm = useForm<UpdateMaterialForm>({
    resolver: zodResolver(updateSchema),
    defaultValues: UPDATE_DEFAULTS,
  });

  const { data: materials = [], isLoading } = useQuery<Material[]>({
    queryKey: ["/api/warehouse/materials"],
  });

  const createMutation = useMutation({
    mutationFn: (data: object) => apiRequest("POST", "/api/warehouse/materials", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse/materials"] });
      toast({ title: "Material muvaffaqiyatli qo'shildi" });
      resetForm();
    },
    onError: () => {
      toast({ title: "Xatolik yuz berdi", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setIsDialogOpen(false);
    createForm.reset(CREATE_DEFAULTS);
  };

  const onCreateSubmit = (values: CreateMaterialForm) => {
    createMutation.mutate(values);
  };

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: object }) =>
      apiRequest("PUT", `/api/warehouse/materials/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse/materials"] });
      toast({ title: "Material yangilandi" });
      setEditingMaterial(null);
    },
    onError: () => {
      toast({ title: "Xatolik yuz berdi", variant: "destructive" });
    },
  });

  const openEditDialog = (m: Material) => {
    setEditingMaterial(m);
    editForm.reset({
      name: m.name ?? "",
      unit: m.unit ?? "kg",
      category: m.category ?? "",
      minStock: m.minStock ?? 0,
    });
  };

  const onUpdateSubmit = (values: UpdateMaterialForm) => {
    if (!editingMaterial) return;
    updateMutation.mutate({ id: editingMaterial.id, data: values });
  };

  const list = (Array.isArray(materials) ? materials : []).filter((m) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return m.name?.toLowerCase().includes(q) || m.materialCode?.toLowerCase().includes(q);
  });

  const getStatusBadge = (status: string, current: number, min: number) => {
    const low = current <= min;
    if (status === "inactive") return <Badge className="bg-gray-100 text-gray-600">{t("inactive")}</Badge>;
    if (low) return <EPStatusPill tone="danger">{t("kamQoldi")}</EPStatusPill>;
    return <EPStatusPill tone="success">{t("active")}</EPStatusPill>;
  };

  const unitSelectItems = (
    <SelectContent>
      <SelectItem value="kg">kg</SelectItem>
      <SelectItem value="pcs">dona</SelectItem>
      <SelectItem value="m">metr</SelectItem>
      <SelectItem value="L">litr</SelectItem>
    </SelectContent>
  );

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 space-y-6">
      <EPPageHeader
        title={t('materialKartalar')}
        subtitle={`${list.length} ta material`}
        actions={
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t("yangiMaterial")}
          </Button>
        }
      />

      <div className="relative w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t("Qidirish...")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">{t("Yuklanmoqda...")}</div>
          ) : list.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>{t("materiallarTopilmadi")}</p>
            </div>
          ) : (
            <div className="ep-table-scroll"><Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("code")}</TableHead>
                  <TableHead>{t("name")}</TableHead>
                  <TableHead>{t("olchov1")}</TableHead>
                  <TableHead>{t("category")}</TableHead>
                  <TableHead className="text-right">{t("currentBalance")}</TableHead>
                  <TableHead className="text-right">{t("minQoldiq")}</TableHead>
                  <TableHead>{t("status28")}</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((m) => (
                  <TableRow key={m.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-mono text-sm">{m.materialCode}</TableCell>
                    <TableCell className="font-medium">{m.name}</TableCell>
                    <TableCell>{m.unit}</TableCell>
                    <TableCell className="text-muted-foreground">{m.category || "—"}</TableCell>
                    <TableCell className="text-right font-medium">
                      <span className={m.currentStock <= m.minStock ? "text-[var(--ep-red)]" : ""}>
                        {m.currentStock?.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">{m.minStock?.toLocaleString()}</TableCell>
                    <TableCell>{getStatusBadge(m.status, m.currentStock, m.minStock)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(m)} data-testid={`btn-edit-material-${m.id}`}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table></div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold">{t("yangiMaterialQoshish")}</DialogTitle>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={createForm.control} name="materialCode" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('materialKodi')}</FormLabel>
                    <FormControl><Input placeholder="MAT-001" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={createForm.control} name="unit" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("olchovBirligi")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      {unitSelectItems}
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={createForm.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("name")}</FormLabel>
                  <FormControl><Input placeholder={t("materialNomi")} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={createForm.control} name="category" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("category")}</FormLabel>
                  <FormControl><Input placeholder={t("masalanQogoz")} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={createForm.control} name="minStock" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("minimalQoldiq")}</FormLabel>
                  <FormControl><Input type="number" placeholder="0" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={resetForm}>{t("cancel")}</Button>
                <Button type="submit" disabled={createMutation.isPending}>{t("Saqlash")}</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingMaterial} onOpenChange={(open) => { if (!open) setEditingMaterial(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold">{t("materialniTahrirlash", "Materialni tahrirlash")}</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onUpdateSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>{t('materialKodi')}</Label>
                  <Input value={editingMaterial?.materialCode ?? ""} disabled />
                </div>
                <FormField control={editForm.control} name="unit" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("olchovBirligi")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      {unitSelectItems}
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={editForm.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("name")}</FormLabel>
                  <FormControl><Input placeholder={t("materialNomi")} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={editForm.control} name="category" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("category")}</FormLabel>
                  <FormControl><Input placeholder={t("masalanQogoz")} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={editForm.control} name="minStock" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("minimalQoldiq")}</FormLabel>
                  <FormControl><Input type="number" placeholder="0" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setEditingMaterial(null)}>{t("cancel")}</Button>
                <Button type="submit" disabled={updateMutation.isPending} data-testid="btn-save-edit-material">{t("Saqlash")}</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
